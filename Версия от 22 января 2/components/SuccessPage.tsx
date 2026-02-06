import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Plus, 
    Search, 
    Calendar, 
    Filter, 
    CheckCircle, 
    X, 
    ChevronDown, 
    HelpCircle, 
    ArrowUp,
    Zap,
    AlertTriangle,
    ThumbsUp,
    Loader,
    Info,
    Download,
    ClipboardCheck,
    Clock
} from './Icons';
import { CampaignRecord } from '../types';

// --- Constants ---
const TOTAL_PROMO_BONUS = 226660517;
const BONUS_PACKAGES = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

// --- Helpers ---
const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

// --- Sub-Components ---
const CompactLaunchLoader: React.FC<{ total: number }> = ({ total }) => (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100 flex items-center gap-4 animate-in fade-in duration-300">
        <Loader className="w-6 h-6 text-purple-600 animate-spin shrink-0" />
        <div>
            <h2 className="text-lg font-bold text-gray-900">
                Запускаем {total} {getPlural(total, 'кампанию', 'кампании', 'кампаний')}...
            </h2>
            <p className="text-gray-500 text-sm">Это может занять некоторое время. Процесс не прервётся, если вы уйдёте со страницы.</p>
        </div>
        <div className="ml-auto w-48 h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-purple-500 animate-loader-progress"></div>
        </div>
        <style>{`
            @keyframes loader-progress {
                0% { transform: translateX(-100%) scaleX(0.5); }
                50% { transform: translateX(0) scaleX(1); }
                100% { transform: translateX(100%) scaleX(0.5); }
            }
            .animate-loader-progress {
                width: 100%;
                animation: loader-progress 1.8s ease-in-out infinite;
            }
        `}</style>
    </div>
);


const ToggleSwitch = ({ id, checked, onChange, disabled = false }: { id?: string; checked: boolean; onChange: (checked: boolean) => void, disabled?: boolean }) => ( <button id={id} role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)} disabled={disabled} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' } ${ checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' }`} > <span aria-hidden="true" className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ checked ? 'translate-x-3' : 'translate-x-0' }`} /> </button> );

const Pagination = ({ total, pageSize, current, onChange }: { total: number, pageSize: number, current: number, onChange: (page: number) => void }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    const handlePrev = () => { if (current > 1) onChange(current - 1); };
    const handleNext = () => { if (current < totalPages) onChange(current + 1); };

    let items = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
        items.push(1);
        if (current > 3) items.push('...');
        if (current > 2) items.push(current - 1);
        if (current > 1 && current < totalPages) items.push(current);
        if (current < totalPages - 1) items.push(current + 1);
        if (current < totalPages - 2) items.push('...');
        items.push(totalPages);
    }
    const uniqueItems = [...new Set(items)];

    return ( <div className="pagination-container"> <button onClick={handlePrev} className={`pagination-item ${current === 1 ? 'disabled' : ''}`} disabled={current === 1}>&lt;</button> {uniqueItems.map((item, index) => ( <button key={index} onClick={() => typeof item === 'number' && onChange(item)} className={`pagination-item ${current === item ? 'active' : ''} ${typeof item !== 'number' ? 'disabled' : ''}`} disabled={typeof item !== 'number'}> {item} </button> ))} <button onClick={handleNext} className={`pagination-item ${current === totalPages ? 'disabled' : ''}`} disabled={current === totalPages}>&gt;</button> </div> );
};

interface SuccessPageProps {
  isLaunching: boolean;
  launchTotal: number;
  launchResult: { success: number; error: number } | null;
  failedCampaigns: CampaignRecord[];
  onClearLaunchResult: () => void;
  onNavigateToCreation: () => void;
  onOpenUploadEditsModal: () => void;
  selectedCampaigns: string[];
  onSelectionChange: (ids: string[]) => void;
  isApplyingEdits: boolean;
  editResult: { success: number; error: number; failedIds?: number[] } | null;
  onClearEditResult: () => void;
  onOpenReview: () => void;
  onCancelEdits: () => void;
  onOpenHistoryModal: () => void;
  showUploadHint?: boolean;
  onDismissUploadHint?: () => void;
  onOpenCpcCampaign: (payload: { campaignId: number; name: string }) => void;
  onOpenSingleCampaign?: () => void;
}

interface DisplayCampaign {
  id: string;
  image: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  statusText: string;
  campaignId: number;
  tags: { text: string; icon: React.ReactNode; type: 'warning' | 'info' | 'error' }[];
  campaignTags: string[];
  type: 'CPC' | 'CPM';
  typeDetails: string;
  typeIcons: React.ReactNode[];
  autoRefill: boolean;
  autoRefillStatus: 'ok' | 'error';
  budget: number | null;
  remainingBudget: number | null;
  dailyLimit?: number | null;
  spend: number | null;
  impressions: number | null;
  ctr: number | null;
  orders: number | null;
  spendShare: number | null;
}

const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return num.toLocaleString('ru-RU');
}
const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return `${num.toLocaleString('ru-RU')} ₽`;
}

const formatForDisplay = (num: number | string | undefined | null): string => {
    if (num === null || num === undefined || num === '') return '0';
    const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
    if (isNaN(numValue) || numValue === null || numValue === undefined) return '0';
    return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

const parseDisplayValue = (str: string): number => {
    return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};
const formatPercentage = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'Н/Д';
    return `${num.toFixed(1).replace('.', ',')}%`;
}

const currentDate = new Date().toLocaleDateString('ru-RU');

