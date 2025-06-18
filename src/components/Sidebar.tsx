import React from 'react';
import { 
  FiEdit2 as FiEdit,
  FiFolder, 
  FiZap, 
  FiSettings, 
  FiPlus, 
  FiMessageSquare, 
  FiSun, 
  FiMoon,
  FiStar,
  FiGrid,
  FiFileText
} from 'react-icons/fi';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onOpenAIAssistant: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  darkMode, 
  onDarkModeToggle,
  onOpenAIAssistant 
}) => {
  const menuItems = [
    { id: 'editor', icon: <FiEdit size={20} />, label: 'Éditeur' },
    { id: 'library', icon: <FiFolder size={20} />, label: 'Bibliothèque' },
    { id: 'templates', icon: <FiZap size={20} />, label: 'Modèles IA' },
    { id: 'favorites', icon: <FiStar size={20} />, label: 'Favoris' },
    { id: 'ai-assistant', icon: <FiMessageSquare size={20} />, label: 'Assistant IA' },
    { id: 'settings', icon: <FiSettings size={20} />, label: 'Paramètres' },
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          PromptCraft
        </h1>
        <p className="text-sm text-gray-400 mt-1">Générez des prompts IA puissants</p>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-gray-700 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 space-y-3 mt-auto">
        <button
          onClick={onOpenAIAssistant}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <FiMessageSquare className="w-5 h-5" />
          <span>Assistant IA</span>
        </button>
        
        <button
          onClick={onDarkModeToggle}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        >
          {darkMode ? (
            <>
              <FiSun className="w-5 h-5" />
              <span>Mode clair</span>
            </>
          ) : (
            <>
              <FiMoon className="w-5 h-5" />
              <span>Mode sombre</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'settings' 
              ? 'bg-blue-600/20 text-blue-400' 
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
          }`}
        >
          <FiSettings className="w-5 h-5" />
          <span>Paramètres</span>
        </button>
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
          <FiPlus className="mr-2" />
          Nouveau Prompt
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
