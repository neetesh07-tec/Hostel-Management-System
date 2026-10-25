import { useState, useCallback, useEffect } from 'react';

export function useFlash() {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');

  const flash = useCallback((msg, t = 'success') => {
    setMessage(msg);
    setType(t);
  }, []);

  const clear = useCallback(() => {
    setMessage('');
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(clear, type === 'error' ? 4000 : 3000);
    return () => clearTimeout(timer);
  }, [message, type, clear]);

  return { message, type, flash, clear };
}
