import React, { useState } from 'react';
import { Volume2, CheckCircle, XCircle, Award } from 'lucide-react';
import { EnglishLevel, VocabularyItem } from '../types';

interface ReadingTwoProps {
  readingText: string;
  translationText: string | null;
  vocabulary: VocabularyItem[];
  answers: string[] | null;
  topicName: string | null;
  level: EnglishLevel;
  showTranslation: boolean;
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isAudioLoading: boolean;
  setIsPlaying: (playing: boolean) => void;
  handlePlayAudio: () => Promise<void>;
}

export const ReadingTwo: React.FC<ReadingTwoProps> = ({
  readingText,
  translationText,
  vocabulary,
  answers,
  topicName,
  level,
  showTranslation,
  audioUrl,
  audioRef,
  isPlaying,
  isAudioLoading,
  setIsPlaying,
  handlePlayAudio
}) => {
  const [userInputs, setUserInputs] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (index: number, value: string) => {
    setUserInputs(prev => ({ ...prev, [index]: value }));
  };

  const checkAnswers = () => {
    setIsSubmitted(true);
  };

  const totalQuestions = answers?.length || 0;
  const correctCount = answers?.reduce((acc, ans, idx) => {
    const num = idx + 1;
    const userAns = (userInputs[num] || '').toLowerCase().trim();
    return acc + (userAns === ans.toLowerCase() ? 1 : 0);
  }, 0) || 0;
  const scoreStr = totalQuestions > 0 ? ((correctCount / totalQuestions) * 10).toFixed(1).replace('.0', '') : "0";

  // Parse text like "Some text (1) more text (2)." into parts
  // We look for "(1)", "(2)", etc.
  const parts = readingText.split(/(\(\d+\))/g);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden border-[6px] border-brand-blue-dark">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-black text-brand-blue uppercase tracking-widest">
          Reading 2 (Fill in the blanks)
        </h3>
        
        {audioUrl && (
          <button
            onClick={handlePlayAudio}
            disabled={isAudioLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-yellow-400 text-brand-blue-dark font-black rounded-xl transition-all disabled:opacity-50"
          >
            <Volume2 size={20} />
            {isPlaying ? 'Dừng' : (isAudioLoading ? 'Đang tải...' : 'Nghe')}
          </button>
        )}
      </div>

      <div className="text-sm sm:text-base font-medium text-slate-700 leading-loose mt-2">
        {parts.map((part, i) => {
          const match = part.match(/^\((\d+)\)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            const index = num - 1; // zero based
            const expectedAns = answers?.[index]?.toLowerCase() || '';
            const userAns = (userInputs[num] || '').toLowerCase().trim();
            const isCorrect = userAns === expectedAns;

            return (
              <span key={i} className="inline-flex flex-col items-center mx-1 relative top-2">
                <div className="relative">
                  <input
                    type="text"
                    value={userInputs[num] || ''}
                    onChange={(e) => handleInputChange(num, e.target.value)}
                    disabled={isSubmitted}
                    className={`w-24 sm:w-32 border-b-2 bg-slate-50 text-center font-bold px-2 py-1 outline-none transition-colors ${
                      isSubmitted
                        ? isCorrect
                          ? 'border-green-500 text-green-700 bg-green-50'
                          : 'border-red-500 text-red-700 bg-red-50'
                        : 'border-slate-300 focus:border-brand-blue text-brand-blue-dark focus:bg-white'
                    }`}
                    placeholder={`(${num})`}
                  />
                  {isSubmitted && (
                    <div className="absolute -top-2 -right-2 bg-white rounded-full z-10">
                      {isCorrect ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {isSubmitted && !isCorrect && answers && answers[index] && (
                  <span className="text-[11px] font-black text-green-700 mt-1 bg-green-100 px-2 py-0.5 rounded-md border border-green-200">
                    {answers[index]}
                  </span>
                )}
              </span>
            );
          }
          // Normal text part
          return <span key={i}>{part}</span>;
        })}
      </div>

      {!isSubmitted ? (
        <button
          onClick={checkAnswers}
          className="mt-4 px-6 py-3 bg-brand-blue hover:bg-brand-blue-dark text-white font-black rounded-xl uppercase tracking-widest transition-all self-center shadow-lg active:scale-95"
        >
          Kiểm tra / Trả lời
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-100 rounded-xl">
            <h4 className="font-black text-blue-900 flex items-center gap-2">
              <Award size={20} className="text-blue-600" />
              Điểm của bạn
            </h4>
            <div className="text-2xl font-black text-blue-700">
              {scoreStr} <span className="text-base text-blue-400">/ 10</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-pink-50 border-2 border-pink-100 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-pink-200 border-2 border-pink-300 flex items-center justify-center shrink-0">
               <span className="text-xl">👩‍🏫</span>
            </div>
            <div>
              <h4 className="font-black text-pink-700 text-sm mb-1">Nhận xét của Ms. Yến</h4>
              <p className="text-pink-900 font-medium text-sm">
                {parseFloat(scoreStr) >= 9 ? "Tuyệt vời quá con yêu! Con làm rất xuất sắc, cô Yến rất tự hào về con! 🌟" :
                 parseFloat(scoreStr) >= 7 ? "Làm tốt lắm! Con hãy xem lại phần gợi ý để rút kinh nghiệm nhé, sắp hoàn hảo rồi! 👍" :
                 parseFloat(scoreStr) >= 5 ? "Cố lên con! Lần sau con chú ý nghe kỹ hơn một chút là điểm sẽ cao ngay. Cô tin con làm được! 💪" :
                 "Không sao đâu con, bài này hơi khó một chút. Con hãy nghe lại và làm lại cùng cô Yến nhé! ❤️"}
              </p>
            </div>
          </div>

            <div className="p-4 bg-slate-100 rounded-xl space-y-3 text-sm border border-slate-200">
              <h4 className="font-black text-slate-700 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                Gợi ý trả lời, Phiên âm & Dịch nghĩa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {answers?.map((ans, idx) => {
                  const vocabMatch = vocabulary.find(v => v.word.toLowerCase() === ans.toLowerCase());
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-800">{ans}</span>
                          {vocabMatch?.ipa && (
                            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{vocabMatch.ipa}</span>
                          )}
                        </div>
                        {vocabMatch?.meaning && (
                          <span className="text-xs text-slate-500 italic truncate">{vocabMatch.meaning}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            {showTranslation && translationText && (
              <p className="mt-4 text-slate-600 italic">
                {translationText}
              </p>
            )}
            <button 
              onClick={() => { setIsSubmitted(false); setUserInputs({}); }}
              className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs shadow-sm active:scale-95"
            >
              Làm lại
            </button>
          </div>
        </div>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}
    </div>
  );
};
