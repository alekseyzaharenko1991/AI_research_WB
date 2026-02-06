import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CampaignConfig, PaymentModel, BidType, CampaignRecord, CampaignStatus } from './types';
import { 
  FileSpreadsheet, UploadCloud, Info, Download, Trash2, CheckCircle, Bell, HelpCircle, Wallet, ChevronDown, ChevronRight, X, FileIcon, Loader, Edit2, Plus, RefreshCw, DollarSign, Briefcase, Zap, Search, Wand, Settings, SingleAccountIcon, Clock, ThumbsUp, ClipboardCheck, Check, AlertTriangle
} from './components/Icons';
import { getMockProductsForCategory, validateUploadedFile } from './services/geminiService';
import { MultiSelect } from './components/MultiSelect';
import { ProductMultiSelect } from './components/ProductMultiSelect';
import { SuccessPage } from './components/SuccessPage';
import { ReviewEditsModal } from './components/ReviewEditsModal';
import { ChangesHistoryModal } from './components/ChangesHistoryModal';
import { CpcCampaignPage } from './components/CpcCampaignPage';
import { MassEditPage } from './components/MassEditPage';
import { SingleCampaignPage } from './components/SingleCampaignPage';

// --- Types ---
interface TemplateGroup {
  id: string; // e.g., "CPC-Manual"
  config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>;
  campaigns: CampaignRecord[];
  duplicateNmIds: Set<number>;
  correctedNmIds: Set<number>;
  currentPage: number;
  sourceFiles: Set<string>;
}

type SelectableProduct = Pick<CampaignRecord, 'nmId' | 'productName' | 'imageUrl' | 'category' | 'cpcCompatible'>;
type BulkActionType = 'bid' | 'budget' | 'funding' | 'autorefill' | 'delete' | 'autobidder' | null;

interface BonusPackage {
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
}

// --- Constants ---
const CATEGORIES = ['Брюки', 'Платья', 'Футболки', 'Аксессуары', 'Обувь', 'Электроника', 'Дом', 'Кольца', 'Фоторамки', 'Спортивная одежда', 'Косметика', 'Игрушки'];
const UNIFIED_BALANCE = 105350;
const TOTAL_PROMO_BONUS = 226660517;
const PAGE_SIZE = 50;
const MASTER_PASSWORD = '01020808';

const BONUS_PACKAGES: BonusPackage[] = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

// --- Helpers ---
export const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };
const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};
const parseDisplayValue = (str: string): number => {
  return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};

// --- Sub-Components ---

const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password === MASTER_PASSWORD) {
      onAuth();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-[200]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="text-3xl font-bold text-gray-400">WB</span>
          <span className="text-2xl text-gray-300">|</span>
          <span className="text-xl font-medium text-gray-800">Продвижение</span>
        </div>
        <h1 className="text-xl font-bold text-center mb-6">Вход в систему</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Введите пароль</label>
            <input 
              type="password" 
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 animate-shake' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-center tracking-widest text-lg`}
              placeholder="••••••••"
            />
            {error && <p className="text-red-500 text-xs mt-2 text-center">Неверный пароль</p>}
          </div>
          <button 
            type="submit"
            className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-[0.98]"
          >
            Войти
          </button>
        </form>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

const Header = ({ onNavigateToList }: { onNavigateToList: () => void }) => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-14 bg-white">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-400">WB</span>
                    <span className="text-xl text-gray-300">|</span>
                    <span className="text-lg font-medium text-gray-800">Продвижение</span>
                </div>
                <button className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                    Продвижение
                </button>
                <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 font-medium">
                    <a href="#" className="hover:text-purple-600">Медиа</a>
                    <a href="#" className="hover:text-purple-600">Наружная реклама</a>
                    <a href="#" className="hover:text-purple-600">Мой магазин</a>
                    <a href="#" className="hover:text-purple-600">Внешний трафик</a>
                </nav>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative">
                    <Bell className="w-6 h-6 text-gray-600" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">99+</span>
                </div>
                <HelpCircle className="w-6 h-6 text-gray-600" />
                <div className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer">
                    <span>МЕГАПОЛИС...</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>
        <div className="px-6 h-12 flex items-center justify-between border-t border-gray-100 bg-white">
            <div className="flex items-center gap-8 text-sm font-medium">
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToList(); }} className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Кампании</a>
                <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Статистика</a>
                <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Финансы</a>
                <a href="#" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">
                    Новости <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">99+</span>
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Помощь</a>
                <a href="#" className="text-gray-500 hover:text-gray-900 py-3 border-b-2 border-transparent">Мои бонусы</a>
            </div>
            <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <Wallet className="w-5 h-5 text-gray-400" />
                <span>{UNIFIED_BALANCE.toLocaleString('ru-RU')} ₽</span>
            </div>
        </div>
    </header>
);

