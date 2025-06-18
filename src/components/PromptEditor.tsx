import React, { useState, useEffect, useRef } from 'react';
import { Prompt } from '../types';
import { FiSave, FiCopy, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

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
  // États du formulaire avec initialisation une seule fois
  const [formData, setFormData] = useState(() => ({
    title: initialPrompt.title || '',
    content: initialPrompt.content || '',
    systemPrompt: initialPrompt.systemPrompt || '',
    category: initialPrompt.category || 'général',
    tags: initialPrompt.tags || [],
    description: initialPrompt.description || ''
  }));
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const optimizeWithAI = async () => {
    if (!content.trim()) {
      alert('Veuvez ajouter du contenu à optimiser');
      return;
    }

    setIsOptimizing(true);
    setShowOptimized(true);

    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Exemple de contenu optimisé (à remplacer par un vrai appel API)
      const optimized = `Voici une version améliorée de votre prompt :\n\n${content}\n\nConseil : Essayez d'être plus spécifique dans vos demandes pour des résultats plus précis.`;
      
      setOptimizedContent(optimized);
    } catch (error) {
      console.error('Erreur lors de l\'optimisation :', error);
      alert('Une erreur est survenue lors de l\'optimisation');
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

  const [optimizedContent, setOptimizedContent] = useState('');
  const [showOptimized, setShowOptimized] = useState(false);
  const [newTag, setNewTag] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Catégories disponibles
  const categories = [
    'général',
    'création',
    'révision',
    'traduction',
    'code',
    'recherche',
    'autre',
  ];

  // Mise à jour des états lorsque initialPrompt change (seulement au montage et quand initialPrompt change vraiment)
  useEffect(() => {
    console.log('InitialPrompt changé:', initialPrompt);
    
    if (initialPrompt && Object.keys(initialPrompt).length > 0) {
      console.log('Mise à jour du formulaire avec initialPrompt:', initialPrompt);
      
      const newFormData = {
        title: initialPrompt.title || 'Sans titre',
        content: initialPrompt.content || '',
        category: initialPrompt.category || 'général',
        tags: Array.isArray(initialPrompt.tags) ? initialPrompt.tags : [],
        description: initialPrompt.description || '',
        systemPrompt: initialPrompt.systemPrompt || ''
      };
      
      console.log('Nouvelles données de formulaire:', newFormData);
      
      // Si un systemPrompt est fourni, l'ajouter au contenu
      if (initialPrompt.systemPrompt && !newFormData.content.includes('[System:')) {
        console.log('Ajout du systemPrompt au contenu');
        newFormData.content = `[System: ${initialPrompt.systemPrompt}]\n\n${newFormData.content}`.trim();
      }
      
      setFormData(prev => {
        const updated = {
          ...prev,
          ...newFormData
        };
        console.log('Mise à jour de formData avec:', updated);
        return updated;
      });
    } else {
      console.log('Aucun initialPrompt fourni ou initialPrompt vide');
      // Réinitialiser avec des valeurs par défaut
      setFormData({
        title: '',
        content: '',
        systemPrompt: '',
        description: '',
        category: 'général',
        tags: []
      });
    }
  }, [JSON.stringify(initialPrompt)]); // Utilisation de JSON.stringify pour une comparaison en profondeur
  
  // Destructuration pour faciliter l'accès
  const { title, content, category, tags } = formData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      // Utiliser une notification au lieu d'une alerte
      if (typeof window !== 'undefined') {
        alert('Veuillez remplir tous les champs obligatoires');
      }
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
      tags: [...new Set(formData.tags)], // Supprime les doublons
      isFavorite: initialPrompt?.isFavorite || false,
      model: 'gpt-4',
      isPublic: false
    };

    console.log('Sauvegarde du prompt:', newPrompt);
    
    // Appeler la fonction onSave avec le nouveau prompt
    onSave(newPrompt);

    // Réinitialiser le formulaire si ce n'est pas une édition
    if (!isEditing) {
      setFormData({
        title: '',
        content: '',
        systemPrompt: '',
        description: '',
        category: 'général',
        tags: []
      });
    }
  };

  // Log des changements d'état (uniquement en développement)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Form data updated:', formData);
    }
  }, [formData]);

  // Gestionnaires d'événements mis à jour
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Alias pour la rétrocompatibilité
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e);
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e);
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange(e);

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const trimmedTag = newTag.trim().toLowerCase();
    
    if ((e.key === 'Enter' || e.key === ',') && trimmedTag) {
      e.preventDefault();
      
      // Vérifier si le tag existe déjà (insensible à la casse)
      const tagExists = tags.some(tag => tag.toLowerCase() === trimmedTag);
      
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    // Vous pourriez ajouter une notification ici
  };

  return (
    <div className={`bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'relative'
    }`}>
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
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Optimiser avec l'IA"
            >
              Optimiser
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {showOptimized && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-purple-500">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-purple-400 font-medium">Suggestion d'amélioration</h3>
              <div className="flex space-x-2">
                <button
                  onClick={useOptimizedContent}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
                >
                  Utiliser
                </button>
                <button
                  onClick={() => setShowOptimized(false)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                >
                  Fermer
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-200 bg-gray-900 p-3 rounded">
              {optimizedContent || 'Génération en cours...'}
            </div>
          </div>
          )}

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
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="content" className="block text-sm font-medium text-gray-300">
                Contenu du prompt *
              </label>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
              >
                <FiCopy className="mr-1" /> Copier
              </button>
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              className="w-full h-64 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-mono text-sm"
              placeholder="Écrivez votre prompt ici..."
              required
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
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">
                Étiquettes
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="tags"
                  ref={tagInputRef}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={addTag}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Appuyez sur Entrée pour ajouter"
                />
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
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

          <div className="flex justify-end space-x-3 pt-4">
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
            >
              <FiSave className="mr-2" />
              {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptEditor;
