import React, { useState } from 'react';
import { AITemplate } from '../types';
import { FiCopy, FiStar, FiFilter, FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Données de démonstration pour les modèles IA
const defaultTemplates: AITemplate[] = [
  {
    id: '1',
    name: 'Assistant de rédaction',
    description: 'Aide à la rédaction de contenu créatif et professionnel',
    systemPrompt: 'Tu es un assistant de rédaction créatif et professionnel. Ton rôle est de m\'aider à rédiger du contenu de qualité.',
    userPrompt: 'Écris un article sur [sujet] qui inclut [points clés].',
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
    },
    category: 'rédaction',
    tags: ['rédaction', 'création', 'contenu'],
    isOfficial: true,
  },
  {
    id: '2',
    name: 'Générateur d\'idées',
    description: 'Génère des idées créatives pour du contenu',
    systemPrompt: 'Tu es un générateur d\'idées créatives. Propose des concepts uniques et originaux.',
    userPrompt: 'Donne-moi 5 idées de [type de contenu] sur [thème].',
    parameters: {
      temperature: 0.8,
      maxTokens: 500,
      topP: 1,
      frequencyPenalty: 0.7,
      presencePenalty: 0.3,
    },
    category: 'idées',
    tags: ['créativité', 'brainstorming', 'idées'],
    isOfficial: true,
  },
  {
    id: '3',
    name: 'Assistant de codage',
    description: 'Aide à écrire et déboguer du code',
    systemPrompt: 'Tu es un assistant de programmation expérimenté. Aide-moi à écrire du code propre et efficace.',
    userPrompt: 'Écris une fonction en [langage] qui [description de la fonction].',
    parameters: {
      temperature: 0.2,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0.3,
      presencePenalty: 0.3,
    },
    category: 'code',
    tags: ['programmation', 'développement', 'code'],
    isOfficial: true,
  },
  {
    id: '4',
    name: 'Assistant marketing',
    description: 'Crée du contenu marketing percutant',
    systemPrompt: 'Tu es un expert en marketing digital. Aide-moi à créer du contenu engageant.',
    userPrompt: 'Crée un post pour [plateforme] qui promeut [produit/service] en mettant en avant [avantages].',
    parameters: {
      temperature: 0.6,
      maxTokens: 800,
      topP: 1,
      frequencyPenalty: 0.4,
      presencePenalty: 0.4,
    },
    category: 'marketing',
    tags: ['marketing', 'réseaux sociaux', 'publicité'],
    isOfficial: true,
  },
  {
    id: '5',
    name: 'Assistant de traduction',
    description: 'Traduit et adapte du contenu entre différentes langues',
    systemPrompt: 'Tu es un traducteur professionnel. Traduis le texte en conservant le ton et le style.',
    userPrompt: 'Traduis le texte suivant en [langue cible] en conservant le ton [ton souhaité]: [texte à traduire]',
    parameters: {
      temperature: 0.3,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0.2,
      presencePenalty: 0.2,
    },
    category: 'traduction',
    tags: ['langue', 'traduction', 'localisation'],
    isOfficial: true,
  },
];

interface AITemplatesProps {
  onUseTemplate: (template: AITemplate) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const AITemplates: React.FC<AITemplatesProps> = ({ 
  onUseTemplate, 
  favorites,
  onToggleFavorite 
}) => {
  const [templates, setTemplates] = useState<AITemplate[]>(defaultTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Extraire toutes les catégories uniques
  const categories = ['all', ...new Set(templates.map(template => template.category))];
  
  // Extraire tous les tags uniques
  const allTags = Array.from(new Set(templates.flatMap(template => template.tags || [])));

  // Filtrer les modèles en fonction de la recherche, de la catégorie et des tags
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      template.category === selectedCategory;
    
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.every(tag => template.tags?.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le déclenchement du clic sur la carte
    onToggleFavorite(id);
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

  const handleUseTemplate = (template: AITemplate) => {
    // On passe directement le template, la transformation sera faite dans createPromptFromTemplate
    onUseTemplate(template);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Modèles IA
            </h2>
            <p className="text-gray-400 text-sm">
              Utilisez ces modèles prédéfinis pour démarrer rapidement
            </p>
          </div>
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
            placeholder="Rechercher des modèles..."
          />
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-750 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Filtrer les modèles</h3>
            
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
                      {category === 'all' ? 'Toutes les catégories' : category}
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

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">Aucun modèle trouvé</div>
          <p className="text-sm text-gray-400">Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div 
              key={template.id} 
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-200 flex flex-col h-full group"
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {template.name}
                    </h3>
                    <span className="inline-block px-2 py-0.5 text-xs bg-blue-900/50 text-blue-300 rounded-full mt-1 capitalize">
                      {template.category}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(template.id, e)}
                    className={`p-1.5 rounded-full ${
                      favorites.includes(template.id)
                        ? 'text-yellow-400 hover:text-yellow-300'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title={favorites.includes(template.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <FiStar className={favorites.includes(template.id) ? 'fill-current' : ''} />
                  </button>
                </div>

                <p className="text-sm text-gray-300 mb-4 flex-1">
                  {template.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded-full">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Paramètres recommandés :</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-750 p-2 rounded">
                      <div className="text-gray-400">Température</div>
                      <div className="text-white">{template.parameters.temperature}</div>
                    </div>
                    <div className="bg-gray-750 p-2 rounded">
                      <div className="text-gray-400">Max Tokens</div>
                      <div className="text-white">{template.parameters.maxTokens}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-750 border-t border-gray-700 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(template.userPrompt)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copier le prompt"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  Utiliser ce modèle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AITemplates;
