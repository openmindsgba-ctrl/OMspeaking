import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FileText, Volume2, Pause, RefreshCw, Target, Play, BookOpen, Lightbulb, Zap } from 'lucide-react';
import { VocabularyItem, EnglishLevel } from '../types';

interface PosterPreviewProps {
  readingText: string | null;
  translationText: string | null;
  vocabulary: VocabularyItem[];
  generatedTopicName: string | null;
  topic: string;
  level: EnglishLevel;
  showTranslation: boolean;
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isAudioLoading: boolean;
  isBrowserTTS: boolean;
  setIsPlaying: (playing: boolean) => void;
  handlePlayAudio: () => Promise<void>;
  isDownloading: boolean;
  onDownloadPoster: () => void;
  onToggleTranslation: () => void;
  posterRef: React.RefObject<HTMLDivElement | null>;
  grammarSummary?: string | null;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-brand-blue-dark">{part.slice(2, -2)}</strong>;
    }
    return <span key={i} className="font-medium">{part}</span>;
  });
};

const playWordAudio = (e: React.MouseEvent, word: string) => {
  e.stopPropagation();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
};

interface MindMapNode {
  label: string;
  children: MindMapNode[];
}

const parseMarkdownToTree = (md: string): MindMapNode[] => {
  const lines = md.split('\n').filter(line => line.trim().length > 0);
  const rootNodes: MindMapNode[] = [];
  const stack: { node: MindMapNode, indent: number }[] = [];

  lines.forEach(line => {
    const match = line.match(/^(\s*)-\s+(.*)/);
    if (!match) return;
    const indent = match[1].length;
    let label = match[2];
    label = label.replace(/\*\*/g, '');

    const newNode = { label, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootNodes.push(newNode);
    } else {
      stack[stack.length - 1].node.children.push(newNode);
    }
    stack.push({ node: newNode, indent });
  });

  if (rootNodes.length === 0) {
    return [{ label: "Ngữ pháp", children: [{ label: md, children: [] }] }];
  }
  return rootNodes;
};

