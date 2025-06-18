import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

// Interfaces
interface AIModelSuggestion {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  strength: number;
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
  apiKey?: string;
}

// Constants
const STORAGE_KEYS = {
  CONVERSATIONS: 'aiAssistant_conversations',
  ACTIVE_CONVERSATION: 'aiAssistant_activeConversation',
  MESSAGES_PREFIX: 'aiAssistant_messages_'
} as const;

// Utility functions
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    console.log(`Loading key ${key}:`, item);
    const result = item ? JSON.parse(item) : defaultValue;
    console.log(`Parsed value for ${key}:`, result);
    return result;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    console.log(`Saving to ${key}:`, value);
    localStorage.setItem(key, JSON.stringify(value));
    const savedValue = localStorage.getItem(key);
    console.log(`Verification for ${key}:`, savedValue);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Custom hook for conversation management
const useConversationManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => 
    loadFromLocalStorage(STORAGE_KEYS.CONVERSATIONS, [] as Conversation[])
  );
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => 
    loadFromLocalStorage(STORAGE_KEYS.ACTIVE_CONVERSATION, null)
  );
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const activeId = loadFromLocalStorage(STORAGE_KEYS.ACTIVE_CONVERSATION, null);
    return activeId 
      ? loadFromLocalStorage(`${STORAGE_KEYS.MESSAGES_PREFIX}${activeId}`, [] as Message[])
      : [];
  });

  // Save conversations to localStorage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveToLocalStorage(STORAGE_KEYS.CONVERSATIONS, conversations);
    }
  }, [conversations]);

  // Save active conversation ID to localStorage when it changes
  useEffect(() => {
    if (activeConversationId) {
      saveToLocalStorage(STORAGE_KEYS.ACTIVE_CONVERSATION, activeConversationId);
    }
  }, [activeConversationId]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      saveToLocalStorage(
        `${STORAGE_KEYS.MESSAGES_PREFIX}${activeConversationId}`, 
        messages
      );
    }
  }, [messages, activeConversationId]);

  const createNewConversation = useCallback((): string => {
    const newId = `conv_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'New conversation',
      lastUpdated: new Date(),
      messageCount: 0
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
    setMessages([]);
    
    return newId;
  }, []);

  const loadConversation = useCallback((conversationId: string) => {
    console.log(`Loading conversation: ${conversationId}`);
    setActiveConversationId(conversationId);
    
    const savedMessages = loadFromLocalStorage<Message[]>(
      `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`, 
      []
    );
    
    const formattedMessages = savedMessages.map(msg => ({
      ...msg,
      timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
    }));
    
    setMessages(formattedMessages);
    return formattedMessages;
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== conversationId);
      saveToLocalStorage(STORAGE_KEYS.CONVERSATIONS, updated);
      return updated;
    });
    
    localStorage.removeItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`);
    
    if (activeConversationId === conversationId) {
      const nextConversation = conversations.find(conv => conv.id !== conversationId);
      if (nextConversation) {
        loadConversation(nextConversation.id);
      } else {
        createNewConversation();
      }
    }
  }, [activeConversationId, conversations, createNewConversation, loadConversation]);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title, lastUpdated: new Date() }
          : conv
      )
    );
  }, []);

  const saveMessages = useCallback((conversationId: string, messagesToSave: Message[]) => {
    setMessages(messagesToSave);
    
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId
          ? { 
              ...conv, 
              lastUpdated: new Date(),
              messageCount: messagesToSave.length 
            }
          : conv
      )
    );
  }, []);

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

// Main component
const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, apiKey }) => {
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
  
  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      console.log('Initializing AIAssistant...');
      
      // Check if localStorage is available
      const isLocalStorageAvailable = (() => {
        try {
          const testKey = '__test__';
          localStorage.setItem(testKey, testKey);
          localStorage.removeItem(testKey);
          return true;
        } catch (e) {
          console.error('localStorage is not available:', e);
          return false;
        }
      })();
      
      if (!isLocalStorageAvailable) {
        console.error('Cannot access localStorage. Conversations will not be saved.');
        return;
      }
      
      // Load conversations
      const loadedConversations = loadFromLocalStorage<Conversation[]>(
        STORAGE_KEYS.CONVERSATIONS, 
        []
      );
      
      if (loadedConversations.length === 0) {
        console.log('No conversations found, creating a new one');
        createNewConversation();
      } else {
        console.log('Loaded conversations:', loadedConversations);
        setConversations(loadedConversations);
        
        // Load active conversation
        const lastActiveId = loadFromLocalStorage<string | null>(
          STORAGE_KEYS.ACTIVE_CONVERSATION, 
          null
        );
        
        if (lastActiveId && loadedConversations.some(c => c.id === lastActiveId)) {
          console.log('Loading active conversation:', lastActiveId);
          await loadConversation(lastActiveId);
        } else if (loadedConversations.length > 0) {
          console.log('Loading first available conversation');
          await loadConversation(loadedConversations[0].id);
        }
      }
    };
    
    initialize();
  }, [createNewConversation, loadConversation]);

  // Rest of the component implementation...
  
  return (
    <div className="ai-assistant">
      {/* Component JSX */}
      <div className="conversation-container">
        {/* Conversation list and messages */}
      </div>
    </div>
  );
};

export default AIAssistant;
