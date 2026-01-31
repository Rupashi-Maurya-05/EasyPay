import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Send, User, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { VoiceButton } from '@/components/VoiceButton';
import { StatusBanner } from '@/components/StatusBanner';
import { GestureHint } from '@/components/GestureHint';
import { useVoice } from '@/hooks/useVoice';
import { useGestures } from '@/hooks/useGestures';
import { useAccessibility } from '@/hooks/useAccessibility';
import { easyPayApi } from '@/lib/api/easyPayApi';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const PayPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useAccessibility();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [step, setStep] = useState<'amount' | 'recipient' | 'confirm'>('amount');
  const [gestureHint, setGestureHint] = useState<'swipe-left' | 'swipe-right' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleVoiceResult = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase();
    
    // Extract amount from speech
    const amountMatch = lower.match(/(\d+)/);
    if (amountMatch && step === 'amount') {
      setAmount(amountMatch[1]);
      setStep('recipient');
      return;
    }

    // Extract name/UPI ID
    if (step === 'recipient') {
      setRecipient(transcript);
      setStep('confirm');
      return;
    }

    // Confirm or cancel
    if (step === 'confirm') {
      if (lower.includes('yes') || lower.includes('confirm') || lower.includes('send')) {
        handlePayment();
      } else if (lower.includes('no') || lower.includes('cancel')) {
        setStep('amount');
        setAmount('');
        setRecipient('');
      }
    }
  }, [step]);

  const { state: voiceState, startListening, stopListening, speak } = useVoice({
    onResult: handleVoiceResult,
    language: settings.language,
    speakRate: settings.speakRate,
  });

  useGestures(containerRef, {
    onSwipeLeft: () => {
      setGestureHint('swipe-left');
      if (step === 'recipient') {
        setStep('amount');
      } else if (step === 'confirm') {
        setStep('recipient');
      } else {
        navigate('/');
      }
    },
    onSwipeRight: () => {
      setGestureHint('swipe-right');
      if (step === 'amount' && amount) {
        setStep('recipient');
      } else if (step === 'recipient' && recipient) {
        setStep('confirm');
      } else if (step === 'confirm') {
        handlePayment();
      }
    },
  });

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    // Generate UPI deep link
    const upiLink = `upi://pay?pa=${encodeURIComponent(recipient)}&am=${amount}&cu=INR`;
    
    // Log the transaction to the database
    try {
      await easyPayApi.logTransaction(recipient, parseFloat(amount), recipient, upiLink);
    } catch (error) {
      console.error('Failed to log transaction:', error);
      // Continue anyway - logging failure shouldn't block payment
    }
    
    // Try to open UPI app
    window.location.href = upiLink;
    
    setPaymentStatus('success');
    toast({
      title: "Opening Payment App",
      description: `Sending ₹${amount} to ${recipient}`,
    });
    speak(`Opening payment app to send ${amount} rupees to ${recipient}`);
  };

  const handleVoicePress = async () => {
    if (voiceState === 'listening') {
      stopListening();
      return;
    }

    const prompts = {
      amount: 'How much would you like to pay? Say the amount in rupees.',
      recipient: 'Who would you like to pay? Say the name or UPI ID.',
      confirm: `Pay ${amount} rupees to ${recipient}. Say yes to confirm or no to cancel.`,
    };

    await speak(prompts[step]);
    startListening();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main
        ref={containerRef}
        className="container py-8 space-y-8 safe-area-inset"
      >
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
            <IndianRupee className="w-10 h-10" />
            Pay Someone
          </h1>
          <p className="text-accessible-lg text-muted-foreground">
            Step {step === 'amount' ? 1 : step === 'recipient' ? 2 : 3} of 3
          </p>
        </section>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2" role="progressbar" aria-valuenow={step === 'amount' ? 1 : step === 'recipient' ? 2 : 3} aria-valuemax={3}>
          {['amount', 'recipient', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'w-16 h-2 rounded-full transition-colors',
                i <= ['amount', 'recipient', 'confirm'].indexOf(step)
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step Content */}
        <section className="space-y-6 animate-slide-up" key={step}>
          {step === 'amount' && (
            <div className="space-y-4">
              <label htmlFor="amount" className="block text-accessible-lg font-semibold text-center">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-accessible-xl text-muted-foreground">
                  ₹
                </span>
                <input
                  id="amount"
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className={cn(
                    'w-full text-accessible-2xl text-center font-bold',
                    'bg-card border-2 border-input rounded-2xl',
                    'py-6 px-16',
                    'focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring'
                  )}
                  aria-describedby="amount-help"
                />
              </div>
              <p id="amount-help" className="text-accessible-sm text-muted-foreground text-center">
                Enter the amount in rupees
              </p>
            </div>
          )}

          {step === 'recipient' && (
            <div className="space-y-4">
              <label htmlFor="recipient" className="block text-accessible-lg font-semibold text-center">
                Enter Recipient
              </label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground" />
                <input
                  id="recipient"
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Name or UPI ID"
                  className={cn(
                    'w-full text-accessible-lg',
                    'bg-card border-2 border-input rounded-2xl',
                    'py-6 pl-20 pr-6',
                    'focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring'
                  )}
                  aria-describedby="recipient-help"
                />
              </div>
              <p id="recipient-help" className="text-accessible-sm text-muted-foreground text-center">
                Enter the name or UPI ID of the person you want to pay
              </p>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6 text-center">
              <div className="bg-card border-2 border-border rounded-3xl p-8 space-y-4">
                <p className="text-accessible-lg text-muted-foreground">
                  You are about to pay
                </p>
                <p className="text-accessible-3xl font-bold text-primary">
                  ₹{amount}
                </p>
                <p className="text-accessible-lg text-muted-foreground">to</p>
                <p className="text-accessible-xl font-semibold text-foreground">
                  {recipient}
                </p>
              </div>

              {paymentStatus === 'success' && (
                <StatusBanner
                  type="info"
                  message="Opening your payment app..."
                />
              )}

              <button
                onClick={handlePayment}
                disabled={paymentStatus === 'processing'}
                className={cn(
                  'w-full btn-accessible',
                  'bg-success text-success-foreground',
                  'flex items-center justify-center gap-3',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {paymentStatus === 'processing' ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Voice Control */}
        <section className="flex flex-col items-center gap-4 pt-8">
          <VoiceButton
            state={voiceState}
            onPress={handleVoicePress}
            onStop={stopListening}
          />
          
          {voiceState === 'listening' && (
            <StatusBanner type="listening" message="Listening..." />
          )}
          
          {voiceState === 'speaking' && (
            <StatusBanner type="speaking" message="Speaking..." />
          )}
        </section>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step !== 'amount' && (
            <button
              onClick={() => setStep(step === 'confirm' ? 'recipient' : 'amount')}
              className={cn(
                'flex-1 btn-accessible',
                'bg-muted text-muted-foreground'
              )}
            >
              Back
            </button>
          )}
          {step !== 'confirm' && (
            <button
              onClick={() => setStep(step === 'amount' ? 'recipient' : 'confirm')}
              disabled={step === 'amount' ? !amount : !recipient}
              className={cn(
                'flex-1 btn-accessible',
                'bg-primary text-primary-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Next
            </button>
          )}
        </div>

        <GestureHint
          gesture={gestureHint}
          onComplete={() => setGestureHint(null)}
        />
      </main>
    </div>
  );
};

export default PayPage;