const MindMapTree = ({ nodes, level = 0 }: { nodes: MindMapNode[], level?: number }) => {
  const colors = [
    'bg-indigo-600 text-white shadow-md border border-indigo-700', 
    'bg-indigo-100 text-indigo-900 shadow-sm border border-indigo-200', 
    'bg-blue-50 text-blue-800 border border-blue-100', 
    'bg-white text-slate-700 border border-slate-200'
  ];
  
  return (
    <div className={`flex flex-col gap-3 ${level > 0 ? 'ml-6 pl-4 border-l-2 border-indigo-200 relative' : ''}`}>
      {nodes.map((node, i) => {
        const colorClass = colors[Math.min(level, colors.length - 1)];
        return (
          <div key={i} className="flex flex-col gap-3 relative">
            {level > 0 && (
              <div className="absolute -left-4 top-[14px] w-4 h-[2px] bg-indigo-200"></div>
            )}
            <div className={`w-fit px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base ${colorClass} max-w-full sm:max-w-[90%] whitespace-normal`}>
              {node.label}
            </div>
            {node.children && node.children.length > 0 && (
              <MindMapTree nodes={node.children} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ====== GRAMMAR DETAIL SECTION ======
interface GrammarBlock {
  title: string;
  explanation: string;
  formula: string | null;
  examples: string[];
  tip: string | null;
}

const parseGrammarBlocks = (md: string): GrammarBlock[] => {
  const lines = md.split('\n').filter(l => l.trim().length > 0);
  const blocks: GrammarBlock[] = [];
  let current: Partial<GrammarBlock> | null = null;
  let collectingExamples = false;
  let collectingTip = false;

  const flushBlock = () => {
    if (current && current.title) {
      blocks.push({
        title: current.title || '',
        explanation: current.explanation || '',
        formula: current.formula || null,
        examples: current.examples || [],
        tip: current.tip || null,
      });
    }
    current = null;
    collectingExamples = false;
    collectingTip = false;
  };

  lines.forEach(line => {
    const trimmed = line.trim();
    const cleanLine = trimmed.replace(/^-\s*/, '').replace(/\*\*/g, '');

    // Detect top-level grammar point (no leading spaces or minimal indent)
    const indent = line.search(/\S/);
    const isBullet = trimmed.startsWith('-');

    if (isBullet && indent <= 2) {
      // This is a top-level grammar point
      flushBlock();
      current = { title: cleanLine, explanation: '', formula: null, examples: [], tip: null };
      collectingExamples = false;
      collectingTip = false;
    } else if (current) {
      const lower = cleanLine.toLowerCase();
      
      // Detect formula / công thức / cấu trúc
      if (lower.includes('công thức') || lower.includes('cấu trúc') || lower.includes('structure') || lower.includes('formula') || lower.includes('pattern')) {
        const formulaContent = cleanLine.replace(/^(công thức|cấu trúc|structure|formula|pattern)\s*[:：]\s*/i, '').trim();
        if (formulaContent) {
          current.formula = formulaContent;
        }
        collectingExamples = false;
        collectingTip = false;
      }
      // Detect examples / ví dụ
      else if (lower.includes('ví dụ') || lower.includes('example') || lower.includes('e.g.')) {
        collectingExamples = true;
        collectingTip = false;
        const exContent = cleanLine.replace(/^(ví dụ|example|e\.g\.)\s*[:：]\s*/i, '').trim();
        if (exContent) {
          (current.examples = current.examples || []).push(exContent);
        }
      }
      // Detect tips / mẹo
      else if (lower.includes('mẹo') || lower.includes('tip') || lower.includes('lưu ý') || lower.includes('nhớ') || lower.includes('ghi nhớ')) {
        collectingTip = true;
        collectingExamples = false;
        const tipContent = cleanLine.replace(/^(mẹo|tip|lưu ý|ghi nhớ|nhớ)\s*[:：]\s*/i, '').trim();
        current.tip = tipContent || null;
      }
      // Continue collecting examples or add to explanation
      else if (collectingExamples && cleanLine) {
        (current.examples = current.examples || []).push(cleanLine);
      }
      else if (collectingTip && cleanLine) {
        current.tip = (current.tip ? current.tip + ' ' : '') + cleanLine;
      }
      else if (cleanLine) {
        // Check if this looks like a formula (contains S + V, arrows, etc.)
        if (cleanLine.match(/[+→=>]/) && cleanLine.length < 100) {
          current.formula = cleanLine;
        } else {
          current.explanation = (current.explanation ? current.explanation + ' ' : '') + cleanLine;
        }
      }
    }
  });
  flushBlock();

  // Fallback: if no blocks were parsed, create a single block from the text
  if (blocks.length === 0 && md.trim()) {
    blocks.push({
      title: 'Ngữ pháp trọng tâm',
      explanation: md.replace(/\*\*/g, '').replace(/^-\s*/gm, ''),
      formula: null,
      examples: [],
      tip: null,
    });
  }

  return blocks;
};

const GRAMMAR_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-gradient-to-r from-blue-600 to-blue-700', badge: 'bg-blue-100 text-blue-700', accent: 'text-blue-600' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-gradient-to-r from-emerald-600 to-teal-600', badge: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-600' },
  { bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-gradient-to-r from-violet-600 to-purple-600', badge: 'bg-violet-100 text-violet-700', accent: 'text-violet-600' },
  { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-gradient-to-r from-amber-600 to-orange-600', badge: 'bg-amber-100 text-amber-700', accent: 'text-amber-600' },
  { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-gradient-to-r from-rose-600 to-pink-600', badge: 'bg-rose-100 text-rose-700', accent: 'text-rose-600' },
];

const GrammarDetailSection: React.FC<{ grammarText: string }> = ({ grammarText }) => {
  const blocks = useMemo(() => parseGrammarBlocks(grammarText), [grammarText]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  return (
    <div className="mt-6 space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <BookOpen size={18} />
        </div>
        <div>
          <h3 className="text-base font-black uppercase tracking-widest" style={{ color: '#4338ca' }}>
            Tóm Tắt Ngữ Pháp
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Grammar Summary & Examples</p>
        </div>
      </div>

      {/* Grammar Cards */}
      <div className="space-y-3">
        {blocks.map((block, idx) => {
          const colors = GRAMMAR_COLORS[idx % GRAMMAR_COLORS.length];
          const isExpanded = expandedIdx === idx;

          return (
            <div
              key={idx}
              className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md`}
            >
              {/* Card Header - clickable */}
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className={`w-full flex items-center gap-3 p-3 sm:p-4 text-left transition-all ${isExpanded ? colors.header + ' text-white' : 'hover:bg-white/50'}`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${isExpanded ? 'bg-white/20 text-white' : colors.badge}`}>
                  {idx + 1}
                </span>
                <span className={`text-sm sm:text-base font-bold flex-1 ${isExpanded ? 'text-white' : 'text-slate-800'}`}>
                  {block.title}
                </span>
                <span className={`text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white/70' : 'text-slate-400'}`}>
                  ▼
                </span>
              </button>

              {/* Card Body - expandable */}
              {isExpanded && (
                <div className="p-3 sm:p-4 space-y-3 animate-in fade-in duration-300">
                  {/* Explanation */}
                  {block.explanation && (
                    <div className="text-sm text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-500 text-xs uppercase tracking-wide mr-1">📖 Giải thích:</span>
                      <span>{block.explanation}</span>
                    </div>
                  )}

                  {/* Formula / Structure */}
                  {block.formula && (
                    <div className="relative p-3 sm:p-4 rounded-xl bg-white border-2 border-dashed border-indigo-200 shadow-inner">
                      <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm">
                        Công thức
                      </div>
                      <p className="text-base sm:text-lg font-black text-center text-indigo-800 mt-1 font-mono tracking-wide">
                        {block.formula}
                      </p>
                    </div>
                  )}

                  {/* Examples */}
                  {block.examples.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Zap size={14} className={colors.accent} />
                        <span className="text-xs font-black uppercase tracking-wide text-slate-500">Ví dụ minh họa</span>
                      </div>
                      <div className="space-y-2 pl-1">
                        {block.examples.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                              {exIdx + 1}
                            </span>
                            <p className="text-sm text-slate-700 leading-relaxed italic">
                              "{ex}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tip */}
                  {block.tip && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                      <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wide text-amber-600 block mb-0.5">💡 Mẹo ghi nhớ</span>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">{block.tip}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  readingText, translationText, vocabulary,
  generatedTopicName, topic, level, showTranslation,
  audioUrl, audioRef, isPlaying, isAudioLoading, isBrowserTTS,
  setIsPlaying, handlePlayAudio,
  isDownloading, onDownloadPoster, onToggleTranslation,
  posterRef, grammarSummary
}) => {
  return (
    <div
      ref={posterRef}
      data-poster-container
      className="p-3 sm:p-4 flex flex-col gap-4 relative overflow-hidden"
      style={{
        fontFamily: "'Libre Baskerville', serif",
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        color: '#1a1a1a',
        borderRadius: '24px',
        border: '2px solid #e2e8f0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '600px'
      }}
    >

      {/* Text Section */}
      <div className="flex-1 p-3" style={{ backgroundColor: '#ffffff', border: '3px solid #1D4ED8', borderRadius: '16px', boxShadow: '0 4px 0 #1E3A8A' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: '#1D4ED8' }} />
            <h2 className="text-base font-black" style={{ color: '#1E3A8A', margin: 0 }}>Trung tâm ngoại ngữ Open Minds</h2>
          </div>
          <div className="flex items-center gap-2" data-html2canvas-ignore>
            <button
              onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
              disabled={isAudioLoading && !audioUrl && !isBrowserTTS}
              className="p-2 rounded-full transition-all"
              style={{
                backgroundColor: isPlaying ? '#DBEAFE' : isAudioLoading ? '#f3f4f6' : '#f9fafb',
                color: isPlaying ? '#1D4ED8' : isAudioLoading ? '#d1d5db' : '#9ca3af'
              }}
              title={isPlaying ? "Dừng" : "Nghe bài đọc"}
            >
              {isAudioLoading && !audioUrl && !isBrowserTTS ? <RefreshCw size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-3">

          {/* Vocabulary */}
          {vocabulary && vocabulary.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Target size={18} /></div>
                <h3 className="text-base font-black uppercase tracking-widest" style={{ color: '#0369a1' }}>Word Bank</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vocabulary.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl flex flex-col transition-all hover:scale-[1.02] shadow-sm hover:shadow-indigo-100 bg-white border-2 border-indigo-100/50">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xl leading-tight" style={{ color: '#0c4a6e' }}>{item.word}</span>
                        <button 
                          onClick={(e) => playWordAudio(e, item.word)}
                          className="text-brand-blue hover:text-brand-gold transition-colors"
                          title="Nghe phát âm"
                        >
                          <Volume2 size={20} />
                        </button>
                      </div>
                      <span className="text-sm font-bold font-serif text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm shrink-0">{item.ipa}</span>
                    </div>
                    <span className="text-base font-medium italic text-slate-700 whitespace-normal leading-relaxed mb-1">{item.meaning} {item.emoji}</span>
                    {item.example && (
                      <div className="text-xs text-gray-700 mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200 italic">
                        <strong>Ví dụ:</strong> "{item.example}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar Summary */}
          {grammarSummary && (
            <>
              {/* Mindmap View */}
              <div className="mt-6 p-5 bg-indigo-50 border-2 border-indigo-200 rounded-[1.5rem] shadow-sm overflow-x-auto">
                <h4 className="text-sm font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Mindmap Ngữ Pháp
                </h4>
                <MindMapTree nodes={parseMarkdownToTree(grammarSummary)} />
              </div>

              {/* Detailed Grammar Summary with Examples */}
              <GrammarDetailSection grammarText={grammarSummary} />
            </>
          )}

          <div className="bg-white/40 mt-8 p-3 sm:p-4 md:p-8 rounded-[2rem] border-2 border-white shadow-lg backdrop-blur-sm mx-auto w-full max-w-[95%]">
            {(generatedTopicName || (topic && topic.length < 50)) && (
              <div className="text-center mb-6">
                <h3 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight" style={{ color: '#0369a1', lineHeight: '1.1' }}>
                  {generatedTopicName || topic}
                </h3>
              </div>
            )}
            {/* Custom Audio Player */}
            {audioUrl && (
              <div data-html2canvas-ignore className="mb-6">
                <CustomAudioPlayer audioUrl={audioUrl} audioRef={audioRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
              </div>
            )}
            <div className="text-[11px] font-black uppercase tracking-[0.4em] mb-4 text-center" style={{ color: '#0369a1', opacity: 0.5 }}>READING PASSAGE</div>
            <div
              className="leading-[1.6] whitespace-pre-wrap text-left md:text-justify px-2"
              style={{
                color: '#1e293b',
                fontSize: readingText && readingText.length > 500 ? '18px' : readingText && readingText.length > 300 ? '22px' : readingText && readingText.length > 150 ? '26px' : '30px',
                fontFamily: '"Outfit", sans-serif'
              }}
            >
              {readingText ? renderMarkdown(readingText) : null}
            </div>
          </div>

          {showTranslation && translationText && (
            <div className="space-y-2 pt-3 mt-4" style={{ borderTop: '2px solid #fef3c7' }}>
              <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#d97706' }}>Tiếng Việt</div>
              <div className="text-sm sm:text-lg leading-relaxed whitespace-pre-wrap font-bold italic" style={{ color: '#334155' }}>
                {translationText}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid #f3f4f6' }}>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9ca3af' }}>TRUNG TÂM NGOẠI NGỮ Open Minds</span>
        <span className="text-[10px] font-black" style={{ color: '#1D4ED8' }}>Level: {level}</span>
      </div>
    </div>
  );
};


// ====== CUSTOM AUDIO PLAYER ======
const CustomAudioPlayer: React.FC<{
  audioUrl: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
}> = ({ audioUrl, audioRef, isPlaying, setIsPlaying }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    // Set initial duration if already loaded
    if (audio.duration) setDuration(audio.duration);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioRef, setIsPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [audioRef, isPlaying]);

  const handleSpeedChange = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const currentIdx = SPEED_OPTIONS.indexOf(speed);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIdx];
    audio.playbackRate = newSpeed;
    setSpeed(newSpeed);
  }, [audioRef, speed]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = ratio * duration;
  }, [audioRef, duration]);

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mb-3 px-1 space-y-2">
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Play/Pause Button */}
        <button onClick={togglePlay}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm"
          style={{
            background: isPlaying ? 'linear-gradient(135deg, #1D4ED8, #DC2626)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
            color: '#ffffff'
          }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-0.5">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="w-full h-2 bg-slate-100 rounded-full cursor-pointer group relative overflow-hidden"
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #1D4ED8)' }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-indigo-500 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed Button */}
        <button
          onClick={handleSpeedChange}
          className="px-2 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 border"
          style={{
            backgroundColor: speed !== 1 ? '#eef2ff' : '#f9fafb',
            borderColor: speed !== 1 ? '#c7d2fe' : '#e5e7eb',
            color: speed !== 1 ? '#4f46e5' : '#6b7280'
          }}
          title="Thay đổi tốc độ"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
};

