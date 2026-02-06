import React, { useState, useEffect } from 'react';
import { Package, ClipboardCheck, Rocket, CheckCircle, Loader } from './Icons';

type StepStatus = 'pending' | 'in-progress' | 'completed';

interface TimelineStep {
  name: string;
  description: string;
  icon: React.ElementType;
}

const steps: TimelineStep[] = [
  { name: 'Подготовка данных', description: 'Собираем и форматируем ваши товары', icon: Package },
  { name: 'Проверка кампаний', description: 'Проверяем ставки и бюджеты', icon: ClipboardCheck },
  { name: 'Запуск в сети', description: 'Отправляем кампании в рекламную сеть', icon: Rocket },
  { name: 'Завершение', description: 'Все кампании успешно созданы', icon: CheckCircle },
];

const getPlural = (number: number, one: string, two: string, five: string) => { let n = Math.abs(number); n %= 100; if (n >= 5 && n <= 20) { return five; } n %= 10; if (n === 1) { return one; } if (n >= 2 && n <= 4) { return two; } return five; };

const Step: React.FC<{ step: TimelineStep; status: StepStatus; isLast: boolean }> = ({ step, status, isLast }) => {
  const Icon = step.icon;
  const getIcon = () => {
    switch (status) {
      case 'in-progress':
        return <Loader className="w-6 h-6 text-purple-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-white" />;
      default:
        return <Icon className="w-6 h-6 text-gray-400" />;
    }
  };

  const iconBgClass = status === 'completed' ? 'bg-purple-600' : 'bg-gray-100';
  const textClass = status !== 'pending' ? 'text-gray-900' : 'text-gray-400';
  const lineClass = status === 'completed' ? 'bg-purple-600' : 'bg-gray-200';

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${iconBgClass}`}>
          {getIcon()}
        </div>
        {!isLast && <div className={`w-0.5 h-12 mt-2 transition-colors duration-300 ${lineClass}`}></div>}
      </div>
      <div className={`pt-2 transition-colors duration-300 ${textClass}`}>
        <h3 className="font-bold text-lg">{step.name}</h3>
        <p className="text-sm">{step.description}</p>
      </div>
    </div>
  );
};

export const LaunchTimeline: React.FC<{ total: number }> = ({ total }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const totalDuration = 9500; // Match old loader timing
    const stepDuration = totalDuration / (steps.length - 1);

    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, stepDuration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);
  
  return (
    <div className="bg-white rounded-xl p-8 mb-6 shadow-sm border border-gray-100 animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Запускаем {total} {getPlural(total, 'кампанию', 'кампании', 'кампаний')}...</h2>
        <p className="text-gray-500 mb-8">Процесс не прервётся, даже если вы уйдёте со страницы.</p>
        <div className="flex flex-col items-center">
            <div className="w-full max-w-sm">
            {steps.map((step, index) => {
                let status: StepStatus = 'pending';
                if (index < currentStep) status = 'completed';
                if (index === currentStep) status = 'in-progress';
                
                return <Step key={step.name} step={step} status={status} isLast={index === steps.length - 1} />;
            })}
            </div>
        </div>
    </div>
  );
};
