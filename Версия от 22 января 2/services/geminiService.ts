import { GoogleGenAI, Type } from "@google/genai";
import { CampaignRecord, CampaignStatus, PaymentModel, BidType, CampaignConfig } from "../types";

export const validateUploadedFile = async (
  filename: string,
  config: CampaignConfig
): Promise<Omit<CampaignRecord, 'source'>[]> => {
  
  if (!process.env.API_KEY) {
    console.warn("API Key missing, returning fallback mock data");
    return getFallbackMockData(config);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const currentDate = new Date().toLocaleDateString('ru-RU');

  const prompt = `
    Act as a Wildberries advertising platform backend. 
    A seller has uploaded an Excel file to create mass ad campaigns.
    
    Context:
    - Payment Model: ${config.paymentModel}
    - Bid Type: ${config.bidType}
    - Target Categories: ${config.categories.join(", ")}
    - Filename: ${filename}
    - Current Date for campaign name: ${currentDate}

    Generate a JSON response representing the parsed rows from this "file".
    Create exactly 70 records.
    
    Rules:
    - Language: Russian.
    - 'usePromoBonuses' should always be true.
    - 'autoReplenishment' must always be false.
    - Use a generic placeholder image URL for all items: 'https://placehold.co/64x64/e2e8f0/94a3b8?text=W'.
    - The majority of records should be perfectly valid (CampaignStatus = "Valid").
    - A small number of records (around 8-10) should have fixable errors (CampaignStatus = "Corrected"). 
    - For some 'Corrected' records, correct 'budget' and one of the bid fields.
    - Provide a 'reason' for each correction (e.g., 'Минимальная ставка для категории 50 ₽').
    - A few records (around 3-5) should have critical errors that are filtered out later (CampaignStatus = "Error"). E.g., "Товар закончился", "Артикул не найден".
    - Include a few duplicate records by 'nmId'.
    - 'campaignName' should be generated based on the formula: "[productName] + [${config.paymentModel}] + [${currentDate}]".
    - 'fundingSource' should always be 'Единый счёт'.
    - 'nmId' should be a realistic 8-digit number.
    - 'budget' should be between 1000 and 50000.
    - IF the campaign is CPM and Manual, generate 'searchBid' and 'recommendationsBid' fields (each between 50-500). DO NOT generate 'bid'.
    - FOR ALL OTHER campaign types, generate a single 'bid' field (between 50-500). DO NOT generate 'searchBid' or 'recommendationsBid'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              nmId: { type: Type.INTEGER },
              productName: { type: Type.STRING },
              campaignName: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              category: { type: Type.STRING },
              bid: { type: Type.NUMBER },
              searchBid: { type: Type.NUMBER },
              recommendationsBid: { type: Type.NUMBER },
              budget: { type: Type.NUMBER },
              autoReplenishment: { type: Type.BOOLEAN },
              fundingSource: { type: Type.STRING, enum: ['Единый счёт'] },
              status: { type: Type.STRING, enum: [CampaignStatus.VALID, CampaignStatus.ERROR, CampaignStatus.CORRECTED] },
              errorMessage: { type: Type.STRING },
              usePromoBonuses: { type: Type.BOOLEAN },
              correctionDetails: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field: { type: Type.STRING, enum: ['bid', 'budget', 'searchBid', 'recommendationsBid'] },
                    oldValue: { type: Type.NUMBER },
                    newValue: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                  },
                  required: ["field", "oldValue", "newValue", "reason"]
                }
              },
            },
            required: ["id", "nmId", "productName", "campaignName", "imageUrl", "category", "budget", "autoReplenishment", "fundingSource", "status", "usePromoBonuses"]
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    return rawData.map((item: any) => ({
      ...item,
      errorMessage: item.status === CampaignStatus.ERROR ? item.errorMessage : undefined,
      correctionDetails: item.status === CampaignStatus.CORRECTED ? item.correctionDetails : undefined
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    return getFallbackMockData(config);
  }
};

export const getFallbackMockData = (config: CampaignConfig): Omit<CampaignRecord, 'source'>[] => {
  const currentDate = new Date().toLocaleDateString('ru-RU');
  const placeholderUrl = 'https://placehold.co/64x64/e2e8f0/94a3b8?text=W';
  const mockData: Omit<CampaignRecord, 'source'>[] = [];
  const category = config.categories[0] || 'Платья';
  const isCpmManual = config.paymentModel === PaymentModel.CPM && config.bidType === BidType.MANUAL;

  for (let i = 1; i <= 70; i++) {
    const baseId = 14029380 + i;
    const record: Omit<CampaignRecord, 'source'> = {
      id: `${baseId}-${Date.now()}`,
      nmId: baseId,
      productName: `${category} Модель ${i}`,
      campaignName: `${category} Модель ${i} ${config.paymentModel} ${currentDate}`,
      imageUrl: placeholderUrl,
      category: category,
      budget: 5000 + i * 100,
      autoReplenishment: false,
      fundingSource: 'Единый счёт',
      status: CampaignStatus.VALID,
      usePromoBonuses: true,
    };
    
    if (isCpmManual) {
      record.searchBid = 150 + i;
      record.recommendationsBid = 160 + i;
    } else {
      record.bid = 150 + i;
    }

    if (i > 60 && i <= 68) {
      record.status = CampaignStatus.CORRECTED;
      const correctionField = isCpmManual ? 'searchBid' : 'bid';
      record.correctionDetails = [{ field: correctionField, oldValue: 100, newValue: 150, reason: 'Минимальная ставка 150 ₽' }];
    }
    if (i > 68) {
      record.status = CampaignStatus.ERROR;
      record.errorMessage = 'Товар закончился';
    }
     if (i === 70) {
      record.nmId = 14029381; // Duplicate
    }
    mockData.push(record);
  }
  return mockData;
};

export const getMockProductsForCategory = (category: string): Pick<CampaignRecord, 'id' | 'nmId' | 'productName' | 'imageUrl' | 'category' | 'cpcCompatible'>[] => {
    const placeholderUrl = 'https://placehold.co/64x64/e2e8f0/94a3b8?text=W';
    const products = [];
    for (let i = 1; i <= 25; i++) {
        const nmId = (Math.floor(Math.random() * 80000000) + 10000000);
        products.push({
            id: `${nmId}`,
            nmId: nmId,
            productName: `${category} #${i}`,
            imageUrl: placeholderUrl,
            category: category,
            cpcCompatible: i % 4 !== 0,
        });
    }
    return products;
}