import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, RotateCcw } from 'lucide-react';
import { Header } from '@/components/Header';
import { AccessibilityToggle } from '@/components/AccessibilityToggle';
import { useAccessibility } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const navigate = useNavigate();
  const {
    settings,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    setSpeakRate,
    setLanguage,
    resetSettings,
  } = useAccessibility();

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'हिंदी (Hindi)' },
    { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
    { code: 'te-IN', name: 'తెలుగు (Telugu)' },
    { code: 'bn-IN', name: 'বাংলা (Bengali)' },
    { code: 'mr-IN', name: 'मराठी (Marathi)' },
  ];

  const speakRates = [
    { value: 0.5, label: 'Very Slow' },
    { value: 0.75, label: 'Slow' },
    { value: 0.9, label: 'Normal' },
    { value: 1.1, label: 'Fast' },
    { value: 1.5, label: 'Very Fast' },
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
            <Settings className="w-10 h-10" />
            Settings
          </h1>
          <p className="text-accessible-lg text-muted-foreground">
            Adjust the app to work best for you
          </p>
        </section>

        {/* Display Settings */}
        <section className="space-y-2">
          <h2 className="text-accessible-xl font-bold text-foreground mb-4">
            Display
          </h2>
          <div className="bg-card rounded-3xl border-2 border-border divide-y divide-border">
            <div className="px-6">
              <AccessibilityToggle
                id="high-contrast"
                label="High Contrast"
                description="Black and white colors for maximum visibility"
                checked={settings.highContrast}
                onChange={toggleHighContrast}
              />
            </div>
            <div className="px-6">
              <AccessibilityToggle
                id="large-text"
                label="Extra Large Text"
                description="Make all text even bigger"
                checked={settings.largeText}
                onChange={toggleLargeText}
              />
            </div>
            <div className="px-6">
              <AccessibilityToggle
                id="reduce-motion"
                label="Reduce Motion"
                description="Turn off animations and transitions"
                checked={settings.reduceMotion}
                onChange={toggleReduceMotion}
              />
            </div>
          </div>
        </section>

        {/* Voice Settings */}
        <section className="space-y-4">
          <h2 className="text-accessible-xl font-bold text-foreground">
            Voice
          </h2>
          
          {/* Speaking Speed */}
          <div className="bg-card rounded-3xl border-2 border-border p-6 space-y-4">
            <label className="block text-accessible-lg font-semibold">
              Speaking Speed
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {speakRates.map((rate) => (
                <button
                  key={rate.value}
                  onClick={() => setSpeakRate(rate.value)}
                  className={cn(
                    'py-4 px-4 rounded-2xl text-accessible-base font-medium',
                    'border-2 transition-all',
                    'focus-visible:ring-4 focus-visible:ring-offset-2',
                    settings.speakRate === rate.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary'
                  )}
                  aria-pressed={settings.speakRate === rate.value}
                >
                  {rate.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="bg-card rounded-3xl border-2 border-border p-6 space-y-4">
            <label htmlFor="language-select" className="block text-accessible-lg font-semibold">
              Language
            </label>
            <select
              id="language-select"
              value={settings.language}
              onChange={(e) => setLanguage(e.target.value)}
              className={cn(
                'w-full text-accessible-lg',
                'bg-background border-2 border-input rounded-2xl',
                'py-4 px-6',
                'focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring'
              )}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Reset Button */}
        <section className="pt-4">
          <button
            onClick={resetSettings}
            className={cn(
              'w-full btn-accessible',
              'bg-muted text-muted-foreground',
              'flex items-center justify-center gap-3'
            )}
          >
            <RotateCcw className="w-6 h-6" />
            Reset to Default Settings
          </button>
        </section>

        {/* Help Info */}
        <section className="bg-primary/10 border-2 border-primary/30 rounded-3xl p-6">
          <h2 className="text-accessible-lg font-bold text-foreground mb-2">
            Need Help?
          </h2>
          <p className="text-accessible-base text-muted-foreground">
            If you need assistance using this app, please ask a family member or caregiver 
            to help you adjust these settings. You can also use voice commands by tapping 
            the microphone button on any screen.
          </p>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
