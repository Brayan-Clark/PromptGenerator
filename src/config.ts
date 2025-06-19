// Configuration de l'API
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.openai.com/v1',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  defaultModel: 'gpt-4-turbo-preview'
} as const;
