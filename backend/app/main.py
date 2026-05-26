"""Library Management API – FastAPI entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.books     import router as books_router
from app.routes.members   import router as members_router
from app.routes.loans     import router as loans_router
from app.routes.dashboard import router as dashboard_router

app = FastAPI(
    title="Library Management API",
    version="1.0.0",
    description=(
        "REST API for a neighborhood library. "
        "Manage books, members, and borrowing operations. "
        "Built with FastAPI + PostgreSQL + Protobuf-compatible REST design."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books_router)
app.include_router(members_router)
app.include_router(loans_router)
app.include_router(dashboard_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Library API is running 📚"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
