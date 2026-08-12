import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../../../i18n';
import type { LanguageCode } from '../../../types';
import { Check, Search } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLang: LanguageCode | null;
  onSelectLanguage: (code: LanguageCode) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLang,
  onSelectLanguage,
  disabled = false,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent, code: LanguageCode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onSelectLanguage(code);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Filter for 23 languages */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#8f8f8f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search language (e.g. Kannada, हिंदी, Tamil)..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full h-9 bg-white border border-[#ebebeb] text-[#171717] text-xs rounded-md pl-8 pr-3 focus:outline-none focus:border-[#0070f3]"
        />
      </div>

      {/* Grid of Language Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {filtered.map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onSelectLanguage(lang.code)}
              onKeyDown={(e) => handleKeyDown(e, lang.code)}
              disabled={disabled}
              tabIndex={0}
              aria-label={`Select ${lang.name} (${lang.nativeName})`}
              className={`p-3 rounded-lg text-left transition-all duration-150 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-offset-1 ${
                isSelected
                  ? 'bg-[#171717] text-white border-2 border-[#171717] shadow-xs'
                  : 'bg-white text-[#171717] border border-[#ebebeb] hover:border-[#171717]'
              }`}
            >
              <div>
                <span className="text-sm font-semibold block leading-tight">{lang.nativeName}</span>
                <span className={`text-[11px] ${isSelected ? 'text-white/70' : 'text-[#8f8f8f]'}`}>{lang.name}</span>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
