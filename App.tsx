import React, { useState, useRef, useCallback } from 'react';
import { TranslationMode, AnalysisResult } from './types';
import { geminiService, decodeAudioData } from './services/geminiService';
import LanguageSelector from './components/LanguageSelector';
import WordCard from './components/WordCard';
import { SpeakerWaveIcon, BookOpenIcon, SparklesIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.CantoneseToOthers);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await geminiService.analyzeText(inputText, mode);
      setResult(data);
    } catch (err) {
      setError("Failed to analyze text. Please check your API key and internet connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = useCallback(async () => {
    if (!result?.cantoneseText) return;
    
    // Prevent multiple clicks
    if (audioLoading) return;

    try {
      setAudioLoading(true);
      const base64Audio = await geminiService.generateSpeech(result.cantoneseText);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioBuffer = await decodeAudioData(base64Audio, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
      
    } catch (err) {
      console.error("Audio playback error:", err);
      // Optional: show a toast or small error
    } finally {
      setAudioLoading(false);
    }
  }, [result, audioLoading]);

  const handleDownloadCSV = () => {
    if (!result?.breakdown) return;

    const headers = [
      "Word",
      "Jyutping",
      "Part of Speech",
      "English Meaning",
      "Korean Meaning",
      "Example Sentence (Cantonese)",
      "Example Sentence (Jyutping)",
      "Example Sentence (English)",
      "Example Sentence (Korean)"
    ];

    const escapeCsv = (str: string) => {
      if (str === null || str === undefined) return '""';
      const stringValue = String(str);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = result.breakdown.map(item => [
      item.word,
      item.jyutping,
      item.partOfSpeech,
      item.englishMeaning,
      item.koreanMeaning,
      item.exampleSentenceCantonese,
      item.exampleSentenceJyutping,
      item.exampleSentenceEnglish,
      item.exampleSentenceKorean
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    // Add BOM for Excel compatibility with CJK characters
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const filename = `${yyyy}${mm}${dd}_vocab.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white p-1.5 rounded-lg">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">JyutDict AI</h1>
          </div>
          <a 
            href="https://ai.google.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            Powered by Gemini
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Input Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <LanguageSelector 
              currentMode={mode} 
              onModeChange={setMode} 
              disabled={loading}
            />
            {inputText && (
              <button 
                onClick={handleClear}
                className="text-slate-500 hover:text-red-500 text-sm font-medium flex items-center gap-1 self-end sm:self-auto"
              >
                <XMarkIcon className="h-4 w-4" /> Clear
              </button>
            )}
          </div>
          
          <div className="relative group">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === TranslationMode.CantoneseToOthers ? "Enter Cantonese sentence here..." :
                mode === TranslationMode.EnglishToCantonese ? "Enter English sentence here..." :
                "Enter Korean sentence here..."
              }
              className="w-full h-32 p-4 rounded-xl border border-slate-200 shadow-sm text-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none bg-white cantonese-text"
              disabled={loading}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !inputText.trim()}
              className={`
                absolute bottom-4 right-4 px-6 py-2 rounded-lg font-semibold text-white shadow-md transition-all flex items-center gap-2
                ${loading || !inputText.trim() 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 hover:shadow-lg active:scale-95'
                }
              `}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Analyze
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
        </section>

        {/* Results Section */}
        {result && (
          <section className="space-y-8 animate-fade-in">
            {/* Primary Translation Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 p-6 md:p-8 text-white relative">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-4 flex-1">
                        <h2 className="text-3xl md:text-4xl font-bold cantonese-text leading-snug">
                          {result.cantoneseText}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-red-200 font-mono text-sm md:text-base">
                            {result.jyutping}
                            </span>
                            <button
                                onClick={handlePlayAudio}
                                disabled={audioLoading}
                                className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait text-white"
                                title="Play Pronunciation"
                            >
                                {audioLoading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <SpeakerWaveIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gradient-to-b from-slate-50 to-white">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2 block">English Definition</label>
                  <p className="text-xl text-slate-800 leading-relaxed font-medium">{result.englishTranslation}</p>
                </div>
                <div className="md:border-l md:border-slate-200 md:pl-8">
                  <label className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2 block">Korean Definition</label>
                  <p className="text-xl text-slate-800 leading-relaxed font-medium">{result.koreanTranslation}</p>
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-6 bg-red-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Detailed Breakdown</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.breakdown.map((item, index) => (
                  <WordCard key={`${item.word}-${index}`} data={item} />
                ))}
              </div>

              {/* Download CSV Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all text-sm font-medium shadow-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download CSV
                </button>
              </div>
            </div>
          </section>
        )}
        
        {/* Placeholder / Empty State */}
        {!result && !loading && !error && (
            <div className="text-center py-20 opacity-50">
                <div className="inline-block p-4 rounded-full bg-slate-200 mb-4">
                    <BookOpenIcon className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-600">Start by entering a sentence above</h3>
                <p className="text-slate-400 mt-2">Get word-by-word analysis, Jyutping, and pronunciation</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;