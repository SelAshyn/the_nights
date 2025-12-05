'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

// yo button component ho jasle loading state pani support garcha
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
  children,
  className,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        'flex justify-center border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'text-white bg-teal-600 hover:bg-teal-700 focus:ring-[##5E079C]': variant === 'primary',
          'text-[#690ED9] bg-white border-[#690ED9] hover:bg-gray-50 focus:ring-[#0ea0d9]': variant === 'secondary',
          'text-[#690ED9] bg-transparent border-[#690ED9] hover:bg-[#690ED9]/5 focus:ring-[#690ED9]': variant === 'outline',
          'opacity-50 cursor-not-allowed': isLoading || disabled,
          'px-2.5 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
