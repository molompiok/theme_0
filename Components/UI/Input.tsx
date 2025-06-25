// themes/mono/components/UI/Input.tsx
import React, { InputHTMLAttributes, JSX, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react'; // Pour typer l'icône

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: any; // Permet une icône Lucide ou un autre ReactNode
  label?: string;
  error?: string | null;
  containerClassName?: string;
  inputClassName?: string;
  iconWrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  icon: IconComponent,
  label,
  id,
  error,
  className = '',
  containerClassName = '',
  inputClassName = '',
  iconWrapperClassName = '',
  ...props
}) => {
  const defaultInputClasses = "block w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:border-primary-light dark:focus:border-primary-dark disabled:opacity-50 disabled:cursor-not-allowed";
  const errorInputClasses = "border-red-500 dark:border-red-400 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-400/50 dark:focus:border-red-400";
  const iconPaddingClass = IconComponent ? 'pl-10' : 'px-4';

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={id || props.name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {IconComponent && (
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${iconWrapperClassName}`}>
            {typeof IconComponent === 'string' ?IconComponent:<IconComponent size={18} className="text-slate-400 dark:text-slate-500" />}
          </div>
        )}
        <input
          id={id || props.name}
          className={`${defaultInputClasses} ${iconPaddingClass} ${error ? errorInputClasses : ''} ${inputClassName} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};