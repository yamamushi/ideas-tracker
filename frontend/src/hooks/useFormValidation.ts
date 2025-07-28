import { useState, useCallback, useMemo } from 'react';
import { getValidationErrors, ApiError } from '../utils/errorHandler';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface FormErrors {
  [field: string]: string[];
}

export interface UseFormValidationOptions {
  rules?: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  options: UseFormValidationOptions = {}
) {
  const { rules = {}, validateOnChange = true, validateOnBlur = true } = options;
  
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: string, value: any): string[] => {
    const rule = rules[field];
    if (!rule) return [];

    const fieldErrors: string[] = [];

    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      fieldErrors.push(`${field} is required`);
    }

    if (value && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        fieldErrors.push(`${field} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        fieldErrors.push(`${field} must be no more than ${rule.maxLength} characters`);
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        fieldErrors.push(`${field} format is invalid`);
      }
    }

    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    return fieldErrors;
  }, [rules]);

  const validateForm = useCallback((): FormErrors => {
    const formErrors: FormErrors = {};
    
    Object.keys(rules).forEach(field => {
      const fieldErrors = validateField(field, values[field]);
      if (fieldErrors.length > 0) {
        formErrors[field] = fieldErrors;
      }
    });

    return formErrors;
  }, [rules, values, validateField]);

  const setValue = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (validateOnChange && touched[field]) {
      const fieldErrors = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: fieldErrors
      }));
    }
  }, [validateField, validateOnChange, touched]);

  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (validateOnBlur) {
      const fieldErrors = validateField(field, values[field]);
      setErrors(prev => ({
        ...prev,
        [field]: fieldErrors
      }));
    }
  }, [validateField, validateOnBlur, values]);

  const setApiErrors = useCallback((apiError: ApiError) => {
    const validationErrors = getValidationErrors(apiError);
    setErrors(validationErrors);
  }, []);

  const clearErrors = useCallback((field?: string) => {
    if (field) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = useMemo(() => {
    const formErrors = validateForm();
    return Object.keys(formErrors).length === 0;
  }, [validateForm]);

  const getFieldProps = useCallback((field: string) => ({
    value: values[field] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(field, e.target.value);
    },
    onBlur: () => setFieldTouched(field),
    error: errors[field]?.[0],
    hasError: Boolean(errors[field]?.length),
  }), [values, errors, setValue, setFieldTouched]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void>
  ) => {
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // Mark all fields as touched
    const allTouched = Object.keys(rules).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError) {
        setApiErrors(error);
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, rules, values, setApiErrors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setFieldTouched,
    setApiErrors,
    clearErrors,
    reset,
    getFieldProps,
    handleSubmit,
    validateForm
  };
}