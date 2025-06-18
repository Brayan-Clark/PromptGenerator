export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  model?: string;
  isPublic?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  isOfficial: boolean;
}

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  category: string;
  tags: string[];
  isOfficial: boolean;
}

export type ApiProvider = 'openai' | 'openrouter';

export interface Settings {
  language: string;
  defaultModel: string;
  defaultTemperature: number;
  maxTokens: number;
  apiKey?: string;
  apiProvider?: ApiProvider;
  suggest: {
    filterGraceful: boolean;
    hideConstants: boolean;
    insertMode: 'insert' | 'replace';
    insertTextMode: 'asIs' | 'withIndent' | 'withIndentation';
    localityBonus: boolean;
    maxVisibleSuggestions: number;
    shareSuggestSelections: boolean;
    showClasses: boolean;
    showColors: boolean;
    showConstructors: boolean;
    showDeprecated: boolean;
    showEnumMembers: boolean;
    showEvents: boolean;
    showFields: boolean;
    showFiles: boolean;
    showFolders: boolean;
    showFunctions: boolean;
    showInterfaces: boolean;
    showIssues: boolean;
    showKeywords: boolean;
    showMethods: boolean;
    showModules: boolean;
    showOperators: boolean;
    showProperties: boolean;
    showReferences: boolean;
    showSnippets: boolean;
    showStructs: boolean;
    showTypeParameters: boolean;
    showUnits: boolean;
    showUsers: boolean;
    showValues: boolean;
    showVariables: boolean;
    showWords: boolean;
    snippetsPreventQuickSuggestions: boolean;
  };
}
