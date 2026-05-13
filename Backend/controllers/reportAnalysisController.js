const axios = require('axios');

const DEFAULT_ML_SERVICE_URL = 'https://healthpath-1.onrender.com';
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || DEFAULT_ML_SERVICE_URL).replace(/\/+$/, '');
const RETRYABLE_UPSTREAM_STATUS = new Set([502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callMlWithRetry = async (requestFactory, retries = 2) => {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;
      const upstreamStatus = error.response?.status;
      const isRetryableStatus = RETRYABLE_UPSTREAM_STATUS.has(upstreamStatus);
      const isRetryableNetworkError =
        error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND';

      if (attempt === retries || (!isRetryableStatus && !isRetryableNetworkError)) {
        throw error;
      }

      // Short exponential backoff helps with Render cold starts and transient upstream failures.
      const backoffMs = 500 * Math.pow(2, attempt);
      await sleep(backoffMs);
      attempt += 1;
    }
  }

  throw lastError;
};

const buildMlProxyError = (error) => {
  if (error.response) {
    const upstreamStatus = error.response.status;
    const upstreamMessage =
      error.response.data?.message ||
      error.response.data?.error ||
      `ML service returned status ${upstreamStatus}`;

    return {
      status: upstreamStatus >= 500 ? 502 : 503,
      body: {
        success: false,
        message: `ML service error: ${upstreamMessage}`,
        mlServiceUrl: ML_SERVICE_URL,
        upstreamStatus
      }
    };
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return {
      status: 503,
      body: {
        success: false,
        message: 'ML service unreachable. Verify ML_SERVICE_URL and ML deployment health.',
        mlServiceUrl: ML_SERVICE_URL,
        error: error.code
      }
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      message: 'Error analyzing patient report',
      error: error.message
    }
  };
};

/**
 * Analyze patient report using ML model
 */
const analyzeReport = async (req, res) => {
  try {
    const reportData = req.body;
    console.log('Forwarding report analysis to ML service:', ML_SERVICE_URL);

    if (!reportData || Object.keys(reportData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient report data is required'
      });
    }

    const response = await callMlWithRetry(() =>
      axios.post(`${ML_SERVICE_URL}/predict`, reportData, {
        timeout: 30000
      })
    );

    // Upstream may still return logical errors with 200 OK.
    if (response.data.status === 'error') {
      console.error('ML service returned logical error:', response.data.message);
      return res.status(500).json({
        success: false,
        message: response.data.message || 'Error analyzing report'
      });
    }

    console.log('ML analysis success:', response.data.prediction);

    res.json({
      success: true,
      analysis: {
        ...response.data,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Report analysis proxy error:', error.message);
    const proxyError = buildMlProxyError(error);
    res.status(proxyError.status).json(proxyError.body);
  }
};

/**
 * Batch analyze multiple patient reports
 */
const analyzeBatchReports = async (req, res) => {
  try {
    const { reports } = req.body;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of patient reports is required'
      });
    }

    const response = await callMlWithRetry(() =>
      axios.post(
        `${ML_SERVICE_URL}/predict/batch`,
        { reports },
        { timeout: 60000 }
      )
    );

    res.json({
      success: true,
      analyses: response.data.results,
      count: response.data.results.length
    });
  } catch (error) {
    console.error('Batch analysis proxy error:', error.message);
    const proxyError = buildMlProxyError(error);
    res.status(proxyError.status).json(proxyError.body);
  }
};

/**
 * Check ML service health
 */
const checkMLServiceHealth = async (req, res) => {
  try {
    const response = await callMlWithRetry(
      () => axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 }),
      1
    );
    res.json({
      success: true,
      mlServiceUrl: ML_SERVICE_URL,
      mlService: response.data
    });
  } catch (error) {
    const proxyError = buildMlProxyError(error);
    res.status(proxyError.status).json(proxyError.body);
  }
};

module.exports = {
  analyzeReport,
  analyzeBatchReports,
  checkMLServiceHealth
};
