import React, { useState, useEffect } from 'react';
import { Prompt, AITemplate, Settings as SettingsType } from './types';
import { Sidebar, PromptEditor, PromptLibrary, AITemplates, Settings, AIAssistant } from './components';
import { FiSun, FiMoon, FiMessageSquare } from 'react-icons/fi';
import { useNotifications } from './contexts/NotificationContext';

interface AppProps {
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

const App: React.FC<AppProps> = ({ darkMode: initialDarkMode, onDarkModeChange }) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const { addNotification } = useNotifications();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [settings, setSettings] = useState<SettingsType>({
    language: 'fr',
    defaultModel: 'gpt-4',
    defaultTemperature: 0.7,
    maxTokens: 1000,
    apiKey: '',
    apiProvider: 'openai',
    suggest: {
      filterGraceful: true,
      hideConstants: false,
      insertMode: 'insert',
      insertTextMode: 'asIs',
      localityBonus: false,
      maxVisibleSuggestions: 10,
      shareSuggestSelections: true,
      showClasses: true,
      showColors: true,
      showConstructors: true,
      showDeprecated: false,
      showEnumMembers: true,
      showEvents: true,
      showFields: true,
      showFiles: true,
      showFolders: true,
      showFunctions: true,
      showInterfaces: true,
      showIssues: true,
      showKeywords: true,
      showMethods: true,
      showModules: true,
      showOperators: true,
      showProperties: true,
      showReferences: true,
      showSnippets: true,
      showStructs: true,
      showTypeParameters: true,
      showUnits: true,
      showUsers: true,
      showValues: true,
      showVariables: true,
      showWords: true,
      snippetsPreventQuickSuggestions: false
    }
  });

