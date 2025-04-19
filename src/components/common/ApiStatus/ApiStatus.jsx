import React from 'react';
import { AlertTriangle, Server, Wifi } from 'lucide-react';
import './ApiStatus.css';

/**
 * Component for displaying API connection status
 * @param {Object} props
 * @param {boolean} props.connected - Whether the API is connected
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Function to call when retry button is clicked
 */
const ApiStatus = ({ connected = true, message = '', onRetry }) => {
  if (connected) return null;
  
  return (
    <div className="api-status-container">
      <div className="api-status-content">
        <div className="api-status-icon">
          {message ? <AlertTriangle size={24} /> : <Server size={24} />}
        </div>
        <div className="api-status-message">
          <h3>API Connection Issue</h3>
          <p>{message || 'Could not connect to the market data API. Using demo data instead.'}</p>
        </div>
        {onRetry && (
          <button className="api-status-retry" onClick={onRetry}>
            <Wifi size={16} />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiStatus;