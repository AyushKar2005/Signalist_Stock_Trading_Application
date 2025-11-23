'use client';

import { useRef, useEffect, useCallback } from 'react';

export function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
    const timeoutRef = useRef<number | null>(null);
    const savedCallback = useRef<T>(callback);

    // keep latest callback
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // stable debounced function (only changes if delay changes)
    const debounced = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            savedCallback.current(...args);
        }, delay);
    }, [delay]);

    // cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debounced;
}
