import { useState, useCallback } from 'react';

export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  const setField = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const reset = useCallback(() => setValues(initialValues), [initialValues]);

  const setAll = useCallback((newValues) => setValues(newValues), []);

  return { values, setField, handleChange, reset, setAll, setValues };
}
