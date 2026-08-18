import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatTestLab } from './components/ChatTestLab';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager';
import { SystemConfigEditor } from './components/SystemConfigEditor';
import { SiegePlanner } from './components/SiegePlanner';
import { DiscordBotIntegration } from './components/DiscordBotIntegration';
import { KnowledgeItem, SystemConfig } from './types';
import { DEFAULT_SYSTEM_CONFIG, INITIAL_KNOWLEDGE_BASE } from './data/defaultKnowledgeBase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'kb' | 'siege' | 'config' | 'discord'>('chat');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(INITIAL_KNOWLEDGE_BASE);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [loading, setLoading] = useState(true);

  const fetchKnowledgeBase = async () => {
    try {
      const res = await fetch('/api/knowledge-base');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setKnowledgeItems(data.items);
      }
    } catch (e) {
      console.error('Failed to fetch knowledge base:', e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success && data.config) {
        setSystemConfig(data.config);
      }
    } catch (e) {
      console.error('Failed to fetch config:', e);
    }
  };

  useEffect(() => {
    Promise.all([fetchKnowledgeBase(), fetchConfig()]).finally(() => setLoading(false));
  }, []);

  const handleAddKnowledge = async (item: Partial<KnowledgeItem>) => {
    try {
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        await fetchKnowledgeBase();
      }
    } catch (e) {
      console.error('Add failed:', e);
    }
  };

  const handleEditKnowledge = async (id: string, item: Partial<KnowledgeItem>) => {
    try {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        await fetchKnowledgeBase();
      }
    } catch (e) {
      console.error('Edit failed:', e);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchKnowledgeBase();
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleBulkUpload = async (items: Partial<KnowledgeItem>[]) => {
    try {
      const res = await fetch('/api/knowledge-base/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchKnowledgeBase();
      }
    } catch (e) {
      console.error('Bulk upload failed:', e);
    }
  };

  const handleResetKnowledge = async () => {
    if (confirm('確定要將官方資料庫與語境設定重置為初始樣板狀態？')) {
      try {
        const res = await fetch('/api/knowledge-base/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          await Promise.all([fetchKnowledgeBase(), fetchConfig()]);
        }
      } catch (e) {
        console.error('Reset failed:', e);
      }
    }
  };

  const handleSaveConfig = async (newConfig: SystemConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (data.success) {
        setSystemConfig(data.config);
      }
    } catch (e) {
      console.error('Save config failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-amber-300">正在載入《熱血三國M》AI 攻略軍師資料庫...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kbCount={knowledgeItems.length}
        strictnessLevel={systemConfig.strictnessLevel}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && <ChatTestLab systemBotName={systemConfig.botName} />}

        {activeTab === 'kb' && (
          <KnowledgeBaseManager
            items={knowledgeItems}
            onAdd={handleAddKnowledge}
            onEdit={handleEditKnowledge}
            onDelete={handleDeleteKnowledge}
            onBulkUpload={handleBulkUpload}
            onReset={handleResetKnowledge}
          />
        )}

        {activeTab === 'siege' && <SiegePlanner />}

        {activeTab === 'config' && (
          <SystemConfigEditor config={systemConfig} onSaveConfig={handleSaveConfig} />
        )}

        {activeTab === 'discord' && <DiscordBotIntegration config={systemConfig} />}
      </main>
    </div>
  );
}