  // Charger le thème depuis le localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        const isDark = JSON.parse(savedDarkMode);
        setDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        // Utiliser la préférence système si rien n'est sauvegardé
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        document.documentElement.classList.toggle('dark', prefersDark);
      }

      // Charger les paramètres sauvegardés
      const savedSettings = localStorage.getItem('promptcraft-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  // Charger les données depuis le localStorage
  useEffect(() => {
    console.log('=== DÉBUT DU CHARGEMENT DES DONNÉES ===');
    
    // Charger les prompts
    const savedPrompts = localStorage.getItem('promptcraft-prompts');
    console.log('=== DONNÉES BRUTES DES PROMPTS ===');
    console.log(savedPrompts);
    
    // Charger les favoris
    const savedFavorites = localStorage.getItem('promptcraft-favorites');
    console.log('=== DONNÉES BRUTES DES FAVORIS ===');
    console.log(savedFavorites);
    
    // Initialiser avec des données par défaut si c'est la première fois
    const defaultPrompts: Prompt[] = [
      {
        id: '1',
        title: 'Exemple de prompt',
        content: 'Ceci est un exemple de prompt. Modifiez-le ou créez-en un nouveau !',
        description: 'Un exemple pour démarrer',
        category: 'général',
        tags: ['exemple', 'démo'],
        isFavorite: false,
        model: 'gpt-4',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log('=== DONNÉES PAR DÉFAUT ===');
    console.log(JSON.stringify(defaultPrompts, null, 2));
    
    try {
      // Traiter les prompts
      let loadedPrompts: Prompt[] = [];
      
      console.log('=== TRAITEMENT DES PROMPTS ===');
      
      if (savedPrompts) {
        console.log('Parsing des prompts sauvegardés...');
        let parsedPrompts;
        try {
          parsedPrompts = JSON.parse(savedPrompts);
          console.log('Prompts parsés avec succès:', parsedPrompts);
        } catch (parseError) {
          console.error('Erreur lors du parsing des prompts:', parseError);
          parsedPrompts = [];
        }
        
        console.log('Nettoyage et validation des données...');
        
        // Valider et nettoyer les données
        loadedPrompts = (Array.isArray(parsedPrompts) ? parsedPrompts : [])
          .filter((prompt: any) => {
            const isValid = prompt && typeof prompt === 'object';
            if (!isValid) {
              console.warn('Prompt invalide ignoré:', prompt);
            }
            return isValid;
          })
          .map((prompt: any, index: number) => {
            const promptId = prompt.id || `prompt-${Date.now()}-${index}`;
            const isFavorite = savedFavorites ? JSON.parse(savedFavorites).includes(promptId) : false;
            
            const cleanedPrompt = {
              id: promptId,
              title: prompt.title || 'Sans titre',
              content: prompt.content || '',
              description: prompt.description || '',
              category: prompt.category || 'général',
              tags: Array.isArray(prompt.tags) ? prompt.tags.filter((t: any) => typeof t === 'string') : [],
              isFavorite: isFavorite,
              model: prompt.model || 'gpt-4',
              isPublic: Boolean(prompt.isPublic),
              createdAt: prompt.createdAt ? new Date(prompt.createdAt) : new Date(),
              updatedAt: prompt.updatedAt ? new Date(prompt.updatedAt) : new Date(),
            };
            
            console.log(`Prompt ${index + 1} nettoyé:`, cleanedPrompt);
            return cleanedPrompt;
          });
          
        console.log(`Chargement de ${loadedPrompts.length} prompts valides`);
      } else {
        // Si pas de données sauvegardées, utiliser les données par défaut
        loadedPrompts = [...defaultPrompts];
        // Sauvegarder les données par défaut
        localStorage.setItem('promptcraft-prompts', JSON.stringify(loadedPrompts));
      }
      
      console.log('Prompts chargés:', loadedPrompts);
      setPrompts(loadedPrompts);
      
      // Traiter les favoris
      if (savedFavorites) {
        try {
          const parsedFavorites = JSON.parse(savedFavorites);
          if (Array.isArray(parsedFavorites)) {
            setFavorites(parsedFavorites);
          } else {
            console.warn('Le format des favoris est invalide, réinitialisation...');
            setFavorites([]);
          }
        } catch (error) {
          console.error('Erreur lors du parsing des favoris:', error);
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Erreur critique lors du chargement des données:', error);
      // En cas d'erreur critique, réinitialiser avec les valeurs par défaut
      setPrompts([...defaultPrompts]);
      setFavorites([]);
      // Et sauvegarder les valeurs par défaut
      localStorage.setItem('promptcraft-prompts', JSON.stringify(defaultPrompts));
      localStorage.setItem('promptcraft-favorites', JSON.stringify([]));
    }
  }, []);

  // Sauvegarder les modifications
  useEffect(() => {
    try {
      console.log('Sauvegarde des prompts dans le localStorage...', prompts);
      localStorage.setItem('promptcraft-prompts', JSON.stringify(prompts));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des prompts:', error);
    }
  }, [prompts]);

  useEffect(() => {
    try {
      console.log('Sauvegarde des favoris dans le localStorage...', favorites);
      localStorage.setItem('promptcraft-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  }, [favorites]);

  // Sauvegarder les paramètres
  const saveSettings = (newSettings: SettingsType) => {
    setSettings(newSettings);
    localStorage.setItem('promptcraft-settings', JSON.stringify(newSettings));
    addNotification('Paramètres enregistrés avec succès', 'success');
  };

  // Gérer le changement de thème
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    onDarkModeChange(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    
    // Mettre à jour le thème dans les paramètres
    const newSettings = {
      ...settings,
      theme: newDarkMode ? 'dark' : 'light'
    };
    setSettings(newSettings);
    localStorage.setItem('promptcraft-settings', JSON.stringify(newSettings));
  };

  // Fonction utilitaire pour créer un prompt à partir d'un template
  const createPromptFromTemplate = (template: AITemplate): Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'> => {
    console.log('Création d\'un prompt à partir du template:', template);
    return {
      title: template.name,
      content: template.systemPrompt + '\n\n' + template.userPrompt,
      description: template.description || '',
      category: template.category || 'général',
      tags: [...(template.tags || [])],
      isFavorite: false,
      model: 'gpt-4',
      isPublic: false
    };
  };

  // Fonctions de gestion des prompts
  const addPrompt = (newPrompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Ajout d\'un nouveau prompt:', newPrompt);
    
    const prompt: Prompt = {
      id: Date.now().toString(),
      title: newPrompt.title || 'Sans titre',
      content: newPrompt.content || '',
      description: newPrompt.description || '',
      category: newPrompt.category || 'général',
      tags: Array.isArray(newPrompt.tags) ? newPrompt.tags : [],
      isFavorite: Boolean(newPrompt.isFavorite),
      model: newPrompt.model || 'gpt-4',
      isPublic: Boolean(newPrompt.isPublic),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Nouveau prompt créé:', prompt);
    
    setPrompts(prevPrompts => {
      const newPrompts = [...prevPrompts, prompt];
      console.log('Mise à jour des prompts, nouveau tableau:', newPrompts);
      return newPrompts;
    });
    
    // Mettre à jour l'éditeur avec le nouveau prompt
    setActiveTab('editor');
    return prompt;
  };

  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id 
        ? { ...prompt, ...updates, updatedAt: new Date() } 
        : prompt
    ));
  };

  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter(prompt => prompt.id !== id));
  };

  // Gestion des favoris
  const toggleFavorite = (id: string) => {
    console.log('Toggle favorite pour l\'ID:', id);
    setFavorites(prevFavorites => {
      const isCurrentlyFavorite = prevFavorites.includes(id);
      const newFavorites = isCurrentlyFavorite
        ? prevFavorites.filter(favId => favId !== id)
        : [...prevFavorites, id];
      
      console.log('Nouveaux favoris:', newFavorites);
      
      // Mettre à jour l'état isFavorite dans les prompts
      setPrompts(prevPrompts => {
        const updatedPrompts = prevPrompts.map(prompt => 
          prompt.id === id 
            ? { ...prompt, isFavorite: !isCurrentlyFavorite }
            : prompt
        );
        console.log('Prompts mis à jour:', updatedPrompts);
        return updatedPrompts;
      });
      
      // Afficher une notification
      addNotification(
        !isCurrentlyFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris',
        !isCurrentlyFavorite ? 'success' : 'info'
      );
      
      return newFavorites;
    });
  };

  // Rendu du contenu en fonction de l'onglet actif
  const renderContent = () => {
    console.log('Rendu du contenu, onglet actif:', activeTab);
    console.log('Prompts chargés:', prompts);
    
    switch (activeTab) {
      case 'editor':
        console.log('Rendu de PromptEditor');
        console.log('Détails du premier prompt:', prompts[0]);
        return (
          <PromptEditor 
            key="prompt-editor" 
            onSave={addPrompt} 
            initialPrompt={prompts[0] || {}} 
          />
        );
      case 'library':
        console.log('=== RENDU DE LA BIBLIOTHÈQUE ===');
        console.log('Prompts transmis à la bibliothèque:', prompts);
        console.log('Favoris:', favorites);
        
        // Vérifier les données des prompts
        prompts.forEach((prompt, index) => {
          console.log(`Prompt ${index + 1}:`, {
            id: prompt.id,
            title: prompt.title,
            content: prompt.content ? `${prompt.content.substring(0, 50)}...` : 'VIDE',
            category: prompt.category,
            tags: prompt.tags,
            isFavorite: favorites.includes(prompt.id!)
          });
        });
        
        return (
          <PromptLibrary 
            key="prompt-library"
            prompts={prompts}
            favorites={favorites}
            onEdit={updatePrompt}
            onDelete={deletePrompt}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'templates':
        return (
          <AITemplates 
            onUseTemplate={(template: AITemplate) => {
              const newPrompt = createPromptFromTemplate(template);
              addPrompt(newPrompt);
              // Basculer vers l'éditeur avec le nouveau prompt
              setActiveTab('editor');
            }}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'ai-assistant':
        return (
          <AIAssistant 
            onClose={() => setActiveTab('editor')} 
            name="Assistant IA"
            description="Assistant pour vous aider à formuler des prompts efficaces"
            apiKey={settings.apiKey || ''}
            apiProvider={settings.apiProvider || 'openai'}
          />
        );
      case 'favorites':
        console.log('Affichage des favoris. Favoris actuels:', favorites);
        const favoritePrompts = prompts.filter(p => favorites.includes(p.id!));
        console.log('Prompts favoris trouvés:', favoritePrompts);
        return (
          <PromptLibrary 
            prompts={favoritePrompts}
            favorites={favorites}
            onEdit={updatePrompt}
            onDelete={deletePrompt}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'settings':
        return (
          <div className="fixed inset-0 z-40 flex">
            <div 
              className="flex-1 bg-black/50 backdrop-blur-sm"
              onClick={() => setActiveTab('editor')}
            />
            <div className="w-full max-w-2xl bg-gray-800 overflow-y-auto">
              <Settings 
                darkMode={darkMode} 
                onDarkModeChange={toggleDarkMode} 
                onSave={saveSettings} 
                settings={settings}
                onClose={() => setActiveTab('editor')}
              />
            </div>
          </div>
        );
      default:
        return <PromptEditor onSave={addPrompt} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Barre latérale */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        onOpenAIAssistant={() => setShowAIAssistant(true)}
      />
      
      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;