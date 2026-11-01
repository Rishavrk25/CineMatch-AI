export function formatScore(score) {
  if (score === null || score === undefined) return '0%';
  return `${Math.round(score * 100)}%`;
}

export function formatYear(dateOrYear) {
  if (!dateOrYear) return 'Unknown';
  if (typeof dateOrYear === 'number') return dateOrYear.toString();
  return dateOrYear.split('-')[0] || dateOrYear;
}

export function formatRuntime(minutes) {
  if (!minutes || isNaN(minutes)) return 'N/A';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

export function formatCurrency(amount) {
  if (!amount || amount <= 0) return 'Not Disclosed';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function truncateText(text, maxLength = 160) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}
