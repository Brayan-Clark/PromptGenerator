import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ApiProvider } from '../types';
import { 
  Send, 
  Menu, 
  X, 
  Copy, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronDown, 
  ChevronUp, 
  Info,
  MessageCircle,
  Send as FiSend,
  Copy as FiCopy,
  RefreshCw as FiRefreshCw,
  ThumbsUp as FiThumbsUp,
  ThumbsDown as FiThumbsDown,
  ChevronDown as FiChevronDown,
  ChevronUp as FiChevronUp,
  Info as FiInfo,
  MessageCircle as FiMessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces for TypeScript
interface AIModelSuggestion {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  strength: number; // 1-5
  feedback?: 'positive' | 'negative';
  modelSuggestions?: AIModelSuggestion[];
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  feedback?: 'positive' | 'negative' | null;
  modelSuggestions?: AIModelSuggestion[];
  conversationId: string;
}

interface Conversation {
  id: string;
  title: string;
  lastUpdated: Date;
  messageCount: number;
}

interface AIAssistantProps {
  onClose: () => void;
  onModelSelect?: (model: { name: string; description: string }) => void;
  name: string;
  description: string;
  apiKey?: string;
  apiProvider?: 'openai' | 'openrouter';
}

// Clés pour le localStorage
const CONVERSATIONS_KEY = 'aiAssistant_conversations';
const ACTIVE_CONVERSATION_KEY = 'aiAssistant_activeConversation';
const MESSAGES_KEY_PREFIX = 'aiAssistant_messages_';

// Fonction utilitaire pour charger depuis le localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    console.log(`Chargement de la clé ${key}:`, item);
    const result = item ? JSON.parse(item) : defaultValue;
    console.log(`Valeur parsée pour ${key}:`, result);
    return result;
  } catch (error) {
    console.error('Erreur lors du chargement depuis le localStorage:', error);
    return defaultValue;
  }
};

