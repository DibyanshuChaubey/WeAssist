export const getApiBaseUrl = (): string => {
  const localFallbackUrl = 'http://localhost:5000/api';
  const productionFallbackUrl = 'https://weassist-backend.onrender.com/api';
  const envUrl = import.meta.env.VITE_API_URL;
  const isProduction = import.meta.env.PROD;

  const configured = (envUrl || '').trim();
  const looksLikePlaceholder = /your-backend-url|onrender\.com\/api$/i.test(configured) && configured.includes('your-');
  const isEmpty = configured.length === 0;

  const baseFallback = isProduction ? productionFallbackUrl : localFallbackUrl;
  const candidate = (!isEmpty && !looksLikePlaceholder ? configured : baseFallback).trim();

  if (candidate === '/' || candidate === '') {
    return baseFallback;
  }

  const withoutTrailingSlash = candidate.replace(/\/+$/, '');

  if (/\/api$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};
