import React, { useState } from 'react';
import { X } from './Icons';

// --- NEW DATA STRUCTURE ---

export interface Cluster {
  name: string;
  oldBid: number | null;
  newBid: number | null;
}

export interface Product {
  id: number;
  clusters: Cluster[];
}

export interface CampaignChange {
  id: number;
  name: string;
  products: Product[];
  replenishmentAmount: number | null;
  
  // Status
  oldIsActive: boolean;
  newIsActive: boolean;

  // Auto-refill
  oldAutoRefill: boolean;
  newAutoRefill: boolean;
  autoRefillConditions: string | null;

  // Bid Chasing
  oldBidChasing: { strategy: 'лидерская' | 'конкурентная'; maxBid: number; } | null;
  newBidChasing: { strategy: 'лидерская' | 'конкурентная'; maxBid: number; } | null;

  oldZones: string;
  newZones: string;
}

// --- MOCK DATA GENERATION ---

const CLUSTER_NAMES = [
  "женская одежда", "платья", "летнее платье", "купить платье", "сарафан",
  "платье на выпускной", "вечернее платье", "одежда для женщин", "модное платье", "длинное платье"
];

export const MOCK_CHANGES: CampaignChange[] = [];

for (let i = 0; i < 15; i++) { // Generate 15 campaigns
    const campaignId = 1304655 + i;
    const numProducts = (i % 3) + 1; // 1 to 3 products
    const products: Product[] = [];

    for (let j = 0; j < numProducts; j++) {
        const productId = 87654321 + i * 10 + j;
        const numClusters = (i + j) % 5 + 2; // 2 to 6 clusters
        const clusters: Cluster[] = [];
        
        const usedClusterNames = new Set<string>();

        for (let k = 0; k < numClusters; k++) {
            let clusterName: string;
            do {
                clusterName = CLUSTER_NAMES[Math.floor(Math.random() * CLUSTER_NAMES.length)];
            } while (usedClusterNames.has(clusterName));
            usedClusterNames.add(clusterName);

            // For first 5 campaigns (i < 5), set oldBid below minimum (300) to show minimum bid change
            const oldBid = i < 5 ? (100 + Math.floor(Math.random() * 40) * 5) : (100 + (Math.floor(Math.random() * 20)) * 5);
            // For first 5 campaigns (i < 5), always change bids to ensure highlighting works
            const shouldChange = i < 5 ? true : Math.random() > 0.7;
            // For first 5 campaigns, ensure newBid is at least 300 (minimum bid)
            const newBidValue = shouldChange 
              ? (i < 5 ? Math.max(300, oldBid + 50) : oldBid + (Math.floor(Math.random() * 10) - 4) * 5)
              : oldBid;
            clusters.push({
                name: clusterName,
                oldBid: oldBid,
                newBid: newBidValue,
            });
        }

        products.push({ id: productId, clusters });
    }

    const changeType = i % 7;
    let campaignChange: Partial<CampaignChange> = {};

    switch (changeType) {
        case 2:
            campaignChange.oldAutoRefill = true;
            campaignChange.newAutoRefill = false;
            break;
        case 3:
            campaignChange.oldZones = 'Поиск';
            campaignChange.newZones = 'Поиск, Рекомендации';
            break;
        case 4:
            campaignChange.oldIsActive = true;
            campaignChange.newIsActive = false;
            break;
        case 5:
            campaignChange.oldBidChasing = null;
            campaignChange.newBidChasing = { strategy: 'лидерская', maxBid: 550 };
            break;
        case 6:
            campaignChange.oldBidChasing = { strategy: 'лидерская', maxBid: 550 };
            campaignChange.newBidChasing = { strategy: 'конкурентная', maxBid: 600 };
            break;
    }

    const newAutoRefill = campaignChange.newAutoRefill ?? true;
    const replenishmentAmount = Math.floor(Math.random() * 4001) + 1000;

    MOCK_CHANGES.push({
        id: campaignId,
        name: `Кампания #${campaignId}`,
        products,
        replenishmentAmount: replenishmentAmount,
        oldIsActive: true,
        newIsActive: true,
        oldAutoRefill: true,
        newAutoRefill: newAutoRefill,
        autoRefillConditions: newAutoRefill ? "Если бюджет < 1000 ₽, пополнять на 3000 ₽" : null,
        oldBidChasing: { strategy: 'лидерская', maxBid: 500 },
        newBidChasing: { strategy: 'лидерская', maxBid: 500 },
        oldZones: 'Единая',
        newZones: 'Единая',
        ...campaignChange,
    });
}


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
const StatusIndicator = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-center gap-2">
    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
    <span>{isActive ? 'Активна' : 'Не активна'}</span>
  </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            isActive
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {children}
    </button>
);


