import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  type = 'text',
  showPasswordToggle = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^\w-]/g, '-') : undefined);
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordInput = type === 'password';
  const effectiveType = isPasswordInput && showPassword ? 'text' : type;

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#171717] tracking-tight">
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        <input
          id={inputId}
          type={effectiveType}
          aria-invalid={!!error}
          className={`w-full h-12 bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md pl-3.5 ${
            isPasswordInput && showPasswordToggle ? 'pr-11' : 'pr-3.5'
          } placeholder-[#a1a1a1] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#0070f3] focus-visible:ring-1 focus-visible:ring-[#0070f3] ${
            error ? 'border-[#ee0000] focus-visible:border-[#ee0000] focus-visible:ring-[#ee0000]' : ''
          } ${className}`}
          {...props}
        />
        {isPasswordInput && showPasswordToggle && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-[#8f8f8f] hover:text-[#171717] transition-colors p-1 rounded-md cursor-pointer flex items-center justify-center"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-[#ee0000] font-medium mt-0.5">{error}</span>}
      {helperText && !error && <span className="text-xs text-[#8f8f8f] mt-0.5">{helperText}</span>}
    </div>
  );
};
