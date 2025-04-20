import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import './FullscreenModal.css';

/**
 * Fullscreen Modal Component rendered as a portal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 */
function FullscreenModal({ isOpen, onClose, title, children }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    // Only apply the effect if the modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Cleanup - restore scroll when unmounted or closed
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]); // Re-run when isOpen changes

  // Handle escape key press
  useEffect(() => {
    // Only add the listener if the modal is open
    if (isOpen) {
      const handleEsc = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleEsc);
      
      // Cleanup - remove listener when unmounted or closed
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]); // Re-run when isOpen or onClose changes

  // Don't render anything if not open
  if (!isOpen) return null;

  // Create portal to render modal outside normal DOM hierarchy
  return ReactDOM.createPortal(
    <div className="fullscreen-modal-overlay">
      <div className="fullscreen-modal">
        <div className="fullscreen-modal-header">
          <h2 className="fullscreen-modal-title">{title}</h2>
          <button 
            className="fullscreen-modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="fullscreen-modal-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FullscreenModal;