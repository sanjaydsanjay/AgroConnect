import { atom } from 'nanostores';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export const $toasts = atom<ToastMessage[]>([]);

export function addToast(toast: Omit<ToastMessage, 'id'>) {
  const id = 'toast_' + Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { ...toast, id };
  $toasts.set([...$toasts.get(), newToast]);

  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

export function removeToast(id: string) {
  $toasts.set($toasts.get().filter((t) => t.id !== id));
}
