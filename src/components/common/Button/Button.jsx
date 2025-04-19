import React from 'react';
import './Button.css';

/**
 * Button component
 * @param {Object} props
 * @param {string} [props.type='button'] - Button type
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, danger)
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} [props.onClick] - Click handler
 */
const Button = ({ 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  className = '',
  children,
  onClick,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;