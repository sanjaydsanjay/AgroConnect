import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $authSession, updateUserProfile, setUserLanguage } from '../../../stores/authStore';
import { SUPPORTED_LANGUAGES, t } from '../../../i18n';
import type { LanguageCode } from '../../../types';
import { LanguageSelectorModal } from '../i18n/LanguageSelectorModal';
import { TextInput } from '../ui/TextInput';
import { SquareButton } from '../ui/SquareButton';
import { addToast } from '../../../stores/toastStore';
import { User as UserIcon, Mail, Phone, MapPin, Layers, Droplets, CheckCircle, Edit3, Shield, Globe, ChevronRight } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const session = useStore($authSession);
  const user = session.user;
  const role = session.role;
  const lang = user?.preferredLanguage || 'en';

  const [isEditing, setIsEditing] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [district, setDistrict] = useState('Mandya');
  const [stateName, setStateName] = useState('Karnataka');
  const [landSize, setLandSize] = useState('4.5');
  const [soilType, setSoilType] = useState('Loam');
  const [irrigation, setIrrigation] = useState('Drip');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="bg-white border border-[#ebebeb] rounded-xl p-8 text-center max-w-md mx-auto">
        <UserIcon className="w-10 h-10 text-[#8f8f8f] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#171717]">Sign In Required</h3>
        <p className="text-xs text-[#8f8f8f] mt-1 mb-4">Please log in to view and manage your profile settings.</p>
        <a href="/login">
          <SquareButton variant="primary" className="w-full">Sign In</SquareButton>
        </a>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      updateUserProfile({
        name,
        email,
        phone,
      });
      setSaving(false);
      setIsEditing(false);
      addToast({
        type: 'success',
        title: t('profile.title', lang),
        message: t('profile.updatedToast', lang),
      });
    }, 350);
  };

  const handleLanguageChange = (code: LanguageCode) => {
    if (code === lang) return;
    setUserLanguage(code);

    const langName = SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code;
    addToast({
      type: 'success',
      title: 'Language Preference Updated',
      message: `Default language updated to ${langName}.`,
    });
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#171717] text-white flex items-center justify-center text-xl font-semibold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#171717]" style={{ letterSpacing: '-0.03em' }}>
                {user.name}
              </h2>
              {user.verified && (
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {t('common.verified', lang)}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8f8f8f] mt-0.5 flex items-center gap-2">
              <span className="capitalize font-medium text-[#171717]">{role} Account</span>
              <span>•</span>
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        <SquareButton
          variant={isEditing ? 'ghost' : 'primary'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          icon={<Edit3 className="w-3.5 h-3.5" />}
        >
          {isEditing ? t('profile.cancelEdit', lang) : t('profile.editProfile', lang)}
        </SquareButton>
      </div>

      {/* Compact Language Preference Card */}
      <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs hover:border-[#171717] transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0070f3] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#171717]">
                  {t('profile.languageSection', lang)}
                </h3>
                <span className="font-mono text-[10px] uppercase font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  BETA
                </span>
              </div>
              <p className="text-xs text-[#8f8f8f] mt-0.5">
                {currentLangObj.nativeName} ({currentLangObj.name})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLangModalOpen(true)}
            aria-label="Open language selection modal"
            className="px-4 py-2 bg-[#fafafa] hover:bg-[#f2f2f2] border border-[#ebebeb] text-[#171717] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Change language</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8f8f8f]" />
          </button>
        </div>
      </div>

      {/* Language Selector Modal */}
      {isLangModalOpen && (
        <LanguageSelectorModal
          currentLang={lang}
          onSelectLanguage={handleLanguageChange}
          onClose={() => setIsLangModalOpen(false)}
        />
      )}

      {isEditing ? (
        /* Edit Profile Form */
        <form onSubmit={handleSaveProfile} className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-[#ebebeb]">
            <h3 className="text-base font-semibold text-[#171717]">{t('profile.editProfile', lang)}</h3>
            <p className="text-xs text-[#8f8f8f]">Update personal and contact details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label={t('profile.name', lang)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextInput
              label={t('profile.email', lang)}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <TextInput
            label={t('profile.phone', lang)}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {role === 'farmer' && (
            <>
              <div className="pt-2 border-t border-[#ebebeb]">
                <h4 className="text-xs font-semibold text-[#171717] uppercase tracking-wider font-mono mb-3">
                  {t('profile.farmDetails', lang)}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextInput
                    label={t('profile.district', lang)}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                  <TextInput
                    label={t('profile.state', lang)}
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextInput
                  label={t('profile.landSize', lang)}
                  type="number"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                />
                <div>
                  <label className="text-xs font-medium text-[#171717] block mb-1.5">{t('profile.soilType', lang)}</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 py-2 focus:outline-none focus:border-[#0070f3]"
                  >
                    {['Loam', 'Clay', 'Sandy', 'Black', 'Red'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#171717] block mb-1.5">{t('profile.irrigation', lang)}</label>
                  <select
                    value={irrigation}
                    onChange={(e) => setIrrigation(e.target.value)}
                    className="w-full bg-white border border-[#ebebeb] text-[#171717] text-sm rounded-md px-3 py-2 focus:outline-none focus:border-[#0070f3]"
                  >
                    {['Drip', 'Rainfed', 'Canal', 'Borewell'].map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#ebebeb] flex justify-end gap-3">
            <SquareButton type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              {t('common.cancel', lang)}
            </SquareButton>
            <SquareButton type="submit" variant="primary" disabled={saving}>
              {saving ? t('profile.saving', lang) : t('profile.saveChanges', lang)}
            </SquareButton>
          </div>
        </form>
      ) : (
        /* Read-Only Profile Details */
        <div className="bg-white border border-[#ebebeb] rounded-xl p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-[#fafafa] border border-[#ebebeb] rounded-lg">
              <Mail className="w-4 h-4 text-[#8f8f8f]" />
              <div>
                <span className="text-[10px] font-mono text-[#8f8f8f] block">{t('profile.email', lang)}</span>
                <span className="text-xs font-medium text-[#171717]">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#fafafa] border border-[#ebebeb] rounded-lg">
              <Phone className="w-4 h-4 text-[#8f8f8f]" />
              <div>
                <span className="text-[10px] font-mono text-[#8f8f8f] block">{t('profile.phone', lang)}</span>
                <span className="text-xs font-medium text-[#171717]">{user.phone || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {role === 'farmer' && (
            <div className="pt-4 border-t border-[#ebebeb] space-y-4">
              <h4 className="text-xs font-semibold text-[#171717] uppercase tracking-wider font-mono">
                {t('profile.farmDetails', lang)}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-lg">
                  <span className="text-[10px] font-mono text-[#8f8f8f] block">{t('profile.location', lang)}</span>
                  <span className="text-xs font-semibold text-[#171717]">{district}, {stateName}</span>
                </div>
                <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-lg">
                  <span className="text-[10px] font-mono text-[#8f8f8f] block">{t('profile.landSize', lang)}</span>
                  <span className="text-xs font-semibold text-[#171717]">{landSize} Acres</span>
                </div>
                <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-lg">
                  <span className="text-[10px] font-mono text-[#8f8f8f] block">{t('profile.soilType', lang)}</span>
                  <span className="text-xs font-semibold text-[#171717]">{soilType}</span>
                </div>
                <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-lg">
                  <span className="text-[10px] font-mono text-[#8f8f8f] block">{t('profile.irrigation', lang)}</span>
                  <span className="text-xs font-semibold text-[#171717]">{irrigation}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
