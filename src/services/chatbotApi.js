import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

/**
 * Send a message to the chatbot
 * @param {string} message - User's message
 * @param {string} token - JWT token (optional for anonymous users)
 * @returns {Promise<Object>} - Chatbot response
 */
export const sendMessage = async (message, token = null) => {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/chatbot/message`,
      { message },
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    throw new Error(error.response?.data?.message || 'Failed to send message');
  }
};

/**
 * Get conversation history for the user
 * @param {string} token - JWT token (optional for anonymous users)
 * @returns {Promise<Object>} - Conversation history
 */
export const getConversationHistory = async (token = null) => {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/chatbot/history`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch conversation history');
  }
};

/**
 * Clear conversation history for the user
 * @param {string} token - JWT token (optional for anonymous users)
 * @returns {Promise<Object>} - Clear response
 */
export const clearConversation = async (token = null) => {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.delete(
      `${API_BASE_URL}/api/chatbot/history`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error clearing conversation:', error);
    throw new Error(error.response?.data?.message || 'Failed to clear conversation');
  }
};

/**
 * Delete conversation on user logout
 * @param {string} token - JWT token (required for authenticated users)
 * @returns {Promise<Object>} - Delete response
 */
export const deleteConversationOnLogout = async (token) => {
  try {
    if (!token) {
      throw new Error('Token is required for logout conversation deletion');
    }

    const response = await axios.delete(
      `${API_BASE_URL}/api/chatbot/logout`,
      { 
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error deleting conversation on logout:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete conversation on logout');
  }
};

/**
 * Get conversation statistics
 * @param {string} token - JWT token (optional for anonymous users)
 * @returns {Promise<Object>} - Conversation stats
 */
export const getConversationStats = async (token = null) => {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/chatbot/stats`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching conversation stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch conversation stats');
  }
};
