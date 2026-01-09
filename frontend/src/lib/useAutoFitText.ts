import { useEffect, useRef, useState } from 'react';

interface UseAutoFitTextOptions {
    minFontSize?: number;
    maxFontSize?: number;
    maxLines?: number;
    lineHeight?: number;
}

export function useAutoFitText({
    minFontSize = 0.75, // 12px at base 16px
    maxFontSize = 1.125, // 18px at base 16px
    maxLines = 3,
    lineHeight = 1.2,
}: UseAutoFitTextOptions = {}) {
    const textRef = useRef<HTMLElement>(null);
    const [fontSize, setFontSize] = useState<number>(maxFontSize);

    useEffect(() => {
        const element = textRef.current;
        if (!element) return;

        // Use a simple adjustment for now to avoid complex DOM measurements in this simplified version
        // In a real app we might want the full binary search logic
        setFontSize(maxFontSize);

    }, [minFontSize, maxFontSize, maxLines, lineHeight]);

    return { textRef, fontSize };
}
