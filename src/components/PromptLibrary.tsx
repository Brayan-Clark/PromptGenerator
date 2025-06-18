import React, { useState } from 'react';
import { Prompt } from '../types';
import { FiSearch, FiFilter, FiX, FiStar, FiEdit2, FiTrash2, FiCopy } from 'react-icons/fi';
import PromptEditor from './PromptEditor';

interface PromptLibraryProps {
  prompts: Prompt[];
  favorites: string[];
  onEdit: (id: string, updates: Partial<Prompt>) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({
  prompts,
  favorites,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extraire toutes les catégories uniques
  const categories = ['all', ...new Set(prompts.map(prompt => prompt.category))];
  
  // Extraire tous les tags uniques
  const allTags = Array.from(new Set(prompts.flatMap(prompt => prompt.tags || [])));

  // Filtrer les prompts en fonction de la recherche, de la catégorie et des tags
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      prompt.category === selectedCategory;
    
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.every(tag => prompt.tags?.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTags([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Vous pourriez ajouter une notification ici
  };

  // Fonction utilitaire pour formater la date
  const formatDate = (date: string | Date | undefined): string => {
    try {
      if (!date) return 'Date inconnue';
      
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) return 'Date invalide';
      
      return dateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de format de date:', error);
      return 'Date invalide';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Bibliothèque de Prompts
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
              >
              <FiFilter />
              <span>Filtres</span>
              {(selectedCategory !== 'all' || selectedTags.length > 0) && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 rounded-full">
                  {selectedCategory !== 'all' ? selectedTags.length + 1 : selectedTags.length}
                </span>
              )}
            </button>
            {(selectedCategory !== 'all' || selectedTags.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white flex items-center"
              >
                <FiX className="mr-1" /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Rechercher des prompts..."
          />
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-750 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Filtres avancés</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Catégorie
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 text-sm rounded-full capitalize ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {allTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Étiquettes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          selectedTags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">Aucun prompt trouvé</div>
          <p className="text-sm text-gray-400">Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2     lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt, index) => {
            console.log(`Rendu du prompt ${index + 1}:`, {
              id: prompt.id,
              title: prompt.title,
              content: prompt.content ? `${prompt.content.substring(0, 30)}...` : 'VIDE',
              category: prompt.category,
              tags: prompt.tags,
              isFavorite: favorites.includes(prompt.id!)
            });
            
            return (
              <div 
                key={prompt.id} 
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-200 flex flex-col h-full"
                >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {prompt.title || 'Sans titre'}
                      </h3>
                      {prompt.category && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-blue-900/50 text-blue-300 rounded-full mt-1">
                          {prompt.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleFavorite(prompt.id!)}
                      className={`p-1.5 rounded-full ${
                        favorites.includes(prompt.id!)
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-gray-500 hover:text-gray-300'
                        }`}
                      title={favorites.includes(prompt.id!) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                      <FiStar className={favorites.includes(prompt.id!) ? 'fill-current' : ''} />
                    </button>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-gray-300 line-clamp-3 mb-4">
                      {prompt.content ? prompt.content.substring(0, 200) : ''}
                      {prompt.content && prompt.content.length > 200 ? '...' : ''}
                    </p>
                  </div>

                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full"
                          >
                          {tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded-full">
                          +{prompt.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 bg-gray-750 border-t border-gray-700 flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    {formatDate(prompt.updatedAt || prompt.createdAt)}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(prompt.content || '')}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Copier le prompt"
                      >
                      <FiCopy size={16} />
                    </button>
                    <button
                      onClick={() => setEditingPrompt(prompt)}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Modifier"
                      >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(prompt.id!)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Supprimer"
                      >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
      )}

      {editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800 rounded-xl shadow-2xl">
            <div className="sticky top-0 bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Modifier le prompt
              </h3>
              <button
                onClick={() => setEditingPrompt(null)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Fermer"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              <PromptEditor
                initialPrompt={editingPrompt}
                onSave={(updatedPrompt) => {
                  onEdit(editingPrompt.id!, updatedPrompt);
                  setEditingPrompt(null);
                }}
                onCancel={() => setEditingPrompt(null)}
                onClose={() => setEditingPrompt(null)}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptLibrary;
