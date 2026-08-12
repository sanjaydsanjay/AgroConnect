export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('en-IN', options);
}

export function getSuitabilityColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 85) {
    return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  } else if (score >= 70) {
    return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
  } else if (score >= 50) {
    return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  } else {
    return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
  }
}

export function getRiskColor(category: 'Low' | 'Medium' | 'High'): { text: string; bg: string } {
  switch (category) {
    case 'Low':
      return { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    case 'Medium':
      return { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    case 'High':
      return { text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
  }
}
