"""
Shared custom transformers for the HealthPath ML Pipeline.

Any class that gets pickled inside the sklearn Pipeline must be importable
at load-time.  Putting it in a standalone module means both
``train_model_v2.py`` and ``ml_service.py`` can import it reliably.
"""

import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class MedicalFeatureEngineer(BaseEstimator, TransformerMixin):
    """Generate domain-specific interaction features.

    Created *inside* the pipeline so the same logic runs automatically at
    inference time - no manual feature-engineering needed.

    Features generated:
        - Age_BP_Interaction   = Age * BloodPressure
        - BMI_Cholesterol_Interaction = BMI * Cholesterol
    """

    def fit(self, X: pd.DataFrame, y=None):
        """Nothing to learn - stateless transformer."""
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()
        if "Age" in X.columns and "BloodPressure" in X.columns:
            X["Age_BP_Interaction"] = X["Age"] * X["BloodPressure"]
        if "BMI" in X.columns and "Cholesterol" in X.columns:
            X["BMI_Cholesterol_Interaction"] = X["BMI"] * X["Cholesterol"]
        return X