const MOCK_CAMPAIGNS: DisplayCampaign[] = [
    // Category 1: Платья (10 items)
    { id: '1', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Летнее платье "Ривьера" CPC от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304655, tags: [{ text: 'Сезонный тренд', icon: <Zap className="w-3 h-3" />, type: 'info' }], campaignTags: ['Летняя распродажа', 'Хиты со скидкой'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, remainingBudget: 1500, dailyLimit: 2000, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8 },
    { id: '2', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Вечернее платье "Грация" CPC от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304656, tags: [{ text: 'Заканчивается бюджет', icon: <AlertTriangle className="w-3 h-3 text-amber-600" />, type: 'warning' }], campaignTags: ['Сезонная распродажа'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 300000, remainingBudget: 800, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8 },
    { id: '3', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Платье-футляр "Офис" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304657, tags: [], campaignTags: ['Уценка', 'Последние размеры'], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 300000, remainingBudget: 3200, spend: 100350, impressions: 324580, ctr: 1.2, orders: 89, spendShare: 15.8 },
    { id: '4', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Сарафан "Прованс" CPM от ${currentDate}`, status: 'paused', statusText: 'приостановлена', campaignId: 1304658, tags: [], campaignTags: ['Ликвидация остатков'], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 300000, remainingBudget: 500, spend: null, impressions: null, ctr: null, orders: null, spendShare: null },
    { id: '5', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Платье с принтом "Флора" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304659, tags: [], campaignTags: ['Чёрная пятница', 'Хиты со скидкой'], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 300000, remainingBudget: 2100, spend: 80200, impressions: 250000, ctr: 1.1, orders: 75, spendShare: 14.1 },
    { id: '6', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Коктейльное платье "Шарм" CPC от ${currentDate}`, status: 'draft', statusText: 'черновик', campaignId: 1304660, tags: [], campaignTags: ['Новый год'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 300000, remainingBudget: 4500, dailyLimit: 3000, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0 },
    { id: '7', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Длинное платье "Макси" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304661, tags: [], campaignTags: ['8 марта', 'Скидка по купону'], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 500000, remainingBudget: 5500, spend: 250000, impressions: 600000, ctr: 1.5, orders: 120, spendShare: 18.2 },
    { id: '8', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Платье-рубашка "Кэжуал" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304662, tags: [], campaignTags: ['1 сентября (школа)'], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 150000, remainingBudget: 1200, spend: 145000, impressions: 400000, ctr: 0.9, orders: 50, spendShare: 11.0 },
    { id: '9', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Пляжное платье "Бриз" CPC от ${currentDate}`, status: 'paused', statusText: 'приостановлена', campaignId: 1304663, tags: [], campaignTags: ['Зимняя распродажа', 'Межсезонье'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 100000, remainingBudget: 900, spend: 98000, impressions: 150000, ctr: 2.0, orders: 100, spendShare: 25.0 },
    { id: '10', image: 'https://placehold.co/64x64/E9D5FF/4C1D95?text=W', name: `Трикотажное платье "Уют" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304664, tags: [], campaignTags: ['Акция поставщика'], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 200000, remainingBudget: 2800, spend: 50000, impressions: 180000, ctr: 1.0, orders: 60, spendShare: 12.5 },
    { id: '11', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Джинсы "Classic Fit" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304665, tags: [], campaignTags: ['Распродажа витрины', 'Уценка'], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 250000, remainingBudget: 3800, spend: 120000, impressions: 450000, ctr: 1.3, orders: 95, spendShare: 16.0 },
    { id: '12', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Брюки-карго "Комбат" CPC от ${currentDate}`, status: 'draft', statusText: 'черновик', campaignId: 1304666, tags: [], campaignTags: ['Последние размеры'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: true, autoRefillStatus: 'ok', budget: 180000, remainingBudget: 1700, dailyLimit: 2200, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0 },
    { id: '13', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Классические брюки "Офис" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304667, tags: [], campaignTags: ['Хиты со скидкой', 'Сезонная распродажа'], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 400000, remainingBudget: 4900, spend: 390000, impressions: 800000, ctr: 1.1, orders: 150, spendShare: 19.5 },
    { id: '14', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Спортивные брюки "Тренд" CPC от ${currentDate}`, status: 'paused', statusText: 'приостановлена', campaignId: 1304668, tags: [], campaignTags: ['Чёрная пятница'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 220000, remainingBudget: 1100, spend: 215000, impressions: 300000, ctr: 1.8, orders: 110, spendShare: 22.0 },
    { id: '15', image: 'https://placehold.co/64x64/BFDBFE/1E3A8A?text=W', name: `Льняные брюки "Лето" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304669, tags: [{ text: 'Сезонный тренд', icon: <Zap className="w-3 h-3" />, type: 'info' }], campaignTags: ['Летняя распродажа'], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 120000, remainingBudget: 2400, spend: 30000, impressions: 100000, ctr: 0.8, orders: 40, spendShare: 10.0 },
    { id: '16', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Сумка-шоппер "Эко" CPM от ${currentDate}`, status: 'error', statusText: 'приостановлена', campaignId: 1304670, tags: [{ text: 'Нарушение +1', icon: <AlertTriangle className="w-3 h-3 text-red-600" />, type: 'error' }], campaignTags: ['Проблемные', 'Уценка'], type: 'CPM', typeDetails: 'Ручная', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 0, remainingBudget: 600, spend: null, impressions: null, ctr: null, orders: null, spendShare: null },
    { id: '17', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Кожаный ремень "Классика" CPC от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304671, tags: [], campaignTags: ['Новый год', '8 марта'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 90000, remainingBudget: 3500, dailyLimit: 4000, spend: 85000, impressions: 120000, ctr: 2.2, orders: 130, spendShare: 28.0 },
    { id: '18', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Шелковый платок "Париж" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304672, tags: [], campaignTags: ['Скидка по купону'], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 75000, remainingBudget: 4100, spend: 15000, impressions: 90000, ctr: 1.0, orders: 45, spendShare: 11.5 },
    { id: '19', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Солнцезащитные очки "Авиатор" CPC от ${currentDate}`, status: 'draft', statusText: 'черновик', campaignId: 1304673, tags: [], campaignTags: ['Акция поставщика', 'Межсезонье'], type: 'CPC', typeDetails: '', typeIcons: [<Search className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 150000, remainingBudget: 2600, spend: 0, impressions: 0, ctr: 0, orders: 0, spendShare: 0 },
    { id: '20', image: 'https://placehold.co/64x64/FED7AA/9A3412?text=W', name: `Наручные часы "Статус" CPM от ${currentDate}`, status: 'active', statusText: 'активна', campaignId: 1304674, tags: [{ text: 'Заканчивается бюджет', icon: <AlertTriangle className="w-3 h-3 text-amber-600" />, type: 'warning' }], campaignTags: ['Распродажа витрины'], type: 'CPM', typeDetails: 'Единая', typeIcons: [<Search className="w-4 h-4 text-gray-400" />, <ThumbsUp className="w-4 h-4 text-gray-400" />], autoRefill: false, autoRefillStatus: 'error', budget: 500000, remainingBudget: 1300, spend: 495000, impressions: 1000000, ctr: 1.6, orders: 200, spendShare: 20.5 },
];

const DailyLimitTooltip: React.FC<{ dailyLimit: number; onClick?: () => void }> = ({ dailyLimit, onClick }) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    
    return (
        <div 
            className="relative inline-block text-xs mt-1"
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
        >
            <span 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick?.();
                }}
                className="text-blue-600 hover:text-purple-600 cursor-pointer transition-colors"
            >
                Лимит на день {formatForDisplay(dailyLimit)}р
            </span>
            {isTooltipVisible && (
                <>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-64 h-2" onMouseEnter={() => setIsTooltipVisible(true)}></div>
                    <div 
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
                        onMouseEnter={() => setIsTooltipVisible(true)}
                        onMouseLeave={() => setIsTooltipVisible(false)}
                    >
                        <p>Идет равномерная открутка установленного лимита на день</p>
                    </div>
                </>
            )}
        </div>
    );
};

const BudgetRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  currentBudget: number;
  dailyLimit?: number | null;
  showDailyLimitSection?: boolean;
  onDailyLimitChange?: (limit: number | null) => void;
}> = ({ isOpen, onClose, onSave, currentBudget, dailyLimit, showDailyLimitSection = false, onDailyLimitChange }) => {
  const [refillAmount, setRefillAmount] = useState('3000');
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [bonusError, setBonusError] = useState('');
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('2000');
  const [isDailyLimitTooltipVisible, setIsDailyLimitTooltipVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRefillAmount('3000');
      setUseBonuses(false);
      setBonusValue(3000);
      setBudgetError('');
      setBonusError('');
      if (showDailyLimitSection) {
        if (dailyLimit) {
          setIsDailyLimitEnabled(true);
          setDailyLimitValue(String(dailyLimit));
        } else {
          setIsDailyLimitEnabled(false);
          setDailyLimitValue('2000');
        }
      } else {
        setIsDailyLimitEnabled(false);
        setDailyLimitValue('2000');
      }
    }
  }, [isOpen, showDailyLimitSection, dailyLimit]);

  const selectedPkg = useMemo(() => BONUS_PACKAGES.find(p => p.id === selectedPkgId) || BONUS_PACKAGES[0], [selectedPkgId]);
  const currentBudgetValue = parseDisplayValue(refillAmount);
  const numericBonusValue = parseDisplayValue(String(bonusValue));

  useEffect(() => {
    setBudgetError('');
    setBonusError('');

    if (currentBudgetValue < 1000 && refillAmount !== '') {
      setBudgetError('Минимальный бюджет 1000 ₽');
    }

    if (useBonuses) {
      if (numericBonusValue > currentBudgetValue) {
        setBonusError('Сумма бонусов не может превышать общий бюджет');
        return;
      }

      const maxBonusFromPackage = selectedPkg.amount;
      if (numericBonusValue > maxBonusFromPackage) {
        setBonusError(`В пакете доступно только ${formatForDisplay(maxBonusFromPackage)} B`);
        return;
      }

      const maxPercent = selectedPkg.maxPercent / 100;
      const maxBonusAllowedByPercent = currentBudgetValue * maxPercent;

      if (numericBonusValue > maxBonusAllowedByPercent) {
        setBonusError(`Можно списать максимум ${formatForDisplay(Math.floor(maxBonusAllowedByPercent))} B (${selectedPkg.maxPercent}% от суммы)`);
        return;
      }
    }
  }, [refillAmount, useBonuses, bonusValue, selectedPkg, currentBudgetValue, numericBonusValue]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setRefillAmount(String(parsed));
    } else if (e.target.value === '') {
      setRefillAmount('');
    }
  };

  const handleBudgetBlur = () => {
    const parsed = parseDisplayValue(refillAmount);
    if (isNaN(parsed) || parsed < 1000) {
      setRefillAmount('1000');
    }
  };

  const handleBonusBlur = () => {
    const numericValue = parseDisplayValue(String(bonusValue));
    if (isNaN(numericValue) || numericValue < 0) {
      setBonusValue(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Пополнение бюджета</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сумма пополнения</label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 pr-8 ${budgetError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="3000"
                  value={formatForDisplay(refillAmount)}
                  onChange={handleBudgetChange}
                  onBlur={handleBudgetBlur}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
              </div>
              {budgetError && <p className="text-red-500 text-xs mt-1.5">{budgetError}</p>}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="bonus-toggle"
                  checked={useBonuses}
                  onChange={e => setUseBonuses(e.target.checked)}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                />
                <label htmlFor="bonus-toggle" className="text-sm font-semibold text-gray-900 cursor-pointer">
                  Списать промо-бонусы <span className="text-gray-400 font-normal ml-1">({formatForDisplay(TOTAL_PROMO_BONUS)} B)</span>
                </label>
              </div>

              {useBonuses && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                    {BONUS_PACKAGES.map(pkg => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`min-w-[200px] p-4 rounded-xl border-2 transition-all cursor-pointer snap-start relative ${selectedPkgId === pkg.id ? 'border-purple-600 bg-purple-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xl font-bold text-gray-900">{formatForDisplay(pkg.amount)}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPkgId === pkg.id ? 'border-purple-600' : 'border-gray-300'}`}>
                            {selectedPkgId === pkg.id && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 font-medium leading-tight">Оплата до {pkg.maxPercent}% от суммы</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-1">
                          <span className="text-orange-500">🔥</span>
                          <span>{pkg.displayBurn} сгорят {pkg.expiry}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative w-full md:w-48">
                      <input
                        type="text"
                        value={formatForDisplay(bonusValue)}
                        onChange={e => setBonusValue(e.target.value)}
                        onBlur={handleBonusBlur}
                        className={`w-full border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500 ${bonusError ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">до {formatForDisplay(numericBonusValue)} B (1B = 1P)</p>
                    </div>
                    <div className="text-sm text-gray-500 leading-snug">
                      {bonusError ? (
                        <p className="text-red-500">{bonusError}</p>
                      ) : (
                        <p>Списать можно максимум {selectedPkg.maxPercent}% от суммы пополнения</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showDailyLimitSection && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ToggleSwitch 
                      checked={isDailyLimitEnabled} 
                      onChange={(checked) => {
                        setIsDailyLimitEnabled(checked);
                        if (!checked && onDailyLimitChange) {
                          onDailyLimitChange(null);
                        }
                      }} 
                    />
                    <p className="text-sm text-gray-800 flex items-center gap-1">
                      Дневной лимит
                      <div 
                        className="relative inline-block"
                        onMouseEnter={() => setIsDailyLimitTooltipVisible(true)}
                        onMouseLeave={() => setIsDailyLimitTooltipVisible(false)}
                      >
                        <HelpCircle className="w-4 h-4 text-gray-600 cursor-help" />
                        {isDailyLimitTooltipVisible && (
                          <>
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-80 h-2" onMouseEnter={() => setIsDailyLimitTooltipVisible(true)}></div>
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 text-left"
                              onMouseEnter={() => setIsDailyLimitTooltipVisible(true)}
                              onMouseLeave={() => setIsDailyLimitTooltipVisible(false)}
                            >
                              <p className="font-semibold mb-2">Как работает равномерная открутка лимита?</p>
                              <p className="mb-2">Сумму, которую вы зададите в лимите мы будем расходовать в течение дня равномерно, она не сгорит за 1-2 часа. Так вы достигаете наилучших показателей по показам.</p>
                              <a href="#" className="text-purple-300 hover:underline">Читать подробнее</a>
                            </div>
                          </>
                        )}
                      </div>
                    </p>
                  </div>
                </div>
                {isDailyLimitEnabled && (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="relative w-1/3">
                        <input
                          type="text"
                          value={formatForDisplay(dailyLimitValue)}
                          onChange={(e) => {
                            const parsed = parseDisplayValue(e.target.value);
                            if (!isNaN(parsed)) {
                              setDailyLimitValue(String(parsed));
                            } else if (e.target.value === '') {
                              setDailyLimitValue('');
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseDisplayValue(dailyLimitValue);
                            if (isNaN(parsed) || parsed < 2000) {
                              setDailyLimitValue('2000');
                            }
                            if (onDailyLimitChange) {
                              onDailyLimitChange(parseDisplayValue(dailyLimitValue));
                            }
                          }}
                          className="w-full text-sm bg-white border shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-2 py-1.5 rounded-lg pr-6 border-gray-300"
                          placeholder="2000"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                      </div>
                      <p className="text-xs text-gray-500 flex-1">
                        Равномерно распределим сумму лимита в течении дня
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseDisplayValue(dailyLimitValue) || 0;
                          const newValue = current + 1000;
                          setDailyLimitValue(String(newValue));
                          if (onDailyLimitChange) {
                            onDailyLimitChange(newValue);
                          }
                        }}
                        className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                      >
                        +1000₽
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseDisplayValue(dailyLimitValue) || 0;
                          const newValue = current + 3000;
                          setDailyLimitValue(String(newValue));
                          if (onDailyLimitChange) {
                            onDailyLimitChange(newValue);
                          }
                        }}
                        className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                      >
                        +3000₽
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseDisplayValue(dailyLimitValue) || 0;
                          const newValue = current + 5000;
                          setDailyLimitValue(String(newValue));
                          if (onDailyLimitChange) {
                            onDailyLimitChange(newValue);
                          }
                        }}
                        className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                      >
                        +5000₽
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Отмена</button>
          <button
            onClick={() => {
              const amount = parseDisplayValue(refillAmount);
              onSave(amount);
              if (showDailyLimitSection && isDailyLimitEnabled && onDailyLimitChange) {
                onDailyLimitChange(parseDisplayValue(dailyLimitValue));
              } else if (showDailyLimitSection && !isDailyLimitEnabled && onDailyLimitChange) {
                onDailyLimitChange(null);
              }
            }}
            disabled={!!budgetError || !!bonusError}
            className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status, text }: { status: DisplayCampaign['status'], text: string }) => {
    const baseClasses = 'px-2 py-0.5 text-xs font-medium rounded-full';
    const styles = {
        active: 'bg-green-100 text-green-700',
        paused: 'bg-yellow-100 text-yellow-700',
        draft: 'bg-gray-200 text-gray-600',
        error: 'bg-red-100 text-red-700',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{text}</span>;
}

const ResultBlock = ({ successCount, errorCount, onClear }: { successCount: number, errorCount: number, failedCampaigns: CampaignRecord[], onClear: () => void }) => {
    return (
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100 relative animate-in fade-in duration-300">
            <button onClick={onClear} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-500 mt-1 shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Создано {successCount} {getPlural(successCount, 'кампания', 'кампании', 'кампаний')}
                    </h2>
                    {errorCount > 0 ? (
                        <p className="text-gray-600 mt-1 text-sm">
                            {errorCount} {getPlural(errorCount, 'кампания не была запущена', 'кампании не были запущены', 'кампаний не были запущены')} из-за нехватки средств и {getPlural(errorCount, 'находится', 'находятся', 'находятся')} в статусе «Готово к запуску».{' '}
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-purple-600 font-medium ml-1 hover:underline">показать в списке</a>
                        </p>
                    ) : (
                        <p className="text-gray-600 mt-1 text-sm">Все кампании были успешно запущены.</p>
                    )}
                </div>
            </div>
        </div>
    )
};

const EditResultBlock = ({ successCount, errorCount, onClear, failedIds = [], onShowFailed }: { successCount: number, errorCount: number, onClear: () => void, failedIds?: number[], onShowFailed: (ids: number[]) => void }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!failedIds || failedIds.length === 0) return;
        navigator.clipboard.writeText(failedIds.join('\n')).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        });
    };

    const handleDownload = () => {
        if (!failedIds || failedIds.length === 0) return;
        const csvContent = "data:text/csv;charset=utf-8,campaign_id\n" + failedIds.map(id => `${id}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "failed_campaign_ids.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100 relative animate-in fade-in duration-300">
            <button onClick={onClear} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-500 mt-1 shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Изменения применены
                    </h2>
                    <div className="flex flex-col gap-1 mt-1 text-sm">
                       <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500"/>
                          <span className="text-gray-800 font-medium">Успешно: {successCount} {getPlural(successCount, 'кампания', 'кампании', 'кампаний')}</span>
                       </div>
                       {errorCount > 0 && (
                          <div className="flex items-start gap-2 text-sm">
                             <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5"/>
                             <div className="text-gray-800">
                               <div className="font-medium">
                                 Не хватило денег для пополнения {errorCount} {getPlural(errorCount, 'кампании', 'кампаний', 'кампаний')}.
                               </div>
                               <div className="text-gray-700">
                                 Эти кампании были изменены и находятся в статусе «Готово к запуску». Пополните бюджет и запустите их.
                               </div>
                               {failedIds && failedIds.length > 0 && (
                                 <button
                                   type="button"
                                   onClick={() => onShowFailed(failedIds)}
                                   className="mt-1 text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                                 >
                                   Показать в списке
                                 </button>
                               )}
                             </div>
                          </div>
                       )}
                    </div>
                     {errorCount > 0 && failedIds && failedIds.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                            <button onClick={handleCopy} disabled={isCopied} className="flex items-center gap-2 text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-70 disabled:cursor-wait">
                               <ClipboardCheck className="w-4 h-4" />
                               <span>{isCopied ? 'ID скопированы!' : 'Скопировать ID с ошибками'}</span>
                           </button>
                           <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all">
                               <Download className="w-4 h-4" />
                               <span>Скачать список с ошибками</span>
                           </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ApplyingChangesBlock: React.FC<{ onOpenReview: () => void; onCancel: () => void; }> = ({ onOpenReview, onCancel }) => (
  <div className="bg-white rounded-xl p-8 mb-6 shadow-sm border border-gray-100 flex flex-col items-center text-center animate-in fade-in duration-300">
    <Loader className="w-12 h-12 text-purple-600 animate-spin" />
    <h2 className="text-xl font-bold text-gray-900 mt-4">
      Внесем изменения через 1 минуту
    </h2>
    <div className="mt-2 max-w-xl px-4 py-3 rounded-lg bg-purple-50 border border-purple-100 flex items-start gap-3 text-left">
      <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-gray-900 font-semibold">
        Мы применяем изменения. Пожалуйста, не вносите правки в эти кампании до завершения процесса.
      </p>
    </div>
    <div className="flex items-center gap-4 mt-6">
      <button onClick={onCancel} className="px-5 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
        Отменить изменения
      </button>
      <button onClick={onOpenReview} className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
        Смотреть файл с изменениями
      </button>
    </div>
  </div>
);


const DateFilter = ({ defaultLabel }: { defaultLabel: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setPreset = (preset: 'today' | 'yesterday') => {
    const today = new Date();
    if (preset === 'today') {
        const dateStr = today.toISOString().split('T')[0];
        setStartDate(dateStr);
        setEndDate(dateStr);
        setLabel('Сегодня');
    } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        setStartDate(dateStr);
        setEndDate(dateStr);
        setLabel('Вчера');
    }
    setIsOpen(false);
  };

  const applyCustomRange = () => {
    if (startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString('ru-RU');
        const end = new Date(endDate).toLocaleDateString('ru-RU');
        setLabel(`${start} - ${end}`);
        setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-20 p-4 animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-2">
             <button onClick={() => setPreset('today')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded-md transition-colors">Сегодня</button>
             <button onClick={() => setPreset('yesterday')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded-md transition-colors">Вчера</button>
          </div>
          <div className="border-t my-3"></div>
          <p className="text-sm font-medium mb-2">Выбрать период</p>
          <div className="space-y-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm p-2 focus:ring-purple-500 focus:border-purple-500"/>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm p-2 focus:ring-purple-500 focus:border-purple-500"/>
          </div>
          <button onClick={applyCustomRange} className="w-full mt-3 bg-purple-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">Применить</button>
        </div>
      )}
    </div>
  );
}

const CampaignDropdown = ({ onNavigateToCreation, onOpenSingleCampaign }: { onNavigateToCreation: () => void; onOpenSingleCampaign?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-purple-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
                <Plus className="w-5 h-5" />
                <span>Кампания</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenSingleCampaign?.(); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Одна кампания</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToCreation(); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Много кампаний</a>
                </div>
            )}
        </div>
    );
};

const ExcelActionsDropdown = ({ onOpenUpload, onOpenHistory, showUploadHint = false, onDismissUploadHint }: { onOpenUpload: () => void, onOpenHistory: () => void, showUploadHint?: boolean, onDismissUploadHint?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showHoverTooltip, setShowHoverTooltip] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && showUploadHint) {
                // Don't close tooltip on outside click, only on dismiss button
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
        };
    }, [showUploadHint]);

    const handleMouseEnter = () => {
        hoverTimerRef.current = setTimeout(() => {
            setShowHoverTooltip(true);
        }, 1500);
    };

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setShowHoverTooltip(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Download className="w-5 h-5 text-gray-500" />
                <span>Загрузить Excel</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {showHoverTooltip && (
                <div 
                    className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white rounded-lg shadow-xl z-30 px-3 py-2 text-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onMouseEnter={() => setShowHoverTooltip(true)}
                    onMouseLeave={handleMouseLeave}
                >
                    Массовая загрузка изменений по кампаниям
                    <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
                </div>
            )}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenUpload(); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Загрузить Excel</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenHistory(); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">История изменений</a>
                </div>
            )}
            {showUploadHint && (
                <div 
                    ref={tooltipRef}
                    className="absolute top-full left-0 mt-2 w-80 bg-gray-900 text-white rounded-lg shadow-xl z-30 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-white shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Загрузите изменённый файл</p>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                Вы скачали Excel файл с параметрами кампаний. Внесите необходимые изменения в файл и загрузите его обратно через кнопку "Загрузить Excel" для применения изменений.
                            </p>
                        </div>
                        {onDismissUploadHint && (
                            <button
                                onClick={onDismissUploadHint}
                                className="shrink-0 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                </div>
            )}
        </div>
    );
};

const FilterDropdown = ({ 
  isOpen, 
  onClose, 
  onApply, 
  category, onCategoryChange,
  status, onStatusChange,
  autorefill, onAutorefillChange,
  payment, onPaymentChange,
  sort, onSortChange,
  tempStatus, onTempStatusChange,
  tempAutorefill, onTempAutorefillChange,
  tempPayment, onTempPaymentChange,
  tempSort, onTempSortChange,
  tempCategory, onTempCategoryChange,
  tempTags, onTempTagsChange,
  tempTagsSearch, onTempTagsSearchChange,
  tempTagsCategory, onTempTagsCategoryChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  category: 'status' | 'autorefill' | 'payment' | 'sort' | 'tags';
  onCategoryChange: (cat: 'status' | 'autorefill' | 'payment' | 'sort' | 'tags') => void;
  status: string;
  onStatusChange: (val: string) => void;
  autorefill: string;
  onAutorefillChange: (val: string) => void;
  payment: string;
  onPaymentChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
  tempStatus: string;
  onTempStatusChange: (val: string) => void;
  tempAutorefill: string;
  onTempAutorefillChange: (val: string) => void;
  tempPayment: string;
  onTempPaymentChange: (val: string) => void;
  tempSort: string;
  onTempSortChange: (val: string) => void;
  tempCategory: 'status' | 'autorefill' | 'payment' | 'sort' | 'tags';
  onTempCategoryChange: (cat: 'status' | 'autorefill' | 'payment' | 'sort' | 'tags') => void;
  tempTags: string[];
  onTempTagsChange: (tags: string[]) => void;
  tempTagsSearch: string;
  onTempTagsSearchChange: (search: string) => void;
  tempTagsCategory: string;
  onTempTagsCategoryChange: (category: string) => void;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-[800px] bg-white rounded-2xl shadow-2xl max-h-[600px] overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Categories */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Фильтр</h3>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => onTempCategoryChange('status')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'status' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Статус кампаний
            </button>
            <button 
              onClick={() => onTempCategoryChange('autorefill')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'autorefill' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Автопополнение
            </button>
            <button 
              onClick={() => onTempCategoryChange('payment')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'payment' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Модель оплаты
            </button>
            <button 
              onClick={() => onTempCategoryChange('sort')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'sort' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Тип сортировки кампаний
            </button>
            <button 
              onClick={() => onTempCategoryChange('tags')} 
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tempCategory === 'tags' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              По тегам
            </button>
          </div>
        </div>

        {/* Right Column - Options */}
        <div className="flex-1 p-6 overflow-y-auto">
          {tempCategory === 'status' && (
            <>
              <div className="space-y-3">
                {[
                  { value: 'all-except-archived', label: 'Все, кроме архивных' },
                  { value: 'ready-to-launch', label: 'Готовые к запуску' },
                  { value: 'active', label: 'Активные' },
                  { value: 'paused', label: 'Приостановленные' },
                  { value: 'archived', label: 'Архивные' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempStatus === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempStatus === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempStatus === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="status" 
                      value={option.value} 
                      checked={tempStatus === option.value} 
                      onChange={(e) => onTempStatusChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'autorefill' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Автопополнение</h3>
              <div className="space-y-3">
                {[
                  { value: 'all', label: 'Все' },
                  { value: 'enabled', label: 'Включено' },
                  { value: 'disabled', label: 'Выключено' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempAutorefill === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempAutorefill === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempAutorefill === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="autorefill" 
                      value={option.value} 
                      checked={tempAutorefill === option.value} 
                      onChange={(e) => onTempAutorefillChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'payment' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Модель оплаты</h3>
              <div className="space-y-3">
                {[
                  { value: 'all', label: 'Все' },
                  { value: 'CPC', label: 'CPC' },
                  { value: 'CPM', label: 'CPM' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempPayment === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempPayment === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempPayment === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="payment" 
                      value={option.value} 
                      checked={tempPayment === option.value} 
                      onChange={(e) => onTempPaymentChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'sort' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Тип сортировки кампаний</h3>
              <div className="space-y-3">
                {[
                  { value: 'by-date', label: 'По дате создания' },
                  { value: 'by-name', label: 'По названию' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempSort === option.value 
                        ? 'border-purple-600 bg-purple-600' 
                        : 'border-gray-300 group-hover:border-purple-400'
                    }`}>
                      {tempSort === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm ${
                      tempSort === option.value 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <input 
                      type="radio" 
                      name="sort" 
                      value={option.value} 
                      checked={tempSort === option.value} 
                      onChange={(e) => onTempSortChange(e.target.value)} 
                      className="sr-only" 
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tempCategory === 'tags' && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">По тегам</h3>
              
              {/* Search for tags */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Поиск тегов"
                    value={tempTagsSearch}
                    onChange={(e) => onTempTagsSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Tags list */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Теги</h4>
                <div className="flex flex-wrap gap-2">
                  {['Сезонная распродажа', 'Ликвидация остатков', 'Чёрная пятница', 'Новый год', '8 марта', '1 сентября (школа)', 'Летняя распродажа', 'Зимняя распродажа', 'Межсезонье', 'Скидка по купону', 'Акция поставщика', 'Распродажа витрины', 'Уценка', 'Последние размеры', 'Хиты со скидкой'].filter(tag => 
                    tag.toLowerCase().includes(tempTagsSearch.toLowerCase())
                  ).map(tag => (
                    <label 
                      key={tag}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        tempTags.includes(tag)
                          ? 'bg-purple-50 border-purple-600 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={tempTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onTempTagsChange([...tempTags, tag]);
                          } else {
                            onTempTagsChange(tempTags.filter(t => t !== tag));
                          }
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category selection */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Категория</h4>
                <div className="space-y-2">
                  {['Брюки', 'Платья', 'Футболки', 'Аксессуары', 'Обувь', 'Электроника', 'Дом', 'Кольца', 'Фоторамки', 'Спортивная одежда', 'Косметика', 'Игрушки'].map(category => (
                    <label key={category} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        tempTagsCategory === category 
                          ? 'border-purple-600 bg-purple-600' 
                          : 'border-gray-300 group-hover:border-purple-400'
                      }`}>
                        {tempTagsCategory === category && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${
                        tempTagsCategory === category 
                          ? 'text-gray-900 font-medium' 
                          : 'text-gray-700'
                      }`}>
                        {category}
                      </span>
                      <input 
                        type="radio" 
                        name="tagsCategory" 
                        value={category} 
                        checked={tempTagsCategory === category} 
                        onChange={(e) => onTempTagsCategoryChange(e.target.value)} 
                        className="sr-only" 
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset button */}
              {(tempTags.length > 0 || tempTagsCategory !== '' || tempTagsSearch !== '') && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      onTempTagsChange([]);
                      onTempTagsCategoryChange('');
                      onTempTagsSearchChange('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Сбросить фильтр
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="border-t border-gray-200 p-4 flex items-center justify-end gap-3">
        <button 
          onClick={onClose} 
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button 
          onClick={onApply} 
          className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all"
        >
          Применить
        </button>
      </div>
    </div>
  );
};


export const SuccessPage: React.FC<SuccessPageProps> = ({ 
    isLaunching, 
    launchTotal, 
    launchResult, 
    failedCampaigns, 
    onClearLaunchResult, 
    onNavigateToCreation,
    onOpenUploadEditsModal,
    selectedCampaigns,
    onSelectionChange,
    isApplyingEdits,
    editResult,
    onClearEditResult,
    onOpenReview,
    onCancelEdits,
    onOpenHistoryModal,
    showUploadHint = false,
    onDismissUploadHint,
    onOpenCpcCampaign,
    onOpenSingleCampaign,
}) => {
  const [allCampaigns, setAllCampaigns] = useState<DisplayCampaign[]>(MOCK_CAMPAIGNS);
  const [currentPage, setCurrentPage] = useState(1);
  const CAMPAIGNS_PAGE_SIZE = 10;
  const [isBudgetRefillModalOpen, setIsBudgetRefillModalOpen] = useState(false);
  const [selectedCampaignForRefill, setSelectedCampaignForRefill] = useState<DisplayCampaign | null>(null);
  const [isModalOpenedFromDailyLimit, setIsModalOpenedFromDailyLimit] = useState(false);

  // Filter states
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'status' | 'autorefill' | 'payment' | 'sort' | 'tags'>('status');
  const [filterStatus, setFilterStatus] = useState<string>('all-except-archived');
  const [filterAutorefill, setFilterAutorefill] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterSort, setFilterSort] = useState<string>('by-date');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterTagsCategory, setFilterTagsCategory] = useState<string>('');

  // Temporary filter states for dropdown
  const [tempFilterCategory, setTempFilterCategory] = useState<'status' | 'autorefill' | 'payment' | 'sort' | 'tags'>('status');
  const [tempFilterStatus, setTempFilterStatus] = useState<string>('all-except-archived');
  const [tempFilterAutorefill, setTempFilterAutorefill] = useState<string>('all');
  const [tempFilterPayment, setTempFilterPayment] = useState<string>('all');
  const [tempFilterSort, setTempFilterSort] = useState<string>('by-date');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempTagsSearch, setTempTagsSearch] = useState<string>('');
  const [tempTagsCategory, setTempTagsCategory] = useState<string>('');
  const [failedFilterIds, setFailedFilterIds] = useState<number[] | null>(null);

  // Initialize temporary states when dropdown opens
  useEffect(() => {
    if (isFilterDropdownOpen) {
      setTempFilterCategory(filterCategory);
      setTempFilterStatus(filterStatus);
      setTempFilterAutorefill(filterAutorefill);
      setTempFilterPayment(filterPayment);
      setTempFilterSort(filterSort);
      setTempTags(filterTags);
      setTempTagsSearch('');
      setTempTagsCategory(filterTagsCategory);
    }
  }, [isFilterDropdownOpen, filterCategory, filterStatus, filterAutorefill, filterPayment, filterSort, filterTags, filterTagsCategory]);

  const handleApplyFilters = () => {
    setFilterCategory(tempFilterCategory);
    setFilterStatus(tempFilterStatus);
    setFilterAutorefill(tempFilterAutorefill);
    setFilterPayment(tempFilterPayment);
    setFilterSort(tempFilterSort);
    setFilterTags(tempTags);
    setFilterTagsCategory(tempTagsCategory);
    setIsFilterDropdownOpen(false);
  };

  const handleCancelFilters = () => {
    // Reset temporary states to current applied states
    setTempFilterCategory(filterCategory);
    setTempFilterStatus(filterStatus);
    setTempFilterAutorefill(filterAutorefill);
    setTempFilterPayment(filterPayment);
    setTempFilterSort(filterSort);
    setTempTags(filterTags);
    setTempTagsSearch('');
    setTempTagsCategory(filterTagsCategory);
    setIsFilterDropdownOpen(false);
  };

  // Filter and sort campaigns
  const campaigns = React.useMemo(() => {
    let filtered = [...allCampaigns];

    // Filter by status
    if (filterStatus !== 'all-except-archived') {
      if (filterStatus === 'ready-to-launch') {
        filtered = filtered.filter(c => c.status === 'draft');
      } else if (filterStatus === 'active') {
        filtered = filtered.filter(c => c.status === 'active');
      } else if (filterStatus === 'paused') {
        filtered = filtered.filter(c => c.status === 'paused');
      } else if (filterStatus === 'archived') {
        filtered = filtered.filter(c => c.status === 'error');
      }
    } else {
      filtered = filtered.filter(c => c.status !== 'error');
    }

    // Filter by autorefill
    if (filterAutorefill !== 'all') {
      if (filterAutorefill === 'enabled') {
        filtered = filtered.filter(c => c.autoRefill === true);
      } else if (filterAutorefill === 'disabled') {
        filtered = filtered.filter(c => c.autoRefill === false);
      }
    }

    // Filter by payment model
    if (filterPayment !== 'all') {
      filtered = filtered.filter(c => c.type === filterPayment);
    }

    // Filter by tags
    if (filterTags.length > 0) {
      filtered = filtered.filter(c => {
        if (!c.campaignTags || c.campaignTags.length === 0) return false;
        return filterTags.some(tag => c.campaignTags.includes(tag));
      });
    }

    // Filter by tags category
    if (filterTagsCategory && filterTagsCategory !== '') {
      // This would filter by category if needed - for now we'll skip this as categories are not in DisplayCampaign
      // Can be implemented later if category field is added
    }

    // Filter by failed IDs (from edit result block)
    if (failedFilterIds && failedFilterIds.length > 0) {
      const idSet = new Set(failedFilterIds);
      filtered = filtered.filter(c => idSet.has(c.campaignId));
    }

    // Sort campaigns
    if (filterSort === 'by-name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    // by-date is default order (no sorting needed)

    return filtered;
  }, [allCampaigns, filterStatus, filterAutorefill, filterPayment, filterSort, filterTags, filterTagsCategory, failedFilterIds]);

  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * CAMPAIGNS_PAGE_SIZE,
    currentPage * CAMPAIGNS_PAGE_SIZE
  );
  
  const paginatedIds = paginatedCampaigns.map(c => c.id);
  const isAllOnPageSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedCampaigns.includes(id));

  const handleSelectAll = (isChecked: boolean) => {
      if(isChecked) {
          onSelectionChange([...new Set([...selectedCampaigns, ...paginatedIds])]);
      } else {
          onSelectionChange(selectedCampaigns.filter(id => !paginatedIds.includes(id)));
      }
  }
  
  const handleSelectSingle = (id: string, isChecked: boolean) => {
      if(isChecked) {
          onSelectionChange([...selectedCampaigns, id]);
      } else {
          onSelectionChange(selectedCampaigns.filter(cid => cid !== id));
      }
  }

  const handleStatusToggle = (campaignId: string, isChecked: boolean) => {
    setAllCampaigns(prevCampaigns =>
        prevCampaigns.map(campaign => {
            if (campaign.id === campaignId) {
                const newStatus = isChecked ? 'active' : 'paused';
                return {
                    ...campaign,
                    status: newStatus,
                    statusText: newStatus === 'active' ? 'активна' : 'приостановлена',
                };
            }
            return campaign;
        })
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      {isLaunching && <CompactLaunchLoader total={launchTotal} />}
      {!isLaunching && launchResult && (
          <ResultBlock
              successCount={launchResult.success}
              errorCount={launchResult.error}
              failedCampaigns={failedCampaigns}
              onClear={onClearLaunchResult}
          />
      )}
      {!isLaunching && !isApplyingEdits && editResult && (
        <EditResultBlock 
          successCount={editResult.success}
          errorCount={editResult.error}
          onClear={() => {
            onClearEditResult();
            setFailedFilterIds(null);
          }}
          failedIds={editResult.failedIds}
          onShowFailed={(ids) => {
            if (ids && ids.length > 0) {
              setFailedFilterIds(ids);
              // Сбрасываем пагинацию на первую страницу, чтобы точно увидеть отфильтрованные кампании
              setCurrentPage(1);
            }
          }}
        />
      )}

      {isApplyingEdits && <ApplyingChangesBlock onOpenReview={onOpenReview} onCancel={onCancelEdits} />}
      
      <div>
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-6">
              <CampaignDropdown onNavigateToCreation={onNavigateToCreation} onOpenSingleCampaign={onOpenSingleCampaign} />
              <ExcelActionsDropdown 
                  onOpenUpload={onOpenUploadEditsModal}
                  onOpenHistory={onOpenHistoryModal}
                  showUploadHint={showUploadHint}
                  onDismissUploadHint={onDismissUploadHint}
              />
              <div className="relative flex-grow ml-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                  type="text" 
                  placeholder="поиск по ID, артикуту и названию"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              />
              </div>
              <DateFilter defaultLabel="Период статистики" />
              <DateFilter defaultLabel="Дата создания" />
              <div className="relative">
                <button 
                  onClick={() => setIsFilterDropdownOpen(prev => !prev)} 
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span>Фильтр</span>
                </button>
                <FilterDropdown
                  isOpen={isFilterDropdownOpen}
                  onClose={handleCancelFilters}
                  onApply={handleApplyFilters}
                  category={filterCategory}
                  onCategoryChange={setFilterCategory}
                  status={filterStatus}
                  onStatusChange={setFilterStatus}
                  autorefill={filterAutorefill}
                  onAutorefillChange={setFilterAutorefill}
                  payment={filterPayment}
                  onPaymentChange={setFilterPayment}
                  sort={filterSort}
                  onSortChange={setFilterSort}
                  tempCategory={tempFilterCategory}
                  onTempCategoryChange={setTempFilterCategory}
                  tempStatus={tempFilterStatus}
                  onTempStatusChange={setTempFilterStatus}
                  tempAutorefill={tempFilterAutorefill}
                  onTempAutorefillChange={setTempFilterAutorefill}
                  tempPayment={tempFilterPayment}
                  onTempPaymentChange={setTempFilterPayment}
                  tempSort={tempFilterSort}
                  onTempSortChange={setTempFilterSort}
                  tempTags={tempTags}
                  onTempTagsChange={setTempTags}
                  tempTagsSearch={tempTagsSearch}
                  onTempTagsSearchChange={setTempTagsSearch}
                  tempTagsCategory={tempTagsCategory}
                  onTempTagsCategoryChange={setTempTagsCategory}
                />
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                          <th className="p-4 w-12"><input type="checkbox" checked={isAllOnPageSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /></th>
                          <th className="p-4 w-10"></th>
                          <th className="p-4 text-left font-medium min-w-[300px]">
                                <div className="flex items-center gap-1">
                                    Товар/Кампания <ArrowUp className="w-4 h-4" />
                                </div>
                            </th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Тип кампании <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Остаток бюджета <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Затраты <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Показы <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">CTR <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Заказы <HelpCircle className="w-4 h-4" /></div></th>
                          <th className="p-4 text-left font-medium"><div className="flex items-center gap-1">Доля затрат <HelpCircle className="w-4 h-4" /></div></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {paginatedCampaigns.map(c => (
                          <tr
                            key={c.id}
                            onClick={(e) => {
                              if (c.type === 'CPC' && !(e.target as HTMLElement).closest('button')) {
                                onOpenCpcCampaign({ campaignId: c.campaignId, name: c.name });
                              }
                            }}
                            className={`transition-colors ${selectedCampaigns.includes(c.id) ? 'bg-purple-50' : 'hover:bg-gray-50'} ${c.type === 'CPC' ? 'cursor-pointer' : ''}`}
                          >
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedCampaigns.includes(c.id)}
                                  onChange={(e) => handleSelectSingle(c.id, e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                              </td>
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                  <ToggleSwitch
                                      checked={c.status === 'active'}
                                      onChange={(isChecked) => handleStatusToggle(c.id, isChecked)}
                                      disabled={c.status === 'draft' || c.status === 'error'}
                                  />
                              </td>
                              <td className="p-4">
                                  <div className="flex items-center gap-3">
                                      <img src={c.image} alt={c.name} className="w-10 h-10 rounded-md shrink-0"/>
                                      <div>
                                          <p className="font-medium text-gray-800 truncate" title={c.name}>{c.name}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                                              <StatusBadge status={c.status} text={c.statusText} />
                                              <span>ID {c.campaignId}</span>
                                              {c.tags.map(tag => (
                                                  <div key={tag.text} className={`flex items-center gap-1 ${tag.type === 'warning' ? 'text-amber-700' : tag.type === 'error' ? 'text-red-700' : ''}`}>
                                                      {tag.icon} {tag.text}
                                                  </div>
                                              ))}
                                          </div>
                                          {c.campaignTags && c.campaignTags.length > 0 && (
                                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1.5 flex-wrap">
                                                  {c.campaignTags.map((tag, idx) => (
                                                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                                                          #{tag}
                                                      </span>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <div className="font-semibold">{c.type}</div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                      {c.typeDetails && <span>{c.typeDetails}</span>}
                                      {c.typeIcons.map((icon, i) => <span key={i} className="p-1 bg-gray-100 rounded">{icon}</span>)}
                                  </div>
                              </td>
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="relative inline-flex items-center group" onClick={(e) => e.stopPropagation()}>
                                      <button
                                          type="button"
                                          onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setSelectedCampaignForRefill(c);
                                              setIsBudgetRefillModalOpen(true);
                                          }}
                                          className="font-semibold text-blue-600 hover:text-purple-600 transition-colors cursor-pointer"
                                      >
                                          {formatCurrency(c.remainingBudget)}
                                      </button>
                                      <button
                                          type="button"
                                          onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setSelectedCampaignForRefill(c);
                                              setIsBudgetRefillModalOpen(true);
                                          }}
                                          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <Plus className="w-4 h-4 text-purple-600" />
                                      </button>
                                  </div>
                                  {c.type === 'CPC' && c.dailyLimit && (
                                      <>
                                          <DailyLimitTooltip 
                                              dailyLimit={c.dailyLimit} 
                                              onClick={() => {
                                                  setSelectedCampaignForRefill(c);
                                                  setIsModalOpenedFromDailyLimit(true);
                                                  setIsBudgetRefillModalOpen(true);
                                              }}
                                          />
                                          {c.autoRefill && (
                                              <div className="flex items-center gap-1 text-xs mt-1 text-green-600">
                                                  <CheckCircle className="w-3.5 h-3.5" />
                                      Автопополнение
                                  </div>
                                          )}
                                      </>
                                  )}
                                  {(!c.type || c.type !== 'CPC' || !c.dailyLimit) && c.autoRefill && (
                                      <div className="flex items-center gap-1 text-xs mt-1 text-green-600">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          Автопополнение
                                      </div>
                                  )}
                              </td>
                              <td className="p-4">{formatCurrency(c.spend)}</td>
                              <td className="p-4">{formatNumber(c.impressions)}</td>
                              <td className="p-4">{formatPercentage(c.ctr)}</td>
                              <td className="p-4">{formatNumber(c.orders)}</td>
                              <td className="p-4">{formatPercentage(c.spendShare)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <Pagination
              total={campaigns.length}
              pageSize={CAMPAIGNS_PAGE_SIZE}
              current={currentPage}
              onChange={setCurrentPage}
          />
          </div>
      </div>
      {isBudgetRefillModalOpen && selectedCampaignForRefill && (
        <BudgetRefillModal
          isOpen={isBudgetRefillModalOpen}
          onClose={() => {
            setIsBudgetRefillModalOpen(false);
            setSelectedCampaignForRefill(null);
            setIsModalOpenedFromDailyLimit(false);
          }}
          onSave={(amount) => {
            setAllCampaigns(prev => prev.map(c => 
              c.id === selectedCampaignForRefill.id 
                ? { ...c, remainingBudget: (c.remainingBudget || 0) + amount }
                : c
            ));
            setIsBudgetRefillModalOpen(false);
            setSelectedCampaignForRefill(null);
            setIsModalOpenedFromDailyLimit(false);
          }}
          currentBudget={selectedCampaignForRefill.remainingBudget || 0}
          dailyLimit={selectedCampaignForRefill.dailyLimit || null}
          showDailyLimitSection={isModalOpenedFromDailyLimit || (selectedCampaignForRefill.type === 'CPC' && selectedCampaignForRefill.dailyLimit !== null && selectedCampaignForRefill.dailyLimit !== undefined)}
          onDailyLimitChange={(limit) => {
            if (selectedCampaignForRefill) {
              setAllCampaigns(prev => prev.map(c => 
                c.id === selectedCampaignForRefill.id 
                  ? { ...c, dailyLimit: limit }
                  : c
              ));
            }
          }}
        />
      )}
    </div>
  );
};