import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const ProcessingStatus = ({ stage, isComplete }) => {
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

  const stages = [
    { num: 1, label: 'Uploading', icon: '📤' },
    { num: 2, label: 'Transcribing', icon: '🎙️' },
    { num: 3, label: 'Generating MOM', icon: '✨' },
    { num: 4, label: 'Complete', icon: '✅' },
  ];

  return (
    <div className="glass rounded-xl p-6">
      <div className="space-y-4">
        {stages.map((s, idx) => (
          <div key={s.num} className="flex items-center gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                stage >= s.num
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {stage > s.num ? '✓' : s.num}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${stage >= s.num ? 'text-white' : 'text-slate-400'}`}>
                {s.label}
              </p>
            </div>
            {stage === s.num && (
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {isComplete && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg text-center">
          <p className="text-green-400 font-semibold">Processing Complete! 🎉</p>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;
