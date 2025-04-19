import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import './Panel.css';

/**
 * Expandable/collapsible panel component
 * @param {Object} props
 * @param {string} props.title - The panel title
 * @param {React.ReactNode} props.children - Panel content
 * @param {boolean} [props.defaultOpen=true] - Whether panel is open by default
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onToggle] - Callback when panel is toggled
 */
const Panel = ({ 
  title, 
  children, 
  defaultOpen = true, 
  className = '',
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <div className={`panel ${className}`}>
      <div 
        className="panel-header"
        onClick={handleToggle}
      >
        <h3 className="panel-title">{title}</h3>
        <button className="panel-toggle">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      
      {isOpen && (
        <div className="panel-body">
          {children}
        </div>
      )}
    </div>
  );
};

export default Panel;