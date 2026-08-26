import React, { useState } from 'react';
import { ExerciseData } from '../types';
import { CheckCircle, XCircle, PenTool } from 'lucide-react';

interface WrittenExercisesProps {
  data: ExerciseData | null;
  onComplete?: (score: number) => void;
}

export const WrittenExercises: React.FC<WrittenExercisesProps> = ({ data, onComplete }) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  if (!data || !data.questions || data.questions.length === 0) return null;

  const handleInputChange = (id: string, value: string) => {
    setUserInputs(prev => ({ ...prev, [id]: value }));
  };

  const isCorrect = (id: string, expected: string) => {
    const userAns = userInputs[id]?.trim().toLowerCase() || "";
    const correct = expected.trim().toLowerCase();
    return userAns === correct;
  };

  const handleCheck = () => {
    setShowAnswers(!showAnswers);
    if (!showAnswers && onComplete) {
      let correctCount = 0;
      data.questions.forEach(q => {
        if (isCorrect(q.id, q.expectedAnswer)) correctCount++;
      });
      const score = Math.round((correctCount / data.questions.length) * 10);
      onComplete(score);
    }
  };

  return (
    <div className="mt-8 bg-white p-4 sm:p-6 rounded-3xl border-4 border-indigo-100 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-indigo-50">
        <h3 className="text-xl font-black text-indigo-800 flex items-center gap-2">
          <PenTool size={24} className="text-indigo-600" />
          Bài tập vận dụng
        </h3>
        <button
          onClick={handleCheck}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
        >
          {showAnswers ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {showAnswers ? "Ẩn đáp án" : "Kiểm tra đáp án"}
        </button>
      </div>

      <div className="space-y-6">
        {data.questions.map((q, index) => (
          <div key={q.id || index} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <span className="font-bold text-indigo-600 min-w-[24px]">{index + 1}.</span>
              <div className="flex-1">
                <p className="text-slate-700 font-medium mb-1">
                  {q.type === 'fill_blank' && 'Điền từ vào chỗ trống:'}
                  {q.type === 'rearrange' && 'Sắp xếp lại câu:'}
                  {q.type === 'find_mistake' && 'Tìm và sửa lỗi sai:'}
                  {q.type === 'complete_sentence' && 'Hoàn thành câu:'}
                </p>
                <p className="text-lg text-slate-800 mb-2">{q.questionText}</p>
                
                {q.suggestedWords && (
                  <p className="text-sm text-slate-500 mb-3 bg-slate-200 inline-block px-2 py-1 rounded">
                    Gợi ý: {q.suggestedWords}
                  </p>
                )}

                <div className="relative mt-2">
                  <input
                    type="text"
                    value={userInputs[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full border-2 border-slate-200 rounded-lg p-3 focus:border-indigo-400 outline-none pr-10"
                  />
                  {showAnswers && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCorrect(q.id, q.expectedAnswer) ? (
                        <CheckCircle size={20} className="text-green-500" />
                      ) : (
                        <XCircle size={20} className="text-rose-500" />
                      )}
                    </span>
                  )}
                </div>

                {showAnswers && !isCorrect(q.id, q.expectedAnswer) && (
                  <div className="mt-3 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-100 text-green-800">
                    <p>Đáp án đúng: <span className="font-bold">{q.expectedAnswer}</span></p>
                    {q.explanation && <p className="mt-1 text-green-700 italic">Giải thích: {q.explanation}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
