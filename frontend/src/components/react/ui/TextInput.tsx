import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^\w-]/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#171717] tracking-tight">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        className={`w-full h-12 bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3.5 placeholder-[#a1a1a1] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#0070f3] focus-visible:ring-1 focus-visible:ring-[#0070f3] ${
          error ? 'border-[#ee0000] focus-visible:border-[#ee0000] focus-visible:ring-[#ee0000]' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#ee0000] font-medium mt-0.5">{error}</span>}
      {helperText && !error && <span className="text-xs text-[#8f8f8f] mt-0.5">{helperText}</span>}
    </div>
  );
};
