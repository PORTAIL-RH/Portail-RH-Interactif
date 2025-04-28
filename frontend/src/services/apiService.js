// src/services/apiService.js
import { API_URL } from '../config';

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const apiService = {
  get: async (url) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`API GET Error (${url}):`, error);
      throw error;
    }
  },

  post: async (url, data) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  put: async (url, data) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  delete: async (url) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  upload: async (url, file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  }
};