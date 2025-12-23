
'use client';

import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, speed = 50, onComplete?: () => void) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText(''); // Reset on new text
    if (text) {
        let i = 0;
        const typingInterval = setInterval(() => {
        if (i < text.length) {
            setDisplayText(prev => prev + text.charAt(i));
            i++;
        } else {
            clearInterval(typingInterval);
            if(onComplete) onComplete();
        }
        }, speed);

        return () => {
            clearInterval(typingInterval);
        };
    }
  }, [text, speed, onComplete]);

  return displayText;
};
