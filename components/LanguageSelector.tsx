import React from 'react';
import { TranslationMode } from '../types';

interface LanguageSelectorProps {
  currentMode: TranslationMode;
  onModeChange: (mode: TranslationMode) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentMode, onModeChange, disabled }) => {
  const modes = [
    { value: TranslationMode.CantoneseToOthers, label: 'Cantonese → Eng/Kor' },
    { value: TranslationMode.EnglishToCantonese, label: 'English → Cantonese' },
    { value: TranslationMode.KoreanToCantonese, label: 'Korean → Cantonese' },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-1 bg-slate-200 rounded-lg w-fit">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onModeChange(mode.value)}
          disabled={disabled}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
            ${currentMode === mode.value 
              ? 'bg-white text-red-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;