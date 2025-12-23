
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Fallback types for browsers lacking SpeechRecognition typings
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

let recognition: SpeechRecognition | null = null;
if (typeof window !== 'undefined' && (('SpeechRecognition' in (window as any)) || ('webkitSpeechRecognition' in (window as any)))) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
}

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);

    useEffect(() => {
        setIsSpeechSupported(!!recognition);
    }, []);

    const startListening = useCallback(() => {
        if (!recognition) return;
        setIsListening(true);
        recognition.start();
    }, []);

    const stopListening = useCallback(() => {
        if (!recognition) return;
        setIsListening(false);
        recognition.stop();
    }, []);

    useEffect(() => {
        if (!recognition) return;

        const handleResult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript);
            }
        };

        const handleEnd = () => {
            if (isListening) {
                recognition?.start(); // Restart if still supposed to be listening
            }
        };

        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('end', handleEnd);

        return () => {
            recognition?.removeEventListener('result', handleResult);
            recognition?.removeEventListener('end', handleEnd);
            recognition?.stop();
        };
    }, [isListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isSpeechSupported,
        setTranscript,
    };
};
