import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { Header } from '@/components/Header';
import { VoiceButton } from '@/components/VoiceButton';
import { StatusBanner } from '@/components/StatusBanner';
import { useVoice } from '@/hooks/useVoice';
import { useAccessibility } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

const ScanPage = () => {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [scannedText, setScannedText] = useState('');

  const handleVoiceResult = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase();
    
    if (lower.includes('take') || lower.includes('camera') || lower.includes('capture')) {
      fileInputRef.current?.click();
    } else if (lower.includes('upload') || lower.includes('gallery')) {
      fileInputRef.current?.click();
    } else if (lower.includes('clear') || lower.includes('reset')) {
      handleReset();
    }
  }, []);

  const { state: voiceState, startListening, stopListening, speak } = useVoice({
    onResult: handleVoiceResult,
    language: settings.language,
    speakRate: settings.speakRate,
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Simulate OCR processing (in real app, would call backend)
    setScanStatus('scanning');
    await speak('Scanning your image. Please wait.');

    // Simulate processing delay
    setTimeout(() => {
      // Mock OCR result
      const mockResult = 'Sample scanned text from your document. This would be the actual OCR result from your backend.';
      setScannedText(mockResult);
      setScanStatus('done');
      speak('Scan complete. I found some text in your image.');
    }, 2000);
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setScanStatus('idle');
    setScannedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoicePress = async () => {
    if (voiceState === 'listening') {
      stopListening();
      return;
    }

    await speak('Say take photo to use camera, or upload to select from gallery.');
    startListening();
  };

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
            <Camera className="w-10 h-10" />
            Scan Document
          </h1>
          <p className="text-accessible-lg text-muted-foreground">
            Take a photo or upload an image to scan
          </p>
        </section>

        {/* Image Preview / Upload Area */}
        <section className="space-y-4">
          {!previewUrl ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="sr-only"
                id="camera-input"
                aria-label="Take or upload photo"
              />
              
              <label
                htmlFor="camera-input"
                className={cn(
                  'flex flex-col items-center justify-center gap-6',
                  'min-h-[300px] bg-card border-4 border-dashed border-muted rounded-3xl',
                  'cursor-pointer hover:border-primary hover:bg-card/50',
                  'transition-colors focus-within:border-primary',
                  'p-8'
                )}
              >
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-accessible-lg font-semibold text-foreground">
                    Tap to take a photo
                  </p>
                  <p className="text-accessible-base text-muted-foreground">
                    or select from your gallery
                  </p>
                </div>
              </label>

              <div className="flex gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex-1 btn-accessible',
                    'bg-primary text-primary-foreground',
                    'flex items-center justify-center gap-3'
                  )}
                >
                  <Camera className="w-6 h-6" />
                  Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex-1 btn-accessible',
                    'bg-secondary text-secondary-foreground',
                    'flex items-center justify-center gap-3'
                  )}
                >
                  <Upload className="w-6 h-6" />
                  Gallery
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-3xl overflow-hidden bg-muted">
                <img
                  src={previewUrl}
                  alt="Scanned document preview"
                  className="w-full max-h-[400px] object-contain"
                />
                {scanStatus === 'scanning' && (
                  <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                    <div className="bg-card rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-accessible-lg font-semibold">Scanning...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanned Result */}
              {scanStatus === 'done' && scannedText && (
                <div className="bg-card border-2 border-border rounded-3xl p-6 space-y-4 animate-slide-up">
                  <h2 className="text-accessible-lg font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-6 h-6" />
                    Scanned Text
                  </h2>
                  <p className="text-accessible-base text-foreground leading-relaxed">
                    {scannedText}
                  </p>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className={cn(
                  'w-full btn-accessible',
                  'bg-muted text-muted-foreground',
                  'flex items-center justify-center gap-3'
                )}
              >
                <RotateCcw className="w-6 h-6" />
                Scan Another
              </button>
            </div>
          )}
        </section>

        {/* Voice Control */}
        <section className="flex flex-col items-center gap-4 pt-4">
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

          <p className="text-accessible-sm text-muted-foreground text-center">
            Say "take photo" or "upload" to capture an image
          </p>
        </section>
      </main>
    </div>
  );
};

export default ScanPage;
