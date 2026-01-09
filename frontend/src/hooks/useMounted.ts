'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track if the component has mounted on the client.
 * Useful for preventing hydration mismatches with wagmi hooks.
 */
export function useMounted() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}
