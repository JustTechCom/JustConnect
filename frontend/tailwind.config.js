/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      colors: {
        // Enhanced Primary Palette
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5b8fc',
          400: '#8b94f8',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
          800: '#434190',
          900: '#3c366b',
          950: '#252052',
        },
        
        // Modern Secondary Colors
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        
        // Enhanced Gray Scale
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        
        // Modern Success Colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        
        // Modern Warning Colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        // Modern Error Colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        // Glass Effect Colors
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          light: 'rgba(255, 255, 255, 0.05)',
          dark: 'rgba(0, 0, 0, 0.1)',
          darker: 'rgba(0, 0, 0, 0.2)',
        },
      },
      
      backgroundImage: {
        // Modern Gradients
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-warning': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'gradient-error': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'gradient-dark': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-light': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        
        // Mesh Gradients
        'mesh-primary': 'radial-gradient(at 40% 20%, #667eea 0px, transparent 50%), radial-gradient(at 80% 0%, #764ba2 0px, transparent 50%), radial-gradient(at 0% 50%, #667eea 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 40% 20%, #1e293b 0px, transparent 50%), radial-gradient(at 80% 0%, #334155 0px, transparent 50%), radial-gradient(at 0% 50%, #0f172a 0px, transparent 50%)',
        
        // Subtle Textures
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      
      animation: {
        // Enhanced Animations
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-fast': 'fadeIn 0.3s ease-out',
        'fade-in-slow': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-out': 'scaleOut 0.2s ease-in',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'floating 3s ease-in-out infinite',
        'morphing': 'morphing 8s ease-in-out infinite',
        
        // Loading Animations
        'spin-slow': 'spin 3s linear infinite',
        'spin-fast': 'spin 0.5s linear infinite',
        'pulse-slow': 'pulse 3s infinite',
        'pulse-fast': 'pulse 1s infinite',
        'typing': 'typing 1.4s infinite ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        
        // Interactive Animations
        'button-press': 'buttonPress 0.15s ease',
        'hover-lift': 'hoverLift 0.3s ease',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-in-bottom': 'slideInFromBottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-in-right': 'slideInFromRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        morphing: {
          '0%, 100%': {
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            transform: 'translate3d(0, 0, 0) rotateZ(0deg)',
          },
          '50%': {
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
            transform: 'translate3d(0, -50px, 0) rotateZ(180deg)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        buttonPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
        hoverLift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(102, 126, 234, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(102, 126, 234, 0.4)' },
        },
        slideInFromBottom: {
          '0%': { opacity: '0', transform: 'translateY(50px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideInFromRight: {
          '0%': { opacity: '0', transform: 'translateX(50px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
      },
      
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      
      boxShadow: {
        // Enhanced Shadows
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 30px rgba(59, 130, 246, 0.15)',
        'glow-lg': '0 0 50px rgba(59, 130, 246, 0.2)',
        'glow-primary': '0 0 30px rgba(102, 126, 234, 0.15)',
        'glow-secondary': '0 0 30px rgba(236, 72, 153, 0.15)',
        'glow-success': '0 0 30px rgba(16, 185, 129, 0.15)',
        'glow-warning': '0 0 30px rgba(245, 158, 11, 0.15)',
        'glow-error': '0 0 30px rgba(239, 68, 68, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        '10xl': '104rem',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    function({ addUtilities, addComponents, theme }) {
      // Custom Utilities
      addUtilities({
        // Safe Area Utilities
        '.safe-top': { paddingTop: 'env(safe-area-inset-top)' },
        '.safe-bottom': { paddingBottom: 'env(safe-area-inset-bottom)' },
        '.safe-left': { paddingLeft: 'env(safe-area-inset-left)' },
        '.safe-right': { paddingRight: 'env(safe-area-inset-right)' },
        
        // Scrollbar Utilities
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.scrollbar-thin': {
          '&::-webkit-scrollbar': { width: '6px', height: '6px' },
          '&::-webkit-scrollbar-track': { background: theme('colors.gray.100') },
          '&::-webkit-scrollbar-thumb': {
            background: theme('colors.gray.300'),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme('colors.gray.400'),
          },
        },
        '.scrollbar-modern': {
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '10px' },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.6))',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.5), rgba(100, 116, 139, 0.8))',
            backgroundClip: 'content-box',
          },
        },
        
        // Glass Effects
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-strong': {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        
        // Text Effects
        '.text-gradient-primary': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-secondary': {
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        
        // Interactive States
        '.hover-lift': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-4px)' },
        },
        '.hover-scale': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'scale(1.05)' },
        },
        '.active-scale': {
          '&:active': { transform: 'scale(0.96)' },
        },
      });
      
      // Custom Components
      addComponents({
        // Modern Button Styles
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.2xl'),
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.600'),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          border: 'none',
          minHeight: '44px',
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          position: 'relative',
          overflow: 'hidden',
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme('colors.primary.500')}40`,
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.6s',
          },
          '&:hover::before': {
            transform: 'translateX(100%)',
          },
        },
        
        '.btn-primary': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.medium'),
          '&:hover:not(:disabled)': {
            transform: 'translateY(-2px)',
            boxShadow: `${theme('boxShadow.strong')}, ${theme('boxShadow.glow-primary')}`,
          },
          '&:active': {
            animation: 'buttonPress 0.2s ease',
          },
        },
        
        '.btn-secondary': {
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.medium'),
          '&:hover:not(:disabled)': {
            transform: 'translateY(-2px)',
            boxShadow: `${theme('boxShadow.strong')}, ${theme('boxShadow.glow-secondary')}`,
          },
        },
        
        '.btn-glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: theme('colors.gray.700'),
          '&:hover:not(:disabled)': {
            background: 'rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.medium'),
          },
        },
        
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.gray.600'),
          border: `1px solid ${theme('colors.gray.200')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.gray.50'),
            borderColor: theme('colors.gray.300'),
          },
        },
        
        // Enhanced Input Styles
        '.input': {
          display: 'block',
          width: '100%',
          borderRadius: theme('borderRadius.2xl'),
          border: `2px solid transparent`,
          padding: `${theme('spacing.4')} ${theme('spacing.5')}`,
          fontSize: theme('fontSize.base'),
          lineHeight: theme('lineHeight.6'),
          color: theme('colors.gray.900'),
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme('boxShadow.soft'),
          '&:focus': {
            outline: 'none',
            borderImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1',
            boxShadow: `${theme('boxShadow.glow-primary')}, ${theme('boxShadow.medium')}`,
            transform: 'translateY(-1px)',
          },
          '&::placeholder': {
            color: theme('colors.gray.400'),
            transition: 'all 0.3s ease',
          },
          '&:focus::placeholder': {
            color: theme('colors.gray.300'),
            transform: 'translateY(-2px)',
          },
        },
        
        // Enhanced Card Styles
        '.card': {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: theme('borderRadius.3xl'),
          padding: theme('spacing.8'),
          boxShadow: theme('boxShadow.medium'),
          border: `1px solid rgba(255, 255, 255, 0.2)`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          },
        },
        
        '.card-hover': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme('boxShadow.strong'),
          },
        },
        
        // Message Bubble Styles
        '.message-bubble': {
          maxWidth: '75%',
          wordWrap: 'break-word',
          borderRadius: theme('borderRadius.3xl'),
          padding: `${theme('spacing.4')} ${theme('spacing.5')}`,
          position: 'relative',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideInFromBottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            borderRadius: theme('borderRadius.3xl'),
          },
        },
        
        '.message-own': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: theme('colors.white'),
          marginLeft: 'auto',
          borderBottomRightRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.medium'),
        },
        
        '.message-other': {
          background: 'rgba(255, 255, 255, 0.9)',
          color: theme('colors.gray.800'),
          marginRight: 'auto',
          borderBottomLeftRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.soft'),
          border: `1px solid rgba(229, 231, 235, 0.5)`,
        },
        
        // Loading Components
        '.skeleton': {
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
          borderRadius: theme('borderRadius.lg'),
        },
        
        '.typing-indicator': {
          display: 'flex',
          alignItems: 'center',
          gap: theme('spacing.2'),
          padding: `${theme('spacing.4')} ${theme('spacing.5')}`,
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: theme('borderRadius.3xl'),
          borderBottomLeftRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.soft'),
          animation: 'slideInFromBottom 0.3s ease',
          maxWidth: '80px',
        },
        
        '.typing-dot': {
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #94a3b8, #64748b)',
          animation: 'typing 1.4s infinite ease-in-out',
          '&:nth-child(1)': { animationDelay: '-0.32s' },
          '&:nth-child(2)': { animationDelay: '-0.16s' },
          '&:nth-child(3)': { animationDelay: '0s' },
        },
      });
    },
  ],
}