import { useState, useCallback } from 'react';
import { get, set } from 'fe-lib-localstorage';

const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [value, setValue] = useState(() => {
    const item = get(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  });

  const setStoredValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      set(key, JSON.stringify(newValue));
    },
    [key],
  );

  return [value, setStoredValue];
};

export default useLocalStorage;
