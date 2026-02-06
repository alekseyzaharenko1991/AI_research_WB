import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, CheckCircle } from './Icons';
import { CampaignRecord } from '../types';

type SelectableProduct = Pick<CampaignRecord, 'nmId' | 'productName' | 'imageUrl' | 'category' | 'cpcCompatible'>;

const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

interface ProductMultiSelectProps {
  options: SelectableProduct[];
  selected: SelectableProduct[];
  onChange: (selected: SelectableProduct[]) => void;
  isCpcMode: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  submitLabel?: string;
}

export const ProductMultiSelect: React.FC<ProductMultiSelectProps> = ({
  options,
  selected,
  onChange,
  isCpcMode,
  disabled = false,
  placeholder = 'Выберите товары',
  className,
  submitLabel = 'Применить'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [tempSelected, setTempSelected] = useState<SelectableProduct[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selected]);
      setSearchTerm('');
    }
  }, [isOpen, selected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOption = (product: SelectableProduct) => {
    setTempSelected(prev => 
      prev.some(p => p.nmId === product.nmId)
        ? prev.filter(p => p.nmId !== product.nmId)
        : [...prev, product]
    );
  };

  const handleApply = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempSelected([]);
  };

  const filteredOptions = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return options;

      // Check for comma-separated IDs
      if (term.includes(',')) {
        const ids = term.split(',').map(s => s.trim()).filter(s => s);
        if (ids.length > 0) {
           return options.filter(opt => ids.includes(String(opt.nmId)));
        }
      }

      // Default search: Name or ID
      return options.filter(opt => 
          opt.productName.toLowerCase().includes(term) ||
          opt.nmId.toString().includes(term)
      );
  }, [options, searchTerm]);

  const displayValue = useMemo(() => {
    if (selected.length === 0) return null;
    
    if (selected.length > 2) {
      const first = selected[0].productName;
      const remaining = selected.length - 1;
      return `${first}, +${remaining}`;
    }
    
    return selected.map(p => p.productName).join(', ');
  }, [selected]);
  
  const selectableFilteredOptions = useMemo(() => {
      return filteredOptions.filter(p => !(isCpcMode && !p.cpcCompatible));
  }, [filteredOptions, isCpcMode]);

  const areAllFilteredSelected = useMemo(() => {
      if (selectableFilteredOptions.length === 0) return false;
      return selectableFilteredOptions.every(p => tempSelected.some(sp => sp.nmId === p.nmId));
  }, [selectableFilteredOptions, tempSelected]);

  const handleSelectAll = () => {
      if (areAllFilteredSelected) {
          setTempSelected(prev => prev.filter(p => !selectableFilteredOptions.some(fo => fo.nmId === p.nmId)));
      } else {
          const newSelections = selectableFilteredOptions.filter(fo => !tempSelected.some(ts => ts.nmId === fo.nmId));
          setTempSelected(prev => [...prev, ...newSelections]);
      }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full min-h-[46px] px-3 py-2.5 bg-white border rounded-lg text-sm flex items-center justify-between transition-all
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        <span className={`${displayValue ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {/* FIX: Updated placeholder text for disabled state to be more informative. */}
          {disabled ? 'Сначала выберите категорию' : displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию или ID (через запятую)" 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
              />
            </div>
            <div 
              onClick={handleSelectAll}
              className="flex items-center gap-3 px-2 py-2 mt-2 hover:bg-purple-50 rounded-lg cursor-pointer group transition-colors"
            >
              <div className={`
                  w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                  ${areAllFilteredSelected
                      ? 'bg-purple-600 border-purple-600' 
                      : 'bg-white border-gray-300 group-hover:border-purple-400'
                  }
              `}>
                  {areAllFilteredSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Выбрать все</span>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((p) => {
                const isSelected = tempSelected.some(sp => sp.nmId === p.nmId);
                const isIncompatible = isCpcMode && !p.cpcCompatible;
                
                return (
                  <div 
                    key={p.nmId} 
                    onClick={() => !isIncompatible && toggleOption(p)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isIncompatible ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-purple-50 cursor-pointer group'}`}
                  >
                    <div className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                        ${isSelected && !isIncompatible 
                            ? 'bg-purple-600 border-purple-600' 
                            : 'bg-white border-gray-300 group-hover:border-purple-400'
                        }
                    `}>
                        {isSelected && !isIncompatible && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    
                    <div className="relative group/image">
                      <img src={p.imageUrl} alt={p.productName} className="w-8 h-8 rounded-md shrink-0 object-cover" />
                      <div className="hidden group-hover/image:block absolute left-full top-0 ml-2 z-[120] w-20 aspect-[3/4] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden pointer-events-none">
                        <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div>
                        <p className={`text-sm ${isSelected && !isIncompatible ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{p.productName}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">ID {p.nmId}</p>
                            {isIncompatible && <span className="text-xs text-red-600 font-medium">не продвигается по СPC</span>}
                        </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-400">
                Товары не найдены
              </div>
            )}
          </div>

          <div className="bg-[#fafafa] border-t border-gray-100 p-3 flex items-center justify-between gap-3 mt-1">
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Сбросить
            </button>
            <button 
              onClick={handleApply}
              className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all"
            >
               {tempSelected.length > 0 
                ? `Добавить ${tempSelected.length} ${getPlural(tempSelected.length, 'товар', 'товара', 'товаров')}`
                : submitLabel
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
};