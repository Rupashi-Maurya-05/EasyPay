import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Camera, MessageSquare, Settings, Mic } from 'lucide-react';
import { Header } from '@/components/Header';
import { ActionCard } from '@/components/ActionCard';
import { VoiceButton } from '@/components/VoiceButton';
import { StatusBanner } from '@/components/StatusBanner';
import { GestureHint } from '@/components/GestureHint';
import { useVoice } from '@/hooks/useVoice';
import { useGestures } from '@/hooks/useGestures';
import { useAccessibility } from '@/hooks/useAccessibility';
const Index = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    settings
  } = useAccessibility();
  const [gestureHint, setGestureHint] = useState<'swipe-left' | 'swipe-right' | null>(null);
  const handleVoiceResult = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    const compact = lower.replace(/\s+/g, '');
    const isHindi = (settings.language || '').toLowerCase().startsWith('hi');

    const containsAny = (haystack: string, needles: string[]) =>
      needles.some(n => haystack.includes(n));

    const payKeywords = isHindi
      ? ['पे', 'पेमेंट', 'भुगतान', 'पैसे', 'पैसा', 'मनी', 'sendmoney', 'transfer']
      : ['pay', 'send money', 'sendmoney', 'transfer', 'upi'];

    const scanKeywords = isHindi
      ? ['स्कैन', 'कैमरा', 'क्यूआर', 'क्यूआरकोड', 'qr']
      : ['scan', 'camera', 'qr'];

    const explainKeywords = isHindi
      ? ['एक्सप्लेन', 'एसएमएस', 'संदेश', 'मैसेज', 'समझा', 'समझाओ', 'sms']
      : ['explain', 'sms', 'message'];

    const settingsKeywords = isHindi
      ? ['सेटिंग', 'मदद', 'हेल्प', 'settings', 'help']
      : ['settings', 'help'];

    // Match against both spaced + compact forms for robustness
    if (containsAny(lower, payKeywords) || containsAny(compact, payKeywords)) {
      navigate('/pay');
      return;
    }

    if (containsAny(lower, scanKeywords) || containsAny(compact, scanKeywords)) {
      navigate('/scan');
      return;
    }

    if (containsAny(lower, explainKeywords) || containsAny(compact, explainKeywords)) {
      navigate('/explain');
      return;
    }

    if (containsAny(lower, settingsKeywords) || containsAny(compact, settingsKeywords)) {
      navigate('/settings');
    }
  }, [navigate, settings.language]);
  const {
    state: voiceState,
    startListening,
    stopListening,
    isSupported
  } = useVoice({
    onResult: handleVoiceResult,
    language: settings.language,
    speakRate: settings.speakRate
  });

  // Gesture handlers
  useGestures(containerRef, {
    onSwipeLeft: () => {
      setGestureHint('swipe-left');
    },
    onSwipeRight: () => {
      setGestureHint('swipe-right');
    }
  });
  const handleVoicePress = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      // CRITICAL: SpeechRecognition.start() must be called from a direct user gesture (tap/click)
      // for many browsers (especially on mobile). Do not defer this behind async TTS.
      startListening();
    }
  };
  const actions = [{
    icon: IndianRupee,
    title: 'Pay',
    description: 'Send money to anyone',
    onClick: () => navigate('/pay'),
    variant: 'primary' as const
  }, {
    icon: Camera,
    title: 'Scan',
    description: 'Scan QR or document',
    onClick: () => navigate('/scan'),
    variant: 'success' as const
  }, {
    icon: MessageSquare,
    title: 'Explain SMS',
    description: 'Understand bank messages',
    onClick: () => navigate('/explain'),
    variant: 'warning' as const
  }, {
    icon: Settings,
    title: 'Settings',
    description: 'Adjust accessibility',
    onClick: () => navigate('/settings'),
    variant: 'default' as const
  }];
  return <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <Header />

      <main id="main-content" ref={containerRef} className="container py-8 space-y-8 safe-area-inset">
        {/* Welcome Section */}
        <section aria-labelledby="welcome-heading" className="text-center space-y-4">
          <h1 id="welcome-heading" className="sr-only">Easy Pay Home</h1>
          <p className="text-accessible-lg max-w-md mx-auto font-bold text-primary">
            Tap a button below or use your voice
          </p>
        </section>

        {/* Voice Control */}
        <section aria-labelledby="voice-heading" className="flex flex-col items-center gap-4">
          <h2 id="voice-heading" className="sr-only">Voice Control</h2>
          
          {!isSupported ? <StatusBanner type="info" message="Voice control is not available in your browser" /> : <>
              <VoiceButton state={voiceState} onPress={handleVoicePress} onStop={stopListening} size="large" />
              
              {voiceState === 'listening' && <StatusBanner type="listening" message="Listening... Speak now" />}
              
              {voiceState === 'speaking' && <StatusBanner type="speaking" message="Speaking..." />}
              
              {voiceState === 'idle' && <p className="text-accessible-base text-muted-foreground flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Tap the microphone to speak
                </p>}
            </>}
        </section>

        {/* Main Actions */}
        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="sr-only">Main Actions</h2>
          
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {actions.map(action => <ActionCard key={action.title} icon={action.icon} title={action.title} description={action.description} onClick={action.onClick} variant={action.variant} />)}
          </div>
        </section>

        {/* Gesture Hints */}
        <section aria-labelledby="gestures-heading" className="text-center">
          <h2 id="gestures-heading" className="sr-only">Gesture Controls</h2>
          <p className="text-accessible-sm text-muted-foreground">
            <span className="hidden sm:inline">Swipe left to go back • Swipe right to confirm</span>
            <span className="sm:hidden">Swipe to navigate</span>
          </p>
        </section>

        {/* Gesture Overlay */}
        <GestureHint gesture={gestureHint} onComplete={() => setGestureHint(null)} />
      </main>
    </div>;
};
export default Index;