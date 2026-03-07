export const getApiBaseUrl = (): string => {
  const fallbackUrl = 'http://localhost:5000/api';
  const envUrl = import.meta.env.VITE_API_URL;

  const candidate = (envUrl && envUrl.trim().length > 0 ? envUrl : fallbackUrl).trim();

  if (candidate === '/' || candidate === '') {
    return fallbackUrl;
  }

  const withoutTrailingSlash = candidate.replace(/\/+$/, '');

  if (/\/api$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};
