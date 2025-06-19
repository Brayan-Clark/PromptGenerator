export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  apiProvider?: 'openai' | 'openrouter';
}

export interface OptimizePromptParams {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  apiConfig: ApiConfig;
}

export const optimizePrompt = async ({
  prompt,
  systemPrompt = 'Tu es un expert en amélioration de prompts. Ton travail est d\'optimiser les prompts pour les rendre plus clairs, précis et efficaces. Réponds UNIQUEMENT avec le prompt optimisé, sans commentaires ni explications.',
  model,
  apiConfig
}: OptimizePromptParams): Promise<string> => {
  try {
    if (!apiConfig?.apiKey) {
      throw new Error('Aucune clé API configurée. Veuillez configurer une clé API dans les paramètres.');
    }

    // Préparer les en-têtes en fonction du fournisseur
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiConfig.apiKey}`
    };

    // Ajouter les en-têtes spécifiques à OpenRouter si nécessaire
    if (apiConfig.apiProvider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin || 'http://localhost:3000';
      headers['X-Title'] = 'PromptCraft AI';
    }

    const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || apiConfig.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Optimise ce prompt en le rendant plus clair, précis et efficace. Réponds UNIQUEMENT avec le prompt optimisé, sans commentaires ni explications :\n\n${prompt}`
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.2,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erreur API (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const optimizedPrompt = data.choices?.[0]?.message?.content?.trim() || prompt;
    
    // Nettoyer la réponse pour s'assurer qu'il n'y a pas de préfixe ou de suffixe indésirable
    return optimizedPrompt
      .replace(/^"|"$/g, '') // Enlever les guillemets autour du prompt
      .replace(/^(?:Voici (?:votre )?prompt optimisé[\s\:]*\n?|Prompt optimisé[\s\:]*\n?|Optimisation[\s\:]*\n?)/i, '')
      .trim();
  } catch (error) {
    console.error('Erreur lors de l\'optimisation du prompt :', error);
    throw error;
  }
};