const BaseSettingsTable = ({ data }: { data: CampaignChange[] }) => {
  return (
    <table className="min-w-full text-sm">
        <thead className="bg-gray-50/70 sticky top-0 z-10">
            <tr>
                <th scope="col" className="p-3 font-semibold text-center text-gray-600 w-12 border-r">№</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-48 border-r">Название</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-32 border-r">ID Кампании</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-32 border-r">ID Товара</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-48 border-r">Статус</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-40 border-r">Сумма пополнения бюджета</th>
                <th scope="col" className="p-3 font-semibold text-center text-gray-600 w-40 border-r">Статус АП</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-64 border-r">Условия АП</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-64">Зоны показа</th>
            </tr>
        </thead>
        <tbody className="bg-white">
            {data.flatMap((campaign, campaignIndex) => {
                const totalRowsForCampaign = campaign.products.length;
                const isStatusChanged = campaign.oldIsActive !== campaign.newIsActive;
                const isZonesChanged = campaign.oldZones !== campaign.newZones;
                const isAutoRefillChanged = campaign.oldAutoRefill !== campaign.newAutoRefill;

                return campaign.products.map((product, productIndex) => (
                    <tr key={`${campaign.id}-${product.id}`} className="border-b border-gray-200 last:border-b-0">
                        {productIndex === 0 && (
                            <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top text-center text-gray-500 border-r">{campaignIndex + 1}</td>
                        )}
                        {productIndex === 0 && (
                            <>
                                <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top font-medium text-gray-800 border-r">{campaign.name}</td>
                                <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top text-gray-500 border-r">{campaign.id}</td>
                            </>
                        )}
                        <td className="px-3 py-2 align-top text-gray-500 border-r">{product.id}</td>
                        {productIndex === 0 && (
                            <>
                                <td rowSpan={totalRowsForCampaign} className={`px-3 py-2 align-top border-r ${isStatusChanged ? 'bg-purple-50' : ''}`}>
                                    <StatusIndicator isActive={campaign.newIsActive} />
                                </td>
                                <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top text-gray-600 border-r">
                                    {formatCurrency(campaign.replenishmentAmount)}
                                </td>
                                <td rowSpan={totalRowsForCampaign} className={`px-3 py-2 align-top text-center border-r ${isAutoRefillChanged ? 'bg-purple-50 font-medium text-purple-800' : ''}`}>
                                    {formatBool(campaign.newAutoRefill)}
                                </td>
                                <td rowSpan={totalRowsForCampaign} className="px-3 py-2 align-top text-gray-500 border-r">{campaign.autoRefillConditions || '-'}</td>
                                <td rowSpan={totalRowsForCampaign} className={`px-3 py-2 align-top ${isZonesChanged ? 'bg-purple-50 font-medium text-purple-800' : ''}`}>
                                    {campaign.newZones}
                                </td>
                            </>
                        )}
                    </tr>
                ))
            })}
        </tbody>
    </table>
  )
}

