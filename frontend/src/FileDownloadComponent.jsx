import React, { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import axios from 'axios';
import { API_URL } from './config';

const FileDownloadComponent = ({ fileId }) => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDownloadProgress(0);

      // 1. Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please login.');
      }

      // 2. Make authenticated request
      const response = await axios.get(`${API_URL}/api/files/download/${fileId}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setDownloadProgress(percentCompleted);
        }
      });

      // 3. Handle unauthorized response
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please login again.');
      }

      // 4. Extract filename
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch?.[1]) filename = filenameMatch[1];
      }

      // 5. Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // 6. Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setDownloadProgress(0);
      }, 100);

    } catch (err) {
      console.error('Download error:', err);
      
      if (err.response?.status === 401 && retryCount < 1) {
        // Try to refresh token once
        try {
          const newToken = await refreshToken(); // Implement your token refresh logic
          if (newToken) {
            localStorage.setItem('authToken', newToken);
            setRetryCount(prev => prev + 1);
            return handleDownload(); // Retry the download
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      setError(
        err.response?.status === 401
          ? 'Session expired. Please login again.'
          : err.message || 'Failed to download file'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Basic token refresh example (implement according to your auth flow)
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;
      
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken
      });
      
      localStorage.setItem('authToken', response.data.accessToken);
      return response.data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  };

  return (
    <div className="file-download-container">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className={`download-btn ${isLoading ? 'loading' : ''}`}
        aria-label={isLoading ? 'Downloading file...' : 'Download file'}
      >
        <FiDownload className="icon" />
        {isLoading ? 'Downloading...' : 'Download'}
      </button>
      
      {downloadProgress > 0 && downloadProgress < 100 && (
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${downloadProgress}%` }}
          />
          <span className="progress-text">{downloadProgress}%</span>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <FiX className="error-icon" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Add these styles to your CSS
const styles = `
  .file-download-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 300px;
  }
  
  .download-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #3182ce;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .download-btn:hover:not(:disabled) {
    background: #2b6cb0;
  }
  
  .download-btn:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
  
  .progress-container {
    width: 100%;
    height: 8px;
    background: #edf2f7;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  
  .progress-bar {
    height: 100%;
    background: #48bb78;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: #4a5568;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #e53e3e;
    font-size: 0.875rem;
  }
  
  .icon {
    font-size: 1rem;
  }
  
  .error-icon {
    color: #e53e3e;
  }
`;

// Inject styles
const styleTag = document.createElement('style');
styleTag.innerHTML = styles;
document.head.appendChild(styleTag);

export default FileDownloadComponent;