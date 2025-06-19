import React, { useState, useEffect } from 'react';
import { 
  FiMoon, 
  FiSun, 
  FiSave, 
  FiX, 
  FiChevronDown, 
  FiChevronUp, 
  FiEye, 
  FiEyeOff, 
  FiKey, 
  FiInfo 
} from 'react-icons/fi';

type ApiProvider = 'openai' | 'openrouter';

interface SettingsData {
  apiKey?: string;
  apiProvider?: ApiProvider;
  language?: string;
  fontSize?: number;
  autoSave?: boolean;
  notifications?: boolean;
  darkMode?: boolean;
}

interface SettingsProps {
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
  onClose?: () => void;
  onSave: (settings: SettingsData) => void;
  settings?: SettingsData;
}

const Settings: React.FC<SettingsProps> = ({
  darkMode,
  onDarkModeChange,
  onClose,
  onSave,
  settings = {}
}) => {
  // États du composant
  const [activeTab, setActiveTab] = useState('général');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [apiProvider, setApiProvider] = useState<ApiProvider>(settings.apiProvider || 'openai');
  const [isValidating, setIsValidating] = useState(false);
  const [isValidKey, setIsValidKey] = useState<boolean | null>(null);
  const [language, setLanguage] = useState(settings.language || 'fr');
  const [fontSize, setFontSize] = useState(settings.fontSize || 14);
  const [autoSave, setAutoSave] = useState(settings.autoSave !== undefined ? settings.autoSave : true);
  const [notifications, setNotifications] = useState(settings.notifications !== undefined ? settings.notifications : true);
  const [saved, setSaved] = useState(false);

  // Charger les paramètres depuis les props ou localStorage
  useEffect(() => {
    console.log('Chargement des paramètres...');
    
    if (settings) {
      console.log('Paramètres chargés depuis les props:', settings);
      setApiKey(settings.apiKey || '');
      setApiProvider(settings.apiProvider || 'openai');
      setLanguage(settings.language || 'fr');
      setFontSize(settings.fontSize || 14);
      setAutoSave(settings.autoSave !== undefined ? settings.autoSave : true);
      setNotifications(settings.notifications !== undefined ? settings.notifications : true);
      
      if (settings.darkMode !== undefined && settings.darkMode !== darkMode) {
        onDarkModeChange(settings.darkMode);
      }
      
      if (settings.apiKey) {
        setActiveTab('général');
      } else {
        setActiveTab('api');
      }
      return;
    }
    
    const savedSettings = localStorage.getItem('promptCraftSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('Paramètres chargés depuis localStorage:', parsedSettings);
        
        setApiKey(parsedSettings.apiKey || '');
        setApiProvider(parsedSettings.apiProvider || 'openai');
        setLanguage(parsedSettings.language || 'fr');
        setFontSize(parsedSettings.fontSize || 14);
        setAutoSave(parsedSettings.autoSave !== undefined ? parsedSettings.autoSave : true);
        setNotifications(parsedSettings.notifications !== undefined ? parsedSettings.notifications : true);
        
        if (parsedSettings.darkMode !== undefined && parsedSettings.darkMode !== darkMode) {
          onDarkModeChange(parsedSettings.darkMode);
        }
        
        if (parsedSettings.apiKey) {
          setActiveTab('général');
        } else {
          setActiveTab('api');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        setActiveTab('général');
      }
    } else {
      console.log('Aucun paramètre sauvegardé trouvé');
      setActiveTab('général');
    }
  }, [settings, darkMode, onDarkModeChange]);

  // Valider la clé API
  const validateApiKey = async (key: string, provider: ApiProvider = apiProvider): Promise<{ isValid: boolean; message?: string }> => {
    console.log(`[DEBUG] Début de validation pour le fournisseur: ${provider}`);
    
    // Masquage partiel de la clé pour les logs
    const maskedKey = key ? `${key.substring(0, 5)}...${key.substring(key.length - 3)}` : 'none';
    console.log(`[DEBUG] Clé fournie: ${maskedKey}`);
    
    if (!key?.trim()) {
      console.log('[DEBUG] Aucune clé fournie');
      setIsValidKey(null);
      return { isValid: false, message: 'Aucune clé fournie' };
    }

    setIsValidating(true);
    console.log('[DEBUG] Validation en cours...');
    
    try {
      // Validation du format basique
      const isValidFormat = /^sk-[a-zA-Z0-9-]{10,300}$/.test(key.trim());
      console.log(`[DEBUG] Format de la clé valide: ${isValidFormat}`);
      
      if (!isValidFormat) {
        const message = 'Format de clé invalide. La clé doit commencer par "sk-" suivie de caractères alphanumériques et tirets.';
        console.error(message);
        setIsValidKey(false);
        return { isValid: false, message };
      }
      
      // Vérification via l'API si nécessaire
      if (provider === 'openai') {
        console.log('[DEBUG] Vérification de la clé via l\'API...');
        try {
          // Utilisation de l'endpoint /models pour la validation
          const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
          });
          
          console.log(`[DEBUG] Réponse de l'API: ${response.status} ${response.statusText}`);
          
          if (response.status === 401) {
            const message = 'Clé API OpenAI non autorisée. Vérifiez que la clé est correcte et active.';
            console.error(message);
            setIsValidKey(false);
            return { isValid: false, message };
          }
          
          if (response.status === 429) {
            const message = 'Trop de requêtes. Veuillez réessayer dans quelques instants.';
            console.error(message);
            setIsValidKey(false);
            return { isValid: false, message };
          }
          
          if (response.ok) {
            console.log('[DEBUG] Clé API OpenAI valide');
            setIsValidKey(true);
            return { isValid: true };
          }
          
          // Pour les autres statuts, on essaie de récupérer le message d'erreur
          try {
            const errorData = await response.json();
            console.warn('Réponse inattendue de l\'API OpenAI:', response.status, errorData);
            
            // Si l'erreur est liée aux permissions ou au modèle, la clé est probablement valide
            if (response.status === 404 || response.status === 403) {
              console.log('[DEBUG] La clé semble valide mais avec des restrictions');
              setIsValidKey(true);
              return { isValid: true };
            }
            
            const message = `Erreur de l'API: ${errorData.error?.message || 'Erreur inconnue'}`;
            setIsValidKey(false);
            return { isValid: false, message };
          } catch (jsonError) {
            console.error('Erreur lors de la lecture de la réponse JSON:', jsonError);
            const message = `Erreur inattendue (${response.status} ${response.statusText})`;
            setIsValidKey(false);
            return { isValid: false, message };
          }
          
        } catch (error) {
          console.error('Erreur lors de la vérification de la clé OpenAI:', error);
          
          // En cas d'erreur réseau, on accepte la clé si le format est bon
          if (error.name === 'AbortError') {
            const message = 'La vérification a pris trop de temps. Vérifiez votre connexion internet.';
            console.warn(message);
            setIsValidKey(false);
            return { isValid: false, message };
          }
          
          if (error instanceof TypeError) {
            console.warn('Erreur réseau, acceptation basée sur le format');
            setIsValidKey(true);
            return { isValid: true };
          }
          
          // Pour les autres erreurs, on rejette la clé
          const message = `Erreur lors de la vérification de la clé: ${error.message || 'Erreur inconnue'}`;
          setIsValidKey(false);
          return { isValid: false, message };
        }
      } else if (provider === 'openrouter') {
        // Validation du format pour OpenRouter
        console.log('[DEBUG] Vérification du format de la clé OpenRouter');
        const openRouterKeyPattern = /^sk-or(-v1)?-[a-zA-Z0-9]{32,}$/;
        const isFormatValid = openRouterKeyPattern.test(key);
        console.log(`[DEBUG] Format de la clé valide: ${isFormatValid}`);
        
        if (!isFormatValid) {
          const message = 'Format de clé OpenRouter invalide. La clé doit commencer par "sk-or-" suivie d\'au moins 32 caractères alphanumériques.';
          console.error(message);
          setIsValidKey(false);
          return { isValid: false, message };
        }
        
        // Vérification via l'API OpenRouter
        try {
          console.log('[DEBUG] Vérification de la clé via l\'API OpenRouter...');
          const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.href,
              'X-Title': 'PromptCraft'
            }
          });
          
          console.log(`[DEBUG] Réponse OpenRouter: ${response.status} ${response.statusText}`);
          
          if (response.status === 401) {
            const message = 'Clé API OpenRouter non autorisée. Vérifiez que la clé est correcte et active.';
            console.error(message);
            setIsValidKey(false);
            return { isValid: false, message };
          }
          
          if (response.status === 429) {
            const message = 'Trop de requêtes vers OpenRouter. Veuillez réessayer dans quelques instants.';
            console.error(message);
            setIsValidKey(false);
            return { isValid: false, message };
          }
          
          if (!response.ok) {
            try {
              const errorData = await response.json();
              console.error('Erreur API OpenRouter:', errorData);
              const message = `Erreur de l'API OpenRouter: ${errorData.error?.message || 'Erreur inconnue'}`;
              setIsValidKey(false);
              return { isValid: false, message };
            } catch (jsonError) {
              console.error('Erreur lors de la lecture de la réponse JSON:', jsonError);
              const message = `Erreur inattendue (${response.status} ${response.statusText})`;
              setIsValidKey(false);
              return { isValid: false, message };
            }
          }
          
          // Si on arrive ici, la clé est valide
          const data = await response.json();
          console.log('[DEBUG] Données de validation OpenRouter:', data);
          console.log('[DEBUG] Clé API OpenRouter valide');
          setIsValidKey(true);
          return { isValid: true };
          
        } catch (error) {
          console.error('Erreur de vérification de la clé OpenRouter:', error);
          
          // En cas d'erreur réseau, on fournit un message d'erreur détaillé
          if (error.name === 'AbortError') {
            const message = 'La vérification a pris trop de temps. Vérifiez votre connexion internet.';
            console.warn(message);
            setIsValidKey(false);
            return { isValid: false, message };
          }
          
          const message = `Erreur lors de la vérification de la clé: ${error.message || 'Erreur inconnue'}`;
          setIsValidKey(false);
          return { isValid: false, message };
        }
      }
      
      setIsValidKey(isValid);
      return isValid;
    } catch (error) {
      console.error('Erreur lors de la validation de la clé API:', error);
      setIsValidKey(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Gérer le changement de fournisseur d'API
  const handleApiProviderChange = (provider: ApiProvider) => {
    setApiProvider(provider);
    setApiKey('');
    setIsValidKey(null);
  };

  // Gestionnaire de changement de clé API
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanedValue = e.target.value.trim().replace(/\s+/g, '');
    setApiKey(cleanedValue);
    setIsValidKey(null);
  };

  // Gestionnaire d'événement pour le blur de l'input
  const handleApiKeyBlur = async () => {
    if (apiKey) {
      const { isValid, message } = await validateApiKey(apiKey, apiProvider);
      if (!isValid && message) {
        // Afficher un message d'erreur à l'utilisateur
        // Vous pouvez utiliser un système de notifications ou un state pour afficher ce message
        console.warn('Erreur de validation de la clé API:', message);
      }
    }
  };

  // Bascher la visibilité de la clé API
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  // Sauvegarder les paramètres
  const saveSettings = async () => {
    // Valider la clé API si elle est fournie
    if (apiKey) {
      const { isValid, message } = await validateApiKey(apiKey, apiProvider);
      if (!isValid) {
        alert(`Erreur de clé API: ${message || 'Clé non valide'}`);
        return;
      }
    }

    const newSettings: SettingsData = {
      apiKey,
      apiProvider,
      language,
      fontSize,
      autoSave,
      notifications,
      darkMode
    };
    
    console.log('Sauvegarde des paramètres:', newSettings);
    
    try {
      // Sauvegarder dans le localStorage
      localStorage.setItem('promptCraftSettings', JSON.stringify(newSettings));
      console.log('Paramètres sauvegardés avec succès dans localStorage');
      
      // Mettre à jour l'état local
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Si l'utilisateur est sur l'onglet API et qu'il vient de sauvegarder une clé, basculer sur l'onglet Général
      if (activeTab === 'api' && apiKey) {
        setActiveTab('général');
      }
      
      // Appeler la fonction de sauvegarde du parent
      console.log('Appel de onSave avec les paramètres:', newSettings);
      onSave(newSettings);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      alert('Une erreur est survenue lors de la sauvegarde des paramètres.');
    }
  };

  // Réinitialiser les paramètres
  const resetSettings = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action est irréversible.')) {
      localStorage.removeItem('promptCraftSettings');
      setApiKey('');
      setApiProvider('openai');
      setLanguage('fr');
      setFontSize(14);
      setAutoSave(true);
      setNotifications(true);
      onDarkModeChange(true);
    }
  };

  // Gestionnaires d'événements pour les paramètres
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(parseInt(e.target.value, 10));
  };

  const handleDarkModeToggle = () => {
    onDarkModeChange(!darkMode);
  };

  const handleAutoSaveToggle = () => {
    setAutoSave(!autoSave);
  };

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
  };

  // Composant de section de paramètres
  const SettingSection: React.FC<{ 
    title: string; 
    description?: string | React.ReactNode; 
    children: React.ReactNode;
    className?: string;
  }> = ({
    title,
    description,
    children,
    className = ''
  }) => (
    <div className={`mb-8 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <div className="text-gray-400 text-sm mb-4">
          {typeof description === 'string' ? (
            <p>{description}</p>
          ) : (
            description
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );

  // Composant d'élément de paramètre
  const SettingItem: React.FC<{ 
    label: string; 
    description?: string; 
    children: React.ReactNode;
  }> = ({
    label,
    description,
    children,
  }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-gray-700">
      <div className="mb-2 md:mb-0 md:mr-4">
        <div className="font-medium text-white">{label}</div>
        {description && <div className="text-sm text-gray-400 mt-1">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  // Fonction pour afficher un onglet de navigation
  const renderTab = (id: string, label: string, icon: React.ReactNode) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
        activeTab === id
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="h-full w-full bg-gray-800 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Paramètres</h2>
          <div className="flex gap-2">
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiSave />
              Enregistrer
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <FiX size={20} />
              </button>
            )}
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-600 text-green-200 rounded-lg">
            Paramètres enregistrés avec succès !
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {renderTab('général', 'Général', <FiInfo />)}
          {renderTab('api', 'API', <FiKey />)}
          {renderTab('apparence', 'Apparence', <FiSun />)}
          {renderTab('avancé', 'Avancé', <FiChevronDown />)}
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          {activeTab === 'général' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Paramètres généraux</h3>
              
              <SettingSection title="Langue">
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </SettingSection>

              <SettingSection title="Sauvegarde automatique">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Activer la sauvegarde automatique</p>
                    <p className="text-sm text-gray-400">Enregistrer automatiquement les modifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={handleAutoSaveToggle}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </SettingSection>

              <SettingSection title="Notifications">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Activer les notifications</p>
                    <p className="text-sm text-gray-400">Recevoir des notifications pour les mises à jour</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={handleNotificationsToggle}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </SettingSection>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Paramètres API</h3>
              
              <SettingSection 
                title="Fournisseur d'API"
                description="Sélectionnez votre fournisseur d'API préféré pour générer des réponses."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => handleApiProviderChange('openai')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      apiProvider === 'openai'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h4 className="font-medium text-white">OpenAI</h4>
                        <p className="text-sm text-gray-400">API officielle d'OpenAI</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                        {apiProvider === 'openai' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleApiProviderChange('openrouter')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      apiProvider === 'openrouter'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h4 className="font-medium text-white">OpenRouter</h4>
                        <p className="text-sm text-gray-400">Accès à plusieurs modèles</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                        {apiProvider === 'openrouter' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </SettingSection>

              <SettingSection
                title={`Clé API ${apiProvider === 'openai' ? 'OpenAI' : 'OpenRouter'}`}
                description={
                  <>
                    <p className="mb-2">
                      Entrez votre clé API {apiProvider === 'openai' ? 'OpenAI' : 'OpenRouter'} pour activer les fonctionnalités avancées.
                    </p>
                    <p className="text-yellow-400 flex items-center gap-1">
                      <FiInfo size={14} />
                      Votre clé est stockée localement et n'est jamais envoyée à nos serveurs.
                    </p>
                  </>
                }
              >
                <div className="relative">
                  <div className="flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={handleApiKeyChange}
                      onBlur={handleApiKeyBlur}
                      placeholder={`Entrez votre clé API ${apiProvider === 'openai' ? 'OpenAI' : 'OpenRouter'}`}
                      className={`w-full p-3 pr-12 rounded-lg bg-gray-800 border ${
                        apiKey
                          ? isValidKey === true
                            ? 'border-green-500'
                            : isValidKey === false
                            ? 'border-red-500'
                            : 'border-gray-700'
                          : 'border-gray-700'
                      } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <div className="absolute right-2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={toggleApiKeyVisibility}
                        className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
                        aria-label={showApiKey ? 'Masquer la clé' : 'Afficher la clé'}
                      >
                        {showApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                      {isValidating && (
                        <div className="p-1.5">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                      {!isValidating && apiKey && isValidKey === true && (
                        <div className="p-1.5 text-green-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!isValidating && apiKey && isValidKey === false && (
                        <div className="p-1.5 text-red-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    {apiProvider === 'openai' ? (
                      <p>Votre clé API OpenAI commence par <code className="bg-gray-800 px-1 py-0.5 rounded">sk-</code> et fait 32 ou 51 caractères.</p>
                    ) : (
                      <p>Votre clé API OpenRouter commence par <code className="bg-gray-800 px-1 py-0.5 rounded">sk-or-</code>.</p>
                    )}
                    <p className="mt-1">
                      <a
                        href={apiProvider === 'openai' ? 'https://platform.openai.com/account/api-keys' : 'https://openrouter.ai/keys'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Obtenir une clé API {apiProvider === 'openai' ? 'OpenAI' : 'OpenRouter'}
                      </a>
                    </p>
                  </div>
                </div>
              </SettingSection>

              <div className="mt-8 pt-6 border-t border-gray-800">
                <h4 className="text-md font-medium text-white mb-3">Aide et support</h4>
                <div className="space-y-3 text-sm text-gray-400">
                  <p>
                    Besoin d'aide pour configurer votre clé API ? Consultez notre{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                      guide d'installation
                    </a>
                    .
                  </p>
                  <p>
                    Pour des questions ou des problèmes, contactez notre{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                      support technique
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apparence' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Apparence</h3>
              
              <SettingSection title="Thème">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Mode sombre</p>
                    <p className="text-sm text-gray-400">Activer/désactiver le mode sombre</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={handleDarkModeToggle}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </SettingSection>

              <SettingSection 
                title="Taille de police"
                description="Ajustez la taille de police pour une meilleure lisibilité."
              >
                <div className="px-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>Petit</span>
                    <span>Grand</span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-center" style={{ fontSize: `${fontSize}px` }}>
                      Exemple de texte avec cette taille de police
                    </p>
                  </div>
                </div>
              </SettingSection>
            </div>
          )}

          {activeTab === 'avancé' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Paramètres avancés</h3>
              
              <SettingSection 
                title="Réinitialisation"
                description="Réinitialisez tous les paramètres aux valeurs par défaut. Cette action est irréversible."
              >
                <button
                  onClick={resetSettings}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Réinitialiser tous les paramètres
                </button>
              </SettingSection>

              <SettingSection 
                title="Informations de débogage"
                className="border-t border-gray-800 pt-6 mt-6"
              >
                <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-gray-300">
                    {JSON.stringify(
                      {
                        version: '1.0.0',
                        environment: process.env.NODE_ENV,
                        settings: {
                          apiProvider,
                          language,
                          darkMode,
                          autoSave,
                          notifications,
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </SettingSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
