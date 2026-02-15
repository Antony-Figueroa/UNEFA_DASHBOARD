import { useState, useCallback, useRef } from 'react';

/**
 * Hook para manejar la acumulación de texto en una respuesta de streaming
 */
export const useStreamResponse = (onComplete?: (text: string) => void) => {
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const accumulatedRef = useRef('');

    const startStreaming = useCallback(() => {
        setStreamingText('');
        accumulatedRef.current = '';
        setIsStreaming(true);
    }, []);

    const handleChunk = useCallback((chunk: string) => {
        accumulatedRef.current += chunk;
        setStreamingText(accumulatedRef.current);
    }, []);

    const endStreaming = useCallback(() => {
        setIsStreaming(false);
        if (onComplete) {
            onComplete(accumulatedRef.current);
        }
    }, [onComplete]);

    const resetStreaming = useCallback(() => {
        setStreamingText('');
        accumulatedRef.current = '';
        setIsStreaming(false);
    }, []);

    return {
        streamingText,
        isStreaming,
        startStreaming,
        handleChunk,
        endStreaming,
        resetStreaming
    };
};
