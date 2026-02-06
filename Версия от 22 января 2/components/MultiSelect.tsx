import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, CheckCircle } from './Icons';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoApply?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Выберите категории',
  className,
  disabled = false,
  autoApply = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selected]);
    }
  }, [isOpen, selected]);


  // Handle click outside to close
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

  const toggleOption = (option: string) => {
    const newSelection = tempSelected.includes(option)
      ? tempSelected.filter(item => item !== option)
      : [...tempSelected, option];
    setTempSelected(newSelection);
    if (autoApply) {
      onChange(newSelection);
    }
  };
  
  const handleApply = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempSelected([]);
  };

  // Logic for displaying selected values
  const displayValue = useMemo(() => {
    if (selected.length === 0) return null;
    
    if (selected.length > 2) {
      const firstTwo = selected.slice(0, 2).join(', ');
      const remaining = selected.length - 2;
      return `${firstTwo}, +${remaining}`;
    }
    
    return selected.join(', ');
  }, [selected]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Field */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full min-h-[46px] px-3 py-2.5 border rounded-lg text-sm flex items-center justify-between transition-all
          ${disabled 
            ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
            : `bg-white cursor-pointer ${isOpen ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-200 hover:border-gray-300'}`
          }
        `}
      >
        <span className={disabled ? 'text-gray-500' : `${displayValue ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Options List */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = tempSelected.includes(option);
                return (
                  <div 
                    key={option} 
                    onClick={() => toggleOption(option)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 rounded-lg cursor-pointer group transition-colors"
                  >
                    {/* Checkbox */}
                    <div className={`
                      w-5 h-5 rounded border flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'bg-purple-600 border-purple-600' 
                        : 'bg-white border-gray-300 group-hover:border-purple-400'
                      }
                    `}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    
                    {/* Text */}
                    <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                      {option}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-400">
                Ничего не найдено
              </div>
            )}
          </div>

          {!autoApply && (
            <div className="bg-gray-50 border-t border-gray-100 p-2 flex items-center justify-between gap-2">
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
                 Применить
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};