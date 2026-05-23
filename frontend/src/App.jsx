import React, { useState } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ConfigPanel from './components/ConfigPanel';
import OutputPanel from './components/OutputPanel';
import ProcessingStatus from './components/ProcessingStatus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [config, setConfig] = useState({
    language: 'en',
    temperature: 0.2,
    customPrompt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setError('');
    await processFile(selectedFile);
  };

  const processFile = async (audioFile) => {
    try {
      setLoading(true);
      setError('');
      setProcessingStage(1);
      setResults(null);

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language', config.language);
      formData.append('temperature', config.temperature.toString());
      if (config.customPrompt) {
        formData.append('customPrompt', config.customPrompt);
      }

      setProcessingStage(2);

      const response = await axios.post(`${API_BASE_URL}/api/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutes
      });

      setProcessingStage(3);

      if (response.data.success) {
        setResults({
          transcript: response.data.transcript,
          mom: response.data.mom,
          metadata: response.data.metadata,
        });
        setProcessingStage(4);
        setActiveTab('mom'); // Show MOM by default
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to process audio file'
      );
      setProcessingStage(0);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  const handleRetry = () => {
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="gradient-bg">
        <div className="gradient-orb-1" />
        <div className="gradient-orb-2" />
        <div className="gradient-orb-3" />
      </div>

      {/* Grid Background */}
      <div className="grid-background" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-700/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  🎙️ Meeting Minutes Generator
                </h1>
                <p className="text-slate-400">
                  Transform your audio meetings into professional minutes instantly
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-slate-300">Backend Connected</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Upload & Config */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Upload */}
              <FileUpload onFileSelect={handleFileSelect} isLoading={loading} />

              {/* Config Panel */}
              {!results && (
                <ConfigPanel onConfigChange={handleConfigChange} isLoading={loading} />
              )}

              {/* Processing Status */}
              {loading && (
                <ProcessingStatus stage={processingStage} isComplete={processingStage === 4} />
              )}

              {/* Error Message */}
              {error && (
                <div className="glass rounded-xl p-4 bg-red-900/20 border border-red-700/50">
                  <p className="text-red-400 text-sm font-medium mb-3">Error</p>
                  <p className="text-red-200 text-sm mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="w-full px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* File Info */}
              {file && !loading && (
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Current File</p>
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-2">
              {results ? (
                <OutputPanel
                  transcript={results.transcript}
                  mom={results.mom}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              ) : (
                <div className="glass rounded-xl p-8 min-h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-4">👂</div>
                    <p className="text-slate-400 mb-2">No results yet</p>
                    <p className="text-xs text-slate-500">
                      Upload an audio file to generate transcript and MOM
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-700/30 backdrop-blur-sm mt-12">
          <div className="max-w-6xl mx-auto px-6 py-6 text-center text-slate-400 text-sm">
            <p>
              Powered by{' '}
              <span className="gradient-text font-semibold">Deepgram Nova-3</span> &
              <span className="gradient-text font-semibold"> Gemini 2.5 Flash</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
