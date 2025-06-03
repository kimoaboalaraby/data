/**
 * Generates a random ID (simple implementation)
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} د.ك`;
};

/**
 * Format date to locale string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-KW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate performance based on completed tasks percentage
 */
export const calculatePerformance = (completed: number, total: number): 'excellent' | 'good' | 'weak' => {
  if (total === 0) return 'excellent';
  
  const percentage = (completed / total) * 100;
  
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  return 'weak';
};

/**
 * Get performance badge color
 */
export const getPerformanceColor = (performance: 'excellent' | 'good' | 'weak' | null): string => {
  switch (performance) {
    case 'excellent':
      return 'bg-success-100 text-success-800';
    case 'good':
      return 'bg-accent-100 text-accent-800';
    case 'weak':
      return 'bg-error-100 text-error-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get subscription tier badge color
 */
export const getTierBadgeColor = (tier: string): string => {
  switch (tier) {
    case 'gold':
      return 'badge-gold';
    case 'silver':
      return 'badge-silver';
    case 'bronze':
      return 'badge-bronze';
    default:
      return 'badge-regular';
  }
};

/**
 * Format tier name in Arabic
 */
export const formatTier = (tier: string): string => {
  switch (tier) {
    case 'gold':
      return 'ذهبي';
    case 'silver':
      return 'فضي';
    case 'bronze':
      return 'برونزي';
    default:
      return 'عادي';
  }
};

/**
 * Check if a subscription is expiring soon (within 7 days)
 */
export const isExpiringSoon = (endDate: string): boolean => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= 7;
};