const BidsTable = ({ data }: { data: CampaignChange[] }) => {
  return (
    <table className="min-w-full text-sm">
        <thead className="bg-gray-50/70 sticky top-0 z-10">
            <tr>
                <th scope="col" className="p-3 font-semibold text-center text-gray-600 w-12 border-r">№</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-48 border-r">Название</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-32 border-r">ID Кампании</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-[450px] border-r">Ставки</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-64">Преследование ставки</th>
            </tr>
        </thead>
        <tbody className="bg-white">
            {data.map((campaign, campaignIndex) => {
                const isBidChasingChanged = JSON.stringify(campaign.oldBidChasing) !== JSON.stringify(campaign.newBidChasing);
                return (
                    <tr key={campaign.id} className="border-b border-gray-200 last:border-b-0">
                        <td className="px-3 py-2 align-top text-center text-gray-500 border-r">{campaignIndex + 1}</td>
                        <td className="px-3 py-2 align-top font-medium text-gray-800 border-r">{campaign.name}</td>
                        <td className="px-3 py-2 align-top text-gray-500 border-r">{campaign.id}</td>
                        <td className="px-3 py-2 align-top border-r">
                            <div className="flex flex-col gap-1">
                                {campaign.products.flatMap(product => 
                                    product.clusters.map(cluster => ({ product, cluster }))
                                ).map(({ product, cluster }) => {
                                    const isChanged = cluster.oldBid !== cluster.newBid;
                                    return (
                                        <div key={`${campaign.id}-${product.id}-${cluster.name}`} className={`flex justify-between items-center p-0.5 rounded text-xs ${isChanged ? 'bg-purple-50' : ''}`}>
                                            <span className={`truncate pr-2 ${isChanged ? 'font-medium text-purple-800' : 'text-gray-500'}`} title={cluster.name}>{cluster.name}:</span>
                                            <span className={`font-medium whitespace-nowrap ${isChanged ? 'text-purple-800' : 'text-gray-600'}`}>{formatCurrency(cluster.newBid)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </td>
                        <td className={`px-3 py-2 align-top ${isBidChasingChanged ? 'bg-purple-50' : ''}`}>
                            {formatBidChasing(campaign.newBidChasing)}
                        </td>
                    </tr>
                )
            })}
        </tbody>
    </table>
  )
}

const ClustersTable = ({ data }: { data: CampaignChange[] }) => {
  return (
    <table className="min-w-full text-sm">
        <thead className="bg-gray-50/70 sticky top-0 z-10">
            <tr>
                <th scope="col" className="p-3 font-semibold text-center text-gray-600 w-12 border-r">№</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-48 border-r">Название</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-32 border-r">ID Кампании</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-32 border-r">ID Товара</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600 w-64 border-r">Кластер</th>
                <th scope="col" className="p-3 font-semibold text-left text-gray-600">Ставка</th>
            </tr>
        </thead>
        <tbody className="bg-white">
            {data.flatMap((campaign, campaignIndex) => {
                const totalClustersForCampaign = campaign.products.reduce((sum, p) => sum + p.clusters.length, 0);
                let clusterGlobalIndex = 0;
                
                return campaign.products.flatMap((product, productIndex) =>
                    product.clusters.map((cluster, clusterIndex) => {
                        const isChanged = cluster.oldBid !== cluster.newBid;
                        const isFirstClusterOfCampaign = clusterGlobalIndex === 0;
                        const isFirstClusterOfProduct = clusterIndex === 0;
                        
                        clusterGlobalIndex++;
                        
                        return (
                            <tr key={`${campaign.id}-${product.id}-${cluster.name}`} className="border-b border-gray-200 last:border-b-0">
                                {isFirstClusterOfCampaign && (
                                    <td rowSpan={totalClustersForCampaign} className="px-3 py-2 align-top text-center text-gray-500 border-r">{campaignIndex + 1}</td>
                                )}
                                {isFirstClusterOfCampaign && (
                                    <>
                                        <td rowSpan={totalClustersForCampaign} className="px-3 py-2 align-top font-medium text-gray-800 border-r">{campaign.name}</td>
                                        <td rowSpan={totalClustersForCampaign} className="px-3 py-2 align-top text-gray-500 border-r">{campaign.id}</td>
                                    </>
                                )}
                                {isFirstClusterOfProduct && (
                                    <td rowSpan={product.clusters.length} className="px-3 py-2 align-top text-gray-500 border-r">{product.id}</td>
                                )}
                                <td className="px-3 py-2 align-top text-gray-700 border-r">{cluster.name}</td>
                                <td className={`px-3 py-2 align-top font-medium ${isChanged ? 'bg-purple-50 text-purple-800' : 'text-gray-800'}`}>
                                    {formatCurrency(cluster.newBid)}
                                </td>
                            </tr>
                        );
                    })
                );
            })}
        </tbody>
    </table>
  )
}

export const ReviewEditsModal = ({ isOpen, onClose, onEdit }: { isOpen: boolean, onClose: () => void, onEdit?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'base' | 'bids' | 'clusters'>('base');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Проверка изменений</h2>
            <p className="text-sm text-gray-500 mt-1">Проверьте данные перед применением. Изменения выделены фиолетовым.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="px-6 pt-4 flex-grow flex flex-col overflow-hidden">
          <div className="border-b border-gray-200 -mx-6 px-6">
              <div className="flex items-center gap-4">
                  <TabButton isActive={activeTab === 'base'} onClick={() => setActiveTab('base')}>Базовые настройки</TabButton>
                  <TabButton isActive={activeTab === 'bids'} onClick={() => setActiveTab('bids')}>Ставки</TabButton>
                  <TabButton isActive={activeTab === 'clusters'} onClick={() => setActiveTab('clusters')}>Кластера</TabButton>
              </div>
          </div>
          <div className="pt-4 flex-grow overflow-hidden">
              <div className="overflow-auto border border-gray-200 rounded-lg h-full custom-scrollbar">
                  {activeTab === 'base' && <BaseSettingsTable data={MOCK_CHANGES} />}
                  {activeTab === 'bids' && <BidsTable data={MOCK_CHANGES} />}
                  {activeTab === 'clusters' && <ClustersTable data={MOCK_CHANGES} />}
              </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-200 rounded-b-2xl">
          <button onClick={onEdit} className="px-6 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">редактировать</button>
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">вернуться к шагам</button>
        </div>
      </div>
    </div>
  );
};