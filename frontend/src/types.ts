export type MarketplaceItem = {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  permalink: string;
  thumbnail?: string;
  condition?: string;
  free_shipping: boolean;
  seller_nickname?: string;
};

export type KeywordFrequency = { term: string; count: number };

export type SearchSummary = {
  query: string;
  total: number;
  average_price: number;
  median_price: number;
  minimum_price: number;
  maximum_price: number;
  price_spread_percent: number;
  free_shipping_percent: number;
  competition_level: "baixa" | "média" | "alta" | "muito alta";
  preliminary_score: number;
  recurrent_keywords: KeywordFrequency[];
  suggested_searches: string[];
  items: MarketplaceItem[];
};

export type TrendItem = { rank: number; keyword: string; url?: string };
export type TrendsResponse = { updated_at: string; source: string; items: TrendItem[] };
