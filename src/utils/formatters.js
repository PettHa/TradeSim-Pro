/**
 * Formatting utility functions for displaying values
 */

/**
 * Format a number as currency
 * 
 * @param {number} value - The value to format
 * @param {string} currency - Currency code (default: USD)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD', decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };
  
  /**
   * Format a number as percentage
   * 
   * @param {number} value - The value to format (0.1 = 10%)
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} Formatted percentage string
   */
  export const formatPercentage = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };
  
  /**
   * Format a date string
   * 
   * @param {string} dateString - Date string in ISO format
   * @param {string} format - Format type ('short', 'medium', 'long')
   * @returns {string} Formatted date string
   */
  export const formatDate = (dateString, format = 'medium') => {
    const date = new Date(dateString);
    
    const options = { 
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }
    };
    
    return new Intl.DateTimeFormat('en-US', options[format]).format(date);
  };
  
  /**
   * Format a number with thousands separators
   * 
   * @param {number} value - The value to format
   * @param {number} decimals - Number of decimal places (default: 0)
   * @returns {string} Formatted number string
   */
  export const formatNumber = (value, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };
  
  /**
   * Format a trade type for display
   * 
   * @param {string} type - Trade type ('LONG', 'SHORT')
   * @returns {Object} Object containing display text and CSS class
   */
  export const formatTradeType = (type) => {
    switch (type.toUpperCase()) {
      case 'LONG':
        return { text: 'LONG', className: 'long' };
      case 'SHORT':
        return { text: 'SHORT', className: 'short' };
      default:
        return { text: type, className: '' };
    }
  };
  
  /**
   * Format a profit/loss value with color coding
   * 
   * @param {number} value - The P/L value
   * @returns {Object} Object containing formatted value and CSS class
   */
  export const formatProfitLoss = (value) => {
    const isPositive = value >= 0;
    const formatted = formatCurrency(Math.abs(value));
    const prefix = isPositive ? '+' : '-';
    
    return {
      text: `${prefix}${formatted}`,
      className: isPositive ? 'positive' : 'negative'
    };
  };
  
  /**
   * Format a price value
   * 
   * @param {number} value - The price value
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} Formatted price string
   */
  export const formatPrice = (value, decimals = 2) => {
    return value.toFixed(decimals);
  };