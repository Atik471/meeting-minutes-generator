import React, { useState, useEffect } from 'react';
import { ChevronDown, RotateCcw, Copy, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ConfigPanel = ({ onConfigChange, isLoading }) => {
  const [language, setLanguage] = useState('en');
  const [temperature, setTemperature] = useState(0.2);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Fetch default prompt on mount
  useEffect(() => {
    const fetchDefaultPrompt = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/default-prompt`);
        if (response.ok) {
          const data = await response.json();
          setDefaultPrompt(data.prompt);
        }
      } catch (error) {
        console.error('Failed to fetch default prompt:', error);
      } finally {
        setLoadingPrompt(false);
      }
    };

    fetchDefaultPrompt();
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    onConfigChange({ language: lang, temperature, customPrompt, deepgramKey, geminiKey });
  };

  const handleTemperatureChange = (temp) => {
    setTemperature(temp);
    onConfigChange({ language, temperature: temp, customPrompt, deepgramKey, geminiKey });
  };

  const handlePromptChange = (prompt) => {
    setCustomPrompt(prompt);
    onConfigChange({ language, temperature, customPrompt: prompt, deepgramKey, geminiKey });
  };

  const handleResetPrompt = () => {
    setCustomPrompt('');
    onConfigChange({ language, temperature, customPrompt: '', deepgramKey, geminiKey });
  };

  const handleUseDefault = () => {
    setCustomPrompt(defaultPrompt);
    onConfigChange({ language, temperature, customPrompt: defaultPrompt, deepgramKey, geminiKey });
  };

  const handleDeepgramKeyChange = (value) => {
    setDeepgramKey(value);
    onConfigChange({ language, temperature, customPrompt, deepgramKey: value, geminiKey });
  };

  const handleGeminiKeyChange = (value) => {
    setGeminiKey(value);
    onConfigChange({ language, temperature, customPrompt, deepgramKey, geminiKey: value });
  };

  const handleCopyDefault = async () => {
    if (defaultPrompt) {
      await navigator.clipboard.writeText(defaultPrompt);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="glass rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Language
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: 'en', label: 'English' },
            { code: 'bn', label: 'Bengali' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isLoading}
              className={`py-2 px-3 rounded-lg transition-all font-medium text-sm ${
                language === lang.code
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white'
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
          Temperature: <span className="text-cyan-400 font-semibold">{temperature.toFixed(1)}</span>
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
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="glass rounded-xl p-4 space-y-3 fade-in">
          <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Deepgram API Key
              </label>
              <input
                type="password"
                value={deepgramKey}
                onChange={(e) => handleDeepgramKeyChange(e.target.value)}
                disabled={isLoading}
                placeholder="dg_..."
                autoComplete="off"
                spellCheck="false"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => handleGeminiKeyChange(e.target.value)}
                disabled={isLoading}
                placeholder="AIza..."
                autoComplete="off"
                spellCheck="false"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
            </div>

            <p className="text-xs text-amber-300/90 leading-relaxed">
              Keys stay in this browser session only. They are sent to your backend for this request and are not stored in localStorage or a database by this app.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              System Prompt
            </label>
            <div className="flex gap-2">
              {customPrompt && (
                <button
                  onClick={handleResetPrompt}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all disabled:opacity-50"
                  title="Clear custom prompt"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
              {defaultPrompt && !customPrompt && (
                <button
                  onClick={handleUseDefault}
                  disabled={isLoading}
                  className="text-xs px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-400 rounded transition-all disabled:opacity-50"
                >
                  Use Default
                </button>
              )}
            </div>
          </div>

          {!customPrompt && defaultPrompt && !loadingPrompt && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 font-semibold">Default System Prompt:</p>
                <button
                  onClick={handleCopyDefault}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-all hover:bg-slate-800"
                  title={copyFeedback ? "Copied!" : "Copy default prompt"}
                >
                  {copyFeedback ? (
                    <>
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-400" />
                      <span className="text-slate-500 group-hover:text-slate-400 hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono line-clamp-8">
                {defaultPrompt}
              </p>
            </div>
          )}

          <textarea
            value={customPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            disabled={isLoading}
            placeholder={defaultPrompt ? "Start editing or clear to use default..." : "Enter your custom system prompt..."}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 text-xs placeholder-slate-500 resize-y focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
          <p className="text-xs text-slate-500">
            {customPrompt 
              ? 'Editing custom prompt. Click Clear to revert to default.' 
              : 'Leave empty to use the default MOM generation prompt'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;
