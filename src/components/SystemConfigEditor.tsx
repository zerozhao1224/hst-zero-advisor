import React, { useState } from 'react';
import { Settings, ShieldCheck, ShieldAlert, Sparkles, Sliders, RefreshCw, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { SystemConfig, KnowledgeCategory } from '../types';
import { DEFAULT_SYSTEM_CONFIG } from '../data/defaultKnowledgeBase';

interface SystemConfigEditorProps {
  config: SystemConfig;
  onSaveConfig: (newConfig: SystemConfig) => Promise<void>;
}

export const SystemConfigEditor: React.FC<SystemConfigEditorProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<SystemConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testPrompt, setTestPrompt] = useState('請問台北今天天氣如何？可以推薦好吃的餐廳嗎？');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const [keyTestResult, setKeyTestResult] = useState<any>(null);
  const [testingKey, setTestingKey] = useState(false);

  const checkGeminiKey = async () => {
    setTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await fetch('/api/test-gemini-key');
      let data: any;
      if (!res.ok) {
        throw new Error(`伺服器檢測異常 (${res.status})`);
      }
      try {
        data = await res.json();
      } catch {
        throw new Error('伺服器未回傳有效檢測數據');
      }
      setKeyTestResult(data);
    } catch (e: any) {
      setKeyTestResult({ success: false, message: '請求失敗：' + e.message });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = async () => {
    await onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_SYSTEM_CONFIG });
  };

  const handleToggleCategory = (cat: KnowledgeCategory) => {
    const exists = formData.activeCategories.includes(cat);
    const updated = exists
      ? formData.activeCategories.filter((c) => c !== cat)
      : [...formData.activeCategories, cat];
    setFormData({ ...formData, activeCategories: updated });
  };

  const runBoundaryTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testPrompt }),
      });
      const data = await res.json();
      setTestResult(data.text);
    } catch (e: any) {
      setTestResult('測試失敗：' + e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Main Prompt & Guardrail Settings */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>AI 軍師語境與領域防護設定 (Guardrail Rules)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                控制 AI 回應邊界，確保軍師只專注回答官方遊戲資料庫範疇，拒絕非遊戲話題。
              </p>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>儲存設定</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-lg flex items-center space-x-2 text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>系統語境與邊界防護設定已更新並套用至全站與 Discord BOT！</span>
            </div>
          )}

          {/* Bot Basic Info & Strictness Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">軍師 AI 稱號 (Bot Name)：</label>
              <input
                type="text"
                value={formData.botName}
                onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">領域防護嚴格度 (Strictness Level)：</label>
              <select
                value={formData.strictnessLevel}
                onChange={(e) => setFormData({ ...formData, strictnessLevel: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="strict">🔴 嚴格防護（100%僅答官方資料庫，違者秒拒）</option>
                <option value="balanced">🟡 溫和導向（禮貌拒絕並引導回遊戲攻略）</option>
                <option value="guided">🟢 開放問答（允許適度遊戲衍生問答）</option>
              </select>
            </div>
          </div>

          {/* Refusal Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>預設邊界拒絕回覆句型 (Refusal Message)：</span>
              <span className="text-[10px] text-amber-400">當玩家發問非遊戲內容時觸發</span>
            </label>
            <textarea
              rows={3}
              value={formData.refusalMessage}
              onChange={(e) => setFormData({ ...formData, refusalMessage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-rose-200 font-sans focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* System Instruction Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">系統核心提示詞 Prompt (System Instruction)：</label>
              <button
                onClick={handleResetDefaults}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>恢復官方預設 Prompt</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={formData.systemInstruction}
              onChange={(e) => setFormData({ ...formData, systemInstruction: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Active Knowledge Categories for RAG */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">啟用的官方知識庫分類 (RAG Categories Enabled)：</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { cat: 'generals', label: '🗡️ 武將庫' },
                { cat: 'tactics', label: '📜 戰法庫' },
                { cat: 'lineups', label: '🛡️ 陣容庫' },
                { cat: 'mechanics', label: '🏰 遊戲機制' },
                { cat: 'faq', label: '❓ 官方 FAQ' },
              ].map(({ cat, label }) => {
                const active = formData.activeCategories.includes(cat as KnowledgeCategory);
                return (
                  <button
                    key={cat}
                    onClick={() => handleToggleCategory(cat as KnowledgeCategory)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-left flex items-center justify-between ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[10px]">{active ? '✓ 啟用' : '停用'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold">AI 發散度 (Temperature)：</span>
              <span className="text-amber-400 font-bold">{formData.temperature} (推薦 0.2 ~ 0.4 保持精準不幻覺)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 bg-slate-950"
            />
          </div>
        </div>
      </div>

      {/* Right Col: Gemini Key Verification & Instant Boundary Sandbox */}
      <div className="space-y-6 flex flex-col">
        {/* Gemini API Key Connection Checker & Direct Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">Gemini API 金鑰設定與測試</h3>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            系統會自動讀取平台的 <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">Settings (⚙️)</code> 環境變數。若變數尚未重啟載入，您亦可直接在此處貼入 Gemini API Key 備用：
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              手動輸入 / 備用 Gemini API Key (可選)：
            </label>
            <input
              type="password"
              placeholder="貼入 AIza... 或 AQ. 開頭之 API Key"
              value={formData.customApiKey || ''}
              onChange={(e) => setFormData({ ...formData, customApiKey: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              支援 Google AI Studio 產生的標準金鑰（AIza... 或 AQ....），點擊下方「儲存設定」後即可立即生效！
            </p>
          </div>

          <button
            onClick={checkGeminiKey}
            disabled={testingKey}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-xs border border-amber-500/30 transition flex items-center justify-center space-x-2 shadow"
          >
            <RefreshCw className={`w-4 h-4 ${testingKey ? 'animate-spin' : ''}`} />
            <span>{testingKey ? '檢測連線中...' : '🔍 測試目前 Gemini API Key 連線狀態'}</span>
          </button>

          {keyTestResult && (
            <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${
              keyTestResult.success
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : keyTestResult.keyPresent
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1.5">
                  {keyTestResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{keyTestResult.success ? '✅ 套用連線成功！' : '⚠️ 金鑰檢測未通過'}</span>
                </span>
                {keyTestResult.maskedKey && (
                  <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded font-mono text-slate-300">
                    Key: {keyTestResult.maskedKey}
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed">{keyTestResult.message}</p>

              {keyTestResult.source && (
                <p className="text-[11px] text-slate-400">
                  金鑰來源：<span className="text-amber-300 font-medium">{keyTestResult.source}</span>
                </p>
              )}

              {keyTestResult.responseText && (
                <div className="bg-slate-950/80 p-2.5 rounded text-[11px] font-sans text-slate-200 border border-emerald-500/30">
                  <span className="text-amber-400 font-bold block mb-1">Gemini 3.6 Flash 即時回應：</span>
                  {keyTestResult.responseText}
                </div>
              )}

              {keyTestResult.error && (
                <div className="bg-slate-950/80 p-2.5 rounded text-[11px] font-mono text-rose-300 border border-rose-500/30 break-all">
                  <span className="font-bold block mb-1">錯誤原因：</span>
                  {keyTestResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instant Boundary Sandbox */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 flex flex-col flex-1">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">邊界拒絕測試沙盒</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            您可以立即輸入各種無關題目或陷阱問題，測試當前設定下的防護攔截效果：
          </p>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />

            <button
              onClick={runBoundaryTest}
              disabled={testing || !testPrompt.trim()}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs shadow transition flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{testing ? '測試攔截中...' : '測試邊界攔截回應'}</span>
            </button>
          </div>

          {testResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 flex-1 mt-2">
              <div className="text-[11px] font-bold text-amber-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AI 軍師實際輸出結果：</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {testResult}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