// Hook personnalisé pour gérer les conversations
const useConversationManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => 
    loadFromLocalStorage<Conversation[]>(CONVERSATIONS_KEY, [])
  );
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => 
    loadFromLocalStorage<string | null>(ACTIVE_CONVERSATION_KEY, null)
  );
  
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const activeId = loadFromLocalStorage<string | null>(ACTIVE_CONVERSATION_KEY, null);
      if (!activeId) return [];
      
      const savedMessages = loadFromLocalStorage<Message[]>(`${MESSAGES_KEY_PREFIX}${activeId}`, []);
      //console.log('Chargement des messages pour', activeId, ':', savedMessages);
      
      // S'assurer que les timestamps sont des objets Date
      return savedMessages.map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
      }));
    } catch (error) {
      //console.error('Erreur lors du chargement des messages:', error);
      return [];
    }
  });

  // Sauvegarder dans le localStorage
  const saveToLocalStorage = useCallback(<T,>(key: string, value: T) => {
    console.log(`Sauvegarde dans ${key}:`, value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Vérifier que la sauvegarde a fonctionné
      const savedValue = localStorage.getItem(key);
      //console.log(`Vérification de la sauvegarde pour ${key}:`, savedValue);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans le localStorage:', error);
    }
  }, []);

  // Fonction utilitaire pour sauvegarder dans le localStorage
  const saveToLocalStorageGlobal = <T,>(key: string, value: T) => {
    saveToLocalStorage(key, value);
  };

  const createNewConversation = useCallback((): string => {
    const newId = `conv_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'Nouvelle conversation',
      lastUpdated: new Date(),
      messageCount: 0
    };
    
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    saveToLocalStorage(CONVERSATIONS_KEY, updatedConversations);
    
    setActiveConversationId(newId);
    saveToLocalStorage(ACTIVE_CONVERSATION_KEY, newId);
    
    setMessages([]);
    saveToLocalStorage(`${MESSAGES_KEY_PREFIX}${newId}`, []);
    
    return newId;
  }, [conversations, saveToLocalStorage]);

  const loadConversation = useCallback((conversationId: string) => {
    try {
      //console.log(`Chargement de la conversation: ${conversationId}`);
      
      // Mettre à jour l'ID de la conversation active
      setActiveConversationId(conversationId);
      saveToLocalStorage(ACTIVE_CONVERSATION_KEY, conversationId);
      
      // Charger les messages de la conversation
      const messagesKey = `${MESSAGES_KEY_PREFIX}${conversationId}`;
      const savedMessages = loadFromLocalStorage<Message[]>(messagesKey, []);
      console.log(`Messages chargés pour ${conversationId}:`, savedMessages);
      
      // S'assurer que les messages sont dans le bon format
      const formattedMessages = savedMessages.map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
        // S'assurer que les autres champs optionnels sont définis
        feedback: msg.feedback || null,
        modelSuggestions: msg.modelSuggestions || []
      }));
      
      setMessages(formattedMessages);
      return formattedMessages;
    } catch (error) {
      console.error(`Erreur lors du chargement de la conversation ${conversationId}:`, error);
      setMessages([]);
      return [];
    }
  }, [saveToLocalStorage]);

  const deleteConversation = useCallback((conversationId: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    setConversations(updatedConversations);
    saveToLocalStorage(CONVERSATIONS_KEY, updatedConversations);
    
    // Supprimer les messages de la conversation
    localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${conversationId}`);
    
    if (activeConversationId === conversationId) {
      const nextConversation = updatedConversations[0];
      if (nextConversation) {
        loadConversation(nextConversation.id);
      } else {
        createNewConversation();
      }
    }
  }, [activeConversationId, conversations, createNewConversation, loadConversation]);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, title, lastUpdated: new Date() }
        : conv
    );
    setConversations(updatedConversations);
    saveToLocalStorage(CONVERSATIONS_KEY, updatedConversations);
  }, [conversations, saveToLocalStorage]);

  const saveMessages = useCallback((conversationId: string, messagesToSave: Message[]) => {
    try {
      // console.log('Sauvegarde des messages pour', conversationId, ':', messagesToSave);
      
      // Sauvegarder les messages dans le state
      setMessages(messagesToSave);
      
      // Sauvegarder dans le localStorage
      const messagesKey = `${MESSAGES_KEY_PREFIX}${conversationId}`;
      saveToLocalStorage(messagesKey, messagesToSave);
      
      // Mettre à jour les métadonnées de la conversation
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                lastUpdated: new Date(), 
                messageCount: messagesToSave.length 
              }
            : conv
        );
        // Sauvegarder la liste mise à jour des conversations
        saveToLocalStorage(CONVERSATIONS_KEY, updated);
        return updated;
      });
      
      console.log('Messages sauvegardés avec succès pour', conversationId);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des messages:', error);
    }
  }, [saveToLocalStorage]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp' | 'conversationId'>) => {
    if (!activeConversationId) return;
    
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date(),
      conversationId: activeConversationId
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveToLocalStorage(`${MESSAGES_KEY_PREFIX}${activeConversationId}`, updatedMessages);
    
    // Mettre à jour le compteur de messages et la date de dernière mise à jour
    const updatedConversations = conversations.map(conv => 
      conv.id === activeConversationId 
        ? { 
            ...conv, 
            lastUpdated: new Date(),
            messageCount: conv.messageCount + 1 
          } 
        : conv
    );
    
    setConversations(updatedConversations);
    saveToLocalStorage(CONVERSATIONS_KEY, updatedConversations);
  }, [activeConversationId, conversations, messages, saveToLocalStorage]);

  return {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    createNewConversation,
    loadConversation,
    deleteConversation,
    updateConversationTitle,
    saveMessages
  };
};

