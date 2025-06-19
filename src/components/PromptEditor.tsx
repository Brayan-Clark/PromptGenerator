import React, { useState, useEffect, useRef } from 'react';
import { Prompt } from '../types';
import { FiSave, FiCopy, FiMaximize2, FiMinimize2, FiZap, FiCheck, FiX } from 'react-icons/fi';
import { optimizePrompt, ApiConfig } from '../services/promptService';

interface PromptEditorProps {
  initialPrompt?: Partial<Prompt>;
  onSave: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  initialPrompt = {},
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    title: initialPrompt.title || '',
    content: initialPrompt.content || '',
    systemPrompt: initialPrompt.systemPrompt || '',
    category: initialPrompt.category || 'général',
    tags: Array.isArray(initialPrompt.tags) ? initialPrompt.tags : [],
    description: initialPrompt.description || ''
  });
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'général',
    'création',
    'révision',
    'traduction',
    'code',
    'recherche',
    'autre',
  ];

  // Mise à jour des états lorsque initialPrompt change
  useEffect(() => {
    if (initialPrompt && Object.keys(initialPrompt).length > 0) {
      setFormData(prev => ({
        ...prev,
        title: initialPrompt.title || '',
        content: initialPrompt.content || '',
        systemPrompt: initialPrompt.systemPrompt || '',
        category: initialPrompt.category || 'général',
        tags: Array.isArray(initialPrompt.tags) ? initialPrompt.tags : [],
        description: initialPrompt.description || ''
      }));
    }
  }, [initialPrompt]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const optimizeWithAI = async () => {
    // Vérifier si le contenu n'est pas vide
    const contentToOptimize = formData.content.trim();
    if (!contentToOptimize) {
      setOptimizationError('Veuillez ajouter du contenu à optimiser');
      return;
    }

    // Vérifier si une optimisation est déjà en cours
    if (isOptimizing) return;

    // Récupérer la configuration de l'API depuis le localStorage
    let apiConfig: ApiConfig | null = null;
    let errorMessage = '';

    try {
      const savedSettings = localStorage.getItem('promptCraftSettings');
      if (!savedSettings) {
        throw new Error('Aucune configuration trouvée. Veuillez configurer votre clé API dans les paramètres.');
      }

      const settings = JSON.parse(savedSettings);
      if (!settings.apiKey) {
        throw new Error('Aucune clé API configurée. Veuillez configurer votre clé API dans les paramètres.');
      }

      const isOpenRouter = settings.apiProvider === 'openrouter';
      
      // Utiliser un modèle gratuit par défaut pour éviter les erreurs de crédits
      let defaultModel = 'gpt-3.5-turbo'; // Modèle gratuit par défaut
      
      // Si l'utilisateur a configuré un modèle spécifique, l'utiliser
      if (settings.defaultModel) {
        defaultModel = settings.defaultModel;
      } else if (isOpenRouter) {
        // Pour OpenRouter, utiliser un modèle gratuit par défaut
        defaultModel = 'openrouter/auto';
      }
      
      apiConfig = {
        baseUrl: isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1',
        apiKey: settings.apiKey,
        defaultModel: defaultModel,
        apiProvider: isOpenRouter ? 'openrouter' : 'openai'
      };

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Erreur de configuration';
      //console.error('Erreur de configuration:', error);
    }

    if (!apiConfig?.apiKey) {
      setOptimizationError(errorMessage || 'Configuration API invalide');
      return;
    }

    // Réinitialiser les états
    setIsOptimizing(true);
    setOptimizationError(null);
    setShowOptimized(false);

    try {
      // Appeler le service d'optimisation
      const optimized = await optimizePrompt({
        prompt: contentToOptimize,
        systemPrompt: formData.systemPrompt || 'Tu es un expert en amélioration de prompts. Ton travail est d\'optimiser les prompts pour les rendre plus clairs, précis et efficaces.',
        model: apiConfig.defaultModel,
        apiConfig: apiConfig
      });
      
      // Mettre à jour l'état avec le résultat optimisé
      setOptimizedContent(optimized);
      setShowOptimized(true);
      
    } catch (error) {
      console.error('Erreur lors de l\'optimisation :', error);
      
      // Gérer différents types d'erreurs
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          setOptimizationError('Clé API non autorisée. Veuillez vérifier votre clé API.');
        } else if (error.message.includes('429')) {
          setOptimizationError('Limite de requêtes dépassée. Veuillez réessayer plus tard.');
        } else if (error.message.includes('network')) {
          setOptimizationError('Erreur de connexion. Vérifiez votre connexion Internet.');
        } else {
          setOptimizationError(`Erreur: ${error.message}`);
        }
      } else {
        setOptimizationError('Une erreur inattendue est survenue lors de l\'optimisation.');
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const useOptimizedContent = () => {
    if (optimizedContent) {
      setFormData(prev => ({
        ...prev,
        content: optimizedContent
      }));
      setShowOptimized(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e);
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e);
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(e);

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const trimmedTag = newTag.trim().toLowerCase();
    
    if ((e.key === 'Enter' || e.key === ',') && trimmedTag) {
      e.preventDefault();
      
      const tagExists = formData.tags.some(tag => tag.toLowerCase() === trimmedTag);
      
      if (!tagExists) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, trimmedTag]
        }));
      }
      
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Extraire le systemPrompt du contenu s'il est formaté avec [System: ...]
    let finalContent = formData.content.trim();
    let systemPrompt = formData.systemPrompt;
    
    const systemMatch = finalContent.match(/^\[System: (.+?)\]([\s\S]*)/);
    if (systemMatch) {
      systemPrompt = systemMatch[1].trim();
      finalContent = systemMatch[2].trim();
    }
    
    // Créer un nouvel objet prompt avec les valeurs actuelles
    const newPrompt = {
      title: formData.title.trim(),
      content: finalContent,
      systemPrompt: systemPrompt,
      description: formData.description || '',
      category: formData.category,
      tags: [...new Set(formData.tags)],
      isFavorite: initialPrompt?.isFavorite || false,
      model: 'gpt-4',
      isPublic: false
    };
    
    onSave(newPrompt);
    
    // Afficher la notification de succès
    setShowSuccess(true);
    
    // Réinitialiser les champs après l'enregistrement
    setFormData({
      title: '',
      content: '',
      systemPrompt: '',
      category: 'général',
      tags: [],
      description: ''
    });
    
    // Effacer les données du localStorage pour éviter les conflits
    try {
      // Sauvegarder les paramètres actuels pour les conserver
      const savedSettings = localStorage.getItem('promptCraftSettings');
      
      // Effacer tout le localStorage lié à l'application
      const prefix = 'promptcraft-';
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
      
      // Restaurer les paramètres si nécessaire
      if (savedSettings) {
        localStorage.setItem('promptCraftSettings', savedSettings);
      }
      
      // Réinitialiser avec des valeurs par défaut
      localStorage.setItem('promptcraft-prompts', JSON.stringify([]));
      localStorage.setItem('promptcraft-favorites', JSON.stringify([]));
      
      console.log('LocalStorage réinitialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du localStorage:', error);
    }
    
    // Masquer la notification après 3 secondes
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className={`bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'relative'
    }`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Modifier le prompt' : 'Nouveau prompt'}
            </h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title={isFullscreen ? 'Réduire' : 'Plein écran'}
              >
                {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
              <button
                type="button"
                onClick={optimizeWithAI}
                disabled={isOptimizing || !formData.content.trim()}
                className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${
                  isOptimizing 
                    ? 'text-purple-400 cursor-wait' 
                    : !formData.content.trim()
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-purple-400 hover:text-white hover:bg-purple-700/50'
                }`}
                title={!formData.content.trim() ? "Ajoutez d'abord un contenu à optimiser" : "Optimiser avec l'IA"}
              >
                <FiZap className={`${isOptimizing ? 'animate-pulse' : ''}`} />
                <span>Optimiser</span>
              </button>
            </div>
          </div>
        </div>
        {showOptimized && (
          <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/50 transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Suggestion d'optimisation
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Voici une version améliorée de votre prompt
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, content: optimizedContent }));
                    setShowOptimized(false);
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center transition-colors"
                >
                  <FiCheck className="mr-1.5 h-3.5 w-3.5" />
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={() => setShowOptimized(false)}
                  className="text-xs bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md flex items-center transition-colors"
                >
                  <FiX className="mr-1 h-3.5 w-3.5" />
                  Fermer
                </button>
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200">
              {optimizedContent}
            </div>
            <div className="mt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(optimizedContent);
                  // Vous pourriez ajouter un toast de confirmation ici
                }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                title="Copier le prompt optimisé"
              >
                <FiCopy className="mr-1 h-3.5 w-3.5" />
                Copier
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="px-6 pb-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
              Titre *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="Donnez un titre à votre prompt"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">
              Contenu du prompt *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              className="w-full h-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-mono text-sm"
              placeholder="Écrivez votre prompt ici..."
              required
              ref={textareaRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  optimizeWithAI();
                }
              }}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full h-20 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="Décrivez l'objectif de ce prompt"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tags (appuyez sur Entrée pour ajouter)
              </label>
              <div>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={addTag}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Appuyez sur Entrée pour ajouter"
                />
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-100"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-800 text-blue-200 hover:bg-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {optimizationError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
              <div className="flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{optimizationError}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {showSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Le prompt a été enregistré avec succès !
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center"
                disabled={isOptimizing}
              >
                <FiSave className="mr-2" />
                {isEditing ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default PromptEditor;
