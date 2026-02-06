import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOCK_CHANGES, CampaignChange, Product } from './ReviewEditsModal';
import { Edit2, Trash2, Bell, HelpCircle, Wallet, ChevronDown, RefreshCw, Download, X, Search, Clock, SingleAccountIcon, Settings, Info, AlertTriangle } from './Icons';

const PAGE_SIZE = 50;
const UNIFIED_BALANCE = 105350;
const TOTAL_PROMO_BONUS = 226660517;

interface BonusPackage {
  id: string;
  amount: number;
  maxPercent: number;
  expiry: string;
  displayBurn: string;
}

const BONUS_PACKAGES: BonusPackage[] = [
  { id: 'p1', amount: 209527397, maxPercent: 100, expiry: '20.03.26', displayBurn: '209.4M' },
  { id: 'p2', amount: 17133120, maxPercent: 99, expiry: '27.03.26', displayBurn: '168.3k' },
];

const getPlural = (number: number, one: string, two: string, five: string) => {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) { return five; }
  n %= 10;
  if (n === 1) { return one; }
  if (n >= 2 && n <= 4) { return two; }
  return five;
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

const formatForDisplay = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '';
  const numValue = typeof num === 'string' ? parseDisplayValue(num) : num;
  return numValue.toLocaleString('ru-RU', { useGrouping: true });
};

const parseDisplayValue = (str: string): number => {
  return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
};

const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
  <button 
    role="switch" 
    aria-checked={checked} 
    onClick={() => !disabled && onChange(!checked)} 
    disabled={disabled} 
    className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ 
      disabled ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer' 
    } ${ 
      checked ? (disabled ? 'bg-purple-300' : 'bg-purple-600') : 'bg-gray-300' 
    }`}
  >
    <span 
      aria-hidden="true" 
      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ 
        checked ? 'translate-x-3' : 'translate-x-0' 
      }`} 
    />
  </button>
);