const Toast = ({ show, message, onClose }: { show: boolean, message: string, onClose: () => void }) => { useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]); if (!show) return null; return ( <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300"> <CheckCircle className="w-5 h-5 text-green-400" /> <span className="font-medium">{message}</span> </div> ); };

const UndoToast: React.FC<{
  campaign: CampaignRecord | null;
  onUndo: () => void;
}> = ({ campaign, onUndo }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (campaign) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [campaign]);

  if (!isVisible || !campaign) {
    return null;
  }

  return (
    <div
      key={campaign.id} 
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl z-[100] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <Trash2 className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="flex-grow relative overflow-hidden">
        <p className="font-medium">Кампания "{campaign.productName}" удалена.</p>
        <div className="absolute bottom-[-8px] left-0 right-0 h-1 bg-gray-700">
            <div className="h-1 bg-purple-500 animate-shrink-width"></div>
        </div>
      </div>
      <button onClick={onUndo} className="font-bold text-purple-400 hover:text-purple-300 ml-4 shrink-0">
        Отменить
      </button>
      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrink-width 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

const ToggleSwitch = ({ id, checked, onChange, disabled = false }: { id?: string; checked: boolean; onChange: (checked: boolean) => void, disabled?: boolean }) => ( <button id={id} role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)} disabled={disabled} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' } ${ checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' }`} > <span aria-hidden="true" className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ checked ? 'translate-x-3' : 'translate-x-0' }`} /> </button> );

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Удалить',
  confirmColor = 'red',
  secondaryConfirmText,
  onSecondaryConfirm,
  cancelText = "Отмена"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmColor?: 'red' | 'purple';
  secondaryConfirmText?: string;
  onSecondaryConfirm?: () => void;
  cancelText?: string;
}) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="text-sm text-gray-600 mb-6">
                    {children}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        {cancelText}
                    </button>
                     {onSecondaryConfirm && secondaryConfirmText && (
                        <button onClick={onSecondaryConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${colorClasses.purple}`}>
                           {secondaryConfirmText}
                        </button>
                    )}
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${colorClasses[confirmColor]}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddItemModal = ({ isOpen, onClose, onSubmit, onTemplateDownload, initialConfig, showToast, setToastMessage }: { isOpen: boolean, onClose: () => void, onSubmit: (config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>, items: CampaignRecord[]) => void, onTemplateDownload: (config: CampaignConfig) => void, initialConfig: CampaignConfig, showToast: (show: boolean) => void, setToastMessage: (message: string) => void }) => {
    const [tempConfig, setTempConfig] = useState(initialConfig);
    const [selectedProducts, setSelectedProducts] = useState<SelectableProduct[]>([]);
    const excelFileInputRef = useRef<HTMLInputElement>(null);
    const [uploadInfo, setUploadInfo] = useState<{ loaded: number, total: number, fileName: string } | null>(null);
    const [isProcessingExcel, setIsProcessingExcel] = useState(false);
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'select' | 'upload'>('select');

    useEffect(() => {
        if (isOpen) {
            setTempConfig(initialConfig);
            setSelectedProducts([]);
            setUploadInfo(null);
            setIsProcessingExcel(false);
            setActiveTab('select');
        }
    }, [isOpen, initialConfig]);

    const mockProducts = useMemo(() => {
        if (tempConfig.categories.length === 0) {
            return getMockProductsForCategory('Все товары');
        }
        return tempConfig.categories.flatMap(category => getMockProductsForCategory(category));
    }, [tempConfig.categories]);

    const validSelectedProducts = useMemo(() => {
        return selectedProducts.filter(p => tempConfig.paymentModel === PaymentModel.CPC ? p.cpcCompatible : true);
    }, [selectedProducts, tempConfig.paymentModel]);

    const cpcIncompatibleInSelection = useMemo(() => {
        if (tempConfig.paymentModel !== PaymentModel.CPC) return [];
        return selectedProducts.filter(p => !p.cpcCompatible);
    }, [selectedProducts, tempConfig.paymentModel]);

    const handleDownloadTemplateFile = (fileType: 'xlsx' | 'csv') => {
        const content = "nmId\n12345678\n87654321\n11223344";
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `upload_template.${fileType}`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setToastMessage(`Шаблон ${fileType.toUpperCase()} скачан`);
        showToast(true);
    };

    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        const file = event.target.files[0];
        setUploadInfo(null);
        setSelectedProducts([]);
        setIsProcessingExcel(true);
        setTempConfig(p => ({ ...p, categories: ['Одежда'] }));

        setTimeout(() => {
            const totalInFile = Math.floor(Math.random() * 10) + 20; 
            const foundCount = Math.floor(totalInFile * (Math.random() * 0.2 + 0.8)); 
            
            const allPossibleProducts = getMockProductsForCategory('Одежда');
            const foundProducts = allPossibleProducts.slice(0, foundCount);

            setSelectedProducts(foundProducts);
            setUploadInfo({ loaded: foundCount, total: totalInFile, fileName: file.name });
            setIsProcessingExcel(false);
        }, 2500);

        if (excelFileInputRef.current) {
            excelFileInputRef.current.value = "";
        }
    };

    const handleDeleteUpload = () => {
        setUploadInfo(null);
        setSelectedProducts([]);
        setTempConfig(p => ({ ...p, categories: [] }));
        setToastMessage("Загруженный файл удален.");
        showToast(true);
    };
    
    const handleSubmit = () => {
        const currentDate = new Date().toLocaleDateString('ru-RU');
        const finalCampaigns = validSelectedProducts.map(p => {
            const campaignBase: Omit<CampaignRecord, 'bid' | 'searchBid' | 'recommendationsBid'> = {
                id: `${p.nmId}-${Date.now()}`,
                nmId: p.nmId,
                productName: p.productName,
                campaignName: `${p.productName} ${tempConfig.paymentModel} ${currentDate}`,
                imageUrl: p.imageUrl,
                category: p.category,
                budget: 3000,
                autoReplenishment: false,
                fundingSource: 'Единый счёт',
                status: CampaignStatus.VALID,
                usePromoBonuses: true,
                source: uploadInfo ? uploadInfo.fileName : 'Ручное добавление',
                cpcCompatible: p.cpcCompatible,
                bonusAmount: 0,
            };
    
            if (tempConfig.paymentModel === PaymentModel.CPM) {
                if (tempConfig.bidType === BidType.MANUAL) {
                    return { ...campaignBase, searchBid: 300, recommendationsBid: 300 } as CampaignRecord;
                }
                return { ...campaignBase, bid: 300 } as CampaignRecord;
            } else { 
                return { ...campaignBase, bid: 30 } as CampaignRecord;
            }
        });
        onSubmit({paymentModel: tempConfig.paymentModel, bidType: tempConfig.bidType}, finalCampaigns);
        onClose();
    };

    const hasChanges = selectedProducts.length > 0 || !!uploadInfo;

    const handleCloseRequest = () => {
        if (hasChanges) {
            setIsConfirmCloseOpen(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setIsConfirmCloseOpen(false);
        onClose();
    };
    
    if (isConfirmCloseOpen) {
      return (
          <ConfirmationModal
              isOpen={true}
              onClose={() => setIsConfirmCloseOpen(false)}
              onConfirm={handleConfirmClose}
              title="Подтвердите закрытие"
              confirmText="Закрыть"
              confirmColor="red"
              children={<p>У вас есть несохраненные изменения. Вы уверены, что хотите закрыть окно? Все настроенные товары будут сброшены.</p>}
          />
      );
    }
    
    if (!isOpen) {
        return null;
    }

    return ( 
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={handleCloseRequest}> 
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl m-auto flex flex-col h-[85vh]" onClick={(e) => e.stopPropagation()}> 
                <div className="flex items-start justify-between p-6 border-b border-gray-100"> 
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Добавление списка товаров</h2> 
                        <p className="text-sm text-gray-500 mt-1">создайте один или больше списков и запустите сразу несколько кампаний, один товар = 1 кампания</p>
                    </div>
                    <button onClick={handleCloseRequest} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X className="w-6 h-6" /></button> 
                </div> 
                <div className="p-6 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                    <section>
                        <h3 className="text-lg font-bold">Добавление товара</h3>
                        
                        <div className="my-4">
                            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 space-x-1">
                                <button
                                    onClick={() => setActiveTab('select')}
                                    className={`px-5 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'select' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Выбрать из списка
                                </button>
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`px-5 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Загрузить из файла
                                </button>
                            </div>
                        </div>

                        {activeTab === 'upload' && (
                            <div>
                                {activeTab === 'upload' && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        Загрузите Excel-файл со списком ID товаров.{' '}
                                        <button
                                            onClick={() => handleDownloadTemplateFile('xlsx')}
                                            className="text-gray-500 underline hover:text-purple-600 focus:outline-none"
                                        >
                                            Шаблон скачать
                                        </button>
                                    </p>
                                )}
                                {isProcessingExcel && (
                                    <div className="my-3 p-4 bg-gray-50 rounded-lg flex items-center gap-3 text-sm text-gray-600">
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>Обрабатываем ваш файл...</span>
                                    </div>
                                )}

                                {!isProcessingExcel && uploadInfo && (
                                    <div className="my-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                                                <div className="overflow-hidden">
                                                    <p className="font-medium text-gray-800 truncate" title={uploadInfo.fileName}>{uploadInfo.fileName}</p>
                                                    <p className="text-xs text-gray-500">Найдено {uploadInfo.loaded} из {uploadInfo.total} товаров</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center shrink-0">
                                                <button onClick={() => excelFileInputRef.current?.click()} className="ml-2 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Заменить</button>
                                                <button onClick={handleDeleteUpload} className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {!isProcessingExcel && !uploadInfo && (
                                  <div>
                                    <input type="file" ref={excelFileInputRef} className="hidden" onChange={handleExcelUpload} accept=".xlsx,.csv" />
                                    <button 
                                        onClick={() => excelFileInputRef.current?.click()}
                                        className="w-full justify-center text-sm font-medium text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5 p-4 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl transition-colors"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        <span>Добавить Excel с ID товаров</span>
                                    </button>
                                  </div>
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'select' && (
                             <div className="relative">
                                <div className="space-y-6">
                                    <div>
                                        <MultiSelect options={CATEGORIES} selected={tempConfig.categories} onChange={(c) => { setTempConfig(p => ({...p, categories: c})); setSelectedProducts([]); }} placeholder="Выберите категории" disabled={!!uploadInfo}/>
                                    </div>
                                    <div>
                                        <ProductMultiSelect
                                            options={mockProducts}
                                            selected={selectedProducts}
                                            onChange={setSelectedProducts}
                                            isCpcMode={tempConfig.paymentModel === PaymentModel.CPC}
                                            disabled={!!uploadInfo || tempConfig.categories.length === 0 || isProcessingExcel}
                                            submitLabel="Применить товары"
                                        />
                                        {cpcIncompatibleInSelection.length > 0 && (
                                            <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                                                Часть товаров&nbsp;
                                                <span className="tooltip underline decoration-dotted cursor-help">
                                                    ({cpcIncompatibleInSelection.length})
                                                    <span className="tooltip-text !w-64 text-left">
                                                        <span className="font-bold block mb-1 text-white">Несовместимые ID товаров:</span>
                                                        <span className="font-normal text-gray-200 break-all">
                                                            {cpcIncompatibleInSelection.map(p => p.nmId).join(', ')}
                                                        </span>
                                                    </span>
                                                </span>
                                                &nbsp;не может продвигаться по CPC, они не будут добавлены в кампанию.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                    
                    {hasChanges && (
                        <div className="space-y-6 pt-4 border-t border-gray-200 mt-6 animate-in fade-in duration-500">
                            <section>
                            <h3 className="text-lg font-bold mb-3">Тип продвижения</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className={`relative p-5 rounded-xl border-2 cursor-pointer ${tempConfig.paymentModel === PaymentModel.CPM ? 'bg-gray-100 border-transparent ring-2 ring-purple-600' : 'bg-white border-gray-100'}`} onClick={() => setTempConfig(p => ({...p, paymentModel: PaymentModel.CPM}))}> <div className="flex items-start gap-4"> <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${tempConfig.paymentModel === PaymentModel.CPM ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>{tempConfig.paymentModel === PaymentModel.CPM && <div className="w-2 h-2 bg-white rounded-full"></div>}</div> <div> <span className="block font-semibold text-lg">Оплата за показы (CPM)</span> <span className="text-gray-500 text-sm">Вы платите за 1 000 показов</span> </div> </div> </label>
                                <label className={`relative p-5 rounded-xl border-2 cursor-pointer ${tempConfig.paymentModel === PaymentModel.CPC ? 'bg-gray-100 border-transparent ring-2 ring-purple-600' : 'bg-white border-gray-100'}`} onClick={() => setTempConfig(p => ({...p, paymentModel: PaymentModel.CPC, bidType: BidType.UNIFIED}))}> <div className="flex items-start gap-4"> <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${tempConfig.paymentModel === PaymentModel.CPC ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>{tempConfig.paymentModel === PaymentModel.CPC && <div className="w-2 h-2 bg-white rounded-full"></div>}</div> <div> <span className="block font-semibold text-lg">Оплата за клики (CPC)</span> <span className="text-gray-500 text-sm">Вы платите за 1 клик</span> </div> </div> </label>
                            </div>
                            </section>
                            {tempConfig.paymentModel === PaymentModel.CPM && (
                            <section>
                            <h3 className="text-lg font-bold mb-4">Зоны показов</h3>
                            <div className="space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTempConfig(p => ({...p, bidType: BidType.UNIFIED}))}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${tempConfig.bidType === BidType.UNIFIED ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                        {tempConfig.bidType === BidType.UNIFIED && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">Единая ставка: продвижение сразу в поиске и рекомендациях</span>
                                        <p className="text-sm text-gray-500 mt-1">
                                            мин. ставка <span className="font-bold text-purple-600">94–155 ₽</span> в зависимости от категории товаров
                                        </p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTempConfig(p => ({...p, bidType: BidType.MANUAL}))}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${tempConfig.bidType === BidType.MANUAL ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                        {tempConfig.bidType === BidType.MANUAL && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">Ручная ставка: выбирайте зоны показов и ставку для них</span>
                                        <p className="text-sm text-gray-500 mt-1">
                                            мин. ставка <span className="font-bold text-purple-600">190–240 ₽</span> в зависимости от категории товаров
                                        </p>
                                    </div>
                                </label>
                            </div>
                            </section>
                            )}
                        </div>
                    )}
                </div> 
                <div className="flex justify-end items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-100 rounded-b-2xl"> 
                    <button onClick={handleCloseRequest} className="px-6 py-2.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Отмена</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={validSelectedProducts.length === 0} 
                        className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-300"
                    >
                    {validSelectedProducts.length > 0 
                        ? `Добавить ${validSelectedProducts.length} ${getPlural(validSelectedProducts.length, 'товар', 'товара', 'товаров')}` 
                        : 'Добавить список'
                    }
                    </button>
                </div> 
            </div> 
        </div> 
    );
};

const AutoRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  campaign: CampaignRecord | null;
}> = ({ isOpen, onClose, onSave, campaign }) => {
  const [threshold, setThreshold] = useState('1000');
  const [amount, setAmount] = useState('3000');
  const [usePromoBonuses, setUsePromoBonuses] = useState(true);
  const [showPackages, setShowPackages] = useState(true);

  const ModalToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${checked ? 'bg-purple-500' : 'bg-gray-300'}`}>
      <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
  
  const handleNumericInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setter(String(parsed));
    } else if (e.target.value === '') {
      setter('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Автопополнение бюджета кампании</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Условия пополнения</h3>
            <div className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 items-center gap-4">
                <label htmlFor="threshold" className="text-gray-600">Если бюджет меньше</label>
                <div className="relative">
                  <input id="threshold" type="text" value={formatForDisplay(threshold)} onChange={handleNumericInput(setThreshold)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full pr-6" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <label htmlFor="amount" className="text-gray-600">Пополнять на</label>
                 <div className="relative">
                  <input id="amount" type="text" value={formatForDisplay(amount)} onChange={handleNumericInput(setAmount)} className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-full pr-6" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">Источники списания <span className="tooltip"><HelpCircle className="w-4 h-4 text-gray-400" /><span className="tooltip-text">Деньги будут списываться с Единого счёта</span></span></h3>
                 <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                    <RefreshCw className="w-4 h-4" />
                    <span>Обновить счета</span>
                 </button>
             </div>
             <div className="space-y-3">
                <div className="flex items-center py-2">
                    <SingleAccountIcon className="w-6 h-6 text-gray-500 mr-4"/>
                    <p className="font-medium text-gray-800">Единый счёт: {UNIFIED_BALANCE.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="flex items-center py-2">
                    <div className="w-6 h-6 mr-4 rounded-full bg-purple-500"></div>
                    <div className="flex-grow">
                        <p className="font-medium text-gray-800">Промо-бонусы: {TOTAL_PROMO_BONUS.toLocaleString('ru-RU')} B <span className="text-gray-500 font-normal">(до 100% от суммы пополнения)</span></p>
                    </div>
                    <ModalToggleSwitch checked={usePromoBonuses} onChange={setUsePromoBonuses} />
                </div>
             </div>
             <p className="text-sm text-gray-500 mt-4 pl-10">Спишем промо-бонусы из ваших пакетов автоматически. Сначала из тех, что сгорают быстрее, затем из остальных. Сумма списания зависит от условий пакета</p>

            <div className="mt-6 pl-10">
                <button onClick={() => setShowPackages(!showPackages)} className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                    <span>Мои пакеты</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPackages ? 'rotate-180' : ''}`} />
                </button>
                {showPackages && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                        {BONUS_PACKAGES.map(pkg => (
                            <div key={pkg.id} className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm hover:border-purple-400 transition-all cursor-pointer">
                                <span className="text-2xl font-bold text-gray-900">{pkg.amount.toLocaleString('ru-RU')}</span>
                                <p className="text-sm text-gray-600 mt-1 mb-3">Оплата до {pkg.maxPercent}% от суммы</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{pkg.displayBurn} сгорят {pkg.expiry}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 <p className="text-sm text-gray-500 mt-4">Новые пакеты учтём автоматически, и доступных промо-бонусов станет больше</p>
            </div>
          </div>
        </div>

        <div className="flex justify-start items-center gap-3 p-6 bg-gray-50/70 border-t border-gray-100 rounded-b-2xl">
            <button onClick={onSave} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
                Сохранить
            </button>
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Отмена
            </button>
        </div>
      </div>
    </div>
  );
};

const BulkEditModal = ({
    isOpen,
    onClose,
    action,
    onSave,
    categories = [],
    onOpenAutoRefill,
    selectedCampaignsCount = 0,
    prefillData,
    isSingleCampaignMode = false,
    campaignData,
    editingGroupId,
    editedCampaigns,
    allValidCampaigns,
    selectedCampaignIds,
}: {
    isOpen: boolean,
    onClose: () => void,
    action: BulkActionType,
    onSave: (val: any) => void,
    categories?: string[],
    onOpenAutoRefill: () => void,
    selectedCampaignsCount?: number,
    prefillData?: { budget: number, bonusAmount: number, useBonuses: boolean } | null,
    isSingleCampaignMode?: boolean;
    campaignData?: CampaignRecord | null;
    editingGroupId: string | null;
    editedCampaigns: CampaignRecord[];
    allValidCampaigns: CampaignRecord[];
    selectedCampaignIds: string[];
}) => {
    const [value, setValue] = useState<string>('3000');
    const [isAutorefillEnabled, setIsAutorefillEnabled] = useState(true);
    const [useBonuses, setUseBonuses] = useState(false);
    const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
    const [bonusValue, setBonusValue] = useState<number | string>(3000);

    const [budgetError, setBudgetError] = useState('');
    const [bonusError, setBonusError] = useState('');

    const budgetForSingleMode = campaignData?.budget ?? 3000;

    useEffect(() => {
        if (isOpen) {
            if (action === 'autorefill') {
                const campaignsToInspect = editingGroupId ? editedCampaigns : allValidCampaigns;
                const selected = campaignsToInspect.filter(c => selectedCampaignIds.includes(c.id));
                if (selected.length > 0) {
                    const allEnabled = selected.every(c => c.autoReplenishment);
                    setIsAutorefillEnabled(allEnabled);
                } else {
                    setIsAutorefillEnabled(false);
                }
            } else if (action === 'funding') setValue('Единый счёт');
            else if (action === 'bid' && categories.length > 1) {
                setValue(categories.reduce((acc, cat) => ({ ...acc, [cat]: '' }), {}) as any);
            } else if (isSingleCampaignMode && campaignData) {
                setValue(String(campaignData.budget));
                setUseBonuses(campaignData.usePromoBonuses);
                setBonusValue(campaignData.bonusAmount || 0);
            } else if (prefillData) {
                setValue(String(prefillData.budget));
                setUseBonuses(prefillData.useBonuses);
                setBonusValue(prefillData.bonusAmount);
            }
            else {
                setValue('3000');
                setUseBonuses(false);
                setBonusValue(3000);
            }
            setBudgetError('');
            setBonusError('');
        }
    }, [isOpen, action, categories, prefillData, isSingleCampaignMode, campaignData, editingGroupId, allValidCampaigns, selectedCampaignIds]);

    const selectedPkg = useMemo(() => BONUS_PACKAGES.find(p => p.id === selectedPkgId) || BONUS_PACKAGES[0], [selectedPkgId]);

    const currentBudget = isSingleCampaignMode ? budgetForSingleMode : parseDisplayValue(value);
    const numericBonusValue = parseDisplayValue(String(bonusValue));

    useEffect(() => {
        setBudgetError('');
        setBonusError('');

        if (currentBudget < 1000 && (isSingleCampaignMode || value !== '')) {
            setBudgetError('Минимальный бюджет 1000 ₽');
        }

        if (useBonuses) {
            if (numericBonusValue > currentBudget) {
                setBonusError('Сумма бонусов не может превышать общий бюджет');
                return;
            }

            const maxBonusFromPackage = selectedPkg.amount;
            if (numericBonusValue > maxBonusFromPackage) {
                setBonusError(`В пакете доступно только ${formatForDisplay(maxBonusFromPackage)} B`);
                return;
            }

            const maxPercent = selectedPkg.maxPercent / 100;
            const maxBonusAllowedByPercent = currentBudget * maxPercent;

            if (numericBonusValue > maxBonusAllowedByPercent) {
                setBonusError(`Максимум ${Math.floor(maxBonusAllowedByPercent)} B (${selectedPkg.maxPercent}%) от суммы`);
                return;
            }
        }
    }, [value, useBonuses, bonusValue, numericBonusValue, selectedPkg, isSingleCampaignMode, currentBudget]);


    if (!isOpen || !action) return null;

    const getTitle = () => {
        switch (action) {
            case 'budget':
                if (selectedCampaignsCount === 1) return `Задать бюджет для 1 кампании`;
                if (selectedCampaignsCount > 1) return `Задать бюджет для ${selectedCampaignsCount} ${getPlural(selectedCampaignsCount, 'кампании', 'кампаний', 'кампаний')}`;
                return 'Задать бюджет';
            case 'bid': return 'Задать ставки';
            case 'autorefill': return 'Настроить автопополнение';
            case 'autobidder': return 'Преследование ставки';
            default: return '';
        }
    }

    const handleSave = () => {
        if (action === 'budget') {
            onSave({
                total: currentBudget,
                bonus: useBonuses ? numericBonusValue : 0,
                isBonusActive: useBonuses,
                selectedPkg: selectedPkg,
            });
        } else if (action === 'autorefill') {
            onSave(isAutorefillEnabled);
        } else {
            onSave(value);
        }
    }
    
    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsed = parseDisplayValue(e.target.value);
        if (!isNaN(parsed)) {
            setValue(String(parsed));
        } else if (e.target.value === '') {
            setValue('');
        }
    };
    
    const handleBudgetBlur = () => {
        const numericValue = parseDisplayValue(value);
        if (isNaN(numericValue) || numericValue < 1000) {
            setValue('1000');
        }
    };

    const handleBonusBlur = () => {
        const numericValue = parseDisplayValue(String(bonusValue));
        if (String(bonusValue).trim() === '' || isNaN(numericValue)) {
            setBonusValue(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className={`relative bg-white rounded-xl shadow-xl w-full ${action === 'budget' ? 'max-w-xl' : 'max-w-sm'} p-6 overflow-hidden`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{getTitle()}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="mb-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                    {action === 'budget' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{isSingleCampaignMode ? 'Бюджет кампании' : 'Новый бюджет для 1 кампании'}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        autoFocus={!isSingleCampaignMode}
                                        readOnly={isSingleCampaignMode}
                                        className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 pr-8 ${budgetError ? 'border-red-500' : 'border-gray-300'} ${isSingleCampaignMode ? 'bg-gray-100' : ''}`}
                                        placeholder="3000"
                                        value={formatForDisplay(isSingleCampaignMode ? currentBudget : value)}
                                        onChange={e => !isSingleCampaignMode && handleBudgetChange(e)}
                                        onBlur={handleBudgetBlur}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                                </div>
                                {budgetError && <p className="text-red-500 text-xs mt-1.5">{budgetError}</p>}
                                {!isSingleCampaignMode && !budgetError && <p className="text-xs text-gray-500 mt-2">Применится ко всем выбранным кампаниям.</p>}
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
                        </div>
                    )}
                    {action === 'bid' && (
                        (categories.length > 1) ? (
                            <div className="space-y-4">
                                {categories.map(cat => (
                                    <div key={cat}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{cat}</label>
                                        <BidInput value={parseDisplayValue((value as any)[cat])} onChange={(val) => setValue((prev: any) => ({ ...prev, [cat]: val }))} presets={[150, 300, 500]} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Новая ставка (₽)</label>
                                <div className="w-1/2">
                                    <BidInput value={parseDisplayValue(value)} onChange={(val) => setValue(String(val))} presets={[150, 300, 500]} />
                                </div>
                            </div>
                        )
                    )}
                    {action === 'autorefill' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Статус автопополнения</label>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-gray-900 font-medium">Автопополнение</span>
                                <div className="flex items-center gap-4">
                                    {isAutorefillEnabled && <button onClick={() => { onClose(); onOpenAutoRefill(); }} className="text-sm font-medium text-purple-600 hover:underline"> Настроить </button>}
                                    <ToggleSwitch checked={isAutorefillEnabled} onChange={setIsAutorefillEnabled} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Отмена</button>
                    <button
                        onClick={handleSave}
                        disabled={!!budgetError || !!bonusError}
                        className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Применить
                    </button>
                </div>
            </div>
        </div>
    )
}

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

const ExcelProcessingLoader = ({ statusText }: { statusText: string }) => (
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-purple-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-100">
            <div className="h-1 bg-purple-500 animate-loader-progress"></div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 font-medium pt-2">
            <Loader className="w-4 h-4 animate-spin text-purple-600" />
            <span>{statusText}</span>
        </div>
        <div className="space-y-3 pt-2">
            <div className="h-10 bg-gray-100 rounded-lg opacity-70"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-60"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-50"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-40"></div>
            <div className="h-10 bg-gray-100 rounded-lg opacity-30"></div>
        </div>
        <style>{`
            @keyframes loader-progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .animate-loader-progress {
                animation: loader-progress 1.5s ease-in-out infinite;
            }
        `}</style>
    </section>
);

const BidInput = ({ value, onChange, presets = [150, 200, 250] }: { value: number, onChange: (value: number) => void, presets?: number[] }) => {
    const [inputValue, setInputValue] = useState(String(value || ''));

    useEffect(() => {
        setInputValue(String(value || ''));
    }, [value]);

    const handleBlur = () => {
        let numericValue = parseDisplayValue(inputValue);
        if (isNaN(numericValue) || numericValue < 300) {
            numericValue = 300;
        }
        onChange(numericValue);
        setInputValue(String(numericValue));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handlePresetClick = (p: number) => {
        setInputValue(String(p));
        onChange(p);
    };

    return (
        <div className="w-full border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <div className="relative bg-white">
                 <input
                    type="text"
                    value={inputValue}
                    placeholder="Ставка"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full text-sm text-left font-medium bg-transparent outline-none px-2 py-1.5 hide-arrows"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">₽</span>
            </div>
            <div className="flex w-full h-2 border-t border-gray-200">
                {presets.map((p, index) => (
                    <button
                        key={p}
                        onClick={() => handlePresetClick(p)}
                        title={`Установить ставку ${p} ₽`}
                        className={`flex-1 h-full transition-colors relative
                            ${Number(value) === p ? 'bg-green-300' : 'bg-gray-100 hover:bg-gray-200'}
                        `}
                        aria-label={`Установить ставку ${p}`}
                    >
                      {index > 0 && <div className="absolute left-0 top-0 bottom-0 w-px bg-white"></div>}
                    </button>
                ))}
            </div>
        </div>
    )
};

const EmptyStatePlaceholder = () => (
    <div className="mt-6 bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <h3 className="text-lg font-bold text-gray-800">Список кампаний пока пуст</h3>
        <p className="mt-2 max-w-sm text-gray-500">
            Нажмите «Добавить список товаров» выше, чтобы загрузить файл или выбрать товары. Они появятся здесь для дальнейшей настройки перед запуском.
        </p>
    </div>
);

const Stepper = ({ currentStep, setStep }: { currentStep: number, setStep: (step: number) => void }) => {
    const steps = [
        { number: 1, title: 'Загрузка файла' },
        { number: 2, title: 'Проверка файла' },
        { number: 3, title: 'Подтверждение' }
    ];

    return (
        <div className="flex items-center w-full">
            {steps.map((step, index) => {
                const isCompleted = currentStep > step.number;
                const isActive = currentStep === step.number;

                return (
                    <React.Fragment key={step.number}>
                        <div
                            className={`flex items-center gap-3 ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                            onClick={() => isCompleted && setStep(step.number)}
                            aria-current={isActive ? 'step' : undefined}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shrink-0 ${
                                isCompleted ? 'bg-purple-600 text-white hover:bg-purple-700' : isActive ? 'bg-purple-100 text-purple-700 border-2 border-purple-200' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                            </div>
                            <div>
                                <p className={`text-sm font-semibold transition-colors ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>{`Шаг ${step.number}`}</p>
                                <p className={`text-xs transition-colors ${isActive || isCompleted ? 'text-gray-600' : 'text-gray-500'}`}>{step.title}</p>
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-grow h-0.5 mx-4 transition-colors duration-300 ${isCompleted ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const UploadEditsModal = ({ isOpen, onClose, onApply, onOpenReview }: { isOpen: boolean, onClose: () => void, onApply: () => void, onOpenReview: () => void }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [isExcelHelpOpen, setIsExcelHelpOpen] = useState(false);

    const handleSetStep = (newStep: number) => {
        if (newStep === 1 && step > 1) {
            // Do not clear the file when going back
        }
        setStep(newStep);
    }
    
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFile(null);
            setIsDragging(false);
            setIsProcessingFile(false);
        }
    }, [isOpen]);
    
    const handleFile = (selectedFile: File) => {
        if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'text/csv')) {
            setIsProcessingFile(true);
            setTimeout(() => {
                setFile(selectedFile);
                setIsProcessingFile(false);
                // No auto-advance
            }, 2000);
        } else {
            alert("Пожалуйста, выберите файл Excel (.xlsx) или CSV.");
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
    
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFile(e.dataTransfer.files[0]); } };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { handleFile(e.target.files[0]); } };
    
    if (!isOpen) return null;

    const renderStepContent = () => {
        if (isProcessingFile) {
            return (
                <div className="text-center p-8 flex flex-col items-center justify-center gap-4 min-h-[280px]">
                    <Loader className="w-12 h-12 text-purple-600 animate-spin" />
                    <p className="font-semibold text-gray-700">Обработка файла...</p>
                    <p className="text-sm text-gray-500">Пожалуйста, подождите</p>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (
                    <div>
                        {!file ? (
                             <div onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`p-8 border-2 border-dashed rounded-xl text-center transition-colors ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.csv" className="hidden" />
                                <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <p className="font-medium text-gray-800 mb-1">
                                    Загрузите изменния по кампаниям в формате файла XLSX, CSV
                                </p>
                                <p className="text-xs text-gray-500">
                                    Одновременно можно внести изменения не более чем в 25 кампаний
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                                >
                                    Выберите файл на компьютере
                                </button>
                            </div>
                        ) : (
                            <div className="my-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                                        <div className="overflow-hidden">
                                            <p className="font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center shrink-0">
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.csv" className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="ml-2 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Заменить</button>
                                        <button onClick={handleRemoveFile} className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={() => handleSetStep(2)} 
                                disabled={!file}
                                className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed">
                                Продолжить
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="text-left p-4 bg-gray-50 rounded-lg border">
                        <h3 className="font-bold text-lg mb-4 text-gray-800">Проверка изменений</h3>
                        <p className="font-medium text-gray-700 mb-4">Вы собираетесь применить изменения:</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Кампании:</span><span className="font-medium">24</span></div>
                            <div className="flex justify-between"><span>Товары:</span><span className="font-medium">87</span></div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span className="text-sm text-gray-700">Поменяли минимальные ставки для 5 кампаний</span>
                            </div>
                            <div className="border-t pt-2 my-2"></div>
                            <div className="space-y-2">
                                <div className="flex justify-between"><span>Общая сумма бюджета всех редактируемых кампаний:</span><span className="font-medium">250 000 ₽</span></div>
                                <div className="flex justify-between font-bold text-base"><span>Будет списано с ЕЛС:</span><span>125 400 ₽</span></div>
                                <p className="text-xs text-gray-500 mt-1">(часть кампаний уже пополнены деньгами, спишем только недостающую часть)</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => handleSetStep(1)} className="px-5 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                Назад
                            </button>
                            <div className="flex items-center gap-4">
                                <button onClick={onOpenReview} className="px-5 py-2 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-lg">Проверить изменения</button>
                                <button onClick={() => handleSetStep(3)} className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
                                    Перейти к подтверждению
                                </button>
                            </div>
                        </div>
                    </div>
                );
             case 3:
                return (
                    <div className="text-center p-8">
                        <h3 className="font-semibold text-gray-800 text-xl">Подтверждение изменений</h3>
                        <p className="text-gray-600 text-sm mt-4">
                            Изменения будут применены к <span className="font-bold text-gray-800">24 кампаниям</span> и <span className="font-bold text-gray-800">87 товарам</span>.
                        </p>
                        <div className="mt-4 space-y-1">
                            <p className="text-gray-600 text-sm">Общая сумма бюджета всех редактируемых кампаний: <span className="font-bold text-lg text-gray-800">250 000 ₽</span></p>
                            <p className="text-gray-600 text-sm">Будет списано с ЕЛС: <span className="font-bold text-lg text-gray-800">125 400 ₽</span></p>
                            <p className="text-xs text-gray-500 mt-1">(часть кампаний уже пополнены деньгами, спишем только недостающую часть)</p>
                        </div>
                         <div className="mt-6 flex justify-center gap-3">
                            <button onClick={() => handleSetStep(2)} className="px-6 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Назад</button>
                            <button onClick={onApply} className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">Применить и списать</button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl m-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">Загрузить Excel с правками</h2>
                        <button
                            type="button"
                            onClick={() => setIsExcelHelpOpen(prev => !prev)}
                            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-gray-700"
                        >
                            <HelpCircle className="w-4 h-4 text-purple-500" />
                            <span>Где взять Excel?</span>
                            <ChevronDown
                                className={`w-4 h-4 text-gray-500 transition-transform ${isExcelHelpOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {isExcelHelpOpen && (
                            <p className="mt-2 text-xs text-gray-600 max-w-2xl">
                                В списке кампаний выберите нужные кампании, нажмите «Скачать Excel для правок», внесите изменения в файле и затем загрузите его здесь.
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8">
                    <Stepper currentStep={step} setStep={handleSetStep} />
                    <div className="mt-8">
                        {renderStepContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BulkActionIsland = ({ count, onConfigureAR, onDownload, onEdit, onClear }: { count: number, onConfigureAR: () => void, onDownload: () => void, onEdit?: () => void, onClear: () => void }) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl z-[80] p-2 flex items-center gap-2 border border-gray-200 animate-in slide-in-from-bottom-4 fade-in">
            <span className="text-sm font-medium text-gray-800 px-3 whitespace-nowrap">Выбрано: {count}</span>
            <div className="h-6 w-px bg-gray-200"></div>
            {onEdit && (
                <button onClick={onEdit} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700 whitespace-nowrap">
                    <Edit2 className="w-4 h-4 text-gray-500" />
                    <span>Редактировать</span>
                </button>
            )}
            <button onClick={onConfigureAR} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700 whitespace-nowrap">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span>Настроить АП</span>
            </button>
            <button onClick={onDownload} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700 whitespace-nowrap">
                <Download className="w-4 h-4 text-gray-500" />
                <span>Скачать Excel для правок</span>
            </button>
            <button onClick={onClear} className="ml-2 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
            </button>
        </div>
    )
}

const DownloadNotification = ({ count }: { count: number }) => (
    <div className="fixed bottom-6 right-6 bg-gray-800 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 z-[90] animate-in slide-in-from-bottom-4 fade-in">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">
            Скачивание данных для {count} {getPlural(count, 'кампании', 'кампаний', 'кампаний')}...
        </span>
    </div>
);


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [appState, setAppState] = useState<'creation' | 'list' | 'editing' | 'single-campaign'>('list');
  const [globalConfig, setGlobalConfig] = useState<CampaignConfig>({ paymentModel: PaymentModel.CPM, bidType: BidType.UNIFIED, categories: [] });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editedCampaigns, setEditedCampaigns] = useState<CampaignRecord[]>([]);
  const [originalCampaignsWhileEditing, setOriginalCampaignsWhileEditing] = useState<CampaignRecord[] | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ campaign: CampaignRecord, index: number, groupId: string | null } | null>(null);
  const deleteUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [currentSearchInput, setCurrentSearchInput] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [isLaunching, setIsLaunching] = useState(false);
  const [creationResult, setCreationResult] = useState<{success: number, error: number} | null>(null);
  const [failedCampaigns, setFailedCampaigns] = useState<CampaignRecord[]>([]);

  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedListedCampaignIds, setSelectedListedCampaignIds] = useState<string[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null);
  const [bulkEditPrefillData, setBulkEditPrefillData] = useState<{ budget: number; bonusAmount: number; useBonuses: boolean; } | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState("Подготавливаем кампании...");
  
  const [isConfirmDeleteGroupOpen, setIsConfirmDeleteGroupOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<TemplateGroup | null>(null);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
  const [isConfirmCancelEditOpen, setIsConfirmCancelEditOpen] = useState(false);
  const [isConfirmSwitchEditOpen, setIsConfirmSwitchEditOpen] = useState(false);
  const [nextGroupToEdit, setNextGroupToEdit] = useState<TemplateGroup | null>(null);
  const [isConfirmLaunchOpen, setIsConfirmLaunchOpen] = useState(false);
  const [isConfirmLaunchWithFiltersOpen, setIsConfirmLaunchWithFiltersOpen] = useState(false);
  const [showAddMoreHint, setShowAddMoreHint] = useState(true);
  const [isLaunchSummaryModalOpen, setIsLaunchSummaryModalOpen] = useState(false);
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [campaignForAutoRefill, setCampaignForAutoRefill] = useState<CampaignRecord | null>(null);
  const [campaignForBonusEdit, setCampaignForBonusEdit] = useState<CampaignRecord | null>(null);
  const [isUploadEditsModalOpen, setIsUploadEditsModalOpen] = useState(false);
  const [isReviewEditsModalOpen, setIsReviewEditsModalOpen] = useState(false);
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading'>('idle');
  const [downloadCount, setDownloadCount] = useState(0);
  const [isEditDownloadModalOpen, setIsEditDownloadModalOpen] = useState(false);
  const [showUploadHint, setShowUploadHint] = useState(false);
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);
  const [editResult, setEditResult] = useState<{ success: number; error: number; failedIds?: number[] } | null>(null);
  const [isFromExcelModal, setIsFromExcelModal] = useState(false);
  const applyEditsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCpcCampaign, setSelectedCpcCampaign] = useState<{ id: number; name: string } | null>(null);


  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  const [isBonusInsufficiencyModalOpen, setIsBonusInsufficiencyModalOpen] = useState(false);
  const [bonusAppContext, setBonusAppContext] = useState<{ value: any, fullCoverageCount: number, remainingBonuses: number } | null>(null);

  const handleNavigateToList = () => setAppState('list');
  const handleNavigateToCreation = () => setAppState('creation');
  const handleNavigateToEditing = () => setAppState('editing');

  const handleNavigationAttempt = (action: () => void) => {
    const hasUnsavedChanges = appState === 'creation' && templateGroups.length > 0;
    if (hasUnsavedChanges) {
      setPendingNavigationAction(() => action);
      setIsConfirmExitOpen(true);
    } else {
      action();
    }
  };

  const handleDownloadForEdit = () => {
    setDownloadCount(selectedListedCampaignIds.length);
    setSelectedListedCampaignIds([]); // Hide island immediately
    setDownloadStatus('loading');

    setTimeout(() => {
        setDownloadStatus('idle');
        setToastMessage("Загрузка завершена");
        setShowToast(true);
        setShowUploadHint(true); // Show hint after download
    }, 2000);
  };

  const handleOpenEditDownloadModal = () => {
    setIsEditDownloadModalOpen(true);
  };

  const handleApplyEdits = () => {
    setIsUploadEditsModalOpen(false);
    setIsApplyingEdits(true);
    setEditResult(null);

    if (applyEditsTimeoutRef.current) {
        clearTimeout(applyEditsTimeoutRef.current);
    }

    applyEditsTimeoutRef.current = setTimeout(() => {
        setIsApplyingEdits(false);
        setEditResult({ success: 19, error: 5, failedIds: [1304655, 1304658, 1304661, 1304670, 1304674] });
        setToastMessage("Изменения применены");
        applyEditsTimeoutRef.current = null;
    }, 60000); // 1 minute
  };

  const handleCancelEdits = () => {
    if (applyEditsTimeoutRef.current) {
        clearTimeout(applyEditsTimeoutRef.current);
        applyEditsTimeoutRef.current = null;
    }
    setIsApplyingEdits(false);
    setToastMessage("Применение изменений отменено");
    setShowToast(true);
  };

  useEffect(() => {
    if (editingGroupId === null && nextGroupToEdit) {
        handleStartEditing(nextGroupToEdit);
        setNextGroupToEdit(null); 
    }
  }, [editingGroupId, nextGroupToEdit]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ' ', ','].includes(e.key) && currentSearchInput.trim()) {
        e.preventDefault();
        const newTags = currentSearchInput.trim().split(/[\s,]+/).filter(Boolean);
        setSearchTags(prev => [...new Set([...prev, ...newTags])]);
        setCurrentSearchInput('');
    } else if (e.key === 'Backspace' && !currentSearchInput && searchTags.length > 0) {
        e.preventDefault();
        setSearchTags(prev => prev.slice(0, -1));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    setSearchTags(prev => prev.filter(tag => tag !== tagToRemove));
  };
  
  const allValidCampaigns = useMemo(() => 
      templateGroups.flatMap(g => g.campaigns.filter(c => c.status !== CampaignStatus.ERROR)),
      [templateGroups]
  );
  
  const uniqueSources = useMemo(() => Array.from(new Set(allValidCampaigns.map(c => c.source))), [allValidCampaigns]);
  const uniqueCategories = useMemo(() => Array.from(new Set(allValidCampaigns.map(c => c.category))), [allValidCampaigns]);
  
  const areFiltersActive = useMemo(() => {
    return searchTags.length > 0 || currentSearchInput.trim() !== '' || selectedSources.length > 0 || selectedCategories.length > 0;
  }, [searchTags, currentSearchInput, selectedSources, selectedCategories]);

  const filteredCampaigns = useMemo(() => {
    if (!areFiltersActive) return allValidCampaigns;

    return allValidCampaigns.filter(campaign => {
        if (selectedSources.length > 0 && !selectedSources.includes(campaign.source)) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(campaign.category)) return false;

        const hasSearchQuery = searchTags.length > 0 || currentSearchInput.trim() !== '';
        if (hasSearchQuery) {
            const allSearchTerms = [...searchTags, ...currentSearchInput.trim().split(/[\s,]+/)].filter(Boolean).map(s => s.toLowerCase());
            const idsToSearch = allSearchTerms.filter(s => !isNaN(Number(s)));
            const textToSearch = allSearchTerms.filter(s => isNaN(Number(s)));
            const campaignText = `${campaign.productName.toLowerCase()} ${campaign.campaignName.toLowerCase()}`;
            const idMatch = idsToSearch.length > 0 ? idsToSearch.includes(String(campaign.nmId)) : true;
            const textMatch = textToSearch.length > 0 ? textToSearch.every(term => campaignText.includes(term)) : true;
            if (idsToSearch.length > 0 && textToSearch.length > 0) {
                if (!idMatch || !textMatch) return false;
            } else if (idsToSearch.length > 0) {
                if (!idMatch) return false;
            } else if (textToSearch.length > 0) {
                if (!textMatch) return false;
            }
        }
        return true;
    });
  }, [allValidCampaigns, selectedSources, selectedCategories, searchTags, currentSearchInput, areFiltersActive]);


  const totalAllValidCount = allValidCampaigns.length;

  const globalTotals = allValidCampaigns.reduce(
    (acc, campaign) => {
        const realSpend = campaign.budget - (campaign.bonusAmount || 0);
        acc.real += realSpend;
        acc.bonus += (campaign.bonusAmount || 0);
        acc.total += campaign.budget;
        return acc;
    },
    { real: 0, bonus: 0, total: 0 }
  );

  const globalDeficit = Math.max(0, globalTotals.real - UNIFIED_BALANCE);

  const handleTemplateDownload = (finalConfig: CampaignConfig) => { setGlobalConfig(finalConfig); setToastMessage("Шаблон успешно сформирован и скачан"); setShowToast(true); };

  const handleAddItemSubmit = (config: Pick<CampaignConfig, 'paymentModel' | 'bidType'>, items: CampaignRecord[]) => {
      setIsTableLoading(true);
      setLoadingStatusText("Проверяем минимальные ставки...");
      const timer1 = setTimeout(() => setLoadingStatusText("Загружаем товары в группы..."), 1200);
      const timer2 = setTimeout(() => {
          const sourceFile = items[0]?.source || "Ручное добавление";
          // Always create a new group instead of merging with existing ones
          const newGroup: TemplateGroup = { id: `manual-${Date.now()}`, config, campaigns: items, duplicateNmIds: new Set(), correctedNmIds: new Set(), currentPage: 1, sourceFiles: new Set([sourceFile]) };
          setTemplateGroups(prev => [...prev, newGroup]);
          setToastMessage(`Создана новая группа с ${items.length} ${getPlural(items.length, 'товаром', 'товарами', 'товарами')}`);
          setShowToast(true);
          setIsTableLoading(false);
          clearTimeout(timer1);
      }, 2500);
      return () => { clearTimeout(timer1); clearTimeout(timer2); }
  };
  
  const handlePageChange = (groupId: string, page: number) => { setTemplateGroups(prev => prev.map(g => g.id === groupId ? { ...g, currentPage: page } : g)); };
    
  const handleUpdateCampaign = (groupId: string, campaignId: string, updates: Partial<CampaignRecord>) => {
      const field = Object.keys(updates)[0] as keyof CampaignRecord;
      const value = Object.values(updates)[0];

      if (field === 'budget') {
          const errorKey = `${campaignId}-${field}`;
          if (Number(value) < 1000) {
              setInlineErrors(prev => ({ ...prev, [errorKey]: 'Мин. 1000 ₽' }));
          } else {
              setInlineErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[errorKey];
                  return newErrors;
              });
          }
      }
      
      const updater = (campaigns: CampaignRecord[]) => campaigns.map(c => c.id === campaignId ? { ...c, ...updates } : c);
      
      if(editingGroupId === groupId) {
          setEditedCampaigns(updater); 
      } else {
          setTemplateGroups(prev => prev.map(g => g.id === groupId ? { ...g, campaigns: updater(g.campaigns) } : g)); 
      }
  };

  const handleStartEditing = (group: TemplateGroup) => {
    if (editingGroupId && editingGroupId !== group.id) {
        setNextGroupToEdit(group);
        setIsConfirmSwitchEditOpen(true);
    } else if (editingGroupId !== group.id) {
        setEditingGroupId(group.id);
        const campaignsToEdit = group.campaigns.filter(c => c.status !== CampaignStatus.ERROR);
        setEditedCampaigns(campaignsToEdit);
        setOriginalCampaignsWhileEditing(JSON.parse(JSON.stringify(campaignsToEdit)));
        setSelectedCampaignIds([]);
    }
  };
  
  const handleSaveEditing = () => {
    if (Object.keys(inlineErrors).length > 0) {
        setToastMessage("Исправьте ошибки в полях перед сохранением");
        setShowToast(true);
        return;
    }
    if (editingGroupId === null) return;

    setTemplateGroups(prev => prev.map(g => (g.id === editingGroupId ? { ...g, campaigns: editedCampaigns } : g)));
    setEditingGroupId(null);
    setEditedCampaigns([]);
    setOriginalCampaignsWhileEditing(null);
    setSelectedCampaignIds([]);
    setInlineErrors({});
    setToastMessage("Изменения сохранены");
    setShowToast(true);
  };
  
  const handleCancelEditing = () => {
    const hasChanges = JSON.stringify(editedCampaigns) !== JSON.stringify(originalCampaignsWhileEditing);
    if (hasChanges) setIsConfirmCancelEditOpen(true);
    else performCancelEditing();
  };

  const performCancelEditing = () => {
      setEditingGroupId(null);
      setEditedCampaigns([]);
      setOriginalCampaignsWhileEditing(null);
      setSelectedCampaignIds([]);
      setIsConfirmCancelEditOpen(false);
      setInlineErrors({});
  }
  
  const openDeleteGroupModal = (group: TemplateGroup) => {
    setGroupToDelete(group);
    setIsConfirmDeleteGroupOpen(true);
  };
  
  const handleConfirmDeleteGroup = () => {
    if (groupToDelete) {
      setTemplateGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
      setToastMessage("Группа кампаний удалена");
      setShowToast(true);
    }
    setIsConfirmDeleteGroupOpen(false);
    setGroupToDelete(null);
  };

  const handleDeleteCampaign = (campaignId: string) => {
      if (deleteUndoTimer.current) clearTimeout(deleteUndoTimer.current);
      if (editingGroupId) {
          const index = editedCampaigns.findIndex(c => c.id === campaignId);
          if (index === -1) return;
          const campaign = editedCampaigns[index];
          setLastDeleted({ campaign, index, groupId: editingGroupId });
          setEditedCampaigns(prev => prev.filter(c => c.id !== campaignId));
      } else {
         let campaignToDelete: CampaignRecord | undefined;
         let groupIndex = -1;
         let campIndex = -1;
         for(let i=0; i<templateGroups.length; i++) {
             const idx = templateGroups[i].campaigns.findIndex(c => c.id === campaignId);
             if (idx !== -1) {
                 campaignToDelete = templateGroups[i].campaigns[idx];
                 groupIndex = i;
                 campIndex = idx;
                 break;
             }
         }
         if (campaignToDelete && groupIndex !== -1) {
             setLastDeleted({ campaign: campaignToDelete, index: campIndex, groupId: templateGroups[groupIndex].id });
             setTemplateGroups(prev => {
                 const newGroups = [...prev];
                 newGroups[groupIndex] = { ...newGroups[groupIndex], campaigns: newGroups[groupIndex].campaigns.filter(c => c.id !== campaignId) };
                 return newGroups;
             });
         }
      }
      setSelectedCampaignIds(prev => prev.filter(id => id !== campaignId));
      deleteUndoTimer.current = setTimeout(() => setLastDeleted(null), 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    if (deleteUndoTimer.current) clearTimeout(deleteUndoTimer.current);
    const { campaign, index, groupId } = lastDeleted;
    if (groupId === editingGroupId) {
        setEditedCampaigns(prev => {
            const newCampaigns = [...prev];
            newCampaigns.splice(index, 0, campaign);
            return newCampaigns;
        });
    } else {
        setTemplateGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                const newCampaigns = [...g.campaigns];
                newCampaigns.splice(index, 0, campaign);
                return { ...g, campaigns: newCampaigns };
            }
            return g;
        }));
    }
    setToastMessage(`Кампанию с номером ID ${campaign.nmId} вернули`);
    setShowToast(true);
    setLastDeleted(null);
  };
  
  const launchCampaigns = () => setIsLaunchSummaryModalOpen(true);

  const handleProceedToLaunch = () => {
    setIsLaunchSummaryModalOpen(false);
    if (areFiltersActive) { setIsConfirmLaunchWithFiltersOpen(true); return; }
    if (editingGroupId) { setIsConfirmLaunchOpen(true); return; }
    performLaunch();
  };

  const performLaunch = () => {
    setCreationResult(null);
    setFailedCampaigns([]);
    setIsLaunching(true);
    setAppState('list');
    setIsConfirmLaunchOpen(false);
    setIsConfirmLaunchWithFiltersOpen(false);
  }

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  const handleSelectAllOnPage = (idsOnPage: string[], checked: boolean) => {
    if (checked) setSelectedCampaignIds(prev => [...new Set([...prev, ...idsOnPage])]);
    else setSelectedCampaignIds(prev => prev.filter(id => !idsOnPage.includes(id)));
  };

  const uniqueCategoriesForSelection = useMemo(() => {
      if (currentBulkAction !== 'bid' || selectedCampaignIds.length === 0) return [];
      const allCampaigns = templateGroups.flatMap(g => g.campaigns);
      const selectedCampaigns = allCampaigns.filter(c => selectedCampaignIds.includes(c.id));
      return [...new Set(selectedCampaigns.map(c => c.category))];
  }, [selectedCampaignIds, currentBulkAction, templateGroups]);

    const openBulkActionModal = (action: BulkActionType) => {
        if (action === 'delete') {
            setIsConfirmBulkDeleteOpen(true);
            return;
        }
        
        const campaignsToInspect = editingGroupId ? editedCampaigns : allValidCampaigns;

        if (action === 'budget') {
            const selected = campaignsToInspect.filter(c => selectedCampaignIds.includes(c.id));
            if (selected.length > 0) {
                const first = selected[0];
                const allSame = selected.every(c =>
                    c.budget === first.budget &&
                    (c.bonusAmount || 0) === (first.bonusAmount || 0) &&
                    c.usePromoBonuses === first.usePromoBonuses
                );
                if (allSame) {
                    setBulkEditPrefillData({
                        budget: first.budget,
                        bonusAmount: first.bonusAmount || 0,
                        useBonuses: first.usePromoBonuses,
                    });
                } else {
                    setBulkEditPrefillData(null);
                }
            } else {
                setBulkEditPrefillData(null);
            }
        }
        setCurrentBulkAction(action);
        setIsBulkActionModalOpen(true);
    };

  const handleBulkDelete = () => {
      setTemplateGroups(prev => prev.map(group => ({ ...group, campaigns: group.campaigns.filter(c => !selectedCampaignIds.includes(c.id)) })).filter(g => g.campaigns.length > 0)); 
      if (editingGroupId) setEditedCampaigns(prev => prev.filter(c => !selectedCampaignIds.includes(c.id)));
      setToastMessage(`Удалено ${selectedCampaignIds.length} ${getPlural(selectedCampaignIds.length, 'кампания', 'кампании', 'кампаний')}`);
      setShowToast(true);
      setSelectedCampaignIds([]);
  };

    const applyBulkChanges = (value: any, idsToUpdate: string[]) => {
        const action = currentBulkAction;
        const updateLogic = (campaign: CampaignRecord): CampaignRecord => {
            if (!idsToUpdate.includes(campaign.id)) return campaign;
            const newCamp = { ...campaign };
            if (action === 'budget') {
                newCamp.budget = Number(value.total);
                newCamp.bonusAmount = value.isBonusActive ? value.bonus : 0;
                newCamp.usePromoBonuses = value.isBonusActive;
            }
            if (action === 'autorefill') newCamp.autoReplenishment = Boolean(value);
            if (action === 'bid') {
                const isMultiCategory = typeof value === 'object' && value !== null && !Array.isArray(value);
                const newBid = isMultiCategory ? value[campaign.category] : value;
                if (newBid !== undefined && newBid !== '') {
                    if (newCamp.bid !== undefined) newCamp.bid = Number(newBid);
                    if (newCamp.searchBid !== undefined) newCamp.searchBid = Number(newBid);
                    if (newCamp.recommendationsBid !== undefined) newCamp.recommendationsBid = Number(newBid);
                }
            }
            return newCamp;
        };
        
        if (editingGroupId) {
            setEditedCampaigns(prev => prev.map(updateLogic));
        }
        
        // Always update the base groups so changes persist after editing
        setTemplateGroups(prev => prev.map(group => ({ ...group, campaigns: group.campaigns.map(updateLogic) })));

        setToastMessage(`Обновлено ${idsToUpdate.length} ${getPlural(idsToUpdate.length, 'кампания', 'кампании', 'кампаний')}`);
        setShowToast(true);
        setIsBulkActionModalOpen(false);
        setSelectedCampaignIds([]);
    };

    const handleBulkSave = (value: any) => {
        const action = currentBulkAction;
        if (action === 'budget' && value.isBonusActive) {
            const bonusPerCampaign = Number(value.bonus);
            const selectedPkg = value.selectedPkg as BonusPackage;

            if (bonusPerCampaign <= 0) {
                applyBulkChanges(value, selectedCampaignIds);
                return;
            }

            if (selectedPkg.amount < bonusPerCampaign) {
                setToastMessage(`Бонусов в пакете не хватает даже для одной кампании по ${bonusPerCampaign} B.`);
                setShowToast(true);
                return;
            }

            const fullCoverageCount = Math.floor(selectedPkg.amount / bonusPerCampaign);
            
            if (fullCoverageCount >= selectedCampaignIds.length) {
                applyBulkChanges(value, selectedCampaignIds);
            } else {
                const remainingBonuses = selectedPkg.amount % bonusPerCampaign;
                setBonusAppContext({ value, fullCoverageCount, remainingBonuses });
                setIsBonusInsufficiencyModalOpen(true);
            }
            return;
        }
        applyBulkChanges(value, selectedCampaignIds);
    };
    
    const handleConfirmPartialBonusApplication = () => {
        if (!bonusAppContext) return;
    
        const { value, fullCoverageCount, remainingBonuses } = bonusAppContext;
        const bonusPerCampaign = Number(value.bonus);
        
        const fullCoverageIds = selectedCampaignIds.slice(0, fullCoverageCount);
        const partialCoverageId = remainingBonuses > 0 && selectedCampaignIds.length > fullCoverageCount 
            ? selectedCampaignIds[fullCoverageCount] 
            : null;
    
        const partialUpdateLogic = (campaign: CampaignRecord): CampaignRecord => {
            if (!selectedCampaignIds.includes(campaign.id)) {
                return campaign;
            }
    
            const newCamp = { ...campaign };
            newCamp.budget = Number(value.total);
            newCamp.usePromoBonuses = true;
    
            if (fullCoverageIds.includes(campaign.id)) {
                newCamp.bonusAmount = bonusPerCampaign;
            } else if (partialCoverageId && campaign.id === partialCoverageId) {
                newCamp.bonusAmount = remainingBonuses;
            } else {
                newCamp.bonusAmount = 0;
            }
            return newCamp;
        };
    
        if (editingGroupId) {
            setEditedCampaigns(prev => prev.map(partialUpdateLogic));
        }
        setTemplateGroups(prev => prev.map(group => ({ ...group, campaigns: group.campaigns.map(partialUpdateLogic) })));

        const appliedCount = fullCoverageCount + (partialCoverageId ? 1 : 0);
        setToastMessage(`Бонусы применены к ${appliedCount} ${getPlural(appliedCount, 'кампании', 'кампаниям', 'кампаниям')}`);
        setShowToast(true);
    
        setIsBonusInsufficiencyModalOpen(false);
        setIsBulkActionModalOpen(false);
        setSelectedCampaignIds([]);
        setBonusAppContext(null);
    };

    const handleSaveBonusForCampaign = (value: any) => {
        if (!campaignForBonusEdit || !editingGroupId) return;

        const updatedCampaign = {
            ...campaignForBonusEdit,
            budget: Number(value.total),
            bonusAmount: value.isBonusActive ? value.bonus : 0,
            usePromoBonuses: value.isBonusActive,
        };
        
        setEditedCampaigns(prev => prev.map(c => c.id === campaignForBonusEdit.id ? updatedCampaign : c));
        
        setCampaignForBonusEdit(null);
    };

  const openAutoRefillModal = (campaign: CampaignRecord) => { setCampaignForAutoRefill(campaign); setIsAutoRefillModalOpen(true); };
  const handleSaveAutoRefill = () => { setIsAutoRefillModalOpen(false); setCampaignForAutoRefill(null); setToastMessage("Настройки автопополнения сохранены"); setShowToast(true); };

  const launchPreview = useMemo(() => {
    let amountToDebit = 0;
    let affordableCount = 0;
    let runningBalance = UNIFIED_BALANCE;
    const sortedCampaigns = [...allValidCampaigns].sort((a, b) => (a.budget - (a.bonusAmount || 0)) - (b.budget - (b.bonusAmount || 0)));
    
    for(const a of sortedCampaigns) {
      const realCost = a.budget - (a.bonusAmount || 0);
      if(runningBalance >= realCost) {
        runningBalance -= realCost;
        amountToDebit += realCost;
        affordableCount++;
      }
    }
    
    return {
        successfulCount: affordableCount,
        readyToLaunchCount: totalAllValidCount - affordableCount,
        amountToDebit
    };
  }, [allValidCampaigns]);

  useEffect(() => {
    if (isLaunching) {
      const timer = setTimeout(() => {
        let currentBalance = UNIFIED_BALANCE;
        const successful = [];
        const failed = [];

        for(const campaign of allValidCampaigns) {
          const realCost = campaign.budget - (campaign.bonusAmount || 0);
          if (currentBalance >= realCost) {
            currentBalance -= realCost;
            successful.push(campaign);
          } else {
            failed.push({...campaign, errorMessage: "Недостаточно средств на Едином счёте"});
          }
        }
        
        setCreationResult({ success: successful.length, error: failed.length });
        setFailedCampaigns(failed);
        setIsLaunching(false);
      }, 10000); 
      return () => clearTimeout(timer);
    }
  }, [isLaunching, allValidCampaigns]);

  const editableInputClass = "w-full text-sm bg-white border shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-2 py-1.5 rounded-lg";
  const hasActiveFilterTags = selectedSources.length > 0 || selectedCategories.length > 0;

  if (!isAuthenticated) return <AuthScreen onAuth={() => setIsAuthenticated(true)} />;

  if (appState === 'editing') {
    return (
      <MassEditPage 
        onNavigateToList={() => {
          setIsFromExcelModal(false);
          handleNavigationAttempt(handleNavigateToList);
        }} 
        onStartApplyingEdits={handleApplyEdits}
        fromExcelModal={isFromExcelModal}
      />
    );
  }

  if (appState === 'single-campaign') {
    return (
      <SingleCampaignPage 
        onBack={() => handleNavigationAttempt(handleNavigateToList)}
      />
    );
  }

  if (appState === 'list') {
    return (
      <div className="min-h-screen bg-[#F6F69] font-sans text-gray-900 relative">
        <Header onNavigateToList={() => handleNavigationAttempt(handleNavigateToList)} />
        <main className="max-w-[1392px] mx-auto px-6 py-8">
          <SuccessPage
            isLaunching={isLaunching}
            launchTotal={totalAllValidCount}
            launchResult={creationResult}
            failedCampaigns={failedCampaigns}
            onClearLaunchResult={() => setCreationResult(null)}
            onNavigateToCreation={() => handleNavigationAttempt(handleNavigateToCreation)}
            onOpenUploadEditsModal={() => setIsUploadEditsModalOpen(true)}
            selectedCampaigns={selectedListedCampaignIds}
            onSelectionChange={setSelectedListedCampaignIds}
            isApplyingEdits={isApplyingEdits}
            editResult={editResult}
            onClearEditResult={() => setEditResult(null)}
            onCancelEdits={handleCancelEdits}
            onOpenReview={() => setIsReviewEditsModalOpen(true)}
            onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
            showUploadHint={showUploadHint}
            onDismissUploadHint={() => setShowUploadHint(false)}
            onOpenCpcCampaign={({ campaignId, name }) => {
              setSelectedCpcCampaign({ id: campaignId, name });
              setAppState('cpc-detail' as any);
            }}
            onOpenSingleCampaign={() => setAppState('single-campaign')}
          />
        </main>
         <UploadEditsModal 
          isOpen={isUploadEditsModalOpen} 
          onClose={() => setIsUploadEditsModalOpen(false)}
          onApply={handleApplyEdits}
          onOpenReview={() => {
            setIsUploadEditsModalOpen(false);
            setIsFromExcelModal(true);
            handleNavigationAttempt(handleNavigateToEditing);
          }}
        />
        <ReviewEditsModal 
          isOpen={isReviewEditsModalOpen}
          onClose={() => setIsReviewEditsModalOpen(false)}
          onEdit={() => {
            setIsReviewEditsModalOpen(false);
            setIsFromExcelModal(false);
            handleNavigationAttempt(handleNavigateToEditing);
          }}
        />
        <ChangesHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            showToast={setShowToast}
            setToastMessage={setToastMessage}
        />
        {selectedListedCampaignIds.length > 0 && (
          <BulkActionIsland 
            count={selectedListedCampaignIds.length}
            onClear={() => setSelectedListedCampaignIds([])}
            onEdit={() => {
              setIsFromExcelModal(false);
              handleNavigationAttempt(handleNavigateToEditing);
            }}
            onConfigureAR={() => {
              setToastMessage("Функция 'Настроить АП' в разработке");
              setShowToast(true);
            }}
            onDownload={handleOpenEditDownloadModal}
          />
        )}

        {isEditDownloadModalOpen && (
          <div
            className="fixed inset-0 z-[96] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setIsEditDownloadModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Скачать Excel для правок</h2>
                  <p className="mt-1 text-sm text-gray-600">Какие параметры будете менять?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditDownloadModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded"
                    defaultChecked
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Базовые настройки</div>
                    <div className="text-xs text-gray-500 mt-0.5">Бюджет, автопополнение</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded"
                    defaultChecked
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Ставки</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Ставки и настройка преследования ставок
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded"
                    defaultChecked
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Кластера</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Настройка ставок по кластерам
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditDownloadModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDownloadModalOpen(false);
                    handleDownloadForEdit();
                  }}
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Скачать
                </button>
              </div>
            </div>
          </div>
        )}

        {downloadStatus === 'loading' && <DownloadNotification count={downloadCount} />}
        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  if (appState === 'cpc-detail' && selectedCpcCampaign) {
    return (
      <CpcCampaignPage
        campaignId={selectedCpcCampaign.id}
        name={selectedCpcCampaign.name}
        onBack={() => {
          setAppState('list' as any);
          setSelectedCpcCampaign(null);
        }}
      />
    );
  }

  return ( <div className="min-h-screen bg-[#F6F69] font-sans text-gray-900 pb-40 relative">
    <Header onNavigateToList={() => handleNavigationAttempt(handleNavigateToList)} />
    <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    <UndoToast campaign={lastDeleted?.campaign} onUndo={handleUndoDelete} />
    <AddItemModal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} onSubmit={handleAddItemSubmit} onTemplateDownload={handleTemplateDownload} initialConfig={globalConfig} showToast={setShowToast} setToastMessage={setToastMessage} /> 
    <AutoRefillModal isOpen={isAutoRefillModalOpen} onClose={() => setIsAutoRefillModalOpen(false)} onSave={handleSaveAutoRefill} campaign={campaignForAutoRefill} />
    <ConfirmationModal
        isOpen={isConfirmExitOpen}
        onClose={() => {
            setIsConfirmExitOpen(false);
            setPendingNavigationAction(null);
        }}
        onConfirm={() => {
            if (pendingNavigationAction) {
                setTemplateGroups([]);
                setEditingGroupId(null);
                setEditedCampaigns([]);
                setSelectedCampaignIds([]);
                setInlineErrors({});
                pendingNavigationAction();
            }
            setIsConfirmExitOpen(false);
            setPendingNavigationAction(null);
        }}
        title="Изменения не сохранены"
        confirmText="Выйти без сохранения"
        confirmColor="red"
        cancelText="Остаться"
        children={<p>Вы уверены, что хотите выйти? Все данные будут потеряны.</p>}
    />
  <BulkEditModal 
      isOpen={isBulkActionModalOpen} 
      onClose={() => setIsBulkActionModalOpen(false)} 
      action={currentBulkAction} 
      onSave={handleBulkSave} 
      categories={uniqueCategoriesForSelection} 
      selectedCampaignsCount={selectedCampaignIds.length} 
      onOpenAutoRefill={() => { setCampaignForAutoRefill(null); setIsAutoRefillModalOpen(true); }}
      prefillData={bulkEditPrefillData}
      editingGroupId={editingGroupId}
      editedCampaigns={editedCampaigns}
      allValidCampaigns={allValidCampaigns}
      selectedCampaignIds={selectedCampaignIds}
  />
  <BulkEditModal 
      isOpen={!!campaignForBonusEdit} 
      onClose={() => setCampaignForBonusEdit(null)} 
      action={'budget'} 
      onSave={handleSaveBonusForCampaign} 
      isSingleCampaignMode={true}
      campaignData={campaignForBonusEdit}
      selectedCampaignsCount={1} 
      onOpenAutoRefill={() => {}}
      editingGroupId={editingGroupId}
      editedCampaigns={editedCampaigns}
      allValidCampaigns={allValidCampaigns}
      selectedCampaignIds={selectedCampaignIds}
  />
  
  {bonusAppContext && (
    <ConfirmationModal
        isOpen={isBonusInsufficiencyModalOpen}
        onClose={() => setIsBonusInsufficiencyModalOpen(false)}
        onConfirm={handleConfirmPartialBonusApplication}
        title="Недостаточно бонусов"
        confirmText={`Применить к ${bonusAppContext.fullCoverageCount + (bonusAppContext.remainingBonuses > 0 ? 1 : 0)} ${getPlural(bonusAppContext.fullCoverageCount + (bonusAppContext.remainingBonuses > 0 ? 1 : 0), 'кампании', 'кампаниям', 'кампаниям')}`}
        confirmColor="purple"
        cancelText="Отмена"
        children={
            <div className="space-y-2 text-left">
                <p>
                    В выбранном пакете недостаточно бонусов для пополнения всех <b>{selectedCampaignIds.length} {getPlural(selectedCampaignIds.length, 'кампании', 'кампаний', 'кампаний')}</b> на сумму {bonusAppContext.value.bonus} B.
                </p>
                <p>
                    Будет пополнено <b>{bonusAppContext.fullCoverageCount} {getPlural(bonusAppContext.fullCoverageCount, 'кампания', 'кампании', 'кампаний')}</b> на полную сумму <b>{bonusAppContext.value.bonus} B</b>.
                </p>
                {bonusAppContext.remainingBonuses > 0 && (
                    <p>
                        Остаток в <b>{bonusAppContext.remainingBonuses.toLocaleString('ru-RU')} B</b> будет применен к следующей кампании.
                    </p>
                )}
            </div>
        }
    />
  )}

  <ConfirmationModal isOpen={isConfirmDeleteGroupOpen} onClose={() => setIsConfirmDeleteGroupOpen(false)} onConfirm={handleConfirmDeleteGroup} title="Подтвердите удаление" children={groupToDelete && ( <p> Вы уверены, что хотите удалить всю группу? Это действие удалит{' '} <b> {groupToDelete.campaigns.length} {getPlural(groupToDelete.campaigns.length, 'кампанию', 'кампании', 'кампаний')} </b> . Отменить это действие будет невозможно. </p> )} />
  <ConfirmationModal isOpen={isConfirmBulkDeleteOpen} onClose={() => setIsConfirmBulkDeleteOpen(false)} onConfirm={() => { handleBulkDelete(); setIsConfirmBulkDeleteOpen(false); }} title="Подтвердите удаление" confirmText="Да, удалить" confirmColor="red" children={<p> Вы уверены, что хотите удалить{' '} <b> {selectedCampaignIds.length} {getPlural(selectedCampaignIds.length, 'кампанию', 'кампании', 'кампаний')} </b> ? Это действие необратимо. </p>} />
  <ConfirmationModal isOpen={isConfirmCancelEditOpen} onClose={() => setIsConfirmCancelEditOpen(false)} onConfirm={performCancelEditing} title="Выйти без сохранения?" confirmText="Выйти без сохранения" confirmColor="red" secondaryConfirmText="Сохранить и выйти" onSecondaryConfirm={() => { handleSaveEditing(); setIsConfirmCancelEditOpen(false); }} cancelText="Продолжить редактирование" children={<p>У вас есть несохраненные изменения. Что вы хотите сделать?</p>} />
  <ConfirmationModal isOpen={isConfirmSwitchEditOpen} onClose={() => setIsConfirmSwitchEditOpen(false)} title="Сохраните изменения" confirmText="Выйти без сохранения" confirmColor="red" onConfirm={() => { setIsConfirmSwitchEditOpen(false); performCancelEditing(); }} secondaryConfirmText="Сохранить" onSecondaryConfirm={() => { setIsConfirmSwitchEditOpen(false); handleSaveEditing(); }} cancelText="Отмена" children={<p>У вас есть несохраненные изменения. Что вы хотите сделать?</p>} />
  <ConfirmationModal isOpen={isConfirmLaunchOpen} onClose={() => setIsConfirmLaunchOpen(false)} onConfirm={() => { handleSaveEditing(); performLaunch(); }} title="Сохранить изменения?" confirmText="Сохранить и запустить" confirmColor="purple" cancelText="Отмена" children={<p>У вас есть несохраненные изменения в одной из групп. Сохранить их и продолжить запуск?</p>} />
  <ConfirmationModal isOpen={isConfirmLaunchWithFiltersOpen} onClose={() => setIsConfirmLaunchWithFiltersOpen(false)} onConfirm={() => { setIsConfirmLaunchWithFiltersOpen(false); if (editingGroupId) setIsConfirmLaunchOpen(true); else performLaunch(); }} title="Запуск кампаний с активным фильтром" confirmText={`Запустить все ${totalAllValidCount}`} confirmColor="purple" cancelText="Отмена" children={ <p> Применены фильтры для просмотра, но будут запущены <b>все {totalAllValidCount} {getPlural(totalAllValidCount, 'готовая кампания', 'готовые кампании', 'готовых кампаний')}</b>. Вы уверены, что хотите продолжить? </p> } />
  <ConfirmationModal isOpen={isLaunchSummaryModalOpen} onClose={() => setIsLaunchSummaryModalOpen(false)} onConfirm={handleProceedToLaunch} title="Всё готово к запуску" confirmText={`Запустить ${totalAllValidCount} ${getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}`} confirmColor="purple" cancelText="Отменить" children={ <div className="space-y-3 text-left"> <p className="text-gray-800"> <b>{launchPreview.successfulCount} {getPlural(launchPreview.successfulCount, 'кампания', 'кампании', 'кампаний')}</b> запустятся. </p> <p className="text-gray-800">К списанию с Единого счета: <b>{launchPreview.amountToDebit.toLocaleString('ru-RU')} ₽</b></p> {globalTotals.bonus > 0 && <p className="text-gray-800">Будет оплачено бонусами: <b>{globalTotals.bonus.toLocaleString('ru-RU')} B</b></p>} {launchPreview.readyToLaunchCount > 0 && <p className="text-orange-600">Остальные <b>{launchPreview.readyToLaunchCount}</b> будут созданы в статусе «Готово к запуску».</p>} <p className="text-xs text-gray-500 pt-2"> Кампании можно остановить в любой момент и оставшиеся деньги вернуть на счет. </p> </div> } />
  
  <main className="max-w-[1392px] mx-auto px-6 py-8">
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => setIsAddItemModalOpen(true)} className="px-5 py-2.5 text-sm font-bold text-white bg-gray-700 hover:bg-gray-800 rounded-lg shadow-sm transition-all flex items-center gap-2 w-auto">
                    <Plus className="w-4 h-4" />
                    <span>Добавить список товаров</span>
                </button>
                 {templateGroups.length > 0 && showAddMoreHint && (
                    <div className="flex items-center gap-2 text-sm font-medium animate-in fade-in">
                        <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 transform -translate-y-1">
                            <path d="M31 27C31 27 21.5 25.5 17 18C12.5 10.5 1.00001 7.49999 1.00001 7.49999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
                            <path d="M5.5 12L1 7.5L6.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-gray-500">Можете добавить еще один список товаров</span>
                        <button onClick={() => setShowAddMoreHint(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </section>

        {templateGroups.length > 0 && (
             <div className="mt-6 mb-8">
                <div className="flex items-center flex-wrap gap-4">
                    <div className="relative flex-grow p-2.5 text-sm bg-white border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent outline-none transition-all shadow-sm flex items-center flex-wrap gap-2 min-w-[300px] sm:min-w-[400px]">
                        <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
                        {searchTags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-gray-100 rounded-md pl-2 pr-1 py-0.5 text-gray-700 animate-in fade-in zoom-in-95">
                                <span>{tag}</span>
                                <button onClick={() => removeSearchTag(tag)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-300 rounded-full">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <input 
                            type="text" 
                            value={currentSearchInput}
                            onChange={(e) => setCurrentSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Поиск по названию или ID" 
                            className="flex-grow bg-transparent outline-none min-w-[150px]"
                        />
                        {(searchTags.length > 0 || currentSearchInput) && (
                            <button onClick={() => {setSearchTags([]); setCurrentSearchInput('')}} className="ml-auto text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <MultiSelect options={uniqueSources} selected={selectedSources} onChange={setSelectedSources} placeholder="Источник" className="w-full sm:w-auto sm:min-w-[260px]" autoApply={true} />
                    <MultiSelect options={uniqueCategories} selected={selectedCategories} onChange={setSelectedCategories} placeholder="Категория" className="w-full sm:w-auto sm:min-w-[260px]" autoApply={true} />
                </div>
                {hasActiveFilterTags && (
                  <div className="mt-4 flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-500 mr-2">Активные фильтры:</span>
                    {selectedSources.map(source => (
                      <div key={`source-${source}`} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-2 py-1 text-sm text-gray-700 animate-in fade-in">
                        <span>{source}</span>
                        <button onClick={() => setSelectedSources(prev => prev.filter(s => s !== source))} className="text-gray-400 hover:text-gray-700 hover:bg-gray-300 rounded-full p-0.5"> <X className="w-3 h-3" /> </button>
                      </div>
                    ))}
                    {selectedCategories.map(category => (
                      <div key={`category-${category}`} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-2 py-1 text-sm text-gray-700 animate-in fade-in">
                        <span>{category}</span>
                        <button onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))} className="text-gray-400 hover:text-gray-700 hover:bg-gray-300 rounded-full p-0.5"> <X className="w-3 h-3" /> </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        )}
        
        {isTableLoading ? (
            <div className="space-y-8 mt-6">
                <ExcelProcessingLoader statusText={loadingStatusText} />
            </div>
        ) : templateGroups.length > 0 ? (
            <div className="space-y-8"> {templateGroups.map((group) => { 
            const campaignsForReview = editingGroupId === group.id ? editedCampaigns : group.campaigns.filter(c => c.status !== CampaignStatus.ERROR);
            const filteredGroupCampaigns = campaignsForReview.filter(c => filteredCampaigns.some(fc => fc.id === c.id));
            const validCount = filteredGroupCampaigns.length; 
            const totals = filteredGroupCampaigns.reduce( (acc, campaign) => { acc.total += campaign.budget; acc.bonus += campaign.bonusAmount || 0; return acc; }, { total: 0, bonus: 0 } ); const paginatedCampaigns = filteredGroupCampaigns.slice((group.currentPage - 1) * PAGE_SIZE, group.currentPage * PAGE_SIZE); const paginatedIds = paginatedCampaigns.map(c => c.id); const isCpmManual = group.config.paymentModel === PaymentModel.CPM && group.config.bidType === BidType.MANUAL; 
            const selectedOnPageCount = paginatedIds.filter(id => selectedCampaignIds.includes(id)).length;
            const allOnPageSelected = selectedOnPageCount === paginatedIds.length && paginatedIds.length > 0;
            const isIndeterminate = !allOnPageSelected && selectedOnPageCount > 0;
            if (filteredGroupCampaigns.length === 0 && areFiltersActive) return null;

            return ( <section key={group.id} className="bg-white rounded-2xl shadow-sm px-6 pb-6 pt-0 space-y-4 animate-fade-in"> 
            <div className="sticky top-[104px] z-30 bg-white py-3 border-b border-gray-100 mb-0 flex justify-between items-center -mx-6 px-6 rounded-t-2xl shadow-sm h-[57px]"> 
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{`${group.config.paymentModel} ${group.config.bidType === BidType.MANUAL ? 'Ручная ставка' : 'Единая ставка'}`}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 truncate" title={Array.from(group.sourceFiles).join(', ')}> {Array.from(group.sourceFiles).join(', ')} </p>
                </div>
                <span className="text-gray-400 text-sm font-medium">{validCount} {getPlural(validCount, 'кампания', 'кампании', 'кампаний')}</span> 
              </div> 
              <div className="flex items-center gap-2">
              {editingGroupId === group.id ? ( 
                <>
                  <button onClick={handleCancelEditing} className="px-4 py-2 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Отмена</button> 
                  <button onClick={handleSaveEditing} disabled={Object.keys(inlineErrors).length > 0} className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">Сохранить</button> 
                </>
              ) : ( 
                <>
                  <button onClick={() => handleStartEditing(group)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 text-xs"> 
                    <Edit2 className="w-3 h-3" /> <span>Редактировать</span> 
                  </button>
                   <div className="tooltip">
                    <button onClick={() => openDeleteGroupModal(group)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"> <Trash2 className="w-4 h-4" /> </button>
                    <span className="tooltip-text">Удалить группу</span>
                   </div>
                </>
              )} 
              </div>
            </div> 
            <div className="bg-white rounded-lg overflow-x-auto">
              <table className="w-full min-w-[1024px] text-xs text-left table-fixed"> 
              <thead className="text-gray-600"> 
                <tr> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"> <input type="checkbox" checked={allOnPageSelected} ref={el => { if (el) el.indeterminate = isIndeterminate; }} onChange={(e) => handleSelectAllOnPage(paginatedIds, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /> </th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Товар/Кампания</span><span className="tooltip-text">Информация о товаре и его артикул (ID)</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[16%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Название кампании</span><span className="tooltip-text">Редактируемое название рекламной кампании</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Категория</span><span className="tooltip-text">Категория, к которой относится товар</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Зона показов</span><span className="tooltip-text">Места показа рекламы: Поиск и/или Рекомендации</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Бюджет</span><span className="tooltip-text">Общая сумма, выделенная на кампанию</span></div></th>  
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Преследование</span><span className="tooltip-text">Автоматическое управление ставками</span></div></th> 
                  {isCpmManual ? <> 
                    <th className="table-header-cell px-2 py-1.5 font-normal w-[9%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Поиск</span><span className="tooltip-text">Ставка для показов в результатах поиска</span></div></th> 
                    <th className="table-header-cell px-2 py-1.5 font-normal w-[9%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Рекоменд.</span><span className="tooltip-text">Ставка для показов в рекомендациях</span></div></th> 
                  </> : <th className="table-header-cell px-2 py-1.5 font-normal w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip justify-start"><span>Ставка</span><span className="tooltip-text">Единая ставка для всех зон показов</span></div></th> } 
                  <th className="table-header-cell px-2 py-1.5 font-normal w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"><div className="tooltip"><span>АП</span><span className="tooltip-text">Автоматическое пополнение бюджета</span></div></th> 
                  <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"></th> 
                </tr> 
              </thead> 
              <tbody className="divide-y divide-gray-100"> {paginatedCampaigns.map((row) => ( <tr key={row.id} className={`transition-colors ${selectedCampaignIds.includes(row.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}> <td className="px-2 py-1.5 align-top"><input type="checkbox" checked={selectedCampaignIds.includes(row.id)} onChange={() => handleSelectCampaign(row.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"/></td> <td className="px-2 py-1.5 align-top"> <div className="flex items-start gap-2"> 
      <div className="relative group">
        <img src={row.imageUrl} alt={row.productName} className="w-8 h-8 rounded-md object-cover bg-gray-100 shrink-0 cursor-zoom-in" />
        <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-[100] w-28 aspect-[3/4] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden pointer-events-none">
            <img src={row.imageUrl} alt={row.productName} className="w-full h-full object-cover" />
        </div>
      </div>
      <div> <a href="#" className="font-medium text-purple-600 hover:underline leading-tight block">{row.productName}</a> <div className="text-gray-500 mt-0.5">ID {row.nmId}</div> </div> </div> </td> 
      <td className="px-2 py-1.5 align-top">
        {editingGroupId === group.id ? (
            <textarea value={row.campaignName} onChange={(e) => handleUpdateCampaign(group.id, row.id, { campaignName: e.target.value })} rows={2} className={`${editableInputClass} resize-y min-h-[34px] border-gray-300`} />
        ) : (
            <div className="tooltip w-full">
                <textarea value={row.campaignName} readOnly rows={2} className='w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed' />
                <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
            </div>
        )}
      </td>
      <td className="px-2 py-1.5 text-gray-600 align-top">{row.category}</td> <td className="px-2 py-1.5 text-gray-600 align-top">{group.config.bidType === BidType.MANUAL ? 'Ручная' : 'Единая'}</td> 
      <td className="px-2 py-1.5 text-gray-800 align-top">
        {editingGroupId === group.id ? (
            <div>
                 <div className="relative">
                    <input 
                        type="text" 
                        value={row.budget === null || row.budget === undefined ? '' : formatForDisplay(row.budget)}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '') {
                                const parsed = parseDisplayValue(val);
                                if (!isNaN(parsed)) {
                                    handleUpdateCampaign(group.id, row.id, { budget: parsed });
                                }
                            }
                        }}
                        onBlur={() => {
                            if (row.budget < 1000) {
                                handleUpdateCampaign(group.id, row.id, { budget: 1000 });
                            }
                        }}
                        className={`${editableInputClass} pr-6 ${inlineErrors[`${row.id}-budget`] ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
                {inlineErrors[`${row.id}-budget`] && <p className="text-red-500 text-[10px] mt-0.5 absolute">{inlineErrors[`${row.id}-budget`]}</p>}
            </div>
        ) : (
            <div className="tooltip">
                <div className="flex flex-col cursor-not-allowed">
                    <span className="font-medium">{`${formatForDisplay(row.budget)} ₽`}</span>
                </div>
                 <span className="tooltip-text">Чтобы изменить бюджет, нажмите «Редактировать»</span>
            </div>
        )}
      </td>
      <td className="px-2 py-1.5 align-top">
        {editingGroupId === group.id ? (
            <a href="#" onClick={(e) => { e.preventDefault(); openBulkActionModal('autobidder'); }} className="text-blue-600 hover:underline">настроить</a>
        ) : (
            <div className="tooltip">
                <span className="text-gray-400 cursor-not-allowed">настроить</span>
                <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
            </div>
        )}
      </td>
      {isCpmManual ? <> 
        <td className="px-2 py-1.5 text-gray-800 align-top">
            <div className="w-full pr-2">
                {editingGroupId === group.id ? (
                    <BidInput value={row.searchBid || 0} onChange={(val) => handleUpdateCampaign(group.id, row.id, { searchBid: val })} />
                ) : (
                    <div className="tooltip">
                        <span className="cursor-not-allowed">{`${row.searchBid || 0} ₽`}</span>
                        <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                    </div>
                )}
            </div>
        </td> 
        <td className="px-2 py-1.5 text-gray-800 align-top">
            <div className="w-full pr-2">
                {editingGroupId === group.id ? (
                    <BidInput value={row.recommendationsBid || 0} onChange={(val) => handleUpdateCampaign(group.id, row.id, { recommendationsBid: val })} />
                ) : (
                     <div className="tooltip">
                        <span className="cursor-not-allowed">{`${row.recommendationsBid || 0} ₽`}</span>
                        <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                    </div>
                )}
            </div>
        </td> 
        </> : 
        <td className="px-2 py-1.5 text-gray-800 align-top">
            <div className="w-full pr-2">
                {editingGroupId === group.id ? (
                    <BidInput value={row.bid || 0} onChange={(val) => handleUpdateCampaign(group.id, row.id, { bid: val })} />
                ) : (
                     <div className="tooltip">
                        <span className="cursor-not-allowed">{`${row.bid || 0} ₽`}</span>
                        <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                    </div>
                )}
            </div>
        </td> 
      } 
      <td className="px-2 py-1.5 align-top">
        <div className="flex items-center gap-2">
            <ToggleSwitch checked={row.autoReplenishment} onChange={(checked) => handleUpdateCampaign(group.id, row.id, { autoReplenishment: checked })} disabled={editingGroupId !== group.id}/>
            {row.autoReplenishment && editingGroupId === group.id && (
                <button onClick={() => openAutoRefillModal(row)} className="text-gray-400 hover:text-purple-600"> <Settings className="w-4 h-4" /> </button>
            )}
        </div>
      </td> 
      <td className="px-2 py-1.5 text-left align-top">
        <div className="tooltip">
            <button onClick={() => handleDeleteCampaign(row.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"> <Trash2 className="w-4 h-4" /> </button>
            <span className="tooltip-text">Удалить</span>
        </div>
      </td> 
      </tr> ))} </tbody> {validCount > 0 && ( <tfoot className="border-t-2 border-gray-200 bg-gray-50/50"> <tr> <td colSpan={5} className="px-2 py-2 font-bold text-gray-800 text-sm text-left">Итого по группе:</td> <td colSpan={isCpmManual ? 7 : 6} className="px-2 py-2 text-xs"> <div className="text-gray-600 whitespace-nowrap">Единый счёт: <span className="font-semibold text-gray-800">{formatForDisplay(totals.total - totals.bonus)} ₽</span></div> {totals.bonus > 0 && <div className="text-gray-600 whitespace-nowrap">Бонусы: <span className="font-semibold text-purple-600">{formatForDisplay(totals.bonus)} B</span></div>} </td> </tr> </tfoot> )} </table> </div> <Pagination total={validCount} pageSize={PAGE_SIZE} current={group.currentPage} onChange={(page) => handlePageChange(group.id, page)} /> </section> ) })}</div>
        ) : (
            <EmptyStatePlaceholder />
        )}
    </main> 

    {selectedCampaignIds.length > 0 && (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl z-[80] p-3 flex flex-col items-center gap-1 animate-in slide-in-from-bottom-4 fade-in border border-gray-200">
          <span className="text-xs text-gray-500 font-medium mb-1">Выбрано {selectedCampaignIds.length}</span>
          <div className="flex items-center gap-1">
           <button onClick={() => openBulkActionModal('budget')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <DollarSign className="w-4 h-4 text-gray-500" />
             <span>Задать бюджет</span>
           </button>
           <button onClick={() => openBulkActionModal('bid')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <Zap className="w-4 h-4 text-gray-500" />
             <span>Задать ставки</span>
           </button>
           <button onClick={() => openBulkActionModal('autorefill')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <RefreshCw className="w-4 h-4 text-gray-500" />
             <span>Настроить АП</span>
           </button>
           <button onClick={() => openBulkActionModal('autobidder')} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
             <Wand className="w-4 h-4 text-gray-500" />
             <span>Автобиддер</span>
           </button>
           <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <div className="tooltip">
             <button onClick={() => openBulkActionModal('delete')} className="p-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5">
               <Trash2 className="w-4 h-4" />
             </button>
             <span className="tooltip-text">Удалить</span>
            </div>
           <button onClick={() => setSelectedCampaignIds([])} className="ml-2 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
             <X className="w-5 h-5" />
           </button>
          </div>
      </div>
    )}

    {totalAllValidCount > 0 && selectedCampaignIds.length === 0 && editingGroupId === null && ( 
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-gray-200"> 
    <div className="max-w-[1392px] mx-auto px-6 py-4 flex justify-between items-center"> 
    <div> <h3 className="font-bold text-gray-800">Общий итог за {totalAllValidCount} {getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}</h3> 
        <div className="flex items-center gap-6 text-sm mt-1"> 
            <div> 
                <span className="text-gray-500">Единый счёт: </span> 
                <span className={`font-semibold ${globalDeficit > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {globalTotals.real.toLocaleString('ru-RU')} ₽
                </span> 
                {globalDeficit > 0 && 
                    <span className="ml-2 text-red-500 font-medium">
                        (не хватает {globalDeficit.toLocaleString('ru-RU')} ₽ 
                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 font-medium hover:underline text-sm ml-2">пополнить</a>)
                    </span>
                } 
            </div> 
            {globalTotals.bonus > 0 && (
                <div> 
                    <span className="text-gray-500">Бонусы: </span> 
                    <span className="font-semibold text-gray-900">{globalTotals.bonus.toLocaleString('ru-RU')} B</span> 
                </div>
            )}
            <div className="pl-6 border-l border-gray-200 flex items-center gap-4"> 
                <div> 
                    <span className="font-bold text-lg text-purple-600"> {globalTotals.total.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 })} </span> 
                </div> 
            </div> 
        </div> 
    </div>
    <div className="flex items-center gap-4">
        {globalDeficit > 0 && launchPreview.readyToLaunchCount > 0 && (
            <div className="flex items-start gap-2 max-w-md mr-4 text-xs text-gray-800 leading-tight">
                <Bell className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-left">
                    Не хватает средств для {launchPreview.readyToLaunchCount} {getPlural(launchPreview.readyToLaunchCount, 'кампании', 'кампаний', 'кампаний')}.<br/>
                    Они будут созданы в статусе «Готово к запуску».
                </div>
            </div>
        )}
        <button onClick={launchCampaigns} disabled={isLaunching} className="px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-purple-200 transition-all transform hover:-translate-y-0.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-xl disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"> {`Запустить ${totalAllValidCount} ${getPlural(totalAllValidCount, 'кампанию', 'кампании', 'кампаний')}`} </button>
    </div>
    </div> </footer> )} </div> );
}