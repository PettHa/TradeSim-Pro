import React from 'react';
import { AlertTriangle, WifiOff, Wifi } from 'lucide-react'; // Import WifiOff
import './ApiStatus.css';

/**
 * Component for displaying API connection status
 * @param {Object} props
 * @param {boolean} props.connected - Whether the API is connected (derived from having an error message)
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Function to call when retry button is clicked
 */
const ApiStatus = ({ connected = true, message = '', onRetry }) => {
  // If connected is explicitly true OR there is no message, render nothing
  if (connected || !message) return null;

  return (
    <div className="api-status-container">
      <div className="api-status-content">
        <div className="api-status-icon">
           <AlertTriangle size={24} /> {/* Use alert icon for errors */}
        </div>
        <div className="api-status-message">
          <h3>Tilkoblingsproblem</h3> {/* More specific title */}
          <p>{message || 'Kunne ikke koble til API for markedsdata.'}</p> {/* Default message if needed */}
        </div>
        {onRetry && (
          <button className="api-status-retry" onClick={onRetry}>
            <Wifi size={16} /> {/* Use Wifi icon for retry action */}
            <span>Prøv igjen</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiStatus;