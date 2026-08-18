import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Upload,
  FileText,
  CheckCircle2,
  Trash2,
  Edit3,
  HelpCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  File,
  Sparkles,
  Loader2,
  AlertCircle,
  Table,
  Check,
  Eye,
  FileCheck,
  Download,
  HardDriveDownload,
  HardDriveUpload,
  Globe,
  Link,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KnowledgeItem, KnowledgeCategory } from '../types';

interface KnowledgeBaseManagerProps {
  items: KnowledgeItem[];
  onAdd: (item: Partial<KnowledgeItem>) => Promise<void>;
  onEdit: (id: string, item: Partial<KnowledgeItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkUpload: (items: Partial<KnowledgeItem>[]) => Promise<void>;
  onReset: () => Promise<void>;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  items,
  onAdd,
  onEdit,
  onDelete,
  onBulkUpload,
  onReset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  // Form states for single add/edit
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>('generals');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVersion, setFormVersion] = useState('v3.2');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Handle Export Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      version: 'v3.2',
      exportedAt: new Date().toISOString(),
      itemsCount: items.length,
      knowledgeBase: items,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `three_kingdoms_kb_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Import Backup JSON
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupLoading(true);
    setBackupMessage(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const res = await fetch('/api/knowledge-base/import-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData: parsed }),
        });
        const data = await res.json();
        if (data.success) {
          setBackupMessage(`✅ ${data.message || '備份還原成功！'}`);
          // trigger reload
          window.location.reload();
        } else {
          setBackupMessage(`❌ 還原失敗：${data.message}`);
        }
      } catch (err: any) {
        setBackupMessage(`❌ 備份檔解析失敗：${err.message}`);
      } finally {
        setBackupLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // File Upload & AI Analysis state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{
    name: string;
    size: string;
    type: 'excel' | 'pdf' | 'word' | 'image' | 'text';
    base64?: string;
    extractedText?: string;
    imageThumbnail?: string;
  } | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<Partial<KnowledgeItem>[]>([]);
  const [selectedItemsToImport, setSelectedItemsToImport] = useState<number[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Raw text paste fallback
  const [bulkText, setBulkText] = useState('');

  // URL Scraping state
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file');
  const [scrapeUrlInput, setScrapeUrlInput] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [scrapeSuccessInfo, setScrapeSuccessInfo] = useState<{ url: string; title: string } | null>(null);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('generals');
    setFormSubcategory('蜀國核心');
    setFormTags('蜀國, 5星, 武將');
    setFormContent('');
    setFormVersion('v3.2');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormSubcategory(item.subcategory || '');
    setFormTags(item.tags.join(', '));
    setFormContent(item.content);
    setFormVersion(item.version || 'v3.2');
    setShowAddModal(true);
  };

  const handleSaveItem = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      subcategory: formSubcategory.trim(),
      tags: formTags.split(/[,，\s]+/).filter(Boolean),
      content: formContent.trim(),
      version: formVersion.trim(),
      verified: true,
    };

    if (editingItem) {
      await onEdit(editingItem.id, payload);
    } else {
      await onAdd(payload);
    }
    setShowAddModal(false);
  };

  // Process File Selection (Excel, Word, PDF, Image, Text)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAnalysisError(null);
    setAnalyzedItems([]);

    const fileName = file.name;
    const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Determine type
    let fileKind: 'excel' | 'pdf' | 'word' | 'image' | 'text' = 'text';
    if (['xlsx', 'xls', 'csv'].includes(ext)) fileKind = 'excel';
    else if (ext === 'pdf') fileKind = 'pdf';
    else if (['doc', 'docx'].includes(ext)) fileKind = 'word';
    else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) fileKind = 'image';

    if (fileKind === 'excel') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let sheetsText = '';
        let totalRows = 0;
        let detectedHeaders: string[] = [];
        const sampleGeneralNames: string[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonData && jsonData.length > 0) {
            const headerRow = jsonData[0]?.map((c) => String(c || '').trim()) || [];
            if (headerRow.length > 0 && detectedHeaders.length === 0) {
              detectedHeaders = headerRow;
            }
            const dataRows = jsonData.slice(1).filter((r) => r && r.length > 0 && r.some((c) => c !== undefined && c !== ''));
            totalRows += dataRows.length;

            dataRows.forEach((row) => {
              if (row[0]) sampleGeneralNames.push(String(row[0]).trim());
            });

            // Convert to clean Markdown Table
            sheetsText += `### 📜 【工作表：${sheetName}】\n\n`;
            if (headerRow.length > 0) {
              sheetsText += `| ${headerRow.join(' | ')} |\n`;
              sheetsText += `| ${headerRow.map(() => '---').join(' | ')} |\n`;
              dataRows.forEach((row) => {
                const formattedRow = headerRow.map((_, colIdx) => String(row[colIdx] ?? '-').replace(/\|/g, '/'));
                sheetsText += `| ${formattedRow.join(' | ')} |\n`;
              });
              sheetsText += `\n`;
            }
          }
        });

        const cleanBaseName = fileName.replace(/\.[^/.]+$/, '');
        const autoGeneralTags = Array.from(new Set(sampleGeneralNames)).slice(0, 60);

        // Generate the unified single official knowledge entry
        const singleConsolidatedItem: Partial<KnowledgeItem> = {
          title: `【官方將領數據表】${cleanBaseName}`,
          category: 'generals',
          subcategory: '官方數據總覽',
          tags: ['將領表', '名將數據', '官方數值總覽', cleanBaseName, ...autoGeneralTags],
          content: `## 📜 《${fileName}》官方將領數值與屬性完整總表\n> 本官方總表收錄共 ${totalRows} 位將領之基礎數值與欄位數據。\n\n${sheetsText}`,
          version: 'v3.2',
          verified: true,
        };

        setFilePreview({
          name: fileName,
          size: sizeFormatted,
          type: 'excel',
          extractedText: sheetsText,
        });

        // Directly provide the single structured official item ready for 1-click import
        setAnalyzedItems([singleConsolidatedItem]);
        setSelectedItemsToImport([0]);
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        setAnalysisError('Excel 檔案解析失敗，請確認檔案格式是否正確。');
      }
    } else if (fileKind === 'image' || fileKind === 'pdf' || fileKind === 'word') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFilePreview({
          name: fileName,
          size: sizeFormatted,
          type: fileKind,
          base64: base64,
          imageThumbnail: fileKind === 'image' ? base64 : undefined,
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Plain text / Markdown
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setBulkText(content);
        setFilePreview({
          name: fileName,
          size: sizeFormatted,
          type: 'text',
          extractedText: content,
        });
      };
      reader.readAsText(file);
    }
  };

  // Run Gemini Multimodal AI Analysis
  const handleRunAiAnalysis = async () => {
    if (!filePreview && !bulkText.trim()) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalyzedItems([]);

    try {
      const payload: any = {
        fileName: filePreview?.name || '剪貼簿文本.txt',
        fileType: filePreview?.type || 'text',
        mimeType:
          filePreview?.type === 'image'
            ? selectedFile?.type || 'image/png'
            : filePreview?.type === 'pdf'
            ? 'application/pdf'
            : filePreview?.type === 'word'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : undefined,
        base64Data: filePreview?.base64,
        textContent: filePreview?.extractedText || bulkText,
      };

      const res = await fetch('/api/knowledge-base/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any;
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`伺服器解析異常 (${res.status})：${errText.slice(0, 120) || '請稍候重試'}`);
      }

      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('伺服器未回傳有效 JSON 格式');
      }

      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setAnalyzedItems(data.items);
        setSelectedItemsToImport(data.items.map((_: any, idx: number) => idx));
      } else {
        setAnalysisError(data.message || '未自檔案中提煉出有效名將或三國策略條目，已為您自動載入備用解析。');
      }
    } catch (e: any) {
      console.error('Analysis failed:', e);
      setAnalysisError('AI 解析請求失敗：' + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Sample Demos for instant testing
  const handleLoadDemoExcel = () => {
    const demoContent = `【Excel工作表：武將面板數據與戰法適性表】
武將名稱,陣營,星級,武力成長,智力成長,統率成長,自帶戰法,首選陣容
諸葛亮,蜀,5星,0.62,3.00,2.36,神機妙算,蜀槍/蜀智
司馬懿,魏,5星,0.61,2.88,2.45,鷹視狼顧,魏盾/太尉盾
陸遜,吳,5星,0.42,2.60,1.88,火燒連營,社稷弓/肉弓
曹操,魏,5星,1.33,1.94,2.70,亂世奸雄,魏騎/魏盾`;

    setFilePreview({
      name: '三國策略_武將面板與戰法適性表.xlsx',
      size: '24.5 KB',
      type: 'excel',
      extractedText: demoContent,
    });
    setAnalysisError(null);
  };

  const handleLoadDemoText = () => {
    const demoContent = `# 戰法對決：【刮骨療毒】vs【草船借箭】解析
【刮骨療毒】：S級主動戰法（發動率40%）。清除我軍單體負面狀態並恢復大量兵力（受智力影響）。
【草船借箭】：S級事件戰法（發動率50%）。移除我軍全體負面效果，並獲得急救狀態，受傷害時恢復兵力（受統率影響）。
【克制與選用策略】：面對灼燒與強控制時，草船借箭解控覆蓋率更廣，但刮骨療毒點對點精準救殘兵效果更佳。

# 遊戲機制：士氣動態衰減與遠行戰力公式
士氣上限為100點。部隊行軍每移動1格消耗1點士氣。
士氣每降低1點，部隊造成的傷害降低0.7%。士氣為0時，傷害降低70%。
部隊停留在城池或營帳內每2分鐘恢復1點士氣。`;

    setBulkText(demoContent);
    setFilePreview({
      name: '官方機制與戰法解析攻略.md',
      size: '12.8 KB',
      type: 'text',
      extractedText: demoContent,
    });
    setAnalysisError(null);
  };

  // Scrape Online Web Page URL handler
  const handleScrapeWebUrl = async (customUrl?: string) => {
    const targetUrl = customUrl || scrapeUrlInput;
    if (!targetUrl || !targetUrl.trim().startsWith('http')) {
      setAnalysisError('請輸入完整的網址 (例如：https://zh.wikipedia.org/wiki/... 或 巴哈姆特/攻略網站網址)');
      return;
    }

    setScrapingUrl(true);
    setAnalysisError(null);
    setScrapeSuccessInfo(null);

    try {
      const res = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || '網頁擷取失敗');
      }

      setScrapeSuccessInfo({
        url: targetUrl.trim(),
        title: data.pageTitle || '線上網頁攻略',
      });

      // Prepare preview for user
      setFilePreview({
        name: data.pageTitle ? `${data.pageTitle.slice(0, 30)}.html` : '網頁抓取內容.html',
        size: `${Math.round((data.extractedText?.length || 0) / 1024)} KB`,
        type: 'text',
        extractedText: data.extractedText,
      });

      if (data.item) {
        setAnalyzedItems([data.item]);
        setSelectedItemsToImport([0]);
      }
    } catch (err: any) {
      console.error('Scrape URL error:', err);
      setAnalysisError('網頁擷取失敗：' + err.message);
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleExecuteBulkImport = async () => {
    const itemsToImport = analyzedItems.filter((_, idx) => selectedItemsToImport.includes(idx));
    if (itemsToImport.length === 0) return;

    await onBulkUpload(itemsToImport);
    setShowBulkModal(false);
    setFilePreview(null);
    setAnalyzedItems([]);
    setBulkText('');
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryLabels: Record<KnowledgeCategory, { label: string; icon: string; bg: string }> = {
    buildings: { label: '城池建築', icon: '🏰', bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' },
    troops: { label: '12大兵種', icon: '🏹', bg: 'bg-orange-950/40 text-orange-300 border-orange-800/50' },
    tech: { label: '科技研發', icon: '🧪', bg: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50' },
    generals: { label: '名將圖鑑', icon: '🗡️', bg: 'bg-red-950/40 text-red-300 border-red-800/50' },
    jewelry_titles: { label: '珠寶爵位', icon: '💎', bg: 'bg-purple-950/40 text-purple-300 border-purple-800/50' },
    mechanics: { label: '刷黃戰術', icon: '⚔️', bg: 'bg-rose-950/40 text-rose-300 border-rose-800/50' },
    tactics: { label: '戰法陣型', icon: '📜', bg: 'bg-amber-950/40 text-amber-300 border-amber-800/50' },
    lineups: { label: '陣容配置', icon: '🛡️', bg: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50' },
    faq: { label: '官方 FAQ', icon: '❓', bg: 'bg-slate-800 text-slate-300 border-slate-700' },
  };

  const applyTemplate = (templateType: 'building' | 'troop' | 'tech' | 'general' | 'jewelry') => {
    switch (templateType) {
      case 'building':
        setFormCategory('buildings');
        setFormTitle('城池建築：[建築名稱] 升級與建設規劃');
        setFormSubcategory('城池建設');
        setFormTags('建築,升級效果,資源消耗,建設規劃');
        setFormContent(`【[建築名稱] 核心功能】：
1. 功能描述：[說明該建築作用，如：訓練兵種/招募將領/儲存資源]
2. 前置建造條件：[如：官府 5 級、書院 3 級]

【2008 經典建設等級與數值】：
• 等級 1~5：[說明初期效果]
• 等級 6~10：[說明高級解鎖項目]

【軍師建置與佈局建議】：
• 主城建議：[建置數量與優先順序]
• 分城建議（兵城/資源城）：[是否需建置與配比]`);
        break;
      case 'troop':
        setFormCategory('troops');
        setFormTitle('兵種指南：[兵種名稱] 屬性與戰術定位');
        setFormSubcategory('兵種數據');
        setFormTags('兵種,攻擊力,防禦力,生命值,攻擊距離,克制');
        setFormContent(`【[兵種名稱] 面板數據與耗費】：
• 攻擊力：[數值] | 防禦力：[數值] | 生命值：[數值]
• 行軍速度：[數值] | 負重：[數值] | 攻擊距離：[數值]
• 招募消耗：糧食[數值]、木材[數值]、黃金[數值]

【2008 戰術克制與定位】：
• 克制關係：對 [兵種] 有 [X]% 傷害加成；被 [兵種] 克制。
• 主要戰術用途：[如：刷野地抓名將/城防破牆/後勤運輸/前排炮灰]
• 推薦搭配陣容與前排保護：[推薦隊伍組合]`);
        break;
      case 'tech':
        setFormCategory('tech');
        setFormTitle('科技研發：[科技名稱] 效果與計算公式');
        setFormSubcategory('軍事/內政科技');
        setFormTags('科技,書院,研發條件,加成趴數,戰力公式');
        setFormContent(`【[科技名稱] 作用機制】：
1. 科技類型：[軍事科技 / 內政科技]
2. 研發前置條件：書院 [X] 級、[其他前置科技] [X] 級

【數值加成與公式】：
• 每級提升效果：[如：增加遠程兵種 5% 射程 / 提高資源產量 10%]
• 頂級 (10級) 效果：[說明滿級效果]

【軍師研發順序建議】：
• 優先級：[極高 / 中等 / 後期補足]
• 戰術連動：[與其他兵種或戰法之連動分析]`);
        break;
      case 'general':
        setFormCategory('generals');
        setFormTitle('名將檔案：[名將姓名]（[陣營]·[星級/稱號]）');
        setFormSubcategory('名將圖鑑');
        setFormTags('名將,抓取坐標,勇武,智謀,統率,內政,洗髓');
        setFormContent(`【[名將姓名] 四大基礎屬性】：
• 勇武：[數值] | 智謀：[數值] | 統率：[數值] | 內政：[數值]
• 初始等級：[70級/60級] | 初始坐標：[縣城/郡城坐標或地圖區域]

【2008 名將抓捕與招降指南】：
1. 前置爵位要求：[如：公乘 / 伯爵 / 侯爵]
2. 招降必備珠寶：[如：夜明珠 x5, 琥珀 x10] + 黃金 [數量]
3. 洗髓加點建議：[如：全加勇武/全加智謀/全加統率]

【推薦戰法與攜帶兵種】：
• 自帶與推薦戰法：[戰法1]、[戰法2]
• 最佳帶兵兵種：[如：輕騎兵/槍兵/投石車]`);
        break;
      case 'jewelry':
        setFormCategory('jewelry_titles');
        setFormTitle('珠寶爵位：[爵位名稱/珠寶名稱] 晉升與獲取攻略');
        setFormSubcategory('爵位珠寶');
        setFormTags('爵位,珠寶,加官進爵,名將招降,野地採集');
        setFormContent(`【[爵位名稱/珠寶名稱] 核心規格】：
1. 爵位晉升條件 / 珠寶等級：[如：伯爵 / 5級珠寶]
2. 晉升所需材料：珍珠 [X]、翡翠 [Y]、水晶 [Z] + 黃金 [數量]

【解鎖權益與用途】：
• 野地佔領上限：增加至 [X] 處
• 名將抓取門檻：可招降 [等級/種類] 名將
• 附加效果：[如：提升麾下將領忠誠度]

【2008 最佳獲取管道】：
• 野地採集地點：[湖泊/沼澤/森林]
• 刷黃與任務產出：[討伐黃巾賊X級]`);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Database className="w-5 h-5 text-amber-400" />
            <span>官方遊戲攻略資料庫歸檔中心</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              共 {items.length} 筆已歸檔
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            支援 Word, PDF, Excel, 圖卡與純文字檔案上傳，由 LLM 深度剖析視覺表格與內文後自動提煉歸檔。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Backup Export/Import Actions */}
          <button
            onClick={handleExportBackup}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="下載目前完整資料庫 JSON 備份檔至本機"
          >
            <HardDriveDownload className="w-4 h-4 text-emerald-400" />
            <span>匯出備份 (JSON)</span>
          </button>

          <label className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer">
            <HardDriveUpload className="w-4 h-4 text-cyan-400" />
            <span>{backupLoading ? '還原中...' : '匯入還原備份'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackupFile}
              className="hidden"
              disabled={backupLoading}
            />
          </label>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>{showGuide ? '隱藏指南' : '多格式解析指南'}</span>
          </button>

          <button
            onClick={() => {
              setShowBulkModal(true);
              setAnalyzedItems([]);
              setFilePreview(null);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
          >
            <Upload className="w-4 h-4" />
            <span>上傳多格式檔案 (Word/PDF/Excel/圖片)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>單筆新增知識</span>
          </button>

          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title="重置為官方初始樣板資料"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {backupMessage && (
        <div className={`p-3 rounded-lg text-xs font-semibold border ${backupMessage.startsWith('✅') ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' : 'bg-red-950/40 text-red-300 border-red-500/30'}`}>
          {backupMessage}
        </div>
      )}

      {/* Format Support Header */}
      {showGuide && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>【多模態 LLM 檔案解析與知識提煉引擎】—— 支援常見攻略格式與線上網址 URL</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
              <Globe className="w-6 h-6 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">網頁網址 URL</span>
                <span className="text-[10px] text-slate-400">貼上線上攻略網址</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">Excel 表格</span>
                <span className="text-[10px] text-slate-400">.xlsx / .xls / .csv</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
              <FileText className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">PDF 攻略冊</span>
                <span className="text-[10px] text-slate-400">.pdf 文檔與圖卡</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
              <File className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">Word 文件</span>
                <span className="text-[10px] text-slate-400">.docx / .doc 報告</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
              <ImageIcon className="w-6 h-6 text-purple-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">戰法/面板截圖</span>
                <span className="text-[10px] text-slate-400">.png / .jpg / .webp</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center space-x-2.5">
              <FileCode className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">純文字檔</span>
                <span className="text-[10px] text-slate-400">.md / .txt / .json</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            全部 ({items.length})
          </button>
          {(Object.keys(categoryLabels) as KnowledgeCategory[]).map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            const meta = categoryLabels[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋標題、關鍵字、標籤..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Knowledge Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const catMeta = categoryLabels[item.category] || categoryLabels['faq'];
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 flex flex-col justify-between transition shadow-md group"
            >
              <div className="space-y-2.5">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${catMeta.bg}`}>
                      {catMeta.icon} {catMeta.label}
                    </span>
                    {item.subcategory && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {item.subcategory}
                      </span>
                    )}
                  </div>
                  {item.verified && (
                    <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>官方核驗</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-300 transition">
                  {item.title}
                </h3>

                {/* Content Snippet */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 bg-slate-950/60 p-2.5 rounded border border-slate-800/80 font-sans whitespace-pre-wrap">
                  {item.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] text-amber-300/80 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/20">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>版本: {item.version || 'v3.2'} | 更新: {item.updatedAt}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition"
                    title="編輯此條目"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                    title="刪除此條目"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            <Database className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">目前分類下尚無符合之官方攻略資料</p>
            <p className="text-xs text-slate-500 mt-1">點擊上方「單筆新增知識」或「上傳多格式檔案」將資料載入資料庫。</p>
          </div>
        )}
      </div>

      {/* Add / Edit Single Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>{editingItem ? '編輯官方知識庫條目' : '新增官方攻略知識條目'}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">攻略標題：</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例：武將檔案：諸葛亮（蜀·5星）"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Template Buttons for 2008 Rexue Sanguo */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>快捷填寫助手：一鍵帶入 2008 經典資料結構模板</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate('building')}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 transition"
                  >
                    🏰 城池建築模板
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('troop')}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 border border-orange-700/50 transition"
                  >
                    🏹 12兵種數據模板
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('tech')}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 transition"
                  >
                    🧪 科技與帶兵公式
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('general')}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/50 transition"
                  >
                    🗡️ 名將四圍加點模板
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('jewelry')}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-700/50 transition"
                  >
                    💎 珠寶爵位晉升模板
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">主分類：</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as KnowledgeCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="buildings">🏰 城池建築 (Buildings)</option>
                    <option value="troops">🏹 12大兵種 (Troops)</option>
                    <option value="tech">🧪 科技研發 (Tech)</option>
                    <option value="generals">🗡️ 名將圖鑑 (Generals)</option>
                    <option value="jewelry_titles">💎 珠寶爵位 (Jewelry & Titles)</option>
                    <option value="mechanics">⚔️ 刷黃野地戰術 (Mechanics)</option>
                    <option value="tactics">📜 戰法陣型 (Tactics)</option>
                    <option value="lineups">🛡️ 陣容配置 (Lineups)</option>
                    <option value="faq">❓ 官方 FAQ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">次分類 / 標籤組：</label>
                  <input
                    type="text"
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    placeholder="例：蜀國核心"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">檢索關鍵字標籤 (以逗號隔開)：</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="例：諸葛亮, 蜀國, 智力, 主將, 控場"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">官方攻略詳細內文：</label>
                <textarea
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="請輸入詳盡官方遊戲攻略數據（如面板數據、戰法觸發趴數、克制隊伍等）..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!formTitle.trim() || !formContent.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow disabled:opacity-50"
              >
                儲存至官方資料庫
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Format File Upload & Multimodal LLM Extraction Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>多模態知識提煉與自動歸檔中心</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  支援上傳本機檔案（Word/PDF/Excel/圖片）或貼上線上攻略網頁 URL
                </p>
              </div>

              {/* Sample file buttons for fast testing */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLoadDemoExcel}
                  className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded text-[11px] font-semibold transition"
                >
                  ⚡ 示例 Excel
                </button>
                <button
                  onClick={handleLoadDemoText}
                  className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 rounded text-[11px] font-semibold transition"
                >
                  ⚡ 示例文字
                </button>
              </div>
            </div>

            {/* Input Mode Tabs: Upload Local File vs Online Webpage URL */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => {
                  setUploadTab('file');
                  setAnalysisError(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                  uploadTab === 'file'
                    ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>上傳本機檔案 / 圖片 / Excel</span>
              </button>

              <button
                onClick={() => {
                  setUploadTab('url');
                  setAnalysisError(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                  uploadTab === 'url'
                    ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>貼上線上攻略網址 (URL 抓取)</span>
              </button>
            </div>

            {/* URL Scraping Form Area */}
            {uploadTab === 'url' && (
              <div className="space-y-4 bg-slate-950/70 border border-cyan-900/40 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center space-x-1.5">
                    <Link className="w-4 h-4 text-cyan-400" />
                    <span>請輸入三國策略 / 遊戲攻略網頁 URL 網址：</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={scrapeUrlInput}
                      onChange={(e) => setScrapeUrlInput(e.target.value)}
                      placeholder="例：https://zh.wikipedia.org/wiki/三國演義 或 官方攻略/巴哈姆特網址"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                    <button
                      onClick={() => handleScrapeWebUrl()}
                      disabled={scrapingUrl || !scrapeUrlInput.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 disabled:opacity-50 transition shrink-0"
                    >
                      {scrapingUrl ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Globe className="w-4 h-4 text-slate-950" />}
                      <span>{scrapingUrl ? '網頁擷取中...' : '抓取網頁並自動提煉'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Try Sample URLs */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 block font-medium">⚡ 快速測試推薦網址：</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const demo = 'https://zh.wikipedia.org/wiki/%E4%B8%89%E5%9C%8B';
                        setScrapeUrlInput(demo);
                        handleScrapeWebUrl(demo);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 flex items-center space-x-1 transition"
                    >
                      <span>維基百科：三國歷史</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => {
                        const demo = 'https://zh.wikipedia.org/wiki/%E8%AB%B8%E8%91%9B%E4%BA%AE';
                        setScrapeUrlInput(demo);
                        handleScrapeWebUrl(demo);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 flex items-center space-x-1 transition"
                    >
                      <span>維基百科：諸葛亮傳記</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </button>
                  </div>
                </div>

                {scrapeSuccessInfo && (
                  <div className="bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-lg flex items-center space-x-2 text-xs text-cyan-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>成功擷取網頁：<strong>{scrapeSuccessInfo.title}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* File Drop Area */}
            {uploadTab === 'file' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-950/80 rounded-xl p-5 text-center transition relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,.json"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  <div className="space-y-2 pointer-events-none">
                    <div className="flex justify-center items-center space-x-3 text-indigo-400">
                      <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                      <FileText className="w-7 h-7 text-rose-400" />
                      <File className="w-7 h-7 text-blue-400" />
                      <ImageIcon className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        點擊選擇檔案 或 將檔案拖曳至此處
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        支援類型：Excel (.xlsx, .xls), PDF (.pdf), Word (.docx, .doc), 圖片 (.png, .jpg), Markdown (.md, .txt)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* File Selected Status */}
              {filePreview && (
                <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {filePreview.type === 'excel' && <FileSpreadsheet className="w-7 h-7 text-emerald-400 shrink-0" />}
                      {filePreview.type === 'pdf' && <FileText className="w-7 h-7 text-rose-400 shrink-0" />}
                      {filePreview.type === 'word' && <File className="w-7 h-7 text-blue-400 shrink-0" />}
                      {filePreview.type === 'image' && <ImageIcon className="w-7 h-7 text-purple-400 shrink-0" />}
                      {filePreview.type === 'text' && <FileCode className="w-7 h-7 text-amber-400 shrink-0" />}

                      <div>
                        <div className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                          <span>{filePreview.name}</span>
                          <span className="text-[10px] text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800 uppercase">
                            {filePreview.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">大小: {filePreview.size} · 系統已自動解析欄位並整理為 1 筆完整官方總表資料</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Optional LLM deep decomposition button */}
                      <button
                        onClick={handleRunAiAnalysis}
                        disabled={analyzing}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg text-xs border border-slate-700 flex items-center space-x-1.5 disabled:opacity-50 transition"
                        title="若需要將每位名將另外拆分為獨立子卡片，可點擊此處進行 AI 提煉"
                      >
                        {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                        <span>{analyzing ? 'AI 提煉拆分中...' : '需要額外拆分？點此進行 LLM 深度提煉'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Text Fallback Textarea for File Tab */}
            {uploadTab === 'file' && !filePreview && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  或在此直接貼上攻略文字 / 表格文字：
                </label>
                <textarea
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="貼上文字（例：武將三圍數據、戰法對決介紹、機制表格...）"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                {bulkText.trim() && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleRunAiAnalysis}
                      disabled={analyzing}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow flex items-center space-x-1.5"
                    >
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{analyzing ? '分析中...' : '開始文字知識提煉'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

              {/* Analyzing Spinner */}
              {analyzing && (
                <div className="bg-slate-950/90 border border-indigo-500/40 p-6 rounded-xl text-center space-y-3 animate-pulse">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indigo-300">
                      Gemini Multimodal LLM 正全面閱讀檔案內容...
                    </p>
                    <p className="text-[11px] text-slate-400">
                      正在辯識表格欄位數據、圖片圖卡說明與文獻層次，整理出有邏輯的三國策略官方知識庫
                    </p>
                  </div>
                </div>
              )}

              {/* Analysis Error */}
              {analysisError && (
                <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Analyzed Results Preview & Selector */}
              {analyzedItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300">
                        AI 已成功提煉出 {analyzedItems.length} 筆結構化知識條目：
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">勾選欲歸檔入庫的條目：</span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {analyzedItems.map((item, idx) => {
                      const isSelected = selectedItemsToImport.includes(idx);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border transition flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/50'
                              : 'bg-slate-950 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                                {item.category}
                              </span>
                              <span className="text-xs font-bold text-slate-100">{item.title}</span>
                            </div>

                            <p className="text-[11px] text-slate-300 line-clamp-2 font-sans bg-slate-900/80 p-1.5 rounded border border-slate-800">
                              {item.content}
                            </p>

                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {item.tags?.map((t, tidx) => (
                                <span key={tidx} className="text-[9px] text-indigo-300 bg-indigo-900/30 px-1 py-0.2 rounded">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedItemsToImport(selectedItemsToImport.filter((i) => i !== idx));
                              } else {
                                setSelectedItemsToImport([...selectedItemsToImport, idx]);
                              }
                            }}
                            className="mt-1 w-4 h-4 accent-indigo-500 rounded"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleExecuteBulkImport}
                disabled={analyzedItems.length === 0 || selectedItemsToImport.length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow disabled:opacity-50 flex items-center space-x-1"
              >
                <FileCheck className="w-4 h-4" />
                <span>匯入至官方知識庫 ({selectedItemsToImport.length} 筆)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

