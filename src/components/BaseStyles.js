import React from 'react';

const BaseStyles = () => {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #0d1117;
        color: #c9d1d9;
      }
      
      code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
          monospace;
      }
      
      .profile-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
      }
      
      .profile-section {
        display: flex;
        align-items: center;
        gap: 48px;
      }
      
      .profile-content {
        flex: 1;
        min-width: 0;
      }
    `}</style>
  );
};

export default BaseStyles;