from fastapi import APIRouter, Query
from app.schemas import SearchSummary, TrendsResponse
from app.services.mercado_livre import get_marketplace_trends, search_marketplace

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

@router.get("/search", response_model=SearchSummary)
async def search(q: str = Query(min_length=2, max_length=120)) -> SearchSummary:
    return await search_marketplace(q)

@router.get("/trends", response_model=TrendsResponse)
async def trends() -> TrendsResponse:
    return await get_marketplace_trends()
