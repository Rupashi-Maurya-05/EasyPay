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
  const isListeningIntentRef = useRef(false); // Track if we WANT to be listening
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      isListeningIntentRef.current = false;
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  // Create/update recognition instance when language changes
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) return;

    // Clean up existing instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    // Create new recognition instance with updated language
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening until manually stopped
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      const text = latestResult[0].transcript;
      
      console.log('Speech recognition result:', text, 'isFinal:', latestResult.isFinal);
      setTranscript(text);
      
      if (latestResult.isFinal) {
        // Stop listening after getting final result
        isListeningIntentRef.current = false;
        recognition.stop();
        onResultRef.current?.(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        // No speech detected - if we still want to listen, let onend restart
        console.log('No speech detected, will retry...');
        return;
      }
      
      if (event.error === 'aborted') {
        // Aborted intentionally, don't report as error
        return;
      }
      
      isListeningIntentRef.current = false;
      setState('idle');
      onErrorRef.current?.(event.error as string);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended, intent:', isListeningIntentRef.current);
      
      // Auto-restart if we still intend to be listening (browser stopped due to silence)
      if (isListeningIntentRef.current) {
        try {
          console.log('Restarting speech recognition...');
          recognition.start();
        } catch (e) {
          console.log('Failed to restart recognition:', e);
          setState('idle');
        }
      } else {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;
  }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      onErrorRef.current?.('Speech recognition not supported');
      return;
    }

    setTranscript('');
    setState('listening');
    isListeningIntentRef.current = true;
    
    try {
      recognitionRef.current.start();
      console.log('Started speech recognition with language:', language);
    } catch (error) {
      // Already started, stop and restart
      console.log('Recognition already started, restarting...');
      recognitionRef.current.stop();
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }, 100);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    isListeningIntentRef.current = false;
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