// Les interfaces ont été déplacées en haut du fichier

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  onClose, 
  name, 
  description, 
  apiKey, 
  apiProvider = 'openai',
  onModelSelect 
}) => {
  // State management using custom hook
  const {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    createNewConversation,
    loadConversation,
    deleteConversation,
    updateConversationTitle,
    saveMessages
  } = useConversationManager();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showConversationList, setShowConversationList] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState<{[key: string]: boolean}>({});
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error' | 'simulation'>('checking');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  
  // Vérifier le statut de l'API en fonction du fournisseur
  const checkApiStatus = useCallback(async () => {
    if (!apiKey) {
      setApiStatus('simulation');
      setIsApiKeyValid(false);
      return;
    }

    try {
      // Configuration de base pour la requête
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      // Configuration spécifique pour OpenRouter
      if (apiProvider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.href;
        headers['X-Title'] = 'PromptCraft AI Assistant';
      }

      // URL de l'API en fonction du fournisseur
      const apiUrl = apiProvider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/auth/key'
        : 'https://api.openai.com/v1/models';

      // Méthode de requête (GET pour OpenRouter, GET pour OpenAI)
      const method = apiProvider === 'openrouter' ? 'GET' : 'GET';

      const response = await fetch(apiUrl, {
        method,
        headers
      });
      
      if (response.ok) {
        setApiStatus('connected');
        setIsApiKeyValid(true);
      } else {
        console.error('Erreur API:', await response.text());
        setApiStatus('error');
        setIsApiKeyValid(false);
      }
    } catch (error) {
      console.error('Erreur de connexion à l\'API:', error);
      setApiStatus('error');
      setIsApiKeyValid(false);
    }
  }, [apiKey]);
  
  // Vérifier le statut de l'API au chargement et quand la clé change
  useEffect(() => {
    checkApiStatus();
  }, [checkApiStatus]);

  // Initialisation au chargement du composant
  useEffect(() => {
    //console.log('Initialisation du composant AIAssistant');
    
    const initialize = async () => {
      //console.log('Début de l\'initialisation...');
      // Vérifier si le localStorage est disponible
      const isLocalStorageAvailable = (() => {
        try {
          const testKey = '__test__';
          localStorage.setItem(testKey, testKey);
          localStorage.removeItem(testKey);
          return true;
        } catch (e) {
          console.error('localStorage non disponible:', e);
          return false;
        }
      })();
      
      //console.log('localStorage disponible:', isLocalStorageAvailable);
      
      if (!isLocalStorageAvailable) {
        console.error('Impossible d\'accéder au localStorage. Les conversations ne seront pas sauvegardées.');
        return;
      }
      
      // Charger les conversations
      const loadedConversations = loadFromLocalStorage<Conversation[]>(CONVERSATIONS_KEY, []);
      //console.log('Conversations chargées:', loadedConversations);
      
      if (loadedConversations.length === 0) {
        console.log('Aucune conversation trouvée, création d\'une nouvelle conversation');
        createNewConversation();
      } else {
        // Mettre à jour l'état des conversations
        setConversations(loadedConversations);
        
        // Charger la dernière conversation active
        const lastActiveId = loadFromLocalStorage<string | null>(ACTIVE_CONVERSATION_KEY, null);
        console.log('Dernière conversation active:', lastActiveId);
        
        if (lastActiveId && loadedConversations.some(c => c.id === lastActiveId)) {
          console.log('Chargement de la conversation active:', lastActiveId);
          await loadConversation(lastActiveId);
        } else if (loadedConversations.length > 0) {
          console.log('Chargement de la première conversation disponible');
          await loadConversation(loadedConversations[0].id);
        }
      }
    };
    
    initialize();
  }, []);

  // Wrap deleteConversation to handle the event properly
  const handleDeleteConversation = useCallback((e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      deleteConversation(conversationId);
    }
  }, [deleteConversation]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !activeConversationId) return;

    // Créer le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date(),
      conversationId: activeConversationId
    };

    // Mettre à jour les messages avec le message utilisateur
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(activeConversationId, updatedMessages);
    
    // Mettre à jour le titre de la conversation si c'est le premier message
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage) {
      const title = input.trim().substring(0, 30) + (input.trim().length > 30 ? '...' : '');
      updateConversationTitle(activeConversationId, title);
    }
    
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Vérifier la connexion internet avant d'envoyer la requête
      if (!navigator.onLine) {
        throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion et réessayer.');
      }

      // Vérifier que la clé API est définie
      if (!apiKey) {
        throw new Error('Aucune clé API configurée. Veuillez configurer une clé API dans les paramètres.');
      }

      // Générer une réponse de l'IA avec un timeout
      const response = await Promise.race([
        fetchAIResponse(input.trim()),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('La requête a pris trop de temps. Veuillez réessayer.')), 30000)
        )
      ]);
      
      // Générer des suggestions de modèles d'IA uniquement pour le premier message
      const modelSuggestions = isFirstMessage ? generateModelSuggestions(input.trim()) : [];
      
      // Créer le message de l'assistant
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date(),
        conversationId: activeConversationId,
        modelSuggestions: modelSuggestions
      };
      
      // Déplier les suggestions si elles existent
      if (modelSuggestions.length > 0) {
        setExpandedSuggestions(prev => ({
          ...prev,
          [assistantMessage.id]: true
        }));
      }

      // Mettre à jour les messages avec la réponse de l'assistant
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(activeConversationId, finalMessages);
      
    } catch (err) {
      console.error('Error getting AI response:', err);
      
      // Déterminer le message d'erreur approprié en fonction du type d'erreur
      let errorMessage = 'Désolé, une erreur est survenue. Veuillez réessayer.';
      
      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Erreur d\'authentification. Votre clé API est peut-être invalide ou expirée.';
        } else if (err.message.includes('429')) {
          errorMessage = 'Limite de requêtes dépassée. Veuillez patienter avant de réessayer ou mettez à jour votre abonnement.';
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Impossible de se connecter au service. Vérifiez votre connexion Internet.';
        } else if (err.message.includes('timeout') || err.message.includes('trop de temps')) {
          errorMessage = 'La requête a pris trop de temps. Vérifiez votre connexion Internet ou réessayez plus tard.';
        } else {
          // Utiliser le message d'erreur original s'il est pertinent
          errorMessage = err.message || errorMessage;
        }
      }
      
      console.log('Message d\'erreur affiché à l\'utilisateur:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update messages in memory and storage using the saveMessages function from the hook
  const updateConversationMessages = useCallback((conversationId: string, messagesToSave: Message[]) => {
    saveMessages(conversationId, messagesToSave);
  }, [saveMessages]);
  
  // Générer des suggestions de modèles d'IA en fonction du contenu du message
  const generateModelSuggestions = (message: string): AIModelSuggestion[] => {
    const lowerMessage = message.toLowerCase();
    
    // Liste des modèles d'IA avec leurs caractéristiques
    const allModels: AIModelSuggestion[] = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Le modèle le plus avancé d\'OpenAI, idéal pour des tâches complexes et créatives.',
        bestFor: ['Création de contenu', 'Analyse complexe', 'Rédaction avancée', 'Programmation'],
        strength: 5
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Modèle haute performance d\'Anthropic, excellent pour la compréhension et la génération de texte long.',
        bestFor: ['Rédaction longue', 'Analyse détaillée', 'Résumé de documents', 'Raisonnement complexe'],
        strength: 5
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Modèle polyvalent de Google, particulièrement efficace pour les tâches multimodales.',
        bestFor: ['Tâches multimodales', 'Recherche', 'Analyse de données', 'Génération de code'],
        strength: 4
      },
      {
        id: 'llama-3',
        name: 'Llama 3',
        description: 'Modèle open-source de Meta, idéal pour un usage local ou des cas nécessitant de la confidentialité.',
        bestFor: ['Confidentialité', 'Usage local', 'Expérimentation', 'Personnalisation'],
        strength: 4
      }
    ];
    
    // Détecter le type de tâche
    let taskType = 'général';
    const taskKeywords = {
      'création': ['créer', 'écrire', 'rédiger', 'générer', 'inventer'],
      'analyse': ['analyser', 'comprendre', 'expliquer', 'que penses-tu de', 'avis sur'],
      'code': ['coder', 'programmer', 'bug', 'erreur', 'fonction', 'script'],
      'recherche': ['rechercher', 'trouver', 'informations sur', 'qu\'est-ce que']
    };
    
    // Déterminer le type de tâche
    for (const [type, keywords] of Object.entries(taskKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        taskType = type;
        break;
      }
    }
    
    // Trier les modèles par pertinence pour la tâche
    return [...allModels].sort((a, b) => {
      // Les modèles avec une force plus élevée d'abord
      if (b.strength !== a.strength) {
        return b.strength - a.strength;
      }
      
      // Ensuite, ceux qui sont les mieux adaptés à la tâche
      const aIsBestForTask = a.bestFor.some(domain => 
        lowerMessage.includes(domain.toLowerCase())
      );
      const bIsBestForTask = b.bestFor.some(domain => 
        lowerMessage.includes(domain.toLowerCase())
      );
      
      if (aIsBestForTask && !bIsBestForTask) return -1;
      if (!aIsBestForTask && bIsBestForTask) return 1;
      
      return 0;
    });
  };

  // Liste des modèles disponibles par fournisseur
  const availableModels = useMemo(() => ({
    openai: [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', freeTier: true },
      { id: 'gpt-4', name: 'GPT-4', freeTier: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', freeTier: false }
    ],
    openrouter: [
      { id: 'openai/gpt-3.5-turbo', name: 'OpenAI GPT-3.5 Turbo', freeTier: true },
      { id: 'openai/gpt-4', name: 'OpenAI GPT-4', freeTier: false },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', freeTier: true },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', freeTier: false }
    ]
  }), []);  

  // État pour le modèle sélectionné
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Définir le modèle par défaut (gratuit) au chargement
  useEffect(() => {
    if (apiProvider) {
      const freeModel = availableModels[apiProvider].find(m => m.freeTier);
      if (freeModel) {
        setSelectedModel(freeModel.id);
      }
    }
  }, [apiProvider, availableModels]);

  // Fonction pour obtenir une réponse de l'IA avec gestion d'erreur détaillée
  const fetchAIResponse = useCallback(async (message: string): Promise<string> => {
    // If no API key is provided, use simulation mode
    if (!apiKey) {
      setApiStatus('simulation');
      return new Promise((resolve) => {
        setTimeout(() => {
          const lowerMessage = message.toLowerCase();
          
          if (lowerMessage.includes('comment créer') || lowerMessage.includes('comment faire')) {
            const promptTips = [
              "Pour créer un bon prompt, suivez ces étapes :\n1. Soyez précis dans votre demande\n2. Incluez le contexte nécessaire\n3. Spécifiez le format de réponse souhaité\n4. Indiquez le ton ou le style désiré\n\nExemple : 'Rédige un article de blog de 500 mots sur les énergies renouvelables, avec un ton informatif et des sous-titres.'",
              "La clé d'un bon prompt est la spécificité. Au lieu de dire 'parle-moi de l'histoire', essayez 'Raconte-moi les événements clés de la Révolution française entre 1789 et 1799, en mettant l'accent sur les causes économiques.'"
            ];
            resolve(promptTips[Math.floor(Math.random() * promptTips.length)]);
          } else {
            const defaultResponses = [
              `Je vais vous aider avec votre demande : "${message}". Pour des résultats optimaux, pourriez-vous préciser si vous souhaitez une réponse courte ou détaillée, et dans quel format ?`,
              `Merci pour votre message : "${message}". Pour vous fournir la meilleure assistance possible, pourriez-vous me dire quel est l'objectif principal de ce prompt ?`,
              `Je comprends que vous cherchez à : "${message}". Pour vous aider au mieux, pourriez-vous préciser le public cible et l'utilisation prévue de cette réponse ?`
            ];
            resolve(defaultResponses[Math.floor(Math.random() * defaultResponses.length)]);
          }
        }, 1000);
      });
    }

    // Use the actual API with the provided key and provider
    const provider: ApiProvider = apiProvider || 'openai'; // Par défaut à OpenAI
    
    try {
      // Déterminer le modèle en fonction du fournisseur
      const defaultModels = {
        openai: 'gpt-3.5-turbo',  // Modèle par défaut pour OpenAI
        openrouter: 'openai/gpt-3.5-turbo'  // Modèle par défaut pour OpenRouter
      };

      // Configuration de base pour la requête
      const requestConfig = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(provider === 'openrouter' && {
            'HTTP-Referer': window.location.origin || 'http://localhost:3000',
            'X-Title': 'PromptCraft AI Assistant'
          })
        },
        body: JSON.stringify({
          model: defaultModels[provider], // Utilise le modèle par défaut selon le fournisseur
          messages: [
            {
              role: 'system',
              content: 'Vous êtes un assistant IA utile qui aide les utilisateurs à formuler des prompts efficaces. Répondez de manière claire et concise.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      };
      
      console.log('Configuration de la requête:', {
        provider,
        model: selectedModel || defaultModels[provider],
        url: provider === 'openrouter' 
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions'
      });

      // URL de l'API en fonction du fournisseur
      const apiUrl = provider === 'openrouter' 
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      // Appel à l'API
      const response = await fetch(apiUrl, requestConfig);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          provider,
          apiUrl
        });
        
        // Message d'erreur plus détaillé
        let errorMessage = `Erreur ${response.status} lors de la communication avec ${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}`;
        if (errorData?.error?.message) {
          errorMessage += `: ${errorData.error.message}`;
        } else if (response.status === 401) {
          errorMessage += ': Clé API non valide ou expirée. Veuillez vérifier vos paramètres.';
        } else if (response.status === 429) {
          errorMessage += ': Limite de requêtes dépassée. Veuillez réessayer plus tard.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setApiStatus('connected');
      return data.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';
    } catch (error) {
      console.error('Erreur API:', error);
      setApiStatus('error');
      throw new Error(`Désolé, une erreur est survenue avec le service d'IA (${provider}). ${error instanceof Error ? error.message : ''}`);
    }
  }, [apiKey, apiProvider]);

  const handleCopyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
    // In a real app, you might want to show a toast notification here
  }, []);

  const handleRegenerate = useCallback(async (messageId: string) => {
    const messageToRegenerate = messages.find(m => m.id === messageId);
    if (!messageToRegenerate || messageToRegenerate.sender === 'user' || !activeConversationId) return;
    
    const previousMessages = messages.slice(0, messages.findIndex(m => m.id === messageId));
    const userMessage = [...previousMessages].reverse().find(m => m.sender === 'user');
    
    if (userMessage) {
      setIsLoading(true);
      setError(null);
      
      try {
        const newResponse = await fetchAIResponse(userMessage.content);
        
        const updatedMessages = messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newResponse, feedback: null } 
            : msg
        );
        
        setMessages(updatedMessages);
        saveMessages(activeConversationId, updatedMessages);
      } catch (err) {
        console.error('Error regenerating response:', err);
        setError('Erreur lors de la régénération de la réponse.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [messages, activeConversationId, fetchAIResponse, saveMessages]);

  const handleFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    if (!activeConversationId) return;
    
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    );
    
    setMessages(updatedMessages);
    saveMessages(activeConversationId, updatedMessages);
    
    // In a real app, you would send this feedback to your backend
    console.log(`Feedback ${feedback} for message ${messageId}`);
  }, [messages, activeConversationId, saveMessages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fonction pour formater la date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const toggleSuggestions = (messageId: string) => {
    setExpandedSuggestions(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Afficher le statut de l'API
  const renderApiStatus = () => {
    let statusText = '';
    let statusBg = '';
    
    switch (apiStatus) {
      case 'connected':
        statusText = 'Connecté à l\'API';
        statusBg = 'bg-green-500/20 text-green-400';
        break;
      case 'error':
        statusText = 'Erreur de connexion';
        statusBg = 'bg-red-500/20 text-red-400';
        break;
      case 'simulation':
        statusText = 'Mode simulation';
        statusBg = 'bg-yellow-500/20 text-yellow-400';
        break;
      default:
        statusText = 'Vérification...';
        statusBg = 'bg-gray-500/20 text-gray-400';
    }
    
    return (
      <div className={`px-2 py-1 rounded-md text-xs font-medium ${statusBg} flex items-center`}>
        <span className="w-2 h-2 rounded-full mr-1.5" />
        {statusText}
      </div>
    );
  };
  
  // Memoized conversation title
  const currentConversationTitle = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId)?.title || 'Nouvelle conversation';
  }, [conversations, activeConversationId]);

  // Rendu du statut de l'API dans l'interface
  const renderApiStatusBadge = () => (
    <div className="fixed bottom-4 right-4 z-10">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${
            apiStatus === 'connected' ? 'bg-green-500' :
            apiStatus === 'error' ? 'bg-red-500' :
            apiStatus === 'simulation' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`} />
          <span className="text-xs font-medium">
            {apiStatus === 'connected' ? 'Connecté à OpenAI' :
             apiStatus === 'error' ? 'Erreur de connexion' :
             apiStatus === 'simulation' ? 'Mode simulation' :
             'Vérification...'}
          </span>
        </div>
      </div>
    </div>
  );

  // Rendu d'une suggestion de modèle
  const renderModelSuggestion = (suggestion: AIModelSuggestion) => {
    return (
      <div 
        key={suggestion.id}
        className="p-3 bg-gray-600/50 rounded-lg mb-2 cursor-pointer hover:bg-gray-500/50 transition-colors"
        onClick={() => {
          if (props.onModelSelect) {
            props.onModelSelect({
              name: suggestion.name,
              description: suggestion.description
            });
          }
        }}
      >
        <div className="font-medium text-white">{suggestion.name}</div>
        <div className="text-sm text-gray-300">{suggestion.description}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {suggestion.bestFor.map((tag, i) => (
            <span key={i} className="text-xs bg-gray-500/30 text-gray-200 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Rendu du message avec indicateur de simulation si nécessaire
  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    const isSimulated = !isApiKeyValid && !isUser;
    const showSuggestions = !isUser && message.modelSuggestions && message.modelSuggestions.length > 0;
    const isExpanded = showSuggestions ? expandedSuggestions[message.id] : false;
    
    return (
      <div key={message.id} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}
        >
          <div 
            className={`p-3 rounded-lg max-w-[80%] ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-100 relative'
            }`}
          >
            {isSimulated && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded-full">
                Simulation
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs opacity-70">
                {formatTime(message.timestamp)}
              </div>
              {showSuggestions && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSuggestions(message.id);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 ml-2"
                >
                  {isExpanded ? 'Masquer les modèles' : 'Afficher les modèles'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
        
        {showSuggestions && isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%] mt-1`}
          >
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Modèles d'IA recommandés :</h4>
              <div className="space-y-2">
                {message.modelSuggestions?.map(renderModelSuggestion)}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Rendu du composant principal
  return (
    <div className="flex flex-col h-[96vh] bg-gray-900 text-white rounded-lg">
      {/* En-tête */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowConversationList(!showConversationList)}
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700 transition-colors"
            aria-label="Afficher les conversations"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{name}</h1>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
          {/* <div className="hidden md:block">
            {renderApiStatus()}
          </div> */}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={createNewConversation}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Nouvelle conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Fermer l'assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Liste des conversations */}
        <AnimatePresence>
          {showConversationList && (
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-gray-800 border-r border-gray-700 z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Conversations</h2>
                  <button
                    onClick={() => setShowConversationList(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={createNewConversation}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Nouvelle conversation</span>
                </button>
              </div>
              
              {/* Sélecteur de modèle */}
              <div className="p-4 border-b border-gray-700">
                <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-2">
                  Modèle IA
                </label>
                <div className="relative">
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  >
                    {apiProvider && availableModels[apiProvider]?.map((model) => (
                      <option 
                        key={model.id} 
                        value={model.id}
                        className={`${model.freeTier ? 'text-green-300' : 'text-yellow-300'}`}
                      >
                        {model.name} {model.freeTier ? '(Gratuit)' : '(Premium)'}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedModel && (
                  <div className="mt-2 text-xs text-gray-400">
                    {availableModels[apiProvider || 'openai'].find(m => m.id === selectedModel)?.description}
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-700">
                {conversations.map(conversation => (
                  <div 
                    key={conversation.id}
                    onClick={() => {
                      loadConversation(conversation.id);
                      setShowConversationList(false);
                    }}
                    className={`p-4 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      activeConversationId === conversation.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm text-white truncate">
                        {conversation.title}
                      </h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(e, conversation.id);
                        }}
                        className="text-gray-400 hover:text-red-400 p-1 -mr-2"
                        aria-label={`Supprimer la conversation ${conversation.title}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(conversation.lastUpdated)} • {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Comment puis-je vous aider ?</h3>
              <p className="max-w-md mb-6">{description || 'Posez-moi des questions sur la création de prompts ou demandez des suggestions pour améliorer vos idées.'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  'Explique-moi ce qu\'est un bon prompt',
                  'Donne-moi un exemple de prompt pour générer une image',
                  'Comment améliorer la créativité de mes prompts ?',
                  'Quelles sont les meilleures pratiques pour les prompts ?'
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => renderMessage(message))}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-white"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Zone de saisie */}
        <div className="border-t border-gray-700 p-4 bg-gray-800">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative"
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Tapez votre message..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`absolute right-2 bottom-2 p-1.5 rounded-full ${
                  isLoading || !input.trim() 
                    ? 'text-gray-500' 
                    : 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                } transition-colors`}
                aria-label="Envoyer le message"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Appuyez sur Entrée pour envoyer</span>
              </div>
              <div className="md:hidden">
                {renderApiStatus()}
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Badge de statut de l'API */}
      {renderApiStatusBadge()}
      
      {/* Overlay pour fermer la liste des conversations */}
      <AnimatePresence>
        {showConversationList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConversationList(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistant;
