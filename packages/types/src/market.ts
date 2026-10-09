export interface Market {
  marketSlug: string;
  imageUrl?: string;
}

export interface CreateMarketCommand {
  userId: string;
  messageType: "create-market";
  correlationId: string;
  marketSlug: string;
  imageUrl?: string;
}

export interface MarkPriceCommand {
  messageType: "mark-price";
  market: string;
  price: string;
  indexPrice: string;
}

export interface FundingSettlementCommand {
  messageType: "funding-settlement";
  market: string;
}
