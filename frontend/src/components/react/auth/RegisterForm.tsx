import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { TextInput } from '../ui/TextInput';
import { addToast } from '../../../stores/toastStore';
import { loginAsUser, $authSession } from '../../../stores/authStore';
import { t } from '../../../i18n';
import { Sprout } from 'lucide-react';
import type { User, UserRole } from '../../../types';

export const RegisterForm: React.FC = () => {
  const session = useStore($authSession);
  const lang = session.user?.preferredLanguage || 'en';

  const [role, setRole] = useState<UserRole>('farmer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch', lang));
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: name || 'Registered User',
        email: email,
        phone: '+91 98450 00000',
        role: role,
        verified: true,
        createdAt: new Date().toISOString(),
      };

      loginAsUser(newUser, true);
      addToast({ type: 'success', title: t('auth.createAccountTitle', lang), message: 'Welcome to AgroConnect!' });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Brand logo - Text Only */}
      <div className="flex justify-center mb-6">
        <a href="/" className="inline-flex items-center text-[#171717] hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold text-[#171717]" style={{ letterSpacing: '-0.03em' }}>
            {t('nav.brand', lang)}
          </span>
        </a>
      </div>

      {/* Title & subtitle */}
      <div className="text-center mb-8">
        <h1 className="text-[32px] font-semibold text-[#171717] leading-[40px]" style={{ letterSpacing: '-0.8px' }}>
          {t('auth.createAccountTitle', lang)}
        </h1>
        <p className="text-sm text-[#8f8f8f] mt-1.5">
          {t('auth.createAccountSubtitle', lang)}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#171717] block mb-1.5">
            {t('auth.role', lang)}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`h-12 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                role === 'farmer'
                  ? 'bg-[#171717] text-white'
                  : 'bg-white border border-[#ebebeb] text-[#171717] hover:border-[#171717]'
              }`}
            >
              {t('auth.farmer', lang)}
            </button>
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`h-12 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                role === 'buyer'
                  ? 'bg-[#171717] text-white'
                  : 'bg-white border border-[#ebebeb] text-[#171717] hover:border-[#171717]'
              }`}
            >
              {t('auth.buyer', lang)}
            </button>
          </div>
        </div>

        <TextInput
          label={role === 'farmer' ? t('auth.fullName', lang) : t('auth.companyName', lang)}
          placeholder={role === 'farmer' ? 'Ramesh Gowda' : 'GreenFresh Agri'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextInput
          label={t('auth.email', lang)}
          type="email"
          placeholder="name@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          label={t('auth.password', lang)}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <TextInput
          label={t('auth.confirmPassword', lang)}
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError('');
          }}
          error={error}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#171717] hover:bg-black text-white text-sm font-medium rounded-md transition-colors duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xs"
        >
          {loading ? t('auth.creatingAccount', lang) : t('auth.createAccountBtn', lang)}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-sm text-[#8f8f8f] text-center">
        {t('auth.alreadyHaveAccount', lang)}{' '}
        <a href="/login" className="text-[#0070f3] hover:underline font-medium">
          {t('auth.signInBtn', lang)}
        </a>
      </p>
    </div>
  );
};
