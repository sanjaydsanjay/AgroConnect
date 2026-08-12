import { atom } from 'nanostores';
import type { User, UserRole, LanguageCode } from '../types';

export interface AuthSession {
  user: User | null;
  role: UserRole;
}

const DEFAULT_USER: User = {
  id: 'usr_farmer_1',
  name: 'Ramesh Gowda',
  email: 'ramesh.gowda@farm.in',
  phone: '+91 98450 12345',
  role: 'farmer',
  verified: true,
  preferredLanguage: 'en',
  createdAt: '2026-01-15T08:30:00Z',
};

const DEFAULT_SESSION: AuthSession = {
  user: DEFAULT_USER,
  role: 'farmer',
};

function getInitialSession(): AuthSession {
  if (typeof window === 'undefined') return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem('agro_auth_session');
    if (!raw) return DEFAULT_SESSION;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed && parsed.role) {
      return parsed;
    }
    return DEFAULT_SESSION;
  } catch {
    return DEFAULT_SESSION;
  }
}

// Atomic Nano Store holding user session
export const $authSession = atom<AuthSession>(getInitialSession());

// Derived atoms
export const $currentRole = atom<UserRole>($authSession.get().role);
export const $currentUser = atom<User | null>($authSession.get().user);

// Synchronize derived atoms whenever authSession changes
$authSession.subscribe((session) => {
  $currentRole.set(session.role);
  $currentUser.set(session.user);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('agro_auth_session', JSON.stringify(session));
    } catch (err) {
      console.warn('Failed to persist agro_auth_session to localStorage:', err);
    }
  }
});

/**
 * Authenticate user into session
 */
export function loginAsUser(user: User, redirect: boolean = true) {
  const newSession: AuthSession = {
    role: user.role,
    user: user,
  };

  $authSession.set(newSession);

  if (redirect && typeof window !== 'undefined') {
    // If user has no preferredLanguage set, onboard via /language-selection first
    if (!user.preferredLanguage) {
      setTimeout(() => {
        window.location.href = '/language-selection';
      }, 50);
      return;
    }

    setTimeout(() => {
      if (user.role === 'farmer') window.location.href = '/farmer/dashboard';
      else if (user.role === 'buyer') window.location.href = '/buyer/dashboard';
      else if (user.role === 'admin') window.location.href = '/admin/dashboard';
    }, 50);
  }
}

/**
 * Set user language preference
 */
export function setUserLanguage(lang: LanguageCode) {
  const current = $authSession.get();
  if (!current.user) return;

  const updatedUser: User = {
    ...current.user,
    preferredLanguage: lang,
  };

  $authSession.set({
    ...current,
    user: updatedUser,
  });
}

/**
 * Update authenticated user's profile details
 */
export function updateUserProfile(updatedFields: Partial<User>) {
  const current = $authSession.get();
  if (!current.user) return;

  const updatedUser: User = {
    ...current.user,
    ...updatedFields,
  };

  $authSession.set({
    ...current,
    user: updatedUser,
  });
}

/**
 * Logout handler - resets session to unauthenticated state
 */
export function logout(redirect: boolean = true) {
  const emptySession: AuthSession = {
    user: null,
    role: 'farmer',
  };

  $authSession.set(emptySession);

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('agro_auth_session');
    } catch {}

    if (redirect) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 50);
    }
  }
}
