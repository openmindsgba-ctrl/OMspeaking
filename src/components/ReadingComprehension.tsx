import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, MessageSquare, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import { evaluateComprehensionAnswer } from '../services/geminiService';

export interface ComprehensionQuestion {
  question: string;
  options: string[];  // Kept for backward compatibility
  correctAnswer: string;
  suggestedAnswer: string;
}

interface ReadingComprehensionProps {
  questions: ComprehensionQuestion[];
  apiKey: string;
}

interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  studentAnswer: string;
}

export const ReadingComprehension: React.FC<ReadingComprehensionProps> = ({ questions, apiKey }) => {
  const [evaluations, setEvaluations] = useState<Record<number, EvaluationResult>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [activeMic, setActiveMic] = useState<number | null>(null);
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startSpeechRecognition = (qIdx: number) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition. Please use Chrome.");
      return;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setActiveMic(qIdx);
      setTextAnswers(prev => ({ ...prev, [qIdx]: "" }));
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTextAnswers(prev => ({ ...prev, [qIdx]: finalTranscript }));
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setActiveMic(null);
    };

    recognition.onend = () => {
      setActiveMic(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setActiveMic(null);
  };

  const handleEvaluate = async (qIdx: number) => {
    handleStopMic();
    
    const finalAnswer = (textAnswers[qIdx] || "").trim();
    if (!finalAnswer) return;

    setLoadingMap(prev => ({ ...prev, [qIdx]: true }));
    
    try {
      const q = questions[qIdx];
      const result = await evaluateComprehensionAnswer(apiKey, q.question, finalAnswer, q.suggestedAnswer);
      
      setEvaluations(prev => ({
        ...prev,
        [qIdx]: {
          isCorrect: result.isCorrect,
          score: result.score,
          feedback: result.feedback,
          studentAnswer: finalAnswer
        }
      }));
    } catch (err) {
      console.error(err);
      alert("Grading error: " + (err as Error).message);
    } finally {
      setLoadingMap(prev => ({ ...prev, [qIdx]: false }));
    }
  };

  const isAllAnswered = Object.keys(evaluations).length === questions.length && questions.length > 0;
  const correctCount = Object.values(evaluations).filter(e => e.isCorrect).length;
  const totalScoreSum = Object.values(evaluations).reduce((sum, e) => sum + e.score, 0);
  const score = questions.length > 0 ? Math.round(totalScoreSum / questions.length) : 0;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border-[6px] border-brand-blue-dark overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-brand-blue uppercase tracking-widest mb-2">
            READING COMPREHENSION
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Type your answer or click the Microphone to speak!
          </p>
        </div>

        <div className="space-y-8">
          {questions.map((q, qIdx) => {
            const evaluation = evaluations[qIdx];
            const isLoading = loadingMap[qIdx];
            const answerText = textAnswers[qIdx] || "";

            return (
              <div key={qIdx} className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm shrink-0 mt-1">
                    {qIdx + 1}
                  </div>
                  <div className="flex-1 font-semibold text-slate-800 pt-1 leading-relaxed">
                    {q.question}
                    
                    <div className="mt-3 relative">
                      <textarea
                        value={answerText}
                        onChange={(e) => setTextAnswers(prev => ({ ...prev, [qIdx]: e.target.value }))}
                        disabled={isLoading || evaluation !== undefined}
                        placeholder="Type your answer here..."
                        className="w-full p-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-brand-blue outline-none transition-colors resize-none text-sm font-medium"
                        rows={2}
                      />
                      <button
                        onClick={() => activeMic === qIdx ? handleStopMic() : startSpeechRecognition(qIdx)}
                        disabled={isLoading || evaluation !== undefined}
                        className={`absolute right-2 top-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          activeMic === qIdx
                            ? 'bg-rose-50 text-rose-500 animate-pulse'
                            : 'bg-slate-50 text-slate-400 hover:text-brand-blue hover:bg-blue-50'
                        }`}
                        title="Answer by voice"
                      >
                        {activeMic === qIdx ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {!evaluation && (
                    <button
                      onClick={() => handleEvaluate(qIdx)}
                      disabled={isLoading || !answerText.trim()}
                      className={`h-10 px-4 rounded-xl flex items-center justify-center font-bold transition-all shrink-0 mt-8 ${
                        isLoading || !answerText.trim()
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-blue text-white shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95'
                      }`}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
                    </button>
                  )}
                </div>

                {/* Evaluation Result */}
                {evaluation && !isLoading && activeMic !== qIdx && (
                  <div className={`ml-0 sm:ml-12 p-4 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 ${
                    evaluation.isCorrect ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'
                  }`}>
                    <div className="flex gap-3 mb-2">
                      {evaluation.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Em đã trả lời:</div>
                          <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${evaluation.isCorrect ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            Điểm: {evaluation.score}/10
                          </div>
                        </div>
                        <div className={`font-medium ${evaluation.isCorrect ? 'text-green-800' : 'text-orange-800'} italic`}>
                          "{evaluation.studentAnswer}"
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-black/5">
                      <div className="flex gap-2 items-start">
                        <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${evaluation.isCorrect ? 'text-green-600' : 'text-orange-500'}`} />
                        <div>
                          <span className={`text-xs font-black block mb-0.5 ${evaluation.isCorrect ? 'text-green-700' : 'text-orange-700'}`}>
                            Cô Yến nhận xét:
                          </span>
                          <span className={`text-sm ${evaluation.isCorrect ? 'text-green-900' : 'text-orange-900'} leading-relaxed block`}>
                            {evaluation.feedback}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAllAnswered && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 text-brand-blue font-bold mb-4">
                <Award className="w-6 h-6" />
                <span className="uppercase tracking-wider">Your Result</span>
              </div>
              <div className="text-4xl font-black text-brand-blue-dark text-center mb-2">
                {score}/10
              </div>
              <div className="text-center text-sm font-medium text-brand-blue/80">
                (Correct {correctCount}/{questions.length})
              </div>
            </div>

            <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-6">
              <div className="font-black text-pink-600 mb-4 uppercase tracking-wide">Feedback from Cô Yến:</div>
              {correctCount === questions.length ? (
                <p className="text-pink-800 font-medium">Tuyệt vời! Em đã trả lời chính xác tất cả các câu hỏi! 🎉</p>
              ) : (
                <div className="text-pink-800 space-y-4 text-sm">
                  <p className="font-bold">Khá lắm! Tuy nhiên em hãy xem lại đáp án gợi ý cho các câu chưa chính xác nhé:</p>
                  <div className="space-y-3">
                    {questions.map((q, idx) => {
                      const evalResult = evaluations[idx];
                      if (evalResult && !evalResult.isCorrect) {
                        return (
                          <div key={idx} className="bg-white/80 p-4 rounded-xl border border-pink-100 shadow-sm">
                            <span className="font-black text-pink-700 block mb-1">Question {idx + 1}:</span> 
                            <span className="text-slate-700 font-medium leading-relaxed">{q.suggestedAnswer}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <button
                onClick={() => { setEvaluations({}); setTextAnswers({}); }}
                className="w-full bg-slate-100 text-slate-700 font-black uppercase tracking-wider py-4 rounded-xl hover:bg-slate-200 transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-200"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
