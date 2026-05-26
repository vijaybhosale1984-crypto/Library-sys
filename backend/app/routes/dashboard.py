"""Dashboard stats endpoint."""
from fastapi import APIRouter
from app.models.schemas import DashboardStats
from app.db.connection import DB

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats():
    with DB() as db:
        total_books   = db.fetchone("SELECT COALESCE(SUM(total_copies), 0) AS c FROM books")["c"]
        total_members = db.fetchone("SELECT COUNT(*) AS c FROM members WHERE is_active = TRUE")["c"]
        active_loans  = db.fetchone("SELECT COUNT(*) AS c FROM loans WHERE returned_at IS NULL AND due_date >= NOW()")["c"]
        overdue_loans = db.fetchone("SELECT COUNT(*) AS c FROM loans WHERE returned_at IS NULL AND due_date < NOW()")["c"]
        total_fines   = db.fetchone(
            """
            SELECT COALESCE(
                SUM(
                    CASE
                        WHEN returned_at IS NOT NULL THEN fine_amount
                        WHEN due_date < NOW()        THEN EXTRACT(DAY FROM (NOW() - due_date)) * 0.50
                        ELSE 0
                    END
                ), 0
            ) AS f
            FROM loans
            """
        )["f"]

    return DashboardStats(
        total_books=int(total_books),
        total_members=int(total_members),
        active_loans=int(active_loans),
        overdue_loans=int(overdue_loans),
        total_fines=float(total_fines),
    )
