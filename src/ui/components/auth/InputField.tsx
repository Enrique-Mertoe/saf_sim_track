import React from 'react';

interface InputFieldProps {
  id: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  label: string;
  icon: React.ReactElement;
  error?: string;
  disabled?: boolean;
  rightIcon?: React.ReactElement;
  onRightIconClick?: () => void;
  autoComplete?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  name,
  type,
  value,
  onChange,
  placeholder,
  label,
  icon,
  error,
  disabled = false,
  rightIcon,
  onRightIconClick,
  autoComplete,
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`block w-full pl-10 ${rightIcon ? 'pr-10' : 'pr-3'} py-3 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder={placeholder}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {rightIcon}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// components/auth/Button.tsx

interface ButtonProps {
  type: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'button',
  onClick,
  disabled = false,
  fullWidth = false,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}) => {
  const baseClasses = 'flex justify-center items-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';

  const variantClasses = {
    primary: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 border border-transparent',
    secondary: 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300',
    outline: 'text-green-600 bg-white hover:bg-gray-50 focus:ring-green-500 border border-green-300',
  };

  const sizeClasses = {
    sm: 'py-2 px-3 text-xs',
    md: 'py-3 px-4 text-sm',
    lg: 'py-4 px-6 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
};


interface AlertProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  icon?: React.ReactElement;
}

export const Alert: React.FC<AlertProps> = ({ type, message, icon }) => {
  const typeStyles = {
    error: 'bg-red-50 border-red-500 text-red-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    success: 'bg-green-50 border-green-500 text-green-700',
    info: 'bg-blue-50 border-blue-500 text-blue-700',
  };

  return (
    <div className={`p-4 border-l-4 ${typeStyles[type]} flex items-start`}>
      {icon && <span className="mr-2 mt-0.5">{icon}</span>}
      <span>{message}</span>
    </div>
  );
};


interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-white'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <svg className={`animate-spin ${sizeClasses[size]} ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

// components/auth/AuthLayout.tsx
import Image from 'next/image';
import Head from 'next/head';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  showFeatures?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  children,
  showFeatures = true
}) => {
  return (
    <>
      <Head>
        <title>{title} | Safaricom SIM Tracking</title>
        <meta name="description" content="Safaricom SIM Card Sales Tracking System" />
      </Head>

      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Brand Section */}
        <div className="bg-green-600 text-white md:w-1/2 p-8 flex flex-col justify-between">
          <div className="mb-8">
            <div className="w-48 h-12 relative mb-16">
              <Image
                src="/safaricom-logo-white.png"
                alt="Safaricom Logo"
                layout="fill"
                objectFit="contain"
                priority
              />
            </div>

            <h1 className="text-4xl font-bold mb-4">SIM Card Sales Tracking System</h1>
            <p className="text-xl mb-6">Track and manage sales performance across your teams</p>

            {showFeatures && (
              <div className="hidden md:block">
                <h2 className="text-xl font-semibold mb-4">Features:</h2>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="mr-2">✓</span> Track SIM card sales and activations
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span> Monitor team performance
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span> Manage staff onboarding
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span> Generate detailed reports
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="text-sm">
            © {new Date().getFullYear()} Safaricom PLC. All rights reserved.
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white md:w-1/2 p-8 flex items-center justify-center">
          <div className="max-w-md w-full">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};