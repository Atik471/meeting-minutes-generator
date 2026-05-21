import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ConfigPanel = ({ onConfigChange, isLoading }) => {
  const [language, setLanguage] = useState('en');
  const [temperature, setTemperature] = useState(0.2);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    onConfigChange({ language: lang, temperature, customPrompt });
  };

  const handleTemperatureChange = (temp) => {
    setTemperature(temp);
    onConfigChange({ language, temperature: temp, customPrompt });
  };

  const handlePromptChange = (prompt) => {
    setCustomPrompt(prompt);
    onConfigChange({ language, temperature, customPrompt: prompt });
  };

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="glass rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Language
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'en', label: 'English' },
            { code: 'bn', label: 'Bengali' },
            { code: 'es', label: 'Spanish' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isLoading}
              className={`py-2 px-3 rounded-lg transition-all font-medium text-sm ${
                language === lang.code
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature Slider */}
      <div className="glass rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Temperature: <span className="text-purple-400 font-semibold">{temperature.toFixed(1)}</span>
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            disabled={isLoading}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Structured (0.0)</span>
            <span>Balanced (0.5)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        disabled={isLoading}
        className="w-full glass rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-sm font-medium text-slate-300">Advanced Settings</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Custom Prompt */}
      {showAdvanced && (
        <div className="glass rounded-xl p-4 space-y-2 fade-in">
          <label className="block text-sm font-medium text-slate-300">
            Custom System Prompt
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            disabled={isLoading}
            placeholder="Leave empty to use default MOM generation prompt..."
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-slate-500">
            Leave empty to use your default prompt.txt file
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;
