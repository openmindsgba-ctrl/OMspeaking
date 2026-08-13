import React from 'react';
import { CheckCircle, Zap } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKey, onOpenApiKeyModal }) => (
  <header className="bg-brand-blue border-b border-brand-blue-dark sticky top-0 z-50 shadow-lg overflow-hidden">
    <div className="max-w-7xl mx-auto px-3 sm:px-4 h-20 sm:h-28 flex items-center justify-between relative">
      
      {/* Left spacer for balance */}
      <div className="w-10 sm:w-32 shrink-0"></div>
      
      {/* Centered Logo & Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 sm:gap-5 w-full px-16 sm:px-32 z-10">
        <BrandLogo className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 shadow-sm bg-white p-1 rounded-lg" />
        <h1 className="text-[16px] sm:text-3xl md:text-4xl font-black tracking-tight text-brand-gold uppercase truncate drop-shadow-md">Open Minds English Centre</h1>
      </div>
      
      {/* API Key button on the right */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative z-20">
        <button 
          onClick={onOpenApiKeyModal}
          className="flex flex-col items-end group"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all border border-white/20">
            <Zap size={14} className="text-brand-gold sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">Cài đặt API Key</span>
          </div>
          {!apiKey && (
            <span className="text-[9px] sm:text-[10px] font-bold text-red-600 mt-1 animate-pulse bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
              Lấy API key để sử dụng app
            </span>
          )}
        </button>

        <div className="hidden md:flex items-center gap-4 text-xs font-bold text-white/80">
          <span className="flex items-center gap-1.5 bg-brand-blue-dark/40 px-3 py-1.5 rounded-full"><CheckCircle size={16} className="text-brand-gold" /> Learn English to go further.</span>
        </div>
      </div>
    </div>
  </header>
);

