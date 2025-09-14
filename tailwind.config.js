/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        fithub: {
          'white': '#f0f0f0',
          'text': '#c9d1d9',
          'grey': '#8b949e',
          'light-grey': '#30363d',
          'medium-grey': '#161b22',
          'dark-grey': '#0d1117',
          'red': '#a02024',
          'dark-red': '#662020',
          'brown': '#34181c',
          'bright-red': '#bb1f21',
          'salmon': '#ff2d2d',
          'orange': '#ff462d',
          'peach': '#ff722d',
          'yellow': '#ff982d',
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
        'mono': ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
      // Not currently used
      animation: {
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        }
      },
      backgroundSize: {
        '200': '200% 100%',
      }
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.container': {
          'max-width': '1200px',
          'margin': '0 auto',
          'padding': '0 20px',
        },
        '.header': {
          'background-color': '#161b22',
          'border-bottom': '1px solid #30363d',
          'padding': '14px 0',
        },
        '.header-content': {
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
        },
        '.logo': {
          'font-size': '28px',
          'font-weight': 'bold',
          'color': '#f0f6fc',
          'text-decoration': 'none',
        },
        '.nav': {
          'display': 'flex',
          'gap': '24px',
        },
        '.nav-link': {
          'color': '#c9d1d9',
          'text-decoration': 'none',
          'font-weight': '500',
          'padding': '8px 16px',
          'border-radius': '6px',
          'transition': 'background-color 0.2s',
          '&:hover': {
            'background-color': '#21262d',
            'color': '#f0f6fc',
          },
          '&.active': {
            'background-color': '#21262d',
            'color': '#f0f6fc',
          },
        },
        '.header-user': {
          'display': 'flex',
          'align-items': 'center',
          'gap': '16px',
        },
        '.user-greeting': {
          'color': '#c9d1d9',
          'font-size': '14px',
          'font-weight': '500',
        },
        '.logout-button': {
          'padding': '6px 12px',
          'font-size': '12px',
          'font-weight': '500',
          'color': '#c9d1d9',
          'background-color': '#21262d',
          'border': '1px solid #30363d',
          'border-radius': '6px',
          'cursor': 'pointer',
          'transition': 'all 0.2s',
          '&:hover': {
            'background-color': '#30363d',
            'border-color': '#8b949e'
          },
        },
        '.main-content': {
          'padding': '12px 0',
        },
        '.profile-section': {
          'display': 'flex',
          'align-items': 'flex-start',
          'gap': '16px',
          'margin-bottom': '12px',
          'padding': '12px 16px',
          'background-color': '#161b22',
          'border': '1px solid #30363d',
          'border-radius': '6px',
          '@media (min-width: 768px)': {
            'gap': '24px',
            'padding': '16px 24px',
          },
        },
        '.profile-avatar': {
          'width': '60px',
          'height': '60px',
          'border-radius': '50%',
          'background-color': '#30363d',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-size': '24px',
          'color': '#7d8590',
          'flex-shrink': '0',
          'align-self': 'center',
          'margin-top': '4px',
          '@media (min-width: 768px)': {
            'width': '80px',
            'height': '80px',
            'font-size': '32px',
            'margin-top': '8px',
          },
        },
        '.profile-content': {
          'flex': '1',
          'min-width': '0',
          'max-width': '400px',
          'display': 'flex',
          'flex-direction': 'column',
          'justify-content': 'center',
          'margin-top': '8px',
        },
        '.profile-header': {
          'margin-bottom': '10px',
        },
        '.profile-name': {
          'font-size': '20px',
          'font-weight': 'bold',
          'color': '#f0f6fc',
          'margin': '0 0 4px 0',
          '@media (min-width: 768px)': {
            'font-size': '24px',
          },
        },
        '.profile-bio': {
          'color': '#8b949e',
          'margin': '0',
          'font-size': '14px',
          'line-height': '1.4',
        },
        '.profile-stats': {
          'display': 'flex',
          'gap': '16px',
          'flex-wrap': 'wrap',
          '@media (min-width: 768px)': {
            'gap': '22px',
          },
        },
        '.stat': {
          'display': 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
        },
        '.stat-number': {
          'font-size': '18px',
          'font-weight': 'bold',
          'color': '#f0f6fc',
          '@media (min-width: 768px)': {
            'font-size': '20px',
          },
        },
        '.stat-label': {
          'font-size': '11px',
          'color': '#8b949e',
          '@media (min-width: 768px)': {
            'font-size': '12px',
          },
        },
        '.section': {
          'background-color': '#161b22',
          'border': '1px solid #30363d',
          'border-radius': '6px',
          'padding': '20px 24px',
          'margin': '0 0 20px 0',
        },
        '.subsection': {
          'background-color': '#161b22',
          'border': '1px solid #30363d',
          'border-radius': '6px',
          'padding': '16px 20px',
          'margin': '0',
        },
        '.contribution-title': {
          'font-size': '18px',
          'font-weight': '600',
          'color': '#f0f6fc',
          'margin': '0 0 12px 0',
        },
        '.page-title': {
          'font-size': '24px',
          'font-weight': '700',
          'color': '#f0f6fc',
          'margin': '0 0 8px 0',
          'line-height': '1.2',
        },
        '.section-title': {
          'font-size': '20px',
          'font-weight': '600',
          'color': '#f0f6fc',
          'margin': '0 0 12px 0',
        },
        '.contribution-subtitle': {
          'font-size': '14px',
          'color': '#8b949e',
          'margin': '0',
          'padding': '4px 0',
        },
        '.page-header': {
          'padding-top': '12px',
          'padding-bottom': '12px',
        },
        '.contribution-graph': {
          'display': 'flex',
          'flex-direction': 'column',
          'gap': '8px',
        },
        '.contribution-months': {
          'display': 'flex',
          'align-items': 'center',
        },
        '.month-labels': {
          'display': 'flex',
          'width': '100%',
          'justify-content': 'space-between',
          'padding-left': '45px',
        },
        '.month-label': {
          'font-size': '16px',
          'color': '#7d8590',
          'text-align': 'center',
          'flex': '1',
          'font-weight': '500',
        },
        '.contribution-main': {
          'display': 'flex',
          'gap': '10px',
          'width': '100%',
        },
        '.contribution-days': {
          'display': 'grid',
          'grid-template-rows': 'repeat(7, 1fr)',
          'gap': '2px',
          'width': '35px',
          'flex-shrink': '0',
        },
        '.day-label': {
          'font-size': '14px',
          'color': '#7d8590',
          'text-align': 'right',
          'padding-right': '6px',
          'width': '35px',
          'font-weight': '500',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end',
        },
        '.contribution-weeks': {
          'display': 'flex',
          'gap': '2px',
          'width': '100%',
          'flex': '1',
          'min-width': '0',
        },
        '.contribution-week': {
          'display': 'flex',
          'flex-direction': 'column',
          'gap': '2px',
          'flex': '1',
          'min-width': '0',
        },
        '.contribution-day': {
          'width': '100%',
          'height': '0',
          'padding-bottom': '100%',
          'border-radius': '3px',
          'background-color': '#161b22',
          'border': '1px solid #30363d',
          'cursor': 'pointer',
          'transition': 'all 0.2s',
          'position': 'relative',
          '&:hover': {
            'border-color': '#7d8590',
          },
          '&.level-0': {
            'background-color': '#34181c',
          },
          '&.level-1': {
            'background-color': '#662020',
          },
          '&.level-2': {
            'background-color': '#a02024',
          },
          '&.level-3': {
            'background-color': '#ff2d2d',
          },
        },
        '.contribution-footer': {
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-start',
          'gap': '48px',
          'margin-top': '16px',
          'padding-top': '16px',
          'border-top': '1px solid #30363d',
        },
        '.contribution-legend': {
          'display': 'flex',
          'align-items': 'center',
          'gap': '14px',
          'font-size': '12px',
          'color': '#7d8590',
        },
        '.legend-items': {
          'display': 'flex',
          'gap': '10px',
        },
        '.legend-item': {
          'display': 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'gap': '3px',
          'min-width': '52px',
          'width': '52px',
          'span': {
            'font-size': '12px',
            'color': '#7d8590',
            'white-space': 'nowrap',
            'text-align': 'center',
          },
          '.contribution-day': {
            'width': '18px',
            'height': '18px',
            'padding-bottom': '0',
            'position': 'static',
          },
        },
        '.mode-selector': {
          'display': 'flex',
          'gap': '8px',
        },
        '.mode-button': {
          'padding': '8px 16px',
          'font-size': '14px',
          'font-weight': '500',
          'color': '#c9d1d9',
          'background-color': '#21262d',
          'border': '1px solid #30363d',
          'border-radius': '6px',
          'cursor': 'pointer',
          'transition': 'all 0.2s',
          '&:hover': {
            'background-color': '#30363d',
            'border-color': '#8b949e',
          },
          '&.active': {
            'background-color': '#bb1f21',
            'border-color': '#bb1f21',
            'color': '#ffffff',
            '&:hover': {
              'background-color': '#34181c',
              'border-color': '#34181c',
            },
          },
        },
        '.current-streak': {
          'display': 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '16px',
          'background-color': '#21262d',
          'border': '1px solid #30363d',
          'border-radius': '6px',
          'min-width': '120px',
        },
        '.streak-number': {
          'font-size': '24px',
          'font-weight': 'bold',
          'color': '#f0f6fc',
          'margin-bottom': '4px',
        },
        '.streak-label': {
          'font-size': '14px',
          'color': '#8b949e',
          'margin-bottom': '2px',
        },
        '.streak-description': {
          'font-size': '12px',
          'color': '#8b949e',
          'font-style': 'italic',
        },
        '.auth-page': {
          'min-height': '100vh',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'background-color': '#0d1117',
          'padding': '20px',
        },
        '.auth-container': {
          'background-color': '#161b22',
          'border': '1px solid #30363d',
          'border-radius': '12px',
          'padding': '40px',
          'max-width': '400px',
          'width': '100%',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
        '.auth-header': {
          'text-align': 'center',
          'margin-bottom': '32px',
        },
        '.auth-logo': {
          'font-size': '28px',
          'font-weight': '700',
          'color': '#f0f6fc',
          'margin': '0 0 8px 0',
        },
        '.auth-tagline': {
          'font-size': '14px',
          'color': '#8b949e',
          'margin': '0',
        },
        '.auth-form': {
          'width': '100%',
        },
        '.auth-title': {
          'font-size': '24px',
          'font-weight': '600',
          'color': '#f0f6fc',
          'margin': '0 0 8px 0',
          'text-align': 'center',
        },
        '.auth-subtitle': {
          'font-size': '14px',
          'color': '#8b949e',
          'margin': '0 0 24px 0',
          'text-align': 'center',
        },
        '.auth-form-fields': {
          'display': 'flex',
          'flex-direction': 'column',
          'gap': '16px',
        },
        '.form-group': {
          'display': 'flex',
          'flex-direction': 'column',
          'label': {
            'font-size': '14px',
            'font-weight': '600',
            'color': '#f0f6fc',
            'margin-bottom': '6px',
          },
          'input': {
            'padding': '12px',
            'font-size': '14px',
            'background-color': '#0d1117',
            'border': '1px solid #30363d',
            'border-radius': '6px',
            'color': '#c9d1d9',
            'outline': 'none',
            'transition': 'border-color 0.2s',
            '&:focus': {
              'border-color': '#58a6ff',
            },
            '&.error': {
              'border-color': '#f85149',
            },
          },
        },
        '.password-input-group': {
          'position': 'relative',
          'display': 'flex',
          'align-items': 'center',
          'input': {
            'padding-right': '60px',
            'width': '100%',
          },
        },
        '.password-toggle': {
          'position': 'absolute',
          'right': '12px',
          'background': 'none',
          'border': 'none',
          'color': '#8b949e',
          'cursor': 'pointer',
          'font-size': '12px',
          'padding': '4px',
          'transition': 'color 0.2s',
          '&:hover': {
            'color': '#c9d1d9',
          },
          '&:disabled': {
            'opacity': '0.5',
            'cursor': 'not-allowed',
          },
        },
        '.password-strength': {
          'margin-top': '8px',
        },
        '.password-strength-bar': {
          'height': '3px',
          'background-color': '#30363d',
          'border-radius': '2px',
          'position': 'relative',
          'overflow': 'hidden',
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'top': '0',
            'left': '0',
            'height': '100%',
            'width': '100%',
            'background-color': '#30363d',
          },
        },
        '.password-strength-text': {
          'font-size': '12px',
          'margin-top': '4px',
          'display': 'block',
        },
        '.field-error': {
          'color': '#f85149',
          'font-size': '12px',
          'margin-top': '4px',
        },
        '.auth-error': {
          'background-color': '#da3633',
          'border': '1px solid #f85149',
          'border-radius': '6px',
          'padding': '12px',
          'color': '#ffffff',
          'font-size': '14px',
          'margin-bottom': '16px',
          'text-align': 'center',
        },
        '.auth-button': {
          'padding': '12px 24px',
          'font-size': '14px',
          'font-weight': '600',
          'border': 'none',
          'border-radius': '6px',
          'cursor': 'pointer',
          'transition': 'all 0.2s',
          'text-align': 'center',
          'width': '100%',
          '&.primary': {
            'background-color': '#BB1F21',
            'color': '#ffffff',
            '&:hover:not(:disabled)': {
              'background-color': '#921E21',
            },
          },
          '&:disabled': {
            'opacity': '0.5',
            'cursor': 'not-allowed',
          },
        },
        '.auth-footer': {
          'margin-top': '24px',
          'text-align': 'center',
          'p': {
            'color': '#8b949e',
            'font-size': '14px',
            'margin': '0',
          },
        },
        '.auth-link': {
          'background': 'none',
          'border': 'none',
          'color': '#58a6ff',
          'cursor': 'pointer',
          'font-size': '14px',
          'text-decoration': 'underline',
          'padding': '0',
          'transition': 'color 0.2s',
          '&:hover:not(:disabled)': {
            'color': '#79c0ff',
          },
          '&:disabled': {
            'opacity': '0.5',
            'cursor': 'not-allowed',
          },
        },
        '.auth-demo': {
          'margin-top': '24px',
          'padding': '16px',
          'background-color': '#0d1117',
          'border': '1px solid #30363d',
          'border-radius': '6px',
          'text-align': 'center',
          'p': {
            'color': '#8b949e',
            'font-size': '12px',
            'margin': '4px 0',
          },
          'strong': {
            'color': '#f0f6fc',
            'font-weight': '600',
          },
        },
      })
    }
  ],
  corePlugins: {
    preflight: false,
  }
} 