import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function DarkModeToggle({ position = 'top-right', showLabel = true }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const positionStyles = {
    'top-right': {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      zIndex: 1000
    },
    'top-left': {
      position: 'absolute',
      top: '1rem',
      left: '1rem',
      zIndex: 1000
    },
    'inline': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem'
    }
  };

  return (
    <div style={positionStyles[position] || positionStyles['top-right']}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 1rem',
        background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        {showLabel && (
          <span style={{
            fontSize: '0.875rem',
            color: isDarkMode ? '#94a3b8' : '#64748b',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            {!isDarkMode && 'Mode Jour'}
          </span>
        )}
        <label style={{
          position: 'relative',
          display: 'inline-block',
          width: '60px',
          height: '30px',
          cursor: 'pointer',
          margin: 0
        }}>
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={toggleDarkMode}
            style={{
              opacity: 0,
              width: 0,
              height: 0
            }}
          />
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDarkMode ? '#667eea' : '#fbbf24',
            borderRadius: '30px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            <span style={{
              position: 'absolute',
              content: '""',
              height: '24px',
              width: '24px',
              left: isDarkMode ? '32px' : '3px',
              bottom: '3px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
              <i className={`fas fa-${isDarkMode ? 'moon' : 'sun'}`} style={{
                fontSize: '0.75rem',
                color: isDarkMode ? '#667eea' : '#fbbf24'
              }}></i>
            </span>
          </span>
        </label>
        {showLabel && (
          <span style={{
            fontSize: '0.875rem',
            color: isDarkMode ? '#94a3b8' : '#64748b',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            {isDarkMode && 'Mode Nuit'}
          </span>
        )}
        {showLabel && (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            color: isDarkMode ? '#667eea' : '#22c55e',
            fontWeight: 600
          }}>
            {isDarkMode ? 'Actif' : 'Actif'}
          </span>
        )}
      </div>
    </div>
  );
}

