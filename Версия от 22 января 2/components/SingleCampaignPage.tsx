import React, { useState, useEffect } from 'react';
import { Wallet, HelpCircle, X, ChevronDown, Plus, Bell } from './Icons';
import { ProductMultiSelect } from './ProductMultiSelect';

const UNIFIED_BALANCE = 105350;

// Mock products for selection
const MOCK_PRODUCTS = [
  { nmId: 160747184, productName: 'Футболка хлопок мягкая приятная', imageUrl: 'https://via.placeholder.com/80', category: 'Одежда', cpcCompatible: true },
  { nmId: 160747185, productName: 'Джинсы классические', imageUrl: 'https://via.placeholder.com/80', category: 'Одежда', cpcCompatible: true },
  { nmId: 160747186, productName: 'Кроссовки спортивные', imageUrl: 'https://via.placeholder.com/80', category: 'Обувь', cpcCompatible: true },
  { nmId: 160747187, productName: 'Рюкзак городской', imageUrl: 'https://via.placeholder.com/80', category: 'Аксессуары', cpcCompatible: false },
  { nmId: 160747188, productName: 'Куртка зимняя', imageUrl: 'https://via.placeholder.com/80', category: 'Одежда', cpcCompatible: true },
];

interface SingleCampaignPageProps {
  onBack: () => void;
}

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
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToList(); }} className="text-purple-600 hover:text-purple-700 py-3 border-b-2 border-purple-600">Кампании</a>
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

