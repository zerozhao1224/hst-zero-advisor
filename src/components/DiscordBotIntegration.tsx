import React, { useState } from 'react';
import { Code, Terminal, Send, Copy, Check, MessageSquare, ShieldAlert, Sparkles, HelpCircle, ExternalLink, Bot, Server } from 'lucide-react';
import { SystemConfig } from '../types';

interface DiscordBotIntegrationProps {
  config: SystemConfig;
}

export const DiscordBotIntegration: React.FC<DiscordBotIntegrationProps> = ({ config }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Discord Simulator State
  const [discordQuery, setDiscordQuery] = useState('桃園盾被什麼隊伍克制？');
  const [simulating, setSimulating] = useState(false);
  const [discordLogs, setDiscordLogs] = useState<any[]>([
    {
      id: 'log-1',
      user: '主公_趙雲粉',
      query: '/軍師 諸葛亮神機妙算戰法怎麼搭配？',
      embed: {
        title: `⚔️【${config.botName}】官方攻略解析`,
        description: '諸葛亮智力成長高達 3.00，自帶【神機妙算】能克制敵軍主動戰法發動並造成謀略傷害。推薦攜帶「奪魂挾魄」與「刮骨療毒」，陣容首選蜀智隊與蜀槍。',
        color: 3447003,
        fields: [
          { name: '📜 參考文獻', value: '《武將檔案：諸葛亮》 | 相關度: 100%', inline: true },
        ],
        footer: { text: `《熱血三國M》官方 AI 資料庫 | 請求者: 主公_趙雲粉` },
      },
      refused: false,
    },
  ]);

  const handleSimulateDiscordCommand = async () => {
    if (!discordQuery.trim() || simulating) return;
    setSimulating(true);

    try {
      const res = await fetch('/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: discordQuery, user: 'Discord測試玩家' }),
      });

      const data = await res.json();
      setDiscordLogs((prev) => [
        ...prev,
        {
          id: 'log-' + Date.now(),
          user: 'Discord測試玩家',
          query: `/軍師 ${discordQuery}`,
          embed: data.embed,
          refused: data.refused,
        },
      ]);
      setDiscordQuery('');
    } catch (e: any) {
      console.error('Discord simulation error:', e);
    } finally {
      setSimulating(false);
    }
  };

  const discordBotCode = `// ============================================================
// 《熱血三國M》官方 AI 軍師 Discord BOT 完整串接腳本 (discord.js v14)
// ============================================================
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

// 1. 設定環境變數
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN';
const CLIENT_ID = process.env.CLIENT_ID || 'YOUR_BOT_CLIENT_ID';
const API_URL = process.env.API_URL || 'https://YOUR_APP_URL/api/v1/query';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 2. 註冊 Discord Slash Command (/軍師)
const commands = [
  new SlashCommandBuilder()
    .setName('軍師')
    .setDescription('請教《熱血三國M》官方 AI 軍師攻略問題')
    .addStringOption(option =>
      option.setName('問題')
        .setDescription('請輸入遊戲相關問題（例：名將捕捉、諸葛亮戰法、桃園盾...）')
        .setRequired(true)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('正在註冊 Discord 斜線指令 /軍師...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Discord 斜線指令註冊成功！');
  } catch (error) {
    console.error('❌ 指令註冊失敗:', error);
  }
}

// 3. 處理玩家發送之 /軍師 指令
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === '軍師') {
    const userQuery = interaction.options.getString('問題');
    await interaction.deferReply(); // 先進行延遲回覆，避免 Discord 3秒超時

    try {
      // 呼叫官方 AI 軍師 API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          user: interaction.user.username,
          channelId: interaction.channelId
        })
      });

      const data = await response.json();

      // 構建 Discord 美化卡片 Embed
      const embed = new EmbedBuilder()
        .setTitle(data.embed?.title || '【臥龍軍師】攻略解析')
        .setDescription(data.embed?.description || data.response)
        .setColor(data.embed?.color || 3447003)
        .setFooter({ text: data.embed?.footer?.text || '《熱血三國M》官方 AI 資料庫' })
        .setTimestamp();

      if (data.embed?.fields) {
        data.embed.fields.forEach(f => embed.addFields(f));
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('呼叫 AI 軍師 API 失敗:', err);
      await interaction.editReply('⚠️ 軍師暫時閉關，請稍後重試！');
    }
  }
});

client.login(DISCORD_TOKEN);
registerCommands();
`;

  const curlExample = `curl -X POST https://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/api/v1/query \\
  -H "Content-Type: application/json" \\
  -d '{"query": "諸葛亮配什麼戰法最厲害？", "user": "測試大俠"}'`;

  const copyToClipboard = (text: string, type: 'code' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <span>Discord 社群 BOT 串接與 API 控制中心</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            將此 AI 攻略軍師無縫整合至 Discord 社群，提供玩家斜線指令 <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">/軍師 [問題]</code>。
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1.5">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Webhook API 在線</span>
          </span>
        </div>
      </div>

      {/* Grid: Left Simulator, Right Code & Setup Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Discord Bot Live Simulator */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
          {/* Discord Server Bar */}
          <div className="bg-[#2f3136] px-4 py-3 flex items-center justify-between text-slate-200 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="text-indigo-400 text-base">#</span>
              <span>熱血三國M-官方軍師交流區 (Discord 模擬器)</span>
            </div>
            <span className="text-[10px] bg-[#202225] px-2 py-0.5 rounded text-emerald-400">
              ● BOT 運行中
            </span>
          </div>

          {/* Discord Feed */}
          <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto bg-[#36393f] flex-1">
            {discordLogs.map((log) => (
              <div key={log.id} className="space-y-2 text-xs">
                {/* User Prompt */}
                <div className="flex items-center space-x-2 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {log.user.slice(0, 1)}
                  </div>
                  <span className="font-bold text-slate-200">{log.user}</span>
                  <span className="text-indigo-300 bg-[#2f3136] px-2 py-0.5 rounded font-mono">{log.query}</span>
                </div>

                {/* Bot Response Embed Card */}
                <div className="ml-8 border-l-4 rounded bg-[#2f3136] p-3 text-slate-200 space-y-2 shadow"
                     style={{ borderColor: log.embed?.color ? `#${log.embed.color.toString(16)}` : '#3b82f6' }}>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300">
                    <Bot className="w-4 h-4 text-amber-400" />
                    <span>{log.embed?.title || `【${config.botName}】`}</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {log.embed?.description}
                  </p>

                  {log.embed?.fields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">
                      {log.embed.fields.map((f: any, idx: number) => (
                        <div key={idx} className="bg-[#202225] p-1.5 rounded text-[11px]">
                          <span className="text-slate-400 font-semibold block">{f.name}</span>
                          <span className="text-amber-200">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {log.embed?.footer && (
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
                      {log.embed.footer.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Discord Input Bar */}
          <div className="p-3 bg-[#2f3136] border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSimulateDiscordCommand();
              }}
              className="flex items-center space-x-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-indigo-400 font-bold">/軍師</span>
                <input
                  type="text"
                  value={discordQuery}
                  onChange={(e) => setDiscordQuery(e.target.value)}
                  placeholder="輸入問題進行 Discord 觸發測試..."
                  className="w-full bg-[#40444b] text-slate-100 border-0 rounded-lg pl-16 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={simulating || !discordQuery.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow transition flex items-center space-x-1"
              >
                <span>發送測試</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Setup Guide & Code Snippet */}
        <div className="space-y-4">
          {/* Step Guide Accordion */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Discord 社群 Bot 4 步串接步驟指南</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="font-bold text-amber-300">步驟 1：建立 Discord Bot 應用</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  前往 <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Discord Developer Portal</a> 創建新 Application，取得 Bot Token 與 Client ID。
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="font-bold text-amber-300">步驟 2：設定 API Webhook URL</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  將本專案的 Webhook 端點指定為：
                  <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded ml-1">/api/v1/query</code>
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="font-bold text-amber-300">步驟 3：部署 Discord 腳本</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  複製下方 Node.js 代碼，安裝 <code className="text-indigo-300">npm i discord.js node-fetch</code> 後直接啟動，即可在 Discord 伺服器使用 <code className="text-amber-300">/軍師</code> 指令。
                </p>
              </div>
            </div>
          </div>

          {/* cURL API Test */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">HTTP REST API 測試 (cURL 範例)：</span>
              <button
                onClick={() => copyToClipboard(curlExample, 'curl')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? '已複製 cURL' : '複製 cURL'}</span>
              </button>
            </div>
            <pre className="text-[11px] text-amber-300 bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto font-mono leading-relaxed">
              {curlExample}
            </pre>
          </div>

          {/* discord.js Code Snippet */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">discord.js 完整可運行腳本 (Node.js)：</span>
              <button
                onClick={() => copyToClipboard(discordBotCode, 'code')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '已複製代碼' : '複製代碼'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={11}
              value={discordBotCode}
              className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded-lg p-3 text-[11px] font-mono leading-relaxed focus:outline-none select-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
