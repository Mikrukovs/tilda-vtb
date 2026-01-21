'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ValidationState {
  [inputId: string]: {
    isValid: boolean | null;
    touched: boolean;
    hasValidation: boolean; // Включена ли валидация для этого инпута
  };
}

interface FormValidationContextType {
  validationState: ValidationState;
  registerInput: (inputId: string, hasValidation: boolean) => void;
  unregisterInput: (inputId: string) => void;
  updateValidation: (inputId: string, isValid: boolean | null, touched: boolean) => void;
  isFormValid: () => boolean;
}

const FormValidationContext = createContext<FormValidationContextType | null>(null);

export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [validationState, setValidationState] = useState<ValidationState>({});

  const registerInput = useCallback((inputId: string, hasValidation: boolean) => {
    setValidationState(prev => ({
      ...prev,
      [inputId]: { isValid: null, touched: false, hasValidation }
    }));
  }, []);

  const unregisterInput = useCallback((inputId: string) => {
    setValidationState(prev => {
      const next = { ...prev };
      delete next[inputId];
      return next;
    });
  }, []);

  const updateValidation = useCallback((inputId: string, isValid: boolean | null, touched: boolean) => {
    setValidationState(prev => ({
      ...prev,
      [inputId]: { ...prev[inputId], isValid, touched }
    }));
  }, []);

  const isFormValid = useCallback(() => {
    const inputsWithValidation = Object.values(validationState).filter(v => v.hasValidation);
    
    // Если нет инпутов с валидацией - форма валидна
    if (inputsWithValidation.length === 0) return true;
    
    // Проверяем что все инпуты с валидацией touched и valid
    return inputsWithValidation.every(v => v.touched && v.isValid === true);
  }, [validationState]);

  return (
    <FormValidationContext.Provider value={{
      validationState,
      registerInput,
      unregisterInput,
      updateValidation,
      isFormValid,
    }}>
      {children}
    </FormValidationContext.Provider>
  );
}

export function useFormValidation() {
  const context = useContext(FormValidationContext);
  // Возвращаем null если контекст не доступен (не обёрнуто в Provider)
  return context;
}
