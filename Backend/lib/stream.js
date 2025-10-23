/**
 * Stream.io Configuration for HealthPath
 * Provides video calling and optional chat functionality
 */

const { StreamChat } = require('stream-chat');
const { StreamClient } = require('@stream-io/node-sdk');

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// Validate environment variables
if (!apiKey || !apiSecret) {
    console.warn('âš ï¸ STREAM_API_KEY or STREAM_API_SECRET not set. Video calls will not work.');
}

// Chat client (also used for token generation)
let chatClient = null;
if (apiKey && apiSecret) {
    chatClient = StreamChat.getInstance(apiKey, apiSecret);
    console.log('âœ… Stream Chat Client initialized');
}

// Video client
let streamClient = null;
if (apiKey && apiSecret) {
    streamClient = new StreamClient(apiKey, apiSecret);
    console.log('âœ… Stream Video Client initialized');
}

/**
 * Upsert a user in Stream (creates or updates)
 * @param {Object} userData - { id, name, image, role }
 */
const upsertStreamUser = async (userData) => {
    if (!chatClient) {
        throw new Error('Stream client not initialized');
    }
    
    await chatClient.upsertUser({
        id: userData.id,
        name: userData.name,
        image: userData.image || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        // Store app role as custom field, use default Stream role
        custom: {
            appRole: userData.role || 'user'
        }
    });
};

/**
 * Generate a Stream token for a user
 * @param {string} userId - User ID to generate token for
 * @returns {string} Stream token
 */
const generateStreamToken = (userId) => {
    if (!chatClient) {
        throw new Error('Stream client not initialized');
    }
    return chatClient.createToken(userId);
};

/**
 * Create a video call for an appointment
 * @param {string} callId - Unique call ID (usually appointment ID)
 * @param {Array} memberIds - Array of user IDs allowed in the call
 */
const createVideoCall = async (callId, memberIds) => {
    if (!streamClient) {
        throw new Error('Stream video client not initialized');
    }
    
    const call = streamClient.video.call('default', callId);
    
    await call.getOrCreate({
        data: {
            created_by_id: memberIds[0],
            members: memberIds.map(id => ({ user_id: id, role: 'call_member' }))
        }
    });
    
    return call;
};

/**
 * Create or get a chat channel between two users
 * @param {string} channelId - Unique channel ID
 * @param {Object} creatorData - Creator user data { id, name, image }
 * @param {Object} memberData - Other member data { id, name, image }
 * @returns {Object} Channel object
 */
const getOrCreateChannel = async (channelId, creatorData, memberData) => {
    if (!chatClient) {
        throw new Error('Stream client not initialized');
    }
    
    // Ensure both users exist in Stream
    await upsertStreamUser(creatorData);
    await upsertStreamUser(memberData);
    
    // Create/get messaging channel
    const channel = chatClient.channel('messaging', channelId, {
        name: `Chat: ${creatorData.name} & ${memberData.name}`,
        members: [creatorData.id, memberData.id],
        created_by_id: creatorData.id
    });
    
    await channel.create();
    
    return channel;
};

module.exports = {
    chatClient,
    streamClient,
    upsertStreamUser,
    generateStreamToken,
    createVideoCall,
    getOrCreateChannel,
    apiKey // Export for frontend to use
};

