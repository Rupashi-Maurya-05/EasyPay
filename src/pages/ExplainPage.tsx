import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Volume2, Copy, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { VoiceButton } from '@/components/VoiceButton';
import { StatusBanner } from '@/components/StatusBanner';
import { useVoice } from '@/hooks/useVoice';
import { useAccessibility } from '@/hooks/useAccessibility';
import { easyPayApi } from '@/lib/api/easyPayApi';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ExplainPage = () => {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
  const { toast } = useToast();
  
  const [smsText, setSmsText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVoiceResult = useCallback((transcript: string) => {
    setSmsText(transcript);
    handleExplain(transcript);
  }, []);

  const { state: voiceState, startListening, stopListening, speak } = useVoice({
    onResult: handleVoiceResult,
    language: settings.language,
    speakRate: settings.speakRate,
  });

  const handleExplain = async (text: string = smsText) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    await speak('Let me explain this message for you.');

    try {
      const response = await easyPayApi.explainSms(text, settings.language);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        setExplanation('');
      } else if (response.explanation) {
        setExplanation(response.explanation);
        speak(response.explanation);
      }
    } catch (error) {
      console.error('Failed to explain SMS:', error);
      toast({
        title: "Error",
        description: "Could not explain the message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoicePress = async () => {
    if (voiceState === 'listening') {
      stopListening();
      return;
    }

    await speak('Please read or say the SMS message you want me to explain.');
    startListening();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    if (explanation) {
      speak(explanation);
    }
  };

  // Sample SMS messages for demo
  const sampleMessages = [
    'Rs.500 debited from A/c XX1234 on 15-Jan. UPI Ref: 123456789. Available Bal: Rs.2,450.00',
    'OTP for your transaction is 456789. Valid for 10 minutes. Do not share with anyone.',
    'Rs.1,000 credited to A/c XX1234. Balance: Rs.3,450.00. Ref: IMPS/987654321',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 space-y-8 safe-area-inset">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className={cn(
            'flex items-center gap-2 tap-target rounded-xl px-4',
            'text-muted-foreground hover:text-foreground',
            'focus-visible:ring-4 focus-visible:ring-offset-2'
          )}
          aria-label="Go back to home"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-accessible-base">Back</span>
        </button>

        {/* Title */}
        <section className="text-center space-y-2">
          <h1 className="text-accessible-2xl font-bold text-foreground flex items-center justify-center gap-3">
            <MessageSquare className="w-10 h-10" />
            Explain SMS
          </h1>
          <p className="text-accessible-lg text-muted-foreground">
            Paste or speak an SMS to understand it in simple words
          </p>
        </section>

        {/* SMS Input */}
        <section className="space-y-4">
          <label htmlFor="sms-input" className="block text-accessible-lg font-semibold">
            Enter or paste your SMS
          </label>
          <textarea
            id="sms-input"
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="Paste your bank SMS here..."
            rows={4}
            className={cn(
              'w-full text-accessible-base',
              'bg-card border-2 border-input rounded-2xl',
              'p-6',
              'focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring',
              'resize-none'
            )}
          />
          
          <button
            onClick={() => handleExplain()}
            disabled={!smsText.trim() || isProcessing}
            className={cn(
              'w-full btn-accessible',
              'bg-primary text-primary-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Explaining...
              </>
            ) : (
              'Explain This Message'
            )}
          </button>
        </section>

        {/* Explanation Result */}
        {explanation && (
          <section className="space-y-4 animate-slide-up">
            <h2 className="text-accessible-lg font-bold text-foreground">
              Simple Explanation
            </h2>
            <div className="bg-success/10 border-2 border-success/30 rounded-3xl p-6 space-y-4">
              <p className="text-accessible-lg text-foreground leading-relaxed">
                {explanation}
              </p>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReadAloud}
                  className={cn(
                    'flex-1 btn-accessible',
                    'bg-success text-success-foreground',
                    'flex items-center justify-center gap-2'
                  )}
                  aria-label="Read aloud"
                >
                  <Volume2 className="w-5 h-5" />
                  Read Aloud
                </button>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex-1 btn-accessible',
                    'bg-muted text-muted-foreground',
                    'flex items-center justify-center gap-2'
                  )}
                  aria-label={copied ? 'Copied' : 'Copy'}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Sample Messages */}
        <section className="space-y-4">
          <h2 className="text-accessible-lg font-semibold text-foreground">
            Try a sample message
          </h2>
          <div className="space-y-3">
            {sampleMessages.map((msg, index) => (
              <button
                key={index}
                onClick={() => {
                  setSmsText(msg);
                  handleExplain(msg);
                }}
                className={cn(
                  'w-full text-left p-4 rounded-2xl',
                  'bg-card border-2 border-border',
                  'hover:border-primary transition-colors',
                  'focus-visible:ring-4 focus-visible:ring-offset-2'
                )}
              >
                <p className="text-accessible-sm text-muted-foreground line-clamp-2">
                  {msg}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Voice Control */}
        <section className="flex flex-col items-center gap-4 pt-4">
          <VoiceButton
            state={voiceState}
            onPress={handleVoicePress}
            onStop={stopListening}
          />
          
          {voiceState === 'listening' && (
            <StatusBanner type="listening" message="Listening... Read your SMS" />
          )}
          
          {voiceState === 'speaking' && (
            <StatusBanner type="speaking" message="Speaking..." />
          )}

          <p className="text-accessible-sm text-muted-foreground text-center">
            Or speak your SMS message to have it explained
          </p>
        </section>
      </main>
    </div>
  );
};

export default ExplainPage;
