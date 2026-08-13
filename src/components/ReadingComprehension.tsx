import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Award, Mic, MicOff, Loader2 } from 'lucide-react';

export interface ComprehensionQuestion {
  question: string;
  options: string[];  // 4 options A, B, C, D
  correctAnswer: string; // e.g. "A", "B", "C", or "D"
  suggestedAnswer: string; // Full text explanation
}

interface ReadingComprehensionProps {
  questions: ComprehensionQuestion[];
}

export const ReadingComprehension: React.FC<ReadingComprehensionProps> = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeMic, setActiveMic] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  const letters = ['A', 'B', 'C', 'D'];

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startSpeechRecognition = (qIdx: number) => {
    if (isSubmitted) return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome.');
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

    let hasSelected = false;

    recognition.onstart = () => {
      setActiveMic(qIdx);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      if (hasSelected) return;
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      
      setTranscript(finalTranscript);
      const spoken = finalTranscript.toLowerCase().trim();
      if (!spoken) return;

      const q = questions[qIdx];
      
      // Match against A, B, C, D letters
      const matchesLetter = spoken.match(/\b(a|b|c|d)\b/i) || spoken.match(/\b(ây|bi|xi|đi)\b/i);
      if (matchesLetter) {
        const letterMap: Record<string, string> = { 'a': 'A', 'ây': 'A', 'b': 'B', 'bi': 'B', 'c': 'C', 'xi': 'C', 'd': 'D', 'đi': 'D' };
        const key = matchesLetter[1].toLowerCase();
        handleOptionSelect(qIdx, letterMap[key]);
        hasSelected = true;
        recognition.stop();
        return;
      }

      // Match against option text
      for (let i = 0; i < q.options.length; i++) {
        const optText = q.options[i].replace(/^[A-D]\.\s*/, '').toLowerCase().trim();
        // Allow selection if they speak exactly the text, or at least a significant portion
        if (spoken.includes(optText) || (optText.length > 4 && spoken.includes(optText.substring(0, optText.length / 2)))) {
          handleOptionSelect(qIdx, letters[i]);
          hasSelected = true;
          recognition.stop();
          return;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setActiveMic(null);
    };

    recognition.onend = () => {
      setActiveMic(null);
      setTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setActiveMic(null);
      setTranscript("");
    }
  };

  const handleOptionSelect = (qIndex: number, letter: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qIndex]: letter
    }));
  };

  const calculateScore = () => {
    const correctCount = questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);
    return {
      correctCount,
      score: Math.round((correctCount / questions.length) * 10)
    };
  };

  const { correctCount, score } = calculateScore();

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border-[6px] border-brand-blue-dark overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-brand-blue uppercase tracking-widest mb-2">
            READING COMPREHENSION
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Chọn đáp án đúng (A, B, C hoặc D) hoặc ấn vào nút Micro và đọc to đáp án!
          </p>
        </div>

        <div className="space-y-8">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm shrink-0 mt-1">
                  {qIdx + 1}
                </div>
                <div className="flex-1 font-semibold text-slate-800 pt-1 leading-relaxed">
                  {q.question}
                  
                  {/* Live transcript feedback for active mic */}
                  {activeMic === qIdx && transcript && (
                    <div className="mt-2 text-xs text-blue-600 font-medium italic bg-blue-50 p-2 rounded-lg border border-blue-100">
                      Bạn đang nói: "{transcript}"
                    </div>
                  )}
                </div>
                
                {/* Voice Answer Button */}
                {!isSubmitted && (
                  <button
                    onClick={() => activeMic === qIdx ? stopSpeechRecognition() : startSpeechRecognition(qIdx)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm border-2 ${
                      activeMic === qIdx
                        ? 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-brand-blue hover:border-brand-blue hover:bg-blue-50'
                    }`}
                    title="Trả lời bằng giọng nói"
                  >
                    {activeMic === qIdx ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0 sm:pl-12">
                {q.options.map((option, optIdx) => {
                  const letter = letters[optIdx];
                  const isSelected = selectedAnswers[qIdx] === letter;
                  const isCorrect = letter === q.correctAnswer;
                  
                  let btnClasses = "rounded-xl border-2 p-3 text-left font-medium text-sm transition-all relative flex justify-between items-center w-full ";
                  
                  if (!isSubmitted) {
                    if (isSelected) {
                      btnClasses += "border-brand-blue bg-blue-50 text-brand-blue-dark";
                    } else {
                      btnClasses += "border-slate-200 bg-white hover:border-brand-blue hover:bg-blue-50 text-slate-700 cursor-pointer";
                    }
                  } else {
                    btnClasses += "cursor-default ";
                    if (isCorrect) {
                      btnClasses += "border-green-500 bg-green-50 text-green-700";
                    } else if (isSelected && !isCorrect) {
                      btnClasses += "border-red-500 bg-red-50 text-red-700";
                    } else {
                      btnClasses += "border-slate-200 bg-white opacity-50 text-slate-500";
                    }
                  }
                  
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleOptionSelect(qIdx, letter)}
                      disabled={isSubmitted}
                      className={btnClasses}
                    >
                      <div className="flex gap-2">
                        <span className="font-bold shrink-0">{letter}.</span>
                        <span>{option.replace(/^[A-D]\.\s*/, '')}</span>
                      </div>
                      {isSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-green-500 shrink-0 ml-2" />}
                      {isSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {isSubmitted && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 text-brand-blue font-bold mb-4">
                <Award className="w-6 h-6" />
                <span className="uppercase tracking-wider">Kết quả</span>
              </div>
              <div className="text-4xl font-black text-brand-blue-dark text-center">
                {score}/10
              </div>
            </div>

            <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-6 mb-6">
              <div className="font-black text-pink-600 mb-4 uppercase tracking-wide">Ms. Yến nhận xét:</div>
              {correctCount === questions.length ? (
                <p className="text-pink-800 font-medium">Tuyệt vời! Em đã làm đúng hết rồi nhé! 🎉</p>
              ) : (
                <div className="text-pink-800 space-y-4 text-sm">
                  <p className="font-bold">Em xem lại các câu sai nhé:</p>
                  <div className="space-y-3">
                    {questions.map((q, idx) => {
                      if (selectedAnswers[idx] !== q.correctAnswer) {
                        return (
                          <div key={idx} className="bg-white/80 p-4 rounded-xl border border-pink-100 shadow-sm">
                            <span className="font-black text-pink-700 block mb-1">Câu {idx + 1}:</span> 
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
          </div>
        )}

        <div className="mt-8">
          {!isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(true)}
              disabled={Object.keys(selectedAnswers).length < questions.length}
              className="w-full bg-brand-blue text-white font-black uppercase tracking-wider py-4 rounded-xl hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSubmitted(false);
                setSelectedAnswers({});
              }}
              className="w-full bg-slate-100 text-slate-700 font-black uppercase tracking-wider py-4 rounded-xl hover:bg-slate-200 transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 border-2 border-slate-200"
            >
              Làm lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
