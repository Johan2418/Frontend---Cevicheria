import { useEffect, useState } from 'react';

/**
 * Devuelve `value` con retardo. Se usa para que los campos de filtro no
 * disparen una petición por cada tecla que escribe el usuario.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