export const SingleCampaignPage: React.FC<SingleCampaignPageProps> = ({ onBack }) => {
  const [campaignName, setCampaignName] = useState('Кампания от 26.12.2024');
  const [paymentModel, setPaymentModel] = useState<'CPM' | 'CPC'>('CPM');
  const [budget, setBudget] = useState('3000');
  const [isAutoRefillEnabled, setIsAutoRefillEnabled] = useState(false);
  const [bidType, setBidType] = useState<'unified' | 'manual'>('unified');
  const [unifiedBid, setUnifiedBid] = useState('500');
  const [manualBid, setManualBid] = useState('500');
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('2000');
  const [isDailyLimitTooltipVisible, setIsDailyLimitTooltipVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [products, setProducts] = useState<Array<{ nmId: number; productName: string; imageUrl: string; category: string; cpcCompatible?: boolean }>>([]);
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);

  const formatForDisplay = (num: string | number): string => {
    if (typeof num === 'string') {
      const parsed = Number(num.replace(/\s/g, '').replace(/,/g, '.'));
      if (isNaN(parsed)) return num;
      return parsed.toLocaleString('ru-RU', { useGrouping: true });
    }
    return num.toLocaleString('ru-RU', { useGrouping: true });
  };

  const parseDisplayValue = (str: string): number => {
    return Number(String(str).replace(/\s/g, '').replace(/,/g, '.'));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDisplayValue(e.target.value);
    if (!isNaN(parsed)) {
      setBudget(String(parsed));
    } else if (e.target.value === '') {
      setBudget('');
    }
  };

  const handleBudgetBlur = () => {
    const parsed = parseDisplayValue(budget);
    if (isNaN(parsed) || parsed < 1000) {
      setBudget('1000');
      setToastMessage('Минимальный бюджет 1000 ₽');
      setShowToast(true);
    }
  };

  const handleBidChange = (value: string, type: 'unified' | 'manual') => {
    const parsed = parseDisplayValue(value);
    if (!isNaN(parsed)) {
      if (type === 'unified') {
        setUnifiedBid(String(parsed));
      } else {
        setManualBid(String(parsed));
      }
    } else if (value === '') {
      if (type === 'unified') {
        setUnifiedBid('');
      } else {
        setManualBid('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FA] font-sans text-gray-900" style={{ background: '#F7F7FA' }}>
      <Header onNavigateToList={onBack} />
      
      <main className={`flex flex-col items-center px-6 py-8 gap-6 ${products.length > 0 ? 'pb-24' : ''}`}>
        {/* Управление кампанией */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-6">
            {/* Заголовок */}
            <div className="flex justify-between items-start gap-4">
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:outline-none text-left flex-1 min-w-0"
                style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 680, fontSize: '28px', lineHeight: '36px' }}
              />
              <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm flex-shrink-0">
                <span>Информация</span>
              </button>
            </div>

            {/* Модель оплаты */}
            <div className="flex items-start gap-6">
              <div
                onClick={() => setPaymentModel('CPM')}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentModel === 'CPM'
                    ? 'bg-[#F0F0F3] border-[#F0F0F3]'
                    : 'bg-white border-[#F0F0F3] hover:border-purple-300'
                }`}
                style={{ width: '240px', height: '65px' }}
              >
                <div className="flex items-center justify-center w-6 h-6 mt-0.5">
                  {paymentModel === 'CPM' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-normal text-gray-900" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                    CPM
                  </span>
                  <span className="text-xs text-[#77767E]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontSize: '13px', lineHeight: '120%' }}>
                    Оплата за показы
                  </span>
                </div>
              </div>

              <div
                onClick={() => setPaymentModel('CPC')}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentModel === 'CPC'
                    ? 'bg-[#F0F0F3] border-[#F0F0F3]'
                    : 'bg-white border-[#F0F0F3] hover:border-purple-300'
                }`}
                style={{ width: '240px', height: '65px' }}
              >
                <div className="flex items-center justify-center w-6 h-6 mt-0.5">
                  {paymentModel === 'CPC' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-normal text-[#4A4A59]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                    CPC
                  </span>
                  <span className="text-xs text-[#77767E]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontSize: '13px', lineHeight: '120%' }}>
                    Оплата за клики
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Плавающий остров — бюджет */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 680, fontSize: '22px', lineHeight: '28px' }}>
              Бюджет
            </h2>
            
            {paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget) && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-900 font-medium">
                  Чтобы задать дневной лимит {formatForDisplay(dailyLimitValue)} ₽, пополните бюджет еще на {formatForDisplay(parseDisplayValue(dailyLimitValue) - parseDisplayValue(budget))} ₽
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap items-start gap-6">
              {/* Бюджет кампании */}
              <div className="flex flex-col gap-2" style={{ width: '240px' }}>
                <label className="text-base text-[#4E4E53]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                  Бюджет кампании
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatForDisplay(budget)}
                    onChange={handleBudgetChange}
                    onBlur={handleBudgetBlur}
                    className="w-full px-3 py-3 bg-white border border-[#E3E4EA] rounded-lg outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}
                  />
                </div>
                <p className="text-xs text-[#767386] font-semibold" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 560, fontSize: '13px', lineHeight: '16px' }}>
                  Минимальный бюджет 1000 ₽
                </p>
              </div>

              {/* Автопополнение */}
              <div className="flex flex-col gap-1 pt-6" style={{ minWidth: '300px', flex: 1 }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAutoRefillEnabled(!isAutoRefillEnabled)}
                    className={`relative inline-flex items-center rounded-full transition-colors duration-200 ${
                      isAutoRefillEnabled ? 'bg-[#9A41FE]' : 'bg-[#767386]'
                    }`}
                    style={{ width: '30px', height: '18px' }}
                  >
                    <span
                      className={`inline-block rounded-full bg-white transition-transform duration-200 ${
                        isAutoRefillEnabled ? 'translate-x-[14px]' : 'translate-x-[3px]'
                      }`}
                      style={{ width: '12px', height: '12px' }}
                    />
                  </button>
                  <span className="text-base text-[#5067DE]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                    Автопополнение бюджета
                  </span>
                  <div className="relative">
                    <HelpCircle className="w-4 h-4 text-[#4E4E53] cursor-help" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Дневной лимит - только для CPC */}
        {paymentModel === 'CPC' && (
          <div className="bg-white rounded-2xl p-5 w-full max-w-[1200px] shadow-sm border border-gray-100 mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ToggleSwitch 
                  checked={isDailyLimitEnabled} 
                  onChange={(checked) => {
                    setIsDailyLimitEnabled(checked);
                  }} 
                />
                <p className="text-sm text-gray-800 flex items-center gap-1" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
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
                      setDailyLimitValue(String(current + 1000));
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    +1000₽
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseDisplayValue(dailyLimitValue) || 0;
                      setDailyLimitValue(String(current + 3000));
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    +3000₽
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseDisplayValue(dailyLimitValue) || 0;
                      setDailyLimitValue(String(current + 5000));
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

        {/* Зоны показов */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 680, fontSize: '22px', lineHeight: '28px' }}>
                Ставки по товарам
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* Единая ставка */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBidType('unified')}
                  className="flex items-center justify-center w-6 h-6 flex-shrink-0"
                >
                  {bidType === 'unified' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </button>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <span className="text-base text-gray-900" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                    Единая ставка: продвижение сразу в поиске и рекомендациях,
                  </span>
                  {bidType === 'unified' ? (
                    <>
                      <input
                        type="text"
                        value={formatForDisplay(unifiedBid)}
                        onChange={(e) => handleBidChange(e.target.value, 'unified')}
                        className="text-base text-gray-900 bg-transparent border-none outline-none focus:outline-none w-20"
                        style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}
                      />
                      <span className="text-base text-gray-900">₽</span>
                    </>
                  ) : (
                    <span className="text-base text-gray-900">{formatForDisplay(unifiedBid)} ₽</span>
                  )}
                </div>
              </div>

              {/* Ручное управление */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBidType('manual')}
                  className="flex items-center justify-center w-6 h-6 flex-shrink-0"
                >
                  {bidType === 'manual' ? (
                    <div className="w-[18px] h-[18px] bg-[#9A41FE] rounded-full"></div>
                  ) : (
                    <div className="w-[18px] h-[18px] bg-white border-2 border-[#BBB7C9] rounded-full"></div>
                  )}
                </button>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <span className="text-base text-[#4A4A59]" style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}>
                    Ручная ставка: выбирайте зоны показов и ставку для них,
                  </span>
                  {bidType === 'manual' ? (
                    <>
                      <input
                        type="text"
                        value={formatForDisplay(manualBid)}
                        onChange={(e) => handleBidChange(e.target.value, 'manual')}
                        className="text-base text-[#4E4E53] bg-transparent border-none outline-none focus:outline-none w-20"
                        style={{ fontFamily: "'ALS Hauss VF', sans-serif", fontStyle: 'normal', fontWeight: 440, fontSize: '16px', lineHeight: '20px' }}
                      />
                      <span className="text-base text-[#4E4E53]">₽</span>
                    </>
                  ) : (
                    <span className="text-base text-[#4E4E53]">{formatForDisplay(manualBid)} ₽</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Товары */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ставки по товарам</h2>
            <div className="flex flex-wrap items-center gap-3">
              {products.length === 0 && (
                <button 
                  onClick={() => setIsAddProductsModalOpen(true)}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Добавить товар
                </button>
              )}
              {products.length > 0 && (
                <input
                  type="text"
                  placeholder="Поиск по товарам"
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              )}
            </div>
          </div>
          {products.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="p-3 text-left">Товар</th>
                    {paymentModel === 'CPC' && (
                      <th className="p-3 text-left">В поиске (CPC)</th>
                    )}
                    {paymentModel === 'CPM' && bidType === 'manual' && (
                      <>
                        <th className="p-3 text-left">В поиске (CPM)</th>
                        <th className="p-3 text-left">В рекомендациях (CPM)</th>
                      </>
                    )}
                    {paymentModel === 'CPM' && bidType === 'unified' && (
                      <th className="p-3 text-left">Единая ставка (CPM)</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.nmId}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt={product.productName} className="w-10 h-10 rounded-md object-cover" />
                          <div>
                            <p className="font-medium text-gray-800">Товар {product.nmId}</p>
                            <p className="text-xs text-gray-500">{product.productName}</p>
                          </div>
                        </div>
                      </td>
                      {paymentModel === 'CPC' && (
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={formatForDisplay(unifiedBid)}
                              onChange={(e) => handleBidChange(e.target.value, 'unified')}
                              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            />
                            <span className="text-gray-500">₽</span>
                          </div>
                        </td>
                      )}
                      {paymentModel === 'CPM' && bidType === 'manual' && (
                        <>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={formatForDisplay(manualBid)}
                                onChange={(e) => handleBidChange(e.target.value, 'manual')}
                                className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              />
                              <span className="text-gray-500">₽</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={formatForDisplay(manualBid)}
                                onChange={(e) => handleBidChange(e.target.value, 'manual')}
                                className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              />
                              <span className="text-gray-500">₽</span>
                            </div>
                          </td>
                        </>
                      )}
                      {paymentModel === 'CPM' && bidType === 'unified' && (
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={formatForDisplay(unifiedBid)}
                              onChange={(e) => handleBidChange(e.target.value, 'unified')}
                              className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            />
                            <span className="text-gray-500">₽</span>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />

      {/* Modal for adding products */}
      {isAddProductsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setIsAddProductsModalOpen(false)}>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Добавить товар</h3>
              <button onClick={() => setIsAddProductsModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="mb-6 flex-1 min-h-[500px]">
              <ProductMultiSelect
                options={MOCK_PRODUCTS}
                selected={products}
                onChange={(selected) => {
                  // Ограничиваем выбор только одним товаром - берем последний выбранный
                  const singleProduct = selected.length > 0 ? [selected[selected.length - 1]] : [];
                  setProducts(singleProduct);
                  setIsAddProductsModalOpen(false);
                  setToastMessage('Товар добавлен');
                  setShowToast(true);
                }}
                isCpcMode={paymentModel === 'CPC'}
                submitLabel="Добавить товар"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setIsAddProductsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed footer with launch button */}
      {products.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
          <div className="max-w-[1200px] mx-auto flex justify-end">
            <button
              disabled={paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget)}
              className={`px-6 py-3 text-base font-bold rounded-lg transition-colors ${
                paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              onClick={() => {
                // Проверяем условия: нет ошибок в бюджете
                const hasBudgetError = paymentModel === 'CPC' && isDailyLimitEnabled && parseDisplayValue(dailyLimitValue) > parseDisplayValue(budget);
                
                if (!hasBudgetError) {
                  // Переходим на главную страницу
                  onBack();
                }
              }}
            >
              Запустить кампанию
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
