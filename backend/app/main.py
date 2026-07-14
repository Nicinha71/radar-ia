from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.marketplace import router
app=FastAPI(title="Radar IA Produtos API",version="0.1.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
@app.get("/api/health")
async def health():return {"status":"ok"}
app.include_router(router,prefix="/api/v1")
