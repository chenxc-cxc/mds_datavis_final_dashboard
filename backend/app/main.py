"""FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import metrics
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.project_name, openapi_url=f"{settings.api_prefix}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mds-datavis-final-dashboard-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix=settings.api_prefix)


@app.get("/")
def read_root():
    return {"message": "Ecommerce analytics API", "docs": f"{settings.api_prefix}/docs"}

