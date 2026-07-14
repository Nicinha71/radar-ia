import re
import statistics
from collections import Counter
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

from app.config import settings
from app.schemas import KeywordFrequency, MarketplaceItem, SearchSummary, TrendItem, TrendsResponse

STOPWORDS = {
    "de","da","do","das","dos","e","em","para","com","sem","por","a","o","as","os",
    "um","uma","kit","novo","nova","original","frete","gratis","grátis","pronta","entrega",
    "unidade","unidades","cor","cores","modelo","produto"
}

def level(total: int) -> str:
    return "baixa" if total < 500 else "média" if total < 3000 else "alta" if total < 15000 else "muito alta"

def score(total: int, prices: list[float], free_shipping_percent: float) -> int:
    value = 82 if total < 500 else 75 if total < 3000 else 64 if total < 15000 else 52
    if prices:
        average = sum(prices) / len(prices)
        spread = (max(prices) - min(prices)) / average if average else 0
        if spread > 1.2:
            value -= 5
        elif spread < 0.45:
            value += 4
    if free_shipping_percent > 75:
        value -= 4
    return max(0, min(100, round(value)))

def extract_keywords(titles: list[str], query: str) -> list[KeywordFrequency]:
    query_words = set(re.findall(r"[a-záàâãéêíóôõúç0-9]+", query.lower()))
    words: Counter[str] = Counter()
    phrases: Counter[str] = Counter()

    for title in titles:
        tokens = [
            token for token in re.findall(r"[a-záàâãéêíóôõúç0-9]+", title.lower())
            if len(token) > 2 and token not in STOPWORDS and token not in query_words
        ]
        words.update(tokens)
        phrases.update(" ".join(tokens[i:i+2]) for i in range(len(tokens)-1))

    combined = [(term, count) for term, count in phrases.items() if count >= 2]
    combined += [(term, count) for term, count in words.items() if count >= 2]
    combined.sort(key=lambda item: (-item[1], -len(item[0]), item[0]))

    seen: set[str] = set()
    result: list[KeywordFrequency] = []
    for term, count in combined:
        if term not in seen:
            seen.add(term)
            result.append(KeywordFrequency(term=term, count=count))
        if len(result) == 15:
            break
    return result

async def search_marketplace(query: str, limit: int = 50) -> SearchSummary:
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(
                f"{settings.mercado_livre_base_url}/sites/MLB/search",
                params={"q": query, "limit": min(limit, 50)},
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "O Mercado Livre demorou para responder.") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Falha ao consultar o Mercado Livre.") from exc

    items: list[MarketplaceItem] = []
    prices: list[float] = []
    titles: list[str] = []
    free_shipping_count = 0

    for raw in data.get("results", []):
        price = float(raw.get("price") or 0)
        if price > 0:
            prices.append(price)
        title = str(raw.get("title", ""))
        titles.append(title)
        free_shipping = bool(raw.get("shipping", {}).get("free_shipping", False))
        free_shipping_count += int(free_shipping)
        items.append(MarketplaceItem(
            id=str(raw.get("id", "")),
            title=title,
            price=price,
            currency_id=str(raw.get("currency_id", "BRL")),
            permalink=str(raw.get("permalink", "")),
            thumbnail=raw.get("thumbnail"),
            condition=raw.get("condition"),
            free_shipping=free_shipping,
            seller_nickname=raw.get("seller", {}).get("nickname"),
        ))

    total = int(data.get("paging", {}).get("total", 0))
    average = sum(prices) / len(prices) if prices else 0
    median = statistics.median(prices) if prices else 0
    spread = ((max(prices) - min(prices)) / average * 100) if prices and average else 0
    free_shipping_percent = (free_shipping_count / len(items) * 100) if items else 0
    keywords = extract_keywords(titles, query)

    suggested = []
    for keyword in keywords[:8]:
        suggestion = f"{query} {keyword.term}".strip()
        if len(suggestion) <= 80:
            suggested.append(suggestion)

    return SearchSummary(
        query=query,
        total=total,
        average_price=round(average, 2),
        median_price=round(median, 2),
        minimum_price=round(min(prices), 2) if prices else 0,
        maximum_price=round(max(prices), 2) if prices else 0,
        price_spread_percent=round(spread, 1),
        free_shipping_percent=round(free_shipping_percent, 1),
        competition_level=level(total),
        preliminary_score=score(total, prices, free_shipping_percent),
        recurrent_keywords=keywords,
        suggested_searches=suggested,
        items=items,
    )

async def get_marketplace_trends() -> TrendsResponse:
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(
                f"{settings.mercado_livre_base_url}/trends/MLB",
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            raw_items = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "As tendências demoraram para responder.") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Não foi possível consultar as tendências do Mercado Livre.") from exc

    items = [
        TrendItem(
            rank=index + 1,
            keyword=str(item.get("keyword", "")),
            url=item.get("url"),
        )
        for index, item in enumerate(raw_items)
        if item.get("keyword")
    ]
    return TrendsResponse(
        updated_at=datetime.now(timezone.utc).isoformat(),
        source="Mercado Livre API",
        items=items,
    )
