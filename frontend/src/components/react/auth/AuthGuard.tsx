import React from 'react';
import { useStore } from '@nanostores/react';
import { $authSession } from '../../../stores/authStore';
import { Lock, ArrowRight, UserPlus, LogIn, Sprout } from 'lucide-react';
import { SquareButton } from '../ui/SquareButton';

interface AuthGuardProps {
  children: React.ReactNode;
  serviceTitle?: string;
  serviceDescription?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  serviceTitle = 'AgriConnect Services',
  serviceDescription = 'Access AI Smart Crop Planning, Live Mandi Trends, and Direct Marketplace Services.',
}) => {
  const session = useStore($authSession);
  const user = session.user;

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-[#ebebeb] rounded-xl p-8 shadow-sm text-center">
        {/* Icon Header */}
        <div className="w-14 h-14 bg-[#f4f4f4] border border-[#e5e5e5] rounded-full flex items-center justify-center mx-auto mb-5 text-[#171717]">
          <Lock className="w-6 h-6 text-[#0070f3]" />
        </div>

        {/* Badge */}
        <span className="inline-block px-3 py-1 bg-[#eff6ff] text-[#0070f3] text-xs font-semibold rounded-full mb-3">
          Sign In Required
        </span>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#171717] tracking-tight mb-2">
          {serviceTitle}
        </h2>

        {/* Description */}
        <p className="text-sm text-[#666666] leading-relaxed mb-6">
          {serviceDescription} Please create an account or sign in to your existing account to continue.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a href="/login" className="block w-full">
            <button className="w-full h-11 bg-[#171717] hover:bg-black text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs">
              <LogIn className="w-4 h-4" />
              <span>Sign In to Platform</span>
            </button>
          </a>

          <a href="/register" className="block w-full">
            <button className="w-full h-11 bg-white hover:bg-[#fafafa] border border-[#ebebeb] text-[#171717] text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <UserPlus className="w-4 h-4 text-[#0070f3]" />
              <span>Create Free Account</span>
            </button>
          </a>
        </div>

        {/* Footer info */}
        <p className="text-xs text-[#8f8f8f] mt-6">
          Join thousands of farmers and buyers optimizing agricultural supply chains with AI.
        </p>
      </div>
    </div>
  );
};
