/**
 * API Client - Handles communication with Product Builder backend
 */

// Use proxy in development (via package.json proxy setting) or direct URL in production
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? 'http://localhost:3001/api' : '/api');

export async function chatWithEngineer(message, conversationHistory = [], currentDesign = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message,
        conversationHistory,
        currentDesign
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Server error', 
        message: `Server returned ${response.status}. Please check the server logs for details.` 
      }));
      throw new Error(error.message || error.error || `Server returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Check for network/connection errors
    if (error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        (error.name === 'TypeError' && error.message.includes('fetch'))) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 3001.');
    }
    throw error;
  }
}

export async function buildProduct(prompt, previousDesign = null) {
  try {
    if (previousDesign) {
      console.log('🔄 Including previous design for modification');
    }
    
    const response = await fetch(`${API_BASE_URL}/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt,
        previousDesign 
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Server error', 
        message: `Server returned ${response.status}. Please check the server logs for details.` 
      }));
      throw new Error(error.message || error.error || `Server returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Check for network/connection errors
    if (error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        (error.name === 'TypeError' && error.message.includes('fetch'))) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 3001.');
    }
    throw error;
  }
}

export async function getBuildStatus(buildId) {
  try {
    const response = await fetch(`${API_BASE_URL}/build/${buildId}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Server error' }));
      throw new Error(error.message || `Server returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Check for network/connection errors
    if (error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        (error.name === 'TypeError' && error.message.includes('fetch'))) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 3001.');
    }
    throw error;
  }
}

export function getFileUrl(filePath) {
  return `http://localhost:3001/exports/${filePath}`;
}
