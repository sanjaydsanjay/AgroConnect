import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $authSession, setUserLanguage } from '../../../stores/authStore';
import { LanguageSelector } from '../i18n/LanguageSelector';
import { t } from '../../../i18n';
import type { LanguageCode } from '../../../types';
import { ArrowRight } from 'lucide-react';

export const LanguageSelection: React.FC = () => {
  const session = useStore($authSession);
  const user = session.user;
  const initialLang = user?.preferredLanguage || 'en';

  const [selectedLang, setSelectedLang] = useState<LanguageCode>(initialLang as LanguageCode);
  const [saving, setSaving] = useState(false);

  const handleSelectLanguage = (code: LanguageCode) => {
    setSelectedLang(code);
    setUserLanguage(code); // Instantly updates Nanostore state so page UI updates in real-time with zero glitch
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLang) return;

    setSaving(true);
    setUserLanguage(selectedLang);

    const role = session.role || 'farmer';
    const target =
      role === 'buyer'
        ? '/buyer/dashboard'
        : role === 'admin'
        ? '/admin/dashboard'
        : '/farmer/dashboard';

    window.location.href = target;
  };

  const currentT = (key: string) => t(key, selectedLang || 'en');

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Brand Logo - Text Only */}
      <div className="flex justify-center mb-6">
        <a href="/" className="inline-flex items-center text-[#171717] hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold text-[#171717]" style={{ letterSpacing: '-0.03em' }}>
            AgroConnect
          </span>
        </a>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-[30px] font-semibold text-[#171717] leading-[36px]" style={{ letterSpacing: '-0.8px' }}>
            {currentT('languageSelection.title')}
          </h1>
          <span className="font-mono text-[10px] uppercase font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
            BETA
          </span>
        </div>
        <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
          {currentT('languageSelection.subtitle')}
        </p>
      </div>

      {/* Language Selector */}
      <form onSubmit={handleContinue} className="space-y-4">
        <LanguageSelector
          selectedLang={selectedLang}
          onSelectLanguage={handleSelectLanguage}
          disabled={saving}
        />

        {/* Submit Continue Button */}
        <button
          type="submit"
          disabled={!selectedLang || saving}
          className="w-full h-12 bg-[#171717] hover:bg-black text-white text-sm font-medium rounded-md transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-4 shadow-xs"
        >
          <span>{saving ? currentT('languageSelection.saving') : currentT('languageSelection.continue')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
