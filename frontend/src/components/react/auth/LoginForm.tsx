import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { TextInput } from '../ui/TextInput';
import { addToast } from '../../../stores/toastStore';
import { loginAsUser, $authSession } from '../../../stores/authStore';
import { t } from '../../../i18n';
import { Sprout } from 'lucide-react';
import type { User } from '../../../types';

export const LoginForm: React.FC = () => {
  const session = useStore($authSession);
  const lang = session.user?.preferredLanguage || 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const isBuyer = email.includes('buyer') || email.includes('procurement');
      const isAdmin = email.includes('admin');
      const role = isAdmin ? 'admin' : isBuyer ? 'buyer' : 'farmer';

      const user: User = {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Authenticated User',
        email: email,
        phone: '+91 98450 12345',
        role: role,
        verified: true,
        createdAt: new Date().toISOString(),
      };

      loginAsUser(user, true);
      addToast({ type: 'success', title: t('auth.signInTitle', lang), message: `Welcome back, ${user.name}` });
      setLoading(false);
    }, 400);
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
          {t('auth.signInTitle', lang)}
        </h1>
        <p className="text-sm text-[#8f8f8f] mt-1.5">
          {t('auth.signInSubtitle', lang)}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#171717] hover:bg-black text-white text-sm font-medium rounded-md transition-colors duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xs"
        >
          {loading ? t('auth.signingIn', lang) : t('auth.signInBtn', lang)}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-8 text-sm text-[#8f8f8f] text-center">
        {t('auth.noAccount', lang)}{' '}
        <a href="/register" className="text-[#0070f3] hover:underline font-medium">
          {t('auth.createAccountBtn', lang)}
        </a>
      </p>
    </div>
  );
};
