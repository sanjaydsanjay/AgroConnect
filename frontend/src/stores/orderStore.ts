import { atom } from 'nanostores';
import type { BuyerOrder } from '../types';
import { MOCK_ORDERS } from '../lib/mockData';

function getInitialValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export const $orders = atom<BuyerOrder[]>(getInitialValue('agro_orders', MOCK_ORDERS));

if (typeof window !== 'undefined') {
  $orders.subscribe((orders) => {
    try {
      localStorage.setItem('agro_orders', JSON.stringify(orders));
    } catch {}
  });
}

export function addOrder(newOrder: BuyerOrder) {
  $orders.set([newOrder, ...$orders.get()]);
}

export function updateOrderStatus(orderId: string, status: BuyerOrder['status']) {
  $orders.set(
    $orders.get().map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
  );
}
