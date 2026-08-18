export type KnowledgeCategory = 
  | 'generals' 
  | 'tactics' 
  | 'lineups' 
  | 'mechanics' 
  | 'faq' 
  | 'buildings' 
  | 'troops' 
  | 'tech' 
  | 'jewelry_titles';

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  subcategory?: string;
  tags: string[];
  content: string;
  updatedAt: string;
  verified: boolean;
  version?: string;
}

export interface SystemConfig {
  botName: string;
  strictnessLevel: 'strict' | 'balanced' | 'guided';
  refusalMessage: string;
  systemInstruction: string;
  enableGroundingSources: boolean;
  activeCategories: KnowledgeCategory[];
  temperature: number;
  customApiKey?: string;
}

export interface RetrievedDoc {
  id: string;
  title: string;
  category: KnowledgeCategory;
  score: number; // 0 to 1
  contentSnippet: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  retrievedDocs?: RetrievedDoc[];
  refused?: boolean;
  executionTimeMs?: number;
  modelUsed?: string;
}

export interface LineupSlot {
  position: '主將' | '副將1' | '副將2';
  generalName: string;
  tactic1: string;
  tactic2: string;
}

export interface LineupEvaluation {
  rating: 'S+' | 'S' | 'A' | 'B' | 'C';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  synergyAnalysis: string;
  recommendedAdjustments: string[];
}

export interface DiscordTestLog {
  id: string;
  timestamp: string;
  user: string;
  channel: string;
  query: string;
  botResponse: string;
  isRefused: boolean;
  latencyMs: number;
}

export type TargetCityType = 'yellow_turban_10' | 'county_city' | 'prefecture_city' | 'state_city' | 'custom';

export interface CityDefenseConfig {
  cityName: string;
  cityType: TargetCityType;
  wallLevel: number;
  wallDurability: number;
  traps: number;
  abatis: number;
  arrowTowers: number;
  rollingLogs: number;
  catapultStones: number;
  generalValour: number;
  generalLeadership: number;
  defenderCount?: Record<string, number> | number;
}

export interface SiegePlanWave {
  waveNumber: number;
  waveName: string;
  purpose: 'fill_traps' | 'clear_traps' | 'destroy_towers' | 'break_wall_kill_guards' | 'drain_loyalty';
  commanderValour: number;
  throwingTech: number;
  marchingTech: number;
  troops: {
    militia?: number;
    porter?: number;
    scout?: number;
    spearmen?: number;
    swordsmen?: number;
    archer?: number;
    lightCavalry?: number;
    ironCavalry?: number;
    heavyCavalry?: number;
    supplyCart?: number;
    ballista?: number;
    ram?: number;
    catapult?: number;
  };
}
