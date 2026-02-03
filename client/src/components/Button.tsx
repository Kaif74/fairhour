import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm';

  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-brand-200/50 shadow-lg border border-transparent',
    secondary:
      'bg-brand-100 text-brand-800 hover:bg-brand-200 focus:ring-brand-500 border border-transparent',
    outline:
      'border-2 border-gray-200 text-gray-700 bg-transparent hover:border-brand-500 hover:text-brand-600 focus:ring-brand-500',
    ghost: 'text-gray-600 hover:text-brand-600 hover:bg-brand-50 focus:ring-brand-500 shadow-none',
    white:
      'bg-white text-gray-900 hover:bg-gray-50 focus:ring-white border border-gray-100 shadow-soft',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
    xl: 'px-10 py-4 text-xl',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
