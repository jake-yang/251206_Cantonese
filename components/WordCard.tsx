import React from 'react';
import { WordBreakdown } from '../types';

interface WordCardProps {
  data: WordBreakdown;
}

const WordCard: React.FC<WordCardProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 cantonese-text mb-1">{data.word}</h3>
          <p className="text-sm font-mono text-red-500 font-medium">{data.jyutping}</p>
        </div>
        <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded-full font-medium">
          {data.partOfSpeech}
        </span>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">English</span>
            <p className="text-slate-700 font-medium">{data.englishMeaning}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Korean</span>
            <p className="text-slate-700 font-medium">{data.koreanMeaning}</p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <span className="text-xs text-amber-600 font-bold mb-2 block uppercase tracking-wide">Example</span>
          <p className="text-lg text-slate-800 cantonese-text mb-1">{data.exampleSentenceCantonese}</p>
          <p className="text-sm text-red-400 font-mono mb-2">{data.exampleSentenceJyutping}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">🇬🇧 {data.exampleSentenceEnglish}</p>
            <p className="text-sm text-slate-600">🇰🇷 {data.exampleSentenceKorean}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCard;