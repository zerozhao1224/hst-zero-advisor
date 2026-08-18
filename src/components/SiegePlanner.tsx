import React, { useState } from 'react';
import {
  Castle,
  Shield,
  Crosshair,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  TrendingUp,
  Clock,
  Swords,
  Info,
  Layers,
  ChevronRight,
  Flame
} from 'lucide-react';
import { CityDefenseConfig, SiegePlanWave, TargetCityType } from '../types';

const PRESET_CITIES: Record<TargetCityType, CityDefenseConfig> = {
  yellow_turban_10: {
    cityType: 'yellow_turban_10',
    cityName: '10級黃巾城 (野外大寨)',
    wallLevel: 10,
    wallDurability: 120000,
    traps: 1000,
    abatis: 1000,
    arrowTowers: 1200,
    rollingLogs: 500,
    catapultStones: 500,
    defenderCount: {
      militia: 5000,
      spearmen: 3000,
      archers: 4000,
      lightCavalry: 2000,
    },
    generalValour: 65,
    generalLeadership: 60,
  },
  county_city: {
    cityType: 'county_city',
    cityName: '三國名城・縣城',
    wallLevel: 10,
    wallDurability: 300000,
    traps: 4000,
    abatis: 3000,
    arrowTowers: 3500,
    rollingLogs: 1500,
    catapultStones: 1200,
    defenderCount: {
      swordsmen: 8000,
      archers: 12000,
      heavyCavalry: 5000,
      rams: 500,
    },
    generalValour: 82,
    generalLeadership: 78,
  },
  prefecture_city: {
    cityType: 'prefecture_city',
    cityName: '一州核心・郡城',
    wallLevel: 10,
    wallDurability: 900000,
    traps: 10000,
    abatis: 8000,
    arrowTowers: 8000,
    rollingLogs: 3000,
    catapultStones: 2500,
    defenderCount: {
      archers: 30000,
      heavyCavalry: 15000,
      rams: 1500,
      catapults: 2000,
    },
    generalValour: 92,
    generalLeadership: 90,
  },
  state_city: {
    cityType: 'state_city',
    cityName: '天下重鎮・州城 (名將駐防)',
    wallLevel: 10,
    wallDurability: 3000000,
    traps: 30000,
    abatis: 25000,
    arrowTowers: 20000,
    rollingLogs: 8000,
    catapultStones: 6000,
    defenderCount: {
      archers: 80000,
      heavyCavalry: 40000,
      rams: 5000,
      catapults: 6000,
    },
    generalValour: 105,
    generalLeadership: 100,
  },
  custom: {
    cityType: 'custom',
    cityName: '自訂目標城池',
    wallLevel: 8,
    wallDurability: 100000,
    traps: 800,
    abatis: 600,
    arrowTowers: 1000,
    rollingLogs: 200,
    catapultStones: 200,
    defenderCount: {
      archers: 3000,
      lightCavalry: 1000,
    },
    generalValour: 50,
    generalLeadership: 50,
  },
};

const DEFAULT_WAVES: SiegePlanWave[] = [
  {
    waveNumber: 1,
    waveName: '第一波：填坑先鋒隊 (消耗陷阱/拒馬)',
    purpose: 'fill_traps',
    commanderValour: 50,
    throwingTech: 10,
    marchingTech: 10,
    troops: {
      militia: 1200,
      porter: 500,
      spearmen: 1,
      swordsmen: 1,
      scout: 1,
    },
  },
  {
    waveNumber: 2,
    waveName: '第二波：遠程拔塔隊 (射程外狙殺箭塔)',
    purpose: 'destroy_towers',
    commanderValour: 85,
    throwingTech: 10,
    marchingTech: 10,
    troops: {
      catapult: 1500,
      ballista: 500,
      militia: 1,
      spearmen: 1,
    },
  },
  {
    waveNumber: 3,
    waveName: '第三波：主力破門與清剿隊 (衝車砸門+鐵騎掃蕩)',
    purpose: 'break_wall_kill_guards',
    commanderValour: 95,
    throwingTech: 10,
    marchingTech: 10,
    troops: {
      ram: 800,
      heavyCavalry: 5000,
      archer: 10000,
    },
  },
  {
    waveNumber: 4,
    waveName: '第四波：洗民心佔領隊 (每15分鐘連續壓制至0)',
    purpose: 'drain_loyalty',
    commanderValour: 70,
    throwingTech: 10,
    marchingTech: 10,
    troops: {
      lightCavalry: 1000,
      archer: 2000,
    },
  },
];

export const SiegePlanner: React.FC = () => {
  const [cityDefense, setCityDefense] = useState<CityDefenseConfig>(PRESET_CITIES.yellow_turban_10);
  const [waves, setWaves] = useState<SiegePlanWave[]>(DEFAULT_WAVES);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const handleSelectCityPreset = (type: TargetCityType) => {
    setCityDefense(PRESET_CITIES[type]);
    setEvaluationResult(null);
  };

  const handleUpdateWaveTroop = (waveIdx: number, troopKey: string, val: number) => {
    const next = [...waves];
    next[waveIdx] = {
      ...next[waveIdx],
      troops: {
        ...next[waveIdx].troops,
        [troopKey]: Math.max(0, val),
      },
    };
    setWaves(next);
  };

  const handleAddWave = () => {
    const newWave: SiegePlanWave = {
      waveNumber: waves.length + 1,
      waveName: `第 ${waves.length + 1} 波：自訂增援/洗民心隊`,
      purpose: 'drain_loyalty',
      commanderValour: 70,
      throwingTech: 10,
      marchingTech: 10,
      troops: {
        lightCavalry: 500,
        archer: 1000,
      },
    };
    setWaves([...waves, newWave]);
  };

  const handleRemoveWave = (idx: number) => {
    if (waves.length <= 1) return;
    const next = waves.filter((_, i) => i !== idx).map((w, i) => ({ ...w, waveNumber: i + 1 }));
    setWaves(next);
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await fetch('/api/evaluate-siege-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityDefense,
          waves,
        }),
      });

      let data: any;
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`伺服器推演異常 (${res.status})：${errText.slice(0, 100) || '請稍候重試'}`);
      }

      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('推演伺服器未回傳有效 JSON 格式');
      }

      if (data.success) {
        setEvaluationResult(data);
      } else {
        alert(data.message || '攻城試算失敗');
      }
    } catch (e: any) {
      alert('戰術推演提示：' + e.message);
    } finally {
      setEvaluating(false);
    }
  };

  // 即時計算總填坑兵力與攻城器械
  let totalFodder = 0;
  let totalCatapults = 0;
  let totalRams = 0;
  waves.forEach((w) => {
    totalFodder += (w.troops.militia || 0) + (w.troops.porter || 0);
    totalCatapults += w.troops.catapult || 0;
    totalRams += w.troops.ram || 0;
  });

  const trapCoverage = Math.min(100, Math.round((totalFodder / Math.max(1, cityDefense.traps + cityDefense.abatis)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-red-950/50 border border-amber-500/30 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Castle className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-bold text-amber-200 tracking-wide">
                城池攻堅與破防戰術規劃器 (2008 熱血三國硬核經典)
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              專為 10級黃巾城、名城縣城、郡城與州城設計：填坑消陷阱、射程外拔箭塔、衝車砸門破防、四步洗民心抓神將！
            </p>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? '軍師推演戰術中...' : '⚡ 執行破防攻城戰術評測'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Target City Recon Intelligence (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">目標城池情報偵察 (Recon)</h3>
              </div>
            </div>

            {/* City Preset Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">快速載入城池範本：</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRESET_CITIES) as TargetCityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSelectCityPreset(type)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-left transition ${
                      cityDefense.cityType === type
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {PRESET_CITIES[type].cityName}
                  </button>
                ))}
              </div>
            </div>

            {/* City Defense Stats Config */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">城池名稱：</span>
                <input
                  type="text"
                  value={cityDefense.cityName}
                  onChange={(e) => setCityDefense({ ...cityDefense, cityName: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-bold text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">城牆等級 / 耐久度：</span>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={cityDefense.wallLevel}
                      onChange={(e) => setCityDefense({ ...cityDefense, wallLevel: Number(e.target.value) })}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-center"
                    />
                    <span className="text-slate-500">級</span>
                    <input
                      type="number"
                      value={cityDefense.wallDurability}
                      onChange={(e) => setCityDefense({ ...cityDefense, wallDurability: Number(e.target.value) })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 font-mono text-right"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">守將 勇武 / 統率：</span>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={cityDefense.generalValour}
                      onChange={(e) => setCityDefense({ ...cityDefense, generalValour: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-amber-400 font-bold text-center"
                      placeholder="勇武"
                    />
                    <input
                      type="number"
                      value={cityDefense.generalLeadership}
                      onChange={(e) => setCityDefense({ ...cityDefense, generalLeadership: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-300 text-center"
                      placeholder="統率"
                    />
                  </div>
                </div>
              </div>

              {/* Traps & Fortifications */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 block">城防工事情報：</span>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">陷阱 (1換1):</span>
                    <input
                      type="number"
                      value={cityDefense.traps}
                      onChange={(e) => setCityDefense({ ...cityDefense, traps: Number(e.target.value) })}
                      className="w-full bg-transparent text-rose-400 font-bold outline-none"
                    />
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">拒馬 (擋騎):</span>
                    <input
                      type="number"
                      value={cityDefense.abatis}
                      onChange={(e) => setCityDefense({ ...cityDefense, abatis: Number(e.target.value) })}
                      className="w-full bg-transparent text-rose-400 font-bold outline-none"
                    />
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">箭塔 (遠程):</span>
                    <input
                      type="number"
                      value={cityDefense.arrowTowers}
                      onChange={(e) => setCityDefense({ ...cityDefense, arrowTowers: Number(e.target.value) })}
                      className="w-full bg-transparent text-amber-400 font-bold outline-none"
                    />
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">滾木 (殺傷):</span>
                    <input
                      type="number"
                      value={cityDefense.rollingLogs}
                      onChange={(e) => setCityDefense({ ...cityDefense, rollingLogs: Number(e.target.value) })}
                      className="w-full bg-transparent text-slate-300 outline-none"
                    />
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">檑石 (破械):</span>
                    <input
                      type="number"
                      value={cityDefense.catapultStones}
                      onChange={(e) => setCityDefense({ ...cityDefense, catapultStones: Number(e.target.value) })}
                      className="w-full bg-transparent text-slate-300 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Breakthrough Readiness Radar */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>當前出征部隊破防覆蓋率：</span>
                <span className={trapCoverage >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{trapCoverage}%</span>
              </span>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${trapCoverage >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, trapCoverage)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">
                {trapCoverage >= 100
                  ? '✅ 填坑砲灰部隊總數足夠完全抵銷目標陷阱與拒馬！'
                  : '⚠️ 填坑砲灰數量不足，主力部隊進場恐直接遭陷阱秒殺。'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Multi-Wave Tactical Dispatch (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">多波次階梯式攻城部署 (Wave Tactics)</h3>
              </div>
              <button
                onClick={handleAddWave}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增波次</span>
              </button>
            </div>

            {/* Wave Cards */}
            <div className="space-y-3">
              {waves.map((wave, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center border border-amber-500/40">
                        {wave.waveNumber}
                      </span>
                      <input
                        type="text"
                        value={wave.waveName}
                        onChange={(e) => {
                          const next = [...waves];
                          next[idx].waveName = e.target.value;
                          setWaves(next);
                        }}
                        className="bg-transparent text-xs font-bold text-slate-100 focus:outline-none focus:border-b border-amber-500"
                      />
                    </div>
                    {waves.length > 1 && (
                      <button
                        onClick={() => handleRemoveWave(idx)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Purpose & Tech row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">作戰目的：</span>
                      <select
                        value={wave.purpose}
                        onChange={(e) => {
                          const next = [...waves];
                          next[idx].purpose = e.target.value as any;
                          setWaves(next);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                      >
                        <option value="fill_traps">1. 填坑消陷阱拒馬</option>
                        <option value="destroy_towers">2. 射程外拔除箭塔</option>
                        <option value="break_wall_kill_guards">3. 衝車破門殲滅主力</option>
                        <option value="drain_loyalty">4. 連續行軍洗民心至0</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block">主將勇武：</span>
                      <input
                        type="number"
                        value={wave.commanderValour}
                        onChange={(e) => {
                          const next = [...waves];
                          next[idx].commanderValour = Number(e.target.value);
                          setWaves(next);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-amber-300 font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block">拋射技巧等級：</span>
                      <input
                        type="number"
                        value={wave.throwingTech}
                        onChange={(e) => {
                          const next = [...waves];
                          next[idx].throwingTech = Number(e.target.value);
                          setWaves(next);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Troops inputs for this wave */}
                  <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block">兵種編制數量：</span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block">義兵/民夫:</span>
                        <input
                          type="number"
                          value={wave.troops.militia || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'militia', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">弓箭兵:</span>
                        <input
                          type="number"
                          value={wave.troops.archer || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'archer', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-amber-300 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">衝車 (破門):</span>
                        <input
                          type="number"
                          value={wave.troops.ram || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'ram', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-orange-400 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">投石車 (拔塔):</span>
                        <input
                          type="number"
                          value={wave.troops.catapult || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'catapult', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-cyan-400 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">鐵騎兵:</span>
                        <input
                          type="number"
                          value={wave.troops.heavyCavalry || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'heavyCavalry', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">輕騎兵 (洗民心):</span>
                        <input
                          type="number"
                          value={wave.troops.lightCavalry || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'lightCavalry', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">床弩:</span>
                        <input
                          type="number"
                          value={wave.troops.ballista || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'ballista', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">1兵砲灰(槍/盾):</span>
                        <input
                          type="number"
                          value={wave.troops.spearmen || 0}
                          onChange={(e) => handleUpdateWaveTroop(idx, 'spearmen', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-emerald-400 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Result: Tactical Evaluation Report */}
      {evaluationResult && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-6 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40 font-bold text-lg">
                {evaluationResult.evaluation?.score || 90}
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
                  <span>臥龍軍師・破防攻城戰術總評報告</span>
                  {evaluationResult.isAiPowered && (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                      Gemini 3.6 Flash 戰術推演
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">綜合破防指數、射程壓制係數與名將俘虜成功率評估</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>戰術優勢亮點 (Strengths)</span>
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                {evaluationResult.evaluation?.strengths?.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>潛在破綻與隱患 (Risks)</span>
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                {evaluationResult.evaluation?.weaknesses?.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>實戰微操與行軍建議 (Tactics)</span>
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                {evaluationResult.evaluation?.suggestions?.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Deep Analysis Text */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>軍師深入戰況推演詳解：</span>
            </span>
            <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {evaluationResult.evaluation?.analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
