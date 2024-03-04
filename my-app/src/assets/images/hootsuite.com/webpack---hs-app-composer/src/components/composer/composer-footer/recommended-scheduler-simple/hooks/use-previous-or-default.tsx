import { useRef, useEffect } from 'react'

/**
 * Hook to compare current/previous state or props
 * See https://blog.logrocket.com/how-to-get-previous-props-state-with-react-hooks/ for usage
 * @param {*} value The state or prop value
 * @returns {*} The previous value of the state or prop
 */

const usePreviousOrDefault = <T extends unknown>(value: T, defaultValue?: T) => {
  const ref = useRef<T>(defaultValue === undefined ? value : defaultValue)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export default usePreviousOrDefault
