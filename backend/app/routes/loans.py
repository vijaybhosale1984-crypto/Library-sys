"""Loans endpoints – borrow, return, list."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import Loan, LoanCreate, PaginatedLoans, DeleteResponse
from app.db.connection import DB

router = APIRouter(prefix="/loans", tags=["Loans"])

FINE_PER_DAY = 0.50  # $0.50 per overdue day


def _compute_status(row) -> str:
    if row["returned_at"]:
        return "returned"
    now = datetime.now(timezone.utc)
    due = row["due_date"]
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)
    return "overdue" if now > due else "active"


def _compute_fine(row) -> float:
    if row["returned_at"]:
        return float(row["fine_amount"])
    now = datetime.now(timezone.utc)
    due = row["due_date"]
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)
    if now > due:
        days = (now - due).days
        return round(days * FINE_PER_DAY, 2)
    return 0.0


def _row_to_loan(row) -> Loan:
    d = dict(row)
    d["status"] = _compute_status(row)
    d["fine_amount"] = _compute_fine(row)
    return Loan(**d)


@router.post("/borrow", response_model=Loan, status_code=201)
def borrow_book(body: LoanCreate):
    with DB() as db:
        # Verify book exists and has copies
        book = db.fetchone("SELECT * FROM books WHERE id = %s", (body.book_id,))
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        if book["avail_copies"] < 1:
            raise HTTPException(status_code=409, detail="No copies available")

        # Verify member exists and is active
        member = db.fetchone("SELECT * FROM members WHERE id = %s", (body.member_id,))
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        if not member["is_active"]:
            raise HTTPException(status_code=403, detail="Member account is inactive")

        # Check member doesn't already have this book
        existing = db.fetchone(
            "SELECT id FROM loans WHERE book_id = %s AND member_id = %s AND returned_at IS NULL",
            (body.book_id, body.member_id),
        )
        if existing:
            raise HTTPException(status_code=409, detail="Member already has this book borrowed")

        # Create loan
        row = db.fetchone(
            """
            INSERT INTO loans (book_id, member_id, due_date)
            VALUES (%s, %s, NOW() + (%s || ' days')::INTERVAL)
            RETURNING
                loans.*,
                (SELECT title FROM books  WHERE id = loans.book_id)   AS book_title,
                (SELECT name  FROM members WHERE id = loans.member_id) AS member_name
            """,
            (body.book_id, body.member_id, body.loan_days),
        )

        # Decrement available copies
        db.execute("UPDATE books SET avail_copies = avail_copies - 1 WHERE id = %s", (body.book_id,))

    return _row_to_loan(row)


@router.post("/return/{loan_id}", response_model=Loan)
def return_book(loan_id: int):
    with DB() as db:
        loan = db.fetchone(
            """
            SELECT loans.*,
                   (SELECT title FROM books   WHERE id = loans.book_id)   AS book_title,
                   (SELECT name  FROM members WHERE id = loans.member_id) AS member_name
            FROM loans WHERE loans.id = %s
            """,
            (loan_id,),
        )
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        if loan["returned_at"]:
            raise HTTPException(status_code=409, detail="Book already returned")

        fine = _compute_fine(loan)
        row = db.fetchone(
            """
            UPDATE loans SET returned_at = NOW(), fine_amount = %s
            WHERE id = %s
            RETURNING
                loans.*,
                (SELECT title FROM books   WHERE id = loans.book_id)   AS book_title,
                (SELECT name  FROM members WHERE id = loans.member_id) AS member_name
            """,
            (fine, loan_id),
        )
        db.execute("UPDATE books SET avail_copies = avail_copies + 1 WHERE id = %s", (loan["book_id"],))

    return _row_to_loan(row)


@router.get("/", response_model=PaginatedLoans)
def list_loans(
    member_id: int = Query(0),
    book_id: int = Query(0),
    status: str = Query(""),   # active | returned | overdue
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * per_page
    where = ["1=1"]
    params: list = []

    if member_id:
        where.append("loans.member_id = %s"); params.append(member_id)
    if book_id:
        where.append("loans.book_id = %s"); params.append(book_id)
    if status == "active":
        where.append("loans.returned_at IS NULL AND loans.due_date >= NOW()")
    elif status == "returned":
        where.append("loans.returned_at IS NOT NULL")
    elif status == "overdue":
        where.append("loans.returned_at IS NULL AND loans.due_date < NOW()")

    where_sql = " AND ".join(where)
    base_sql = f"""
        SELECT loans.*,
               b.title  AS book_title,
               m.name   AS member_name
        FROM loans
        JOIN books   b ON b.id = loans.book_id
        JOIN members m ON m.id = loans.member_id
        WHERE {where_sql}
    """

    with DB() as db:
        rows = db.fetchall(
            base_sql + " ORDER BY loans.borrowed_at DESC LIMIT %s OFFSET %s",
            (*params, per_page, offset),
        )
        total = db.fetchone(
            f"SELECT COUNT(*) AS c FROM loans JOIN books b ON b.id=loans.book_id JOIN members m ON m.id=loans.member_id WHERE {where_sql}",
            params,
        )["c"]

    return PaginatedLoans(loans=[_row_to_loan(r) for r in rows], total=total)


@router.get("/{loan_id}", response_model=Loan)
def get_loan(loan_id: int):
    with DB() as db:
        row = db.fetchone(
            """
            SELECT loans.*,
                   b.title AS book_title,
                   m.name  AS member_name
            FROM loans
            JOIN books   b ON b.id = loans.book_id
            JOIN members m ON m.id = loans.member_id
            WHERE loans.id = %s
            """,
            (loan_id,),
        )
    if not row:
        raise HTTPException(status_code=404, detail="Loan not found")
    return _row_to_loan(row)
