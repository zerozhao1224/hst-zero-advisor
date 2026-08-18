import React from 'react';
import { Bot, ShieldCheck, Database, MessageSquare, Castle, Settings, Code, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'kb' | 'siege' | 'config' | 'discord';
  setActiveTab: (tab: 'chat' | 'kb' | 'siege' | 'config' | 'discord') => void;
  kbCount: number;
  strictnessLevel: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  kbCount,
  strictnessLevel,
}) => {
  return (
    <header className="bg-slate-900 border-b border-amber-500/20 text-slate-100 sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-red-800 flex items-center justify-center shadow-md border border-amber-400/30">
              <Bot className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-wide text-amber-200">
                  《熱血三國》AI 攻略軍師
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  硬核經典 SLG 戰略版
                </span>
              </div>
              <p className="text-xs text-slate-400">
                攻城破防戰術 · 官方知識庫問答 · Discord BOT 控制台
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="hidden lg:flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">資料庫歸檔：</span>
              <span className="font-semibold text-amber-300">{kbCount} 筆</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">防護邊界：</span>
              <span className="font-semibold text-emerald-300">
                {strictnessLevel === 'strict'
                  ? '嚴格模式（僅回覆官方資料）'
                  : strictnessLevel === 'balanced'
                  ? '平衡模式'
                  : '引導模式'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Gemini 3.6 Flash 在線</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800 pt-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>1. 網頁測試環境 (AI問答)</span>
          </button>

          <button
            onClick={() => setActiveTab('kb')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'kb'
                ? 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. 官方攻略資料歸檔與上傳</span>
          </button>

          <button
            onClick={() => setActiveTab('siege')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'siege'
                ? 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Castle className="w-4 h-4 text-amber-400" />
            <span>3. 破防攻城規劃器</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>4. 系統語境與拒絕邊界</span>
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'discord'
                ? 'bg-indigo-500/20 text-indigo-300 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>5. Discord 社群 BOT 串接</span>
          </button>
        </div>
      </div>
    </header>
  );
};
