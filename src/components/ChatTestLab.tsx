import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldAlert, Sparkles, Database, CheckCircle, RefreshCw, AlertCircle, Clock, Search, BookOpen } from 'lucide-react';
import { ChatMessage, RetrievedDoc } from '../types';

interface ChatTestLabProps {
  systemBotName: string;
}

export const ChatTestLab: React.FC<ChatTestLabProps> = ({ systemBotName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `主公近來可好！吾乃《熱血三國M》官方 AI 攻略軍師【${systemBotName}】。\n\n我專職解答官方資料庫內記載之【武將屬性、名將抓取、戰法組合、陣容評測與戰鬥機制】。您可以隨意測試提問，亦可點選下方快速測試按鈕測試領域防衛防禦效果！`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDocMsg, setSelectedDocMsg] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      let rawResponseText = '';
      try {
        rawResponseText = await res.text();
      } catch (readErr: any) {
        throw new Error(`網路讀取失敗：${readErr.message}`);
      }

      let data: any = null;
      if (rawResponseText) {
        try {
          data = JSON.parse(rawResponseText);
        } catch (jsonErr) {
          // If server returned HTML (like 502/503 Cloud Run Cold Start or Nginx warming up)
          if (rawResponseText.includes('<!DOCTYPE') || rawResponseText.includes('<html')) {
            throw new Error(`伺服器容器正在冷啟動中 (HTTP ${res.status})，請稍候 3~5 秒後再次點擊發送！`);
          }
          throw new Error(`伺服器未回傳有效 JSON (HTTP ${res.status})：${rawResponseText.slice(0, 100)}`);
        }
      }

      if (!res.ok || !data) {
        throw new Error(data?.message || `伺服器回應異常 (${res.status})，請稍候重試`);
      }

      if (data.success) {
        const botMsg: ChatMessage = {
          id: 'msg-ai-' + Date.now(),
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          retrievedDocs: data.retrievedDocs || [],
          refused: data.refused,
          executionTimeMs: data.executionTimeMs,
          modelUsed: data.modelUsed,
        };
        setMessages((prev) => [...prev, botMsg]);
        setSelectedDocMsg(botMsg);
      } else {
        const errorMsg: ChatMessage = {
          id: 'msg-err-' + Date.now(),
          sender: 'assistant',
          text: '⚠️ 軍師提醒：' + (data.message || '無法連線至資料庫'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: '⚠️ 查詢提示：' + err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '🗡️ 關羽數值與戰略', text: '請問關羽的初始勇武、統率與智謀數值如何？適合作為主將攻城還是野戰？' },
    { label: '🏹 10級黃巾城打法', text: '請問攻打10級黃巾城需要多少兵力？投石車與衝車應該如何配比？' },
    { label: '📜 12大兵種克制與射程', text: '請解析熱血三國投石車、弓箭兵、鐵騎兵與衝車的射程與克制機制。' },
    { label: '🏰 陷阱拒馬踩平計算', text: '敵城有 5000 陷阱與 3000 拒馬，需要多少砲灰義兵才能零傷亡踩平？' },
    { label: '⛔ 拒絕測試：天氣詢問', text: '請問明天台北與台中的天氣預報如何？有需要帶傘嗎？' },
    { label: '⛔ 拒絕測試：無關遊戲', text: '可以推薦台北市信義區好吃的麻辣火鍋店嗎？' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8.5rem)] min-h-[600px]">
      {/* Main Chat Area (2 cols on large screen) */}
      <div className="lg:col-span-2 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Chat Room Header */}
        <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <span>網頁即時測試對話框</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-normal">
                  RAG 檢索增強
                </span>
              </h2>
              <p className="text-xs text-slate-400">即時調用官方知識庫，測試問答品質與領域拒絕規則</p>
            </div>
          </div>

          <button
            onClick={() => {
              setMessages([
                {
                  id: 'welcome-' + Date.now(),
                  sender: 'assistant',
                  text: `對話紀錄已重置。我是【${systemBotName}】，請輸入遊戲問題開始測試。`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
              setSelectedDocMsg(null);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded transition"
            title="清空對話"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重置對話</span>
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-slate-950/60 p-2.5 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-xs text-amber-400/90 font-medium whitespace-nowrap pl-1">快速測試題：</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.text)}
              disabled={loading}
              className="px-2.5 py-1 text-xs rounded-full bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-200 border border-slate-700/80 hover:border-amber-500/40 whitespace-nowrap transition"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`flex space-x-3 max-w-[88%] ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-amber-600 text-amber-100 shadow'
                        : msg.refused
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                        : 'bg-slate-800 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                        isUser
                          ? 'bg-amber-600/90 text-white rounded-tr-none'
                          : msg.refused
                          ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-tl-none'
                          : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {/* Refusal Badge if applicable */}
                      {msg.refused && (
                        <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-semibold mb-2 pb-1.5 border-b border-rose-800/50">
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          <span>【已觸發官方知識庫領域防護 Guardrail】</span>
                        </div>
                      )}

                      {msg.text}

                      {/* Footer Info for AI Messages */}
                      {!isUser && (
                        <div className="mt-3 pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                          <div className="flex items-center space-x-2">
                            {msg.executionTimeMs && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{msg.executionTimeMs}ms</span>
                              </span>
                            )}
                            {msg.modelUsed && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-400 text-[10px]">
                                {msg.modelUsed}
                              </span>
                            )}
                          </div>

                          {/* Inspect Documents Button */}
                          {msg.retrievedDocs && msg.retrievedDocs.length > 0 && (
                            <button
                              onClick={() => setSelectedDocMsg(msg)}
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs transition ${
                                selectedDocMsg?.id === msg.id
                                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                                  : 'bg-slate-700/60 hover:bg-slate-700 text-amber-400'
                              }`}
                            >
                              <Database className="w-3 h-3" />
                              <span>檢索參考 ({msg.retrievedDocs.length} 筆)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <span className={`text-[10px] text-slate-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
              <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 text-xs text-slate-300 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span>軍師正在查閱官方資料庫並生成解析...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="請輸入《熱血三國M》遊戲相關問題（例：名將抓取機制？桃園盾怎麼搭配？諸葛亮神機妙算效果？...）"
              className="flex-1 bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/80 placeholder-slate-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center space-x-1.5 shadow-md transition"
            >
              <span>問軍師</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RAG Inspector Sidebar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full overflow-hidden shadow-xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-sm">RAG 官方資料庫檢索監控</h3>
        </div>

        {selectedDocMsg && selectedDocMsg.retrievedDocs && selectedDocMsg.retrievedDocs.length > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-300">
              <span className="font-semibold">當前審視訊息：</span>
              <p className="text-slate-300 italic mt-0.5 text-[11px] truncate">"{selectedDocMsg.text.slice(0, 50)}..."</p>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              命中官方文獻條目 ({selectedDocMsg.retrievedDocs.length} 筆)：
            </div>

            {selectedDocMsg.retrievedDocs.map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2 hover:border-amber-500/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">{doc.title}</h4>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                    相關度 {Math.round(doc.score * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                  <span className="bg-slate-900 px-2 py-0.5 rounded text-amber-400 border border-slate-700">
                    分類：{doc.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/80 p-2 rounded border border-slate-800 leading-relaxed font-mono text-[11px]">
                  {doc.contentSnippet}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">尚未選擇或無 RAG 檢索參考</p>
              <p className="text-[11px] text-slate-500 mt-1">
                發送提問或點選 AI 回應對話框底部的【檢索參考】按鈕，即可在此檢視檢索得出的官方遊戲條目。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
