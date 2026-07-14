from typing import Literal
from pydantic import BaseModel, Field

class MarketplaceItem(BaseModel):
    id: str
    title: str
    price: float = Field(ge=0)
    currency_id: str = "BRL"
    permalink: str
    thumbnail: str | None = None
    condition: str | None = None
    free_shipping: bool = False
    seller_nickname: str | None = None

class KeywordFrequency(BaseModel):
    term: str
    count: int

class SearchSummary(BaseModel):
    query: str
    total: int
    average_price: float
    median_price: float
    minimum_price: float
    maximum_price: float
    price_spread_percent: float
    free_shipping_percent: float
    competition_level: Literal["baixa", "média", "alta", "muito alta"]
    preliminary_score: int
    recurrent_keywords: list[KeywordFrequency]
    suggested_searches: list[str]
    items: list[MarketplaceItem]

class TrendItem(BaseModel):
    rank: int
    keyword: str
    url: str | None = None

class TrendsResponse(BaseModel):
    updated_at: str
    source: str
    items: list[TrendItem]
