import { useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  speakRate: number;
  language: string;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  speakRate: 0.9,
  language: 'en-US',
};

const STORAGE_KEY = 'accessibility-settings';

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text mode
    if (settings.largeText) {
      root.style.fontSize = '24px';
    } else {
      root.style.fontSize = '20px';
    }

    // Reduce motion
    if (settings.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }

    // Persist settings
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage unavailable
    }
  }, [settings]);

  // Check system preferences on mount
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');

    if (prefersReducedMotion.matches && !settings.reduceMotion) {
      setSettings((prev) => ({ ...prev, reduceMotion: true }));
    }

    if (prefersHighContrast.matches && !settings.highContrast) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleLargeText = useCallback(() => {
    setSettings((prev) => ({ ...prev, largeText: !prev.largeText }));
  }, []);

  const toggleReduceMotion = useCallback(() => {
    setSettings((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  }, []);

  const setSpeakRate = useCallback((rate: number) => {
    setSettings((prev) => ({ ...prev, speakRate: Math.max(0.5, Math.min(2, rate)) }));
  }, []);

  const setLanguage = useCallback((language: string) => {
    setSettings((prev) => ({ ...prev, language }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    setSpeakRate,
    setLanguage,
    resetSettings,
  };
}
