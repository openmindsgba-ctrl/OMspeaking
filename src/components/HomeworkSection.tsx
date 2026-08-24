import React, { useState } from 'react';
import { HomeworkData } from '../types';
import { CheckCircle, XCircle, Search, Pen, Target, BookOpen } from 'lucide-react';

interface HomeworkSectionProps {
  data: HomeworkData;
}

export const HomeworkSection: React.FC<HomeworkSectionProps> = ({ data }) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setUserInputs(prev => ({ ...prev, [key]: value }));
  };

  const isCorrect = (key: string, correctAnswer: string) => {
    const userAns = userInputs[key]?.trim().toLowerCase() || "";
    const correct = correctAnswer.trim().toLowerCase();
    return userAns === correct;
  };

  if (!data) return null;

  return (
    <div className="mt-8 space-y-6 bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-black text-indigo-800 flex items-center gap-2">
          <BookOpen size={24} className="text-indigo-600" />
          Practice Exercises
        </h3>
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            showAnswers 
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}
        >
          {showAnswers ? 'Hide answers' : 'Check answers'}
        </button>
      </div>

      {/* Bài 1: Find and correct the mistakes */}
      {data.mistakes && data.mistakes.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
            <Search size={18} className="text-rose-500" />
            Bài 1: Find and correct the mistakes
          </h4>
          <div className="space-y-4">
            {data.mistakes.map((q, idx) => (
              <div key={`mistake-${idx}`} className="bg-rose-50/30 p-3 rounded-lg border border-rose-100">
                <p className="text-sm font-medium text-slate-800 mb-2">
                  <span className="font-black text-rose-600 mr-2">{idx + 1}.</span>
                  {q.sentence}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 ml-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-16">Mistake:</span>
                    <input
                      type="text"
                      value={userInputs[`mistake-wrong-${idx}`] || ''}
                      onChange={(e) => handleInputChange(`mistake-wrong-${idx}`, e.target.value)}
                      className="flex-1 min-w-[100px] border-2 border-slate-200 rounded p-1 text-sm focus:border-rose-400 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-20">Correction:</span>
                    <input
                      type="text"
                      value={userInputs[`mistake-right-${idx}`] || ''}
                      onChange={(e) => handleInputChange(`mistake-right-${idx}`, e.target.value)}
                      className="flex-1 min-w-[100px] border-2 border-slate-200 rounded p-1 text-sm focus:border-green-400 outline-none"
                    />
                  </div>
                </div>
                {showAnswers && (
                  <div className="mt-2 ml-6 text-sm text-green-700 font-medium bg-green-50 p-2 rounded border border-green-100">
                    Answer: <span className="text-rose-600 line-through mr-2">{q.mistake}</span> {'->'} <span className="font-bold">{q.correction}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bài 2: Complete the sentences using the given words */}
      {data.completeSentences && data.completeSentences.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
            <Pen size={18} className="text-blue-500" />
            Bài 2: Complete the sentences using the given words
          </h4>
          <div className="space-y-4">
            {data.completeSentences.map((q, idx) => (
              <div key={`complete-${idx}`} className="space-y-2">
                <div className="text-sm font-medium text-slate-800 leading-relaxed flex flex-wrap items-center gap-2">
                  <span className="font-black text-blue-600 mr-1">{idx + 1}.</span>
                  {q.sentence.split('___').map((part, pIdx, arr) => (
                    <React.Fragment key={pIdx}>
                      <span>{part}</span>
                      {pIdx < arr.length - 1 && (
                        <div className="inline-flex items-center gap-2 mx-1 relative">
                          <input
                            type="text"
                            value={userInputs[`complete-${idx}`] || ''}
                            onChange={(e) => handleInputChange(`complete-${idx}`, e.target.value)}
                            className="w-32 border-b-2 border-slate-300 focus:border-blue-500 outline-none text-center font-bold text-blue-700 bg-blue-50/50"
                          />
                          {showAnswers && (
                            <span className="absolute -right-6 top-1/2 -translate-y-1/2">
                              {isCorrect(`complete-${idx}`, q.answer) ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <XCircle size={16} className="text-rose-500" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                  <span className="ml-2 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono text-xs">({q.givenWords})</span>
                </div>
                {showAnswers && !isCorrect(`complete-${idx}`, q.answer) && (
                  <div className="ml-6 text-sm text-green-600 font-medium italic">
                    Answer: {q.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bài 3: Chia động từ đúng vào chỗ trống */}
      {data.verbConjugation && data.verbConjugation.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
            <Target size={18} className="text-indigo-500" />
            Bài 3: Chia động từ đúng vào chỗ trống
          </h4>
          <div className="space-y-4">
            {data.verbConjugation.map((q, idx) => (
              <div key={`verb-${idx}`} className="space-y-2">
                <div className="text-sm font-medium text-slate-800 leading-relaxed flex flex-wrap items-center gap-2">
                  <span className="font-black text-indigo-600 mr-1">{idx + 1}.</span>
                  {q.sentence.split('___').map((part, pIdx, arr) => (
                    <React.Fragment key={pIdx}>
                      <span>{part}</span>
                      {pIdx < arr.length - 1 && (
                        <div className="inline-flex items-center gap-1 mx-1 relative">
                          <input
                            type="text"
                            value={userInputs[`verb-${idx}`] || ''}
                            onChange={(e) => handleInputChange(`verb-${idx}`, e.target.value)}
                            className="w-32 border-b-2 border-slate-300 focus:border-indigo-500 outline-none text-center font-bold text-indigo-700 bg-indigo-50/50"
                          />
                          <span className="font-bold text-indigo-600">({q.verb})</span>
                          {showAnswers && (
                            <span className="absolute -right-6 top-1/2 -translate-y-1/2">
                              {isCorrect(`verb-${idx}`, q.answer) ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <XCircle size={16} className="text-rose-500" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {showAnswers && !isCorrect(`verb-${idx}`, q.answer) && (
                  <div className="ml-6 text-sm text-green-600 font-medium italic">
                    Answer: {q.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Bài 4: Viết lại câu và không làm thay đổi nghĩa */}
      {data.rewriteSentences && data.rewriteSentences.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
            <Pen size={18} className="text-fuchsia-500" />
            Bài 4: Viết lại câu và không làm thay đổi nghĩa
          </h4>
          <div className="space-y-4">
            {data.rewriteSentences.map((q, idx) => (
              <div key={`rewrite-${idx}`} className="bg-fuchsia-50/30 p-3 rounded-lg border border-fuchsia-100">
                <p className="text-sm font-medium text-slate-800 mb-2">
                  <span className="font-black text-fuchsia-600 mr-2">{idx + 1}.</span>
                  {q.originalSentence}
                </p>
                <div className="flex items-start gap-2 ml-6">
                  <span className="text-sm font-bold text-slate-700 whitespace-nowrap mt-2">{q.hint}</span>
                  <div className="relative flex-1">
                    <textarea
                      value={userInputs[`rewrite-${idx}`] || ''}
                      onChange={(e) => handleInputChange(`rewrite-${idx}`, e.target.value)}
                      placeholder="Write your sentence here..."
                      className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-fuchsia-400 outline-none resize-none"
                      rows={2}
                    />
                    {showAnswers && (
                      <span className="absolute -right-8 top-1/2 -translate-y-1/2">
                        {(isCorrect(`rewrite-${idx}`, q.answer) || isCorrect(`rewrite-${idx}`, q.answer.replace(new RegExp('^' + q.hint, 'i'), '').trim())) ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-rose-500" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {showAnswers && !(isCorrect(`rewrite-${idx}`, q.answer) || isCorrect(`rewrite-${idx}`, q.answer.replace(new RegExp('^' + q.hint, 'i'), '').trim())) && (
                  <div className="mt-2 ml-6 text-sm text-green-700 font-medium bg-green-50 p-2 rounded border border-green-100">
                    Answer: <span className="font-bold">{q.answer}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
