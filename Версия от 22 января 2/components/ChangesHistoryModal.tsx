import React from 'react';
import { X, Download } from './Icons';

interface ChangeHistoryItem {
    id: number;
    dateTime: string;
    description: string;
    fileName: string;
}

const MOCK_HISTORY: ChangeHistoryItem[] = [
    { id: 1, dateTime: '14.07.2024 14:35', description: 'Изменены ставки и бюджеты для 19 кампаний.', fileName: 'changes_140724_1435.xlsx' },
    { id: 2, dateTime: '13.07.2024 11:02', description: 'Отключено автопополнение для 5 кампаний. Изменены зоны показа для 2 кампаний.', fileName: 'changes_130724_1102.xlsx' },
    { id: 3, dateTime: '11.07.2024 18:15', description: 'Массовое пополнение бюджета для 24 кампаний.', fileName: 'changes_110724_1815.xlsx' },
    { id: 4, dateTime: '10.07.2024 09:50', description: 'Изменены стратегии преследования ставки для 8 кампаний.', fileName: 'changes_100724_0950.xlsx' },
];


export const ChangesHistoryModal = ({ isOpen, onClose, showToast, setToastMessage }: { isOpen: boolean, onClose: () => void, showToast: (show: boolean) => void, setToastMessage: (message: string) => void }) => {
    
    const handleDownload = (fileName: string) => {
        setToastMessage(`Файл "${fileName}" скачивается...`);
        showToast(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">История изменений</h2>
                        <p className="text-sm text-gray-500 mt-1">Здесь отображаются все массовые изменения, сделанные через загрузку Excel-файлов.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="flex-grow overflow-hidden p-6">
                    <div className="overflow-auto border border-gray-200 rounded-lg h-full custom-scrollbar">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50/70 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-48">Дата и время</th>
                                    <th scope="col" className="p-3 font-semibold text-left text-gray-600">Описание</th>
                                    <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-64">Действие</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {MOCK_HISTORY.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.dateTime}</td>
                                        <td className="px-4 py-3 text-gray-800">{item.description}</td>
                                        <td className="px-4 py-3">
                                            <button 
                                                onClick={() => handleDownload(item.fileName)}
                                                className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>Скачать файл с изменениями</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="flex justify-end items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-200 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Закрыть</button>
                </div>
            </div>
        </div>
    );
};