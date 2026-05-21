import React, { useState, useRef } from 'react';
import { Upload, Zap } from 'lucide-react';

const FileUpload = ({ onFileSelect, isLoading }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const isValidFile = (file) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm'];
    return validTypes.includes(file.type) && file.size <= 100 * 1024 * 1024;
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFile(file)) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer ${
        isDragActive
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-slate-600 hover:border-purple-400 bg-slate-900/30'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => !isLoading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`p-4 rounded-full ${isDragActive ? 'bg-purple-500/20' : 'bg-purple-500/10'} transition-all`}>
          {isLoading ? (
            <Zap className="w-8 h-8 text-purple-400 animate-pulse" />
          ) : (
            <Upload className="w-8 h-8 text-purple-400" />
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">
            {isDragActive ? 'Drop your audio file here' : 'Drag & drop your audio file'}
          </p>
          <p className="text-sm text-slate-400">
            or click to browse • MP3, WAV, M4A, OGG • Max 100MB
          </p>
        </div>
      </div>

      {/* Animated Border Effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
      </div>
    </div>
  );
};

export default FileUpload;
