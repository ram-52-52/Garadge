import { useState, useEffect, useRef, useCallback } from 'react';

export const useMagnetic = (strength = 0.5) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!ref.current) return;
        
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        
        const distanceX = clientX - centerX;
        const distanceY = clientY - centerY;
        
        if (Math.abs(distanceX) < width && Math.abs(distanceY) < height) {
            setPosition({ x: distanceX * strength, y: distanceY * strength });
        } else {
            setPosition({ x: 0, y: 0 });
        }
    }, [strength]);

    const handleMouseLeave = useCallback(() => {
        setPosition({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    // Vanguard Update: Magnetic movement disabled as per user request
    // Buttons remain stable but retain hover scale/glow in components
    return { ref, x: 0, y: 0, handleMouseLeave };
};
