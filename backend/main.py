from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers.auth import router as auth_router
from routers.assets import router as assets_router
from routers.maintenance import router as maintenance_router
from routers.blocks import router as blocks_router
from routers.plans import router as plans_router
from routers.analytics import router as analytics_router

app = FastAPI(
    title="RailOpt AI API",
    description="AI-Powered Automatic Block Planning for Indian Railways",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()

# Include all routers
app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(maintenance_router)
app.include_router(blocks_router)
app.include_router(plans_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "app": "RailOpt AI",
        "version": "1.0.0",
        "status": "running",
        "description": "AI-Powered Block Planning for Indian Railways",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