const BidInput = ({ value, onChange, presets = [150, 200, 250] }: { value: number; onChange: (value: number) => void; presets?: number[] }) => {
  const [inputValue, setInputValue] = useState(String(value || ''));

  React.useEffect(() => {
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
            className={`flex-1 h-full transition-colors relative ${
              Number(value) === p ? 'bg-green-300' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {index > 0 && <div className="absolute left-0 top-0 bottom-0 w-px bg-white"></div>}
          </button>
        ))}
      </div>
    </div>
  );
};

const Pagination = ({ total, pageSize, current, onChange }: { total: number; pageSize: number; current: number; onChange: (page: number) => void }) => {
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

  return (
    <div className="pagination-container">
      <button onClick={handlePrev} className={`pagination-item ${current === 1 ? 'disabled' : ''}`} disabled={current === 1}>&lt;</button>
      {uniqueItems.map((item, index) => (
        <button 
          key={index} 
          onClick={() => typeof item === 'number' && onChange(item)} 
          className={`pagination-item ${current === item ? 'active' : ''} ${typeof item !== 'number' ? 'disabled' : ''}`} 
          disabled={typeof item !== 'number'}
        >
          {item}
        </button>
      ))}
      <button onClick={handleNext} className={`pagination-item ${current === totalPages ? 'disabled' : ''}`} disabled={current === totalPages}>&gt;</button>
    </div>
  );
};

const StatusIndicator = ({ isActive }: { isActive: boolean }) => (
  <span className={`text-[10px] ${isActive ? 'text-green-600' : 'text-red-600'} whitespace-nowrap overflow-hidden`}>
    {isActive ? 'Активна' : 'Остановлена'}
  </span>
);

const Toast = ({ show, message, onClose }: { show: boolean, message: string, onClose: () => void }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <span className="font-medium">{message}</span>
    </div>
  );
};

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Удалить',
  confirmColor = 'red',
  cancelText = "Отмена"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmColor?: 'red' | 'purple';
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
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${colorClasses[confirmColor]}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const UndoToast: React.FC<{
  product: { campaignId: number; productId: number; campaignName: string; productName: string } | null;
  onUndo: () => void;
}> = ({ product, onUndo }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (product) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [product]);

  if (!isVisible || !product) {
    return null;
  }

  return (
    <div
      key={`${product.campaignId}-${product.productId}`} 
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl z-[100] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <Trash2 className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="flex-grow relative overflow-hidden">
        <p className="font-medium">Товар "{product.productName}" удален.</p>
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

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      isActive
        ? 'text-white bg-purple-600 shadow-sm'
        : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-200'
    }`}
  >
    {children}
  </button>
);

const formatBool = (val: boolean) => val ? 'Вкл' : 'Выкл';
const formatCurrency = (val: number | null) => val !== null ? `${val.toLocaleString('ru-RU')} ₽` : '-';
const formatBidChasing = (chasing: { strategy: string; maxBid: number } | null) => {
  if (!chasing) return '-';
  return (
    <div>
      <p>Стратегия: <span className="font-semibold">{chasing.strategy}</span></p>
      <p>Не выше: <span className="font-semibold">{formatCurrency(chasing.maxBid)}</span></p>
    </div>
  );
};

interface MassEditPageProps {
  onNavigateToList: () => void;
  onStartApplyingEdits: () => void;
  fromExcelModal?: boolean;
}

type BulkActionType = 'bid' | 'budget' | null;

const getPromotionTypeForCampaign = (campaign: CampaignChange): 'CPC' | 'CPM' => {
  // Простая эвристика: по чётности ID кампании
  return campaign.id % 2 === 0 ? 'CPC' : 'CPM';
};

const getDisplayCampaignName = (campaign: CampaignChange) => {
  const promotionType = getPromotionTypeForCampaign(campaign);
  const currentDate = new Date().toLocaleDateString('ru-RU');
  const baseProduct = campaign.products[0];
  const productLabel = baseProduct ? `Товар ${baseProduct.id}` : campaign.name;
  return `${productLabel} ${promotionType} от ${currentDate}`;
};

export const MassEditPage: React.FC<MassEditPageProps> = ({ onNavigateToList, onStartApplyingEdits, fromExcelModal = false }) => {
  const [campaigns, setCampaigns] = useState<CampaignChange[]>(
    () => MOCK_CHANGES.map(c => ({ ...c, name: getDisplayCampaignName(c) }))
  );
  // If from Excel modal, originalCampaigns should be empty (or different) to indicate there are changes from Excel
  // If from list, originalCampaigns should match campaigns initially (no changes)
  const [originalCampaigns, setOriginalCampaigns] = useState<CampaignChange[]>(
    fromExcelModal ? [] : JSON.parse(JSON.stringify(MOCK_CHANGES))
  );
  // default: view mode (like in "массовое создание")
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([]);
  const [flowStep, setFlowStep] = useState<'editing' | 'confirm'>('editing');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'base' | 'bids' | 'clusters'>('base');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null);
  const [lastDeleted, setLastDeleted] = useState<{ campaignId: number; productId: number; campaignName: string; productName: string; product: Product; productIndex: number } | null>(null);
  const deleteUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAutoRefillModalOpen, setIsAutoRefillModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);

  const editableInputClass = "w-full text-sm bg-white border shadow-sm outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-2 py-1.5 rounded-lg";

  const handleUpdateCampaign = (campaignId: number, updates: Partial<CampaignChange>) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, ...updates } : c));
  };

  // Check if there are any changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(campaigns) !== JSON.stringify(originalCampaigns);
  }, [campaigns, originalCampaigns]);

  const handleUpdateClusterBid = (campaignId: number, productId: number, clusterName: string, newBid: number | null) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id !== campaignId) return campaign;
      return {
        ...campaign,
        products: campaign.products.map(product => {
          if (product.id !== productId) return product;
          return {
            ...product,
            clusters: product.clusters.map(cluster => 
              cluster.name === clusterName ? { ...cluster, newBid } : cluster
            )
          };
        })
      };
    }));
  };

  const handleUpdateProductBid = (campaignId: number, productId: number, newBid: number | null) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id !== campaignId) return campaign;
      return {
        ...campaign,
        products: campaign.products.map(product => {
          if (product.id !== productId) return product;
          // Update all clusters with the same bid (unified bid per product)
          return {
            ...product,
            clusters: product.clusters.map(cluster => ({ ...cluster, newBid }))
          };
        })
      };
    }));
  };

  const handleSelectCampaign = (campaignId: number) => {
    setSelectedCampaignIds(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  // Filter campaigns by search query
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    const query = searchQuery.toLowerCase().trim();
    return campaigns.filter(campaign => {
      // Search by campaign ID
      if (String(campaign.id).includes(query)) return true;
      // Search by product ID (артикул товара)
      return campaign.products.some(product => String(product.id).includes(query));
    });
  }, [campaigns, searchQuery]);

  // Find campaigns with changed bids (для информера про минимальные ставки)
  const campaignsWithChangedBids = useMemo(() => {
    if (!fromExcelModal) return new Set<number>();

    const changedCampaignIds: number[] = [];
    campaigns.forEach(campaign => {
      const hasChangedBid = campaign.products.some(product =>
        product.clusters.some(cluster => cluster.oldBid !== null && cluster.newBid !== null && cluster.oldBid !== cluster.newBid)
      );
      if (hasChangedBid) {
        changedCampaignIds.push(campaign.id);
      }
    });

    if (changedCampaignIds.length <= 5) {
      return new Set(changedCampaignIds);
    }

    // Перемешиваем список кампаний с изменёнными ставками и берём любые 5
    const shuffled = [...changedCampaignIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return new Set(shuffled.slice(0, 5));
  }, [campaigns, fromExcelModal]);

  // Base settings table rows
  const baseTableRows = useMemo(() => {
    const rows: Array<{ campaign: CampaignChange; product: typeof MOCK_CHANGES[0]['products'][0]; rowKey: string }> = [];
    filteredCampaigns.forEach(campaign => {
      campaign.products.forEach(product => {
        rows.push({ campaign, product, rowKey: `${campaign.id}-${product.id}` });
      });
    });
    return rows;
  }, [filteredCampaigns]);

  // Bids table rows (one row per product with single bid)
  const bidsTableRows = useMemo(() => {
    const rows: Array<{ campaign: CampaignChange; product: typeof MOCK_CHANGES[0]['products'][0]; rowKey: string }> = [];
    filteredCampaigns.forEach(campaign => {
      campaign.products.forEach(product => {
        rows.push({ campaign, product, rowKey: `${campaign.id}-${product.id}` });
      });
    });
    return rows;
  }, [filteredCampaigns]);

  // Clusters table rows (one row per cluster)
  const clustersTableRows = useMemo(() => {
    const rows: Array<{ campaign: CampaignChange; product: typeof MOCK_CHANGES[0]['products'][0]; cluster: typeof MOCK_CHANGES[0]['products'][0]['clusters'][0]; rowKey: string }> = [];
    filteredCampaigns.forEach(campaign => {
      campaign.products.forEach(product => {
        product.clusters.forEach(cluster => {
          rows.push({ campaign, product, cluster, rowKey: `${campaign.id}-${product.id}-${cluster.name}` });
        });
      });
    });
    return rows;
  }, [filteredCampaigns]);

  const totalRows = useMemo(() => {
    if (activeTab === 'base') return baseTableRows.length;
    if (activeTab === 'bids') return bidsTableRows.length;
    return clustersTableRows.length;
  }, [activeTab, baseTableRows, bidsTableRows, clustersTableRows]);

  const paginatedRows = useMemo(() => {
    if (activeTab === 'base') {
      return baseTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    } else if (activeTab === 'bids') {
      return bidsTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    } else {
      return clustersTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    }
  }, [activeTab, currentPage, baseTableRows, bidsTableRows, clustersTableRows]);

  const paginatedCampaignIds = useMemo(() => {
    if (activeTab === 'base') {
      const currentRows = baseTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
      return new Set(currentRows.map((r: any) => r.campaign.id));
    } else if (activeTab === 'bids') {
      const currentRows = bidsTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
      return new Set(currentRows.map((r: any) => r.campaign.id));
    } else {
      const currentRows = clustersTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
      return new Set(currentRows.map((r: any) => r.campaign.id));
    }
  }, [activeTab, currentPage, baseTableRows, bidsTableRows, clustersTableRows]);

  const allOnPageSelected = paginatedCampaignIds.size > 0 && Array.from(paginatedCampaignIds).every(id => selectedCampaignIds.includes(id));
  const isIndeterminate = !allOnPageSelected && Array.from(paginatedCampaignIds).some(id => selectedCampaignIds.includes(id));

  const handleSelectAllOnPage = (checked: boolean) => {
    if (checked) {
      setSelectedCampaignIds(prev => [...new Set([...prev, ...Array.from(paginatedCampaignIds)])]);
    } else {
      setSelectedCampaignIds(prev => prev.filter(id => !paginatedCampaignIds.has(id)));
    }
  };

  const totals = useMemo(() => {
    const selectedCampaigns = campaigns.filter(c => selectedCampaignIds.includes(c.id));
    return selectedCampaigns.reduce((acc, c) => {
      acc.total += c.replenishmentAmount || 0;
      return acc;
    }, { total: 0 });
  }, [campaigns, selectedCampaignIds]);

  const handleSetBudget = () => {
    setCurrentBulkAction('budget');
    setIsBulkActionModalOpen(true);
  };

  const handleConfigureAR = () => {
    setIsAutoRefillModalOpen(true);
  };

  const handleBulkDelete = () => {
    setIsConfirmBulkDeleteOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    // Get all products from selected campaigns
    let totalProductsDeleted = 0;
    
    selectedCampaignIds.forEach(campaignId => {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        totalProductsDeleted += campaign.products.length;
      }
    });

    // Delete all products from selected campaigns
    setCampaigns(prev => prev.map(campaign => {
      if (selectedCampaignIds.includes(campaign.id)) {
        return {
          ...campaign,
          products: []
        };
      }
      return campaign;
    }));

    // Clear selection
    setSelectedCampaignIds([]);
    setIsConfirmBulkDeleteOpen(false);
    
    // Show notification
    setToastMessage(`Удалено товаров: ${totalProductsDeleted}`);
    setShowToast(true);
  };

  const handleDeleteProduct = (campaignId: number, productId: number) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    
    const productIndex = campaign.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;
    
    const product = campaign.products[productIndex];
    
    // Remove product from campaign
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          products: c.products.filter(p => p.id !== productId)
        };
      }
      return c;
    }));
    
    // Store deleted product for undo
    setLastDeleted({
      campaignId,
      productId,
      product,
      productIndex,
      campaignName: campaign.name,
      productName: `Товар ${productId}`
    });
    
    // Clear previous timer
    if (deleteUndoTimer.current) {
      clearTimeout(deleteUndoTimer.current);
    }
    
    // Auto-clear after 5 seconds
    deleteUndoTimer.current = setTimeout(() => {
      setLastDeleted(null);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    
    const { campaignId, product, productIndex } = lastDeleted;
    
    // Restore product
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const newProducts = [...c.products];
        newProducts.splice(productIndex, 0, product);
        return {
          ...c,
          products: newProducts
        };
      }
      return c;
    }));
    
    // Clear undo state
    setLastDeleted(null);
    if (deleteUndoTimer.current) {
      clearTimeout(deleteUndoTimer.current);
      deleteUndoTimer.current = null;
    }
  };

  const handleSetBid = () => {
    setCurrentBulkAction('bid');
    setIsBulkActionModalOpen(true);
  };

  const handleConfigureBidChasing = () => {
    // Placeholder for configure bid chasing action
    console.log('Configure bid chasing clicked');
  };

  const handleManageClusters = () => {
    // Placeholder for manage clusters action
    console.log('Manage clusters clicked');
  };

  const applyBulkChanges = (value: any) => {
    if (currentBulkAction === 'budget') {
      const budgetValue = value.total;
      setCampaigns(prev => prev.map(campaign => {
        if (selectedCampaignIds.includes(campaign.id)) {
          return { ...campaign, replenishmentAmount: budgetValue };
        }
        return campaign;
      }));
      setToastMessage('Изменения сохранены');
      setShowToast(true);
    } else if (currentBulkAction === 'bid') {
      const bidValue = Number(value);
      setCampaigns(prev => prev.map(campaign => {
        if (selectedCampaignIds.includes(campaign.id)) {
          if (activeTab === 'bids') {
            // For bids tab: set unified bid for all products (first cluster's bid)
            return {
              ...campaign,
              products: campaign.products.map(product => ({
                ...product,
                clusters: product.clusters.map(cluster => ({
                  ...cluster,
                  newBid: bidValue
                }))
              }))
            };
          } else if (activeTab === 'clusters') {
            // For clusters tab: set bid for all clusters
            return {
              ...campaign,
              products: campaign.products.map(product => ({
                ...product,
                clusters: product.clusters.map(cluster => ({
                  ...cluster,
                  newBid: bidValue
                }))
              }))
            };
          }
        }
        return campaign;
      }));
      setToastMessage('Изменения сохранены');
      setShowToast(true);
    }
    setIsBulkActionModalOpen(false);
    setCurrentBulkAction(null);
  };

  const handleApplyClick = () => {
    if (flowStep === 'editing') {
      setFlowStep('confirm');
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F69] font-sans text-gray-900 pb-40 relative">
      <Header onNavigateToList={onNavigateToList} />
      
      <main className="max-w-[1392px] mx-auto px-6 py-8">

        <div className="bg-white rounded-2xl shadow-sm px-6 pb-6 pt-0 space-y-4">
          {/* Tabs */}
          <div className="bg-gray-50 -mx-6 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <TabButton isActive={activeTab === 'base'} onClick={() => { setActiveTab('base'); setCurrentPage(1); }}>Базовые настройки</TabButton>
              <TabButton isActive={activeTab === 'bids'} onClick={() => { setActiveTab('bids'); setCurrentPage(1); }}>Ставки</TabButton>
              <TabButton isActive={activeTab === 'clusters'} onClick={() => { setActiveTab('clusters'); setCurrentPage(1); }}>Кластера</TabButton>
            </div>
          </div>

          <div className="sticky top-[104px] z-30 bg-white py-3 border-b border-gray-100 mb-0 flex justify-between items-center -mx-6 px-6 rounded-t-2xl shadow-sm h-[57px]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900">Кампании</h2>
              <span className="text-gray-400 text-sm font-medium">{totalRows} {totalRows === 1 ? 'запись' : totalRows < 5 ? 'записи' : 'записей'}</span>
            </div>
            {flowStep === 'editing' && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Отмена</button>
                    <button 
                      onClick={() => {
                        // Save changes logic here
                        setIsEditing(false);
                      }} 
                      className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                    >
                      Сохранить
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Редактировать</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Поиск по ID кампании или артикулу товара"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-x-auto">
            {activeTab === 'base' && (() => {
              const campaignIndexMap = new Map<number, number>();
              let campaignCounter = 0;
              campaigns.forEach(c => {
                if (!campaignIndexMap.has(c.id)) {
                  campaignIndexMap.set(c.id, campaignCounter++);
                }
              });
              const currentPaginatedRows = baseTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

              return (
                <table className="w-full min-w-[1024px] text-xs text-left table-fixed">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <input 
                          type="checkbox" 
                          checked={allOnPageSelected} 
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }} 
                          onChange={(e) => handleSelectAllOnPage(e.target.checked)} 
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                        />
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[6%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Статус</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>№</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Название кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[10%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[11%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Товара</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[13%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Зоны показа</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Бюджет</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[8%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>АП</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[14%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start flex items-center gap-1">
                          <span>Условия АП</span>
                          <button
                            type="button"
                            onClick={() => setIsAutoRefillModalOpen(true)}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPaginatedRows.map(({ campaign, product, rowKey }) => {
                      const isFirstProduct = campaign.products[0].id === product.id;
                      const isSelected = selectedCampaignIds.includes(campaign.id);
                      const campaignIndex = campaignIndexMap.get(campaign.id) ?? 0;

                      return (
                        <tr key={rowKey} className={`transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 align-top text-left">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleSelectCampaign(campaign.id)} 
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          {isFirstProduct && (
                            <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left">
                              {isEditing ? (
                                <ToggleSwitch 
                                  checked={campaign.newIsActive} 
                                  onChange={(checked) => handleUpdateCampaign(campaign.id, { newIsActive: checked })} 
                                />
                              ) : (
                                <StatusIndicator isActive={campaign.newIsActive} />
                              )}
                            </td>
                          )}
                          {isFirstProduct && (
                            <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left text-gray-500">
                              {campaignIndex + 1}
                            </td>
                          )}
                          {isFirstProduct && (
                            <>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left font-medium text-gray-800">
                                {isEditing ? (
                                  <textarea 
                                    value={campaign.name} 
                                    onChange={(e) => handleUpdateCampaign(campaign.id, { name: e.target.value })} 
                                    rows={2} 
                                    className={`${editableInputClass} resize-y min-h-[34px] border-gray-300`} 
                                  />
                                ) : (
                                  <div className="tooltip w-full">
                                    <textarea value={campaign.name} readOnly rows={2} className="w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed" />
                                    <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                                  </div>
                                )}
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left text-gray-500">
                                {campaign.id}
                              </td>
                            </>
                          )}
                           <td className="px-2 py-1.5 align-top text-left">
                            <div className="flex items-center gap-2">
                              <img 
                                src={`https://placehold.co/64x64/E9D5FF/4C1D95?text=${product.id}`} 
                                alt={`Товар ${product.id}`}
                                className="w-10 h-10 rounded-md object-cover shrink-0"
                              />
                              <div className="text-gray-500 text-xs leading-snug">
                                <div>ID {product.id}</div>
                                <div className="text-[11px] text-gray-400 truncate max-w-[160px]">Товар {product.id}</div>
                              </div>
                            </div>
                          </td>
                          {isFirstProduct && (
                            <>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left text-gray-500 text-xs whitespace-nowrap overflow-hidden">
                                {campaign.newZones}
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left text-gray-800">
                                {isEditing ? (
                                  <div className="relative">
                                    <input
                                      type="text"
                                      defaultValue={formatForDisplay(campaign.replenishmentAmount)}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val !== '') {
                                          const parsed = parseDisplayValue(val);
                                          if (!isNaN(parsed)) {
                                            handleUpdateCampaign(campaign.id, { replenishmentAmount: parsed });
                                          }
                                        }
                                      }}
                                      onBlur={() => {
                                        if ((campaign.replenishmentAmount || 0) < 1000) {
                                          handleUpdateCampaign(campaign.id, { replenishmentAmount: 1000 });
                                        }
                                      }}
                                      className={`${editableInputClass} pr-6 border-gray-300`}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                                  </div>
                                ) : (
                                  <div className="tooltip">
                                    <span className="font-medium">{formatForDisplay(campaign.replenishmentAmount)} ₽</span>
                                    <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                                  </div>
                                )}
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left">
                                <ToggleSwitch 
                                  checked={campaign.newAutoRefill} 
                                  onChange={(checked) => handleUpdateCampaign(campaign.id, { newAutoRefill: checked })} 
                                  disabled={!isEditing}
                                />
                              </td>
                              <td rowSpan={campaign.products.length} className="px-2 py-1.5 align-top text-left text-gray-500">
                                <div className="flex items-center gap-2">
                                  <span>{campaign.newAutoRefill ? (campaign.autoRefillConditions || '-') : '-'}</span>
                                  {campaign.newAutoRefill && (
                                    <button
                                      type="button"
                                      onClick={() => setIsAutoRefillModalOpen(true)}
                                      className="text-gray-400 hover:text-purple-600 transition-colors"
                                    >
                                      <Settings className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                          <td className="px-2 py-1.5 text-left align-top">
                            <div className="tooltip">
                              <button 
                                onClick={() => handleDeleteProduct(campaign.id, product.id)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="tooltip-text">Удалить</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            {activeTab === 'bids' && (() => {
              const campaignIndexMap = new Map<number, number>();
              let campaignCounter = 0;
              filteredCampaigns.forEach(c => {
                if (!campaignIndexMap.has(c.id)) {
                  campaignIndexMap.set(c.id, campaignCounter++);
                }
              });
              const currentPaginatedRows = bidsTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
              let rowIndex = 0;

              return (
                <table className="w-full min-w-[1024px] text-xs text-left table-fixed">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <input 
                          type="checkbox" 
                          checked={allOnPageSelected} 
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }} 
                          onChange={(e) => handleSelectAllOnPage(e.target.checked)} 
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                        />
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>№</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Название кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Товары</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Ставка</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[30%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Преследование ставки</span></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPaginatedRows.map(({ campaign, product, rowKey }: any) => {
                      const isSelected = selectedCampaignIds.includes(campaign.id);
                      const campaignIndex = campaignIndexMap.get(campaign.id) ?? 0;
                      // Check if zones include both Search and Recommendations
                      const zones = campaign.newZones || '';
                      const hasSearchAndRecommendations = zones.includes('Поиск') && (zones.includes('Рекомендации') || zones.includes('Реком'));
                      // Get bids - if zones have both, we need separate bids for search and recommendations
                      // For now, use first cluster for search bid and second for recommendations bid if available
                      const searchBid = product.clusters.length > 0 ? product.clusters[0].newBid : null;
                      const recommendationsBid = hasSearchAndRecommendations && product.clusters.length > 1 ? product.clusters[1].newBid : (hasSearchAndRecommendations ? searchBid : null);
                      const searchOldBid = product.clusters.length > 0 ? product.clusters[0].oldBid : null;
                      const recommendationsOldBid = hasSearchAndRecommendations && product.clusters.length > 1 ? product.clusters[1].oldBid : (hasSearchAndRecommendations ? searchOldBid : null);
                      const isSearchChanged = searchOldBid !== searchBid;
                      const isRecommendationsChanged = hasSearchAndRecommendations && recommendationsOldBid !== recommendationsBid;
                      const hasChangedBid = isSearchChanged || isRecommendationsChanged;
                      const isHighlightedCampaign = fromExcelModal && campaignsWithChangedBids.has(campaign.id);
                      const minBid = 300; // Минимальная ставка
                      rowIndex++;

                      return (
                        <tr key={rowKey} className={`transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 align-top text-left">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleSelectCampaign(campaign.id)} 
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-2 py-1.5 align-top text-left text-gray-500">{rowIndex + (currentPage - 1) * PAGE_SIZE}</td>
                          <td className="px-2 py-1.5 align-top text-left font-medium text-gray-800">
                            {isEditing ? (
                              <textarea 
                                value={campaign.name} 
                                onChange={(e) => handleUpdateCampaign(campaign.id, { name: e.target.value })} 
                                rows={2} 
                                className={`${editableInputClass} resize-y min-h-[34px] border-gray-300`} 
                              />
                            ) : (
                              <div className="tooltip w-full">
                                <textarea value={campaign.name} readOnly rows={2} className="w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed" />
                                <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-1.5 align-top text-left text-gray-500">{campaign.id}</td>
                          <td className="px-2 py-1.5 align-top text-left">
                            <div className="flex items-center gap-2">
                              <img 
                                src={`https://placehold.co/64x64/E9D5FF/4C1D95?text=${product.id}`} 
                                alt={`Товар ${product.id}`}
                                className="w-10 h-10 rounded-md object-cover shrink-0"
                              />
                              <span className="text-gray-500">{product.id}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 align-top text-left">
                            {hasSearchAndRecommendations ? (
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Поиск</div>
                                  <div className="flex items-center gap-1.5">
                                    {isEditing ? (
                                      <BidInput 
                                        value={searchBid || 0} 
                                        onChange={(val) => {
                                          // Update first cluster (search bid)
                                          if (product.clusters.length > 0) {
                                            handleUpdateClusterBid(campaign.id, product.id, product.clusters[0].name, val);
                                          }
                                        }} 
                                      />
                                    ) : (
                                      <span className="font-medium text-gray-600">{formatCurrency(searchBid)}</span>
                                    )}
                                    {isHighlightedCampaign && isSearchChanged && searchOldBid !== null && (
                                      <div className="relative group">
                                        <Info className="w-4 h-4 text-amber-600 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                                          <div className="space-y-1">
                                            <div>Старая ставка (из Excel): <span className="font-semibold">{formatCurrency(searchOldBid)}</span></div>
                                            <div>Новая ставка: <span className="font-semibold">{formatCurrency(searchBid)}</span></div>
                                            <div className="pt-1 border-t border-gray-700">Причина: минимальная ставка {formatCurrency(minBid)}</div>
                                          </div>
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Рекомендации</div>
                                  <div className="flex items-center gap-1.5">
                                    {isEditing ? (
                                      <BidInput 
                                        value={recommendationsBid || 0} 
                                        onChange={(val) => {
                                          // Update second cluster if exists, otherwise update first
                                          if (product.clusters.length > 1) {
                                            handleUpdateClusterBid(campaign.id, product.id, product.clusters[1].name, val);
                                          } else if (product.clusters.length > 0) {
                                            handleUpdateClusterBid(campaign.id, product.id, product.clusters[0].name, val);
                                          }
                                        }} 
                                      />
                                    ) : (
                                      <span className="font-medium text-gray-600">{formatCurrency(recommendationsBid)}</span>
                                    )}
                                    {isHighlightedCampaign && isRecommendationsChanged && recommendationsOldBid !== null && (
                                      <div className="relative group">
                                        <Info className="w-4 h-4 text-amber-600 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                                          <div className="space-y-1">
                                            <div>Старая ставка (из Excel): <span className="font-semibold">{formatCurrency(recommendationsOldBid)}</span></div>
                                            <div>Новая ставка: <span className="font-semibold">{formatCurrency(recommendationsBid)}</span></div>
                                            <div className="pt-1 border-t border-gray-700">Причина: минимальная ставка {formatCurrency(minBid)}</div>
                                          </div>
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {isEditing ? (
                                  <BidInput 
                                    value={searchBid || 0} 
                                    onChange={(val) => handleUpdateProductBid(campaign.id, product.id, val)} 
                                  />
                                ) : (
                                  <span className="font-medium text-gray-600">{formatCurrency(searchBid)}</span>
                                )}
                                {isHighlightedCampaign && isSearchChanged && searchOldBid !== null && (
                                  <div className="relative group">
                                    <Info className="w-4 h-4 text-amber-600 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                                      <div className="space-y-1">
                                        <div>Старая ставка (из Excel): <span className="font-semibold">{formatCurrency(searchOldBid)}</span></div>
                                        <div>Новая ставка: <span className="font-semibold">{formatCurrency(searchBid)}</span></div>
                                        <div className="pt-1 border-t border-gray-700">Причина: минимальная ставка {formatCurrency(minBid)}</div>
                                      </div>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-1.5 align-top text-left">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={handleConfigureBidChasing}
                                className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline self-start"
                              >
                                настроить
                              </button>
                              {campaign.newBidChasing && (
                                <div className="text-xs text-gray-600">
                                  {formatBidChasing(campaign.newBidChasing)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            {activeTab === 'clusters' && (() => {
              const campaignIndexMap = new Map<number, number>();
              let campaignCounter = 0;
              filteredCampaigns.forEach(c => {
                if (!campaignIndexMap.has(c.id)) {
                  campaignIndexMap.set(c.id, campaignCounter++);
                }
              });
              const currentPaginatedRows = clustersTableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
              const campaignClusterCounts = new Map<number, number>();
              filteredCampaigns.forEach(c => {
                campaignClusterCounts.set(c.id, c.products.reduce((sum, p) => sum + p.clusters.length, 0));
              });
              const productClusterCounts = new Map<string, number>();
              filteredCampaigns.forEach(c => {
                c.products.forEach(p => {
                  productClusterCounts.set(`${c.id}-${p.id}`, p.clusters.length);
                });
              });

              return (
                <table className="w-full min-w-[1024px] text-xs text-left table-fixed">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <input 
                          type="checkbox" 
                          checked={allOnPageSelected} 
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }} 
                          onChange={(e) => handleSelectAllOnPage(e.target.checked)} 
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                        />
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[4%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>№</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[18%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Название кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Кампании</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[12%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>ID Товара</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[30%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Кластер</span></div>
                      </th>
                      <th className="table-header-cell px-2 py-1.5 font-normal text-left w-[20%] sticky top-[161px] bg-white z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <div className="tooltip justify-start"><span>Ставка</span></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPaginatedRows.map(({ campaign, product, cluster, rowKey }: any, index: number) => {
                      const isSelected = selectedCampaignIds.includes(campaign.id);
                      const campaignIndex = campaignIndexMap.get(campaign.id) ?? 0;
                      const isFirstClusterOfCampaign = index === 0 || currentPaginatedRows[index - 1]?.campaign?.id !== campaign.id;
                      const isFirstClusterOfProduct = index === 0 || 
                        (currentPaginatedRows[index - 1]?.product?.id !== product.id || 
                        currentPaginatedRows[index - 1]?.campaign?.id !== campaign.id);
                      const totalClustersForCampaign = campaignClusterCounts.get(campaign.id) || 0;
                      const totalClustersForProduct = productClusterCounts.get(`${campaign.id}-${product.id}`) || 0;
                      const isChanged = cluster.oldBid !== cluster.newBid;

                      // Count how many clusters of this campaign are on current page
                      const clustersOnPageForCampaign = currentPaginatedRows.filter((r: any) => r.campaign.id === campaign.id).length;
                      const clustersOnPageForProduct = currentPaginatedRows.filter((r: any) => r.campaign.id === campaign.id && r.product.id === product.id).length;

                      return (
                        <tr key={rowKey} className={`transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 align-top text-left">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleSelectCampaign(campaign.id)} 
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          {isFirstClusterOfCampaign && (
                            <td rowSpan={clustersOnPageForCampaign} className="px-2 py-1.5 align-top text-left text-gray-500">
                              {campaignIndex + 1}
                            </td>
                          )}
                          {isFirstClusterOfCampaign && (
                            <>
                              <td rowSpan={clustersOnPageForCampaign} className="px-2 py-1.5 align-top text-left font-medium text-gray-800">
                                {isEditing ? (
                                  <textarea 
                                    value={campaign.name} 
                                    onChange={(e) => handleUpdateCampaign(campaign.id, { name: e.target.value })} 
                                    rows={2} 
                                    className={`${editableInputClass} resize-y min-h-[34px] border-gray-300`} 
                                  />
                                ) : (
                                  <div className="tooltip w-full">
                                    <textarea value={campaign.name} readOnly rows={2} className="w-full bg-transparent p-0 resize-none outline-none cursor-not-allowed" />
                                    <span className="tooltip-text">Нажмите «Редактировать», чтобы изменить</span>
                                  </div>
                                )}
                              </td>
                              <td rowSpan={clustersOnPageForCampaign} className="px-2 py-1.5 align-top text-left text-gray-500">
                                {campaign.id}
                              </td>
                            </>
                          )}
                          {isFirstClusterOfProduct && (
                            <td rowSpan={clustersOnPageForProduct} className="px-2 py-1.5 align-top text-left">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={`https://placehold.co/64x64/E9D5FF/4C1D95?text=${product.id}`} 
                                  alt={`Товар ${product.id}`}
                                  className="w-10 h-10 rounded-md object-cover shrink-0"
                                />
                                <span className="text-gray-500">{product.id}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-2 py-1.5 align-top text-left text-gray-700">{cluster.name}</td>
                          <td className={`px-2 py-1.5 align-top text-left font-medium ${isChanged ? 'bg-purple-50 text-purple-800' : 'text-gray-800'}`}>
                            {isEditing ? (
                              <BidInput 
                                value={cluster.newBid || 0} 
                                onChange={(val) => handleUpdateClusterBid(campaign.id, product.id, cluster.name, val)} 
                              />
                            ) : (
                              <span>{formatCurrency(cluster.newBid)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
            </div>

          <Pagination 
            total={totalRows} 
            pageSize={PAGE_SIZE} 
            current={currentPage} 
            onChange={setCurrentPage} 
          />
        </div>
      </main>

      {/* Bulk actions island */}
      {flowStep === 'editing' && selectedCampaignIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl z-[80] p-2 flex items-center gap-2 border border-gray-200 animate-in slide-in-from-bottom-4 fade-in">
          <span className="text-sm font-medium text-gray-800 px-3">Выбрано: {selectedCampaignIds.length}</span>
          <div className="h-6 w-px bg-gray-200"></div>
          {activeTab === 'base' && (
            <>
              <button onClick={handleSetBudget} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span>Задать бюджет</span>
              </button>
              <button onClick={handleConfigureAR} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span>Настроить АП</span>
              </button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
                <Trash2 className="w-4 h-4 text-gray-500" />
                <span>Удалить товары</span>
              </button>
            </>
          )}
          {activeTab === 'bids' && (
            <>
              <button onClick={handleSetBid} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
                <Edit2 className="w-4 h-4 text-gray-500" />
                <span>Задать ставку</span>
              </button>
              <button onClick={handleConfigureBidChasing} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span>Настроить преследование ставки</span>
              </button>
            </>
          )}
          {activeTab === 'clusters' && (
            <>
              <button onClick={handleManageClusters} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
                <Edit2 className="w-4 h-4 text-gray-500" />
                <span>Управление кластерами</span>
              </button>
              <button onClick={handleSetBid} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-gray-700">
                <Edit2 className="w-4 h-4 text-gray-500" />
                <span>Задать ставку</span>
              </button>
            </>
          )}
          <button onClick={() => setSelectedCampaignIds([])} className="ml-2 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Footer with apply button */}
      {flowStep === 'editing' && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-gray-200">
          <div className="max-w-[1392px] mx-auto px-6 py-4 flex justify-end items-center">
            <button
              onClick={handleApplyClick}
              className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              Применить изменения
            </button>
          </div>
        </footer>
      )}

      {/* Confirmation overlay */}
      {flowStep === 'confirm' && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Подтверждение изменений</h3>
            <p className="text-sm text-gray-700 mb-4">
              Изменения будут применены к <span className="font-semibold">{fromExcelModal ? 24 : selectedCampaignIds.length}</span> выбранным кампаниям.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              После подтверждения изменения будут поставлены в очередь на применение. Это может занять некоторое время.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFlowStep('editing')}
                className="px-4 py-2 text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Назад
              </button>
              <button
                onClick={() => {
                  // If from Excel modal, always show loading (data from Excel means there are changes)
                  // If from list and no changes, don't show loading
                  if (fromExcelModal || hasChanges) {
                    onStartApplyingEdits();
                  }
                  onNavigateToList();
                }}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
              >
                Внести изменения в кампании
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />

      {/* Undo Toast */}
      <UndoToast 
        product={lastDeleted ? { campaignId: lastDeleted.campaignId, productId: lastDeleted.productId, campaignName: lastDeleted.campaignName, productName: lastDeleted.productName } : null} 
        onUndo={handleUndoDelete} 
      />

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmationModal
        isOpen={isConfirmBulkDeleteOpen}
        onClose={() => setIsConfirmBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Подтвердите удаление"
        confirmText="Удалить"
        confirmColor="red"
        cancelText="Отмена"
      >
        <p>
          Вы уверены, что хотите удалить все товары из выбранных <b>{selectedCampaignIds.length} {getPlural(selectedCampaignIds.length, 'кампании', 'кампаний', 'кампаний')}</b>? 
          Это действие необратимо.
        </p>
      </ConfirmationModal>

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={isBulkActionModalOpen}
        onClose={() => {
          setIsBulkActionModalOpen(false);
          setCurrentBulkAction(null);
        }}
        action={currentBulkAction}
        onSave={applyBulkChanges}
        selectedCampaignsCount={selectedCampaignIds.length}
      />

      {/* Auto Refill Modal */}
      <AutoRefillModal
        isOpen={isAutoRefillModalOpen}
        onClose={() => setIsAutoRefillModalOpen(false)}
        onSave={() => {
          setIsAutoRefillModalOpen(false);
          setToastMessage('Изменения сохранены');
          setShowToast(true);
        }}
        campaign={null}
      />
    </div>
  );
};

// Auto Refill Modal Component
const AutoRefillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  campaign: any;
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

// Bulk Action Modal Component
const BulkActionModal = ({
  isOpen,
  onClose,
  action,
  onSave,
  selectedCampaignsCount = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  action: BulkActionType;
  onSave: (val: any) => void;
  selectedCampaignsCount?: number;
}) => {
  const [value, setValue] = useState<string>('3000');
  const [isAutorefillEnabled, setIsAutorefillEnabled] = useState(true);
  const [useBonuses, setUseBonuses] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(BONUS_PACKAGES[0].id);
  const [bonusValue, setBonusValue] = useState<number | string>(3000);
  const [budgetError, setBudgetError] = useState('');
  const [bonusError, setBonusError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (action === 'budget') {
        setValue('3000');
        setUseBonuses(false);
        setBonusValue(3000);
      } else if (action === 'bid') {
        setValue('300');
      }
      setBudgetError('');
      setBonusError('');
    }
  }, [isOpen, action]);

  const selectedPkg = useMemo(() => BONUS_PACKAGES.find(p => p.id === selectedPkgId) || BONUS_PACKAGES[0], [selectedPkgId]);
  const currentBudget = parseDisplayValue(value);
  const numericBonusValue = parseDisplayValue(String(bonusValue));

  useEffect(() => {
    setBudgetError('');
    setBonusError('');

    if (action === 'budget' && currentBudget < 1000 && value !== '') {
      setBudgetError('Минимальный бюджет 1000 ₽');
    }

    if (action === 'budget' && useBonuses) {
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
  }, [value, useBonuses, bonusValue, numericBonusValue, selectedPkg, action, currentBudget]);

  if (!isOpen || !action) return null;

  const getTitle = () => {
    switch (action) {
      case 'budget':
        if (selectedCampaignsCount === 1) return `Задать бюджет для 1 кампании`;
        if (selectedCampaignsCount > 1) return `Задать бюджет для ${selectedCampaignsCount} ${getPlural(selectedCampaignsCount, 'кампании', 'кампаний', 'кампаний')}`;
        return 'Задать бюджет';
      case 'bid': return 'Задать ставки';
      default: return '';
    }
  };

  const handleSave = () => {
    if (action === 'budget') {
      onSave({
        total: currentBudget,
        bonus: useBonuses ? numericBonusValue : 0,
        isBonusActive: useBonuses,
        selectedPkg: selectedPkg,
      });
    } else if (action === 'bid') {
      onSave(parseDisplayValue(value));
    }
  };

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Новый бюджет для 1 кампании</label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 pr-8 ${budgetError ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="3000"
                    value={formatForDisplay(value)}
                    onChange={handleBudgetChange}
                    onBlur={handleBudgetBlur}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">₽</span>
                </div>
                {budgetError && <p className="text-red-500 text-xs mt-1.5">{budgetError}</p>}
                {!budgetError && <p className="text-xs text-gray-500 mt-2">Применится ко всем выбранным кампаниям.</p>}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Новая ставка (₽)</label>
              <div className="w-1/2">
                <BidInput value={parseDisplayValue(value)} onChange={(val) => setValue(String(val))} presets={[150, 300, 500]} />
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
  );
};
