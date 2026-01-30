import { useState, useCallback, useRef, useEffect } from 'react';

type VoiceState = 'idle' | 'listening' | 'speaking';

interface UseVoiceOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
  speakRate?: number;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const { onResult, onError, language = 'en-US', speakRate = 0.9 } = options;
  
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      
      setTranscript(text);
      
      if (result.isFinal) {
        onResult?.(text);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setState('idle');
      onError?.(event.error as string);
    };

    recognitionRef.current.onend = () => {
      setState('idle');
    };

    synthRef.current = window.speechSynthesis;

    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, [language, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      onError?.('Speech recognition not supported');
      return;
    }

    setTranscript('');
    setState('listening');
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      // Already started
      console.log('Recognition already started');
    }
  }, [onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState('idle');
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!synthRef.current) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speakRate;
      utterance.lang = language;
      
      // Get available voices and prefer a natural sounding one
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith(language.split('-')[0]) && v.localService
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setState('speaking');
      };

      utterance.onend = () => {
        setState('idle');
        resolve();
      };

      utterance.onerror = (event) => {
        setState('idle');
        reject(event);
      };

      synthRef.current.speak(utterance);
    });
  }, [language, speakRate]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setState('idle');
  }, []);

  return {
    state,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isListening: state === 'listening',
    isSpeaking: state === 'speaking',
  };
}
