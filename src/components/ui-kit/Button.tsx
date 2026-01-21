'use client';

import { ButtonProps } from '@/types';
import { useFormValidation } from '@/contexts/FormValidationContext';

interface Props {
  config: ButtonProps;
  preview?: boolean;
  onNavigate?: (screenId: string) => void;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const disabledStyles = {
  primary: 'bg-blue-300 text-white cursor-not-allowed',
  secondary: 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed',
  destructive: 'bg-red-300 text-white cursor-not-allowed',
};

const sizeStyles = {
  s: 'px-3 py-1.5 text-sm',
  m: 'px-4 py-2 text-base',
  l: 'px-6 py-3 text-lg',
};

export function Button({ config, preview, onNavigate }: Props) {
  const formValidation = useFormValidation();
  
  // Проверяем валидность формы если требуется
  const isFormValid = formValidation?.isFormValid() ?? true;
  const isDisabled = config.requireValidation && !isFormValid;

  const handleClick = () => {
    if (!preview) return;
    if (isDisabled) return;
    
    if (config.action === 'navigate' && config.targetScreenId && onNavigate) {
      onNavigate(config.targetScreenId);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        w-full font-medium rounded-lg transition-colors duration-150 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${isDisabled ? disabledStyles[config.variant] : variantStyles[config.variant]}
        ${sizeStyles[config.size]}
      `}
    >
      {config.label}
    </button>
  );
}
