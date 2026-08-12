import React, { useEffect } from 'react';
import { LanguageSelector } from './LanguageSelector';
import type { LanguageCode } from '../../../types';
import { Globe, X } from 'lucide-react';

interface LanguageSelectorModalProps {
  currentLang: LanguageCode;
  onSelectLanguage: (code: LanguageCode) => void;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  currentLang,
  onSelectLanguage,
  onClose,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#ebebeb] rounded-xl max-w-md w-full p-6 shadow-xl animate-zoom-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ebebeb]">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0070f3]" />
            <h3 className="text-base font-semibold text-[#171717]">Select Language</h3>
            <span className="font-mono text-[10px] uppercase font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
              BETA
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close language selector modal"
            className="p-1.5 rounded-md text-[#8f8f8f] hover:text-[#171717] hover:bg-[#f2f2f2] transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Reusable Language Selector */}
        <LanguageSelector
          selectedLang={currentLang}
          onSelectLanguage={(code) => {
            onSelectLanguage(code);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
