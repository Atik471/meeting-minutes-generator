import React, { useState } from 'react';
import { Mic } from 'lucide-react';
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
    deepgramKey: '',
    geminiKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [results, setResults] = useState(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');
  const [processingTimes, setProcessingTimes] = useState({
    transcription: null,
    momGeneration: null,
    total: null,
  });

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError('');
    setErrorDetails(null);
    setResults(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    await processFile(file);
  };

  const processFile = async (audioFile) => {
    try {
      setLoading(true);
      setError('');
      setErrorDetails(null);
      setProcessingStage(1);
      setResults(null);
      setProcessingTimes({
        transcription: null,
        momGeneration: null,
        total: null,
      });

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language', config.language);
      formData.append('temperature', config.temperature.toString());
      if (config.customPrompt) {
        formData.append('customPrompt', config.customPrompt);
      }
      if (config.deepgramKey) {
        formData.append('deepgramKey', config.deepgramKey);
      }
      if (config.geminiKey) {
        formData.append('geminiKey', config.geminiKey);
      }

      // Use fetch for streaming SSE response, show uploading stage immediately
      // Note: Fetch doesn't provide upload progress, but stage 1 shows "Uploading..."
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      // Move to transcription stage once response starts
      setProcessingStage(2);

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];

          if (line.startsWith('data: ')) {
            let eventData;

            try {
              eventData = JSON.parse(line.slice(6));
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
              continue;
            }

            console.log('SSE Event:', eventData);

            if (eventData.type === 'progress') {
              // Update stage when transcription completes
              if (eventData.status === 'complete' && eventData.stage === 2) {
                setProcessingStage(3); // Move to MOM generation
                setProcessingTimes(prev => ({
                  ...prev,
                  transcription: eventData.processingTime,
                }));
              }
            } else if (eventData.type === 'complete') {
              // Final result received
              setResults({
                transcript: eventData.transcript,
                mom: eventData.mom,
                metadata: eventData.metadata,
              });
              setProcessingTimes(eventData.metadata?.processingTime);
              setProcessingStage(4);
              setActiveTab('mom');
            } else if (eventData.type === 'error') {
              const detailedError = new Error(eventData.message || 'Processing failed');
              detailedError.code = eventData.code;
              detailedError.source = eventData.source;
              detailedError.retryable = eventData.retryable;
              detailedError.details = eventData.details;
              throw detailedError;
            }
          }
        }
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process audio file');
      setErrorDetails({
        code: err.code || 'UNKNOWN_ERROR',
        source: err.source || 'client',
        retryable: Boolean(err.retryable),
        details: err.details || '',
      });
      setProcessingStage(0);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
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
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-2 whitespace-nowrap">
                  <Mic className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 shrink-0" /> Meeting Minutes Generator
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Transform your audio meetings into professional minutes instantly
                </p>
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

              {/* Submit Button */}
              {file && !loading && !results && (
                <button
                  onClick={handleSubmit}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold rounded-lg transition-all"
                >
                  Process Audio
                </button>
              )}

              {/* Processing Status */}
              {loading && (
                <ProcessingStatus stage={processingStage} isComplete={processingStage === 4} processingTimes={processingTimes} />
              )}

              {/* Error Message */}
              {error && (
                <div className="glass rounded-xl p-4 bg-red-900/20 border border-red-700/50">
                  <p className="text-red-400 text-sm font-medium mb-3">Error</p>
                  <p className="text-red-200 text-sm mb-4">{error}</p>
                  {errorDetails && (
                    <div className="mb-4 rounded-lg border border-red-700/40 bg-slate-950/40 p-3 text-xs text-slate-300 space-y-1">
                      <p><span className="text-slate-400">Source:</span> {errorDetails.source}</p>
                      <p><span className="text-slate-400">Code:</span> {errorDetails.code}</p>
                      <p><span className="text-slate-400">Retryable:</span> {errorDetails.retryable ? 'Yes' : 'No'}</p>
                      {errorDetails.details && <p className="text-slate-400 break-words">{errorDetails.details}</p>}
                    </div>
                  )}
                  <button
                    onClick={handleRetry}
                    className="w-full px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Processing Times Summary */}
              {(processingTimes.transcription || processingTimes.momGeneration || processingTimes.total) && !loading && (
                <div className="glass rounded-xl p-4 bg-gradient-to-r from-cyan-900/30 to-teal-900/30 border border-cyan-700/50">
                  <p className="text-xs text-cyan-300 uppercase font-semibold mb-3">Processing Times</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">Transcription:</span>
                      <span className="text-sm font-mono text-cyan-400">
                        {processingTimes.transcription ? `${(processingTimes.transcription / 1000).toFixed(2)}s` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">MOM Generation:</span>
                      <span className="text-sm font-mono text-cyan-400">
                        {processingTimes.momGeneration ? `${(processingTimes.momGeneration / 1000).toFixed(2)}s` : '-'}
                      </span>
                    </div>
                    <div className="border-t border-cyan-700/30 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-200">Total:</span>
                      <span className="text-sm font-mono font-semibold text-cyan-300">
                        {processingTimes.total ? `${(processingTimes.total / 1000).toFixed(2)}s` : '-'}
                      </span>
                    </div>
                  </div>
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
