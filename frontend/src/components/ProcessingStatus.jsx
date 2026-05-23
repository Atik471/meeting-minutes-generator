import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Upload, Mic, Sparkles, CheckCircle } from 'lucide-react';

const ProcessingStatus = ({ stage, isComplete, processingTimes }) => {
  useEffect(() => {
    if (isComplete) {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#3b82f6', '#ec4899', '#f97316'],
      });
    }
  }, [isComplete]);

  const IconMap = {
    Upload,
    Mic,
    Sparkles,
    CheckCircle,
  };

  const stages = [
    { num: 1, label: 'Uploading', icon: 'Upload', timeKey: null },
    { num: 2, label: 'Transcribing', icon: 'Mic', timeKey: 'transcription' },
    { num: 3, label: 'Generating MOM', icon: 'Sparkles', timeKey: 'momGeneration' },
    { num: 4, label: 'Complete', icon: 'CheckCircle', timeKey: null },
  ];

  const formatTime = (ms) => {
    if (!ms) return '';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="space-y-4">
        {stages.map((s, idx) => {
          const IconComponent = IconMap[s.icon];
          const timingData = processingTimes && s.timeKey ? processingTimes[s.timeKey] : null;
          return (
            <div key={s.num} className="flex items-center gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  stage >= s.num
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {stage > s.num ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <IconComponent className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${stage >= s.num ? 'text-white' : 'text-slate-400'}`}>
                  {s.label}
                </p>
                {timingData && stage > s.num && (
                  <p className="text-xs text-cyan-400 mt-1">{formatTime(timingData)}</p>
                )}
              </div>
              {stage === s.num && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-900/30 to-teal-900/30 border border-cyan-700/50 rounded-lg">
          <p className="text-cyan-400 font-semibold text-center mb-2">Processing Complete!</p>
          {processingTimes?.total && (
            <p className="text-xs text-cyan-300 text-center">
              Total time: {formatTime(processingTimes.total)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;
