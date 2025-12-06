export enum TranslationMode {
  CantoneseToOthers = 'CAN_TO_OTHERS',
  EnglishToCantonese = 'ENG_TO_CAN',
  KoreanToCantonese = 'KOR_TO_CAN'
}

export interface WordBreakdown {
  word: string;
  jyutping: string;
  partOfSpeech: string;
  englishMeaning: string;
  koreanMeaning: string;
  exampleSentenceCantonese: string;
  exampleSentenceJyutping: string;
  exampleSentenceEnglish: string;
  exampleSentenceKorean: string;
}

export interface AnalysisResult {
  originalText: string;
  cantoneseText: string; // If source was Eng/Kor, this is the translated Canto. If source Canto, same as original.
  jyutping: string;
  englishTranslation: string;
  koreanTranslation: string;
  breakdown: WordBreakdown[];
}
