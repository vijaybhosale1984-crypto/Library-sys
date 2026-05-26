"""Books CRUD endpoints."""
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import Book, BookCreate, BookUpdate, PaginatedBooks, DeleteResponse
from app.db.connection import DB

router = APIRouter(prefix="/books", tags=["Books"])


def _row_to_book(row) -> Book:
    return Book(**dict(row))


@router.post("/", response_model=Book, status_code=201)
def create_book(body: BookCreate):
    with DB() as db:
        row = db.fetchone(
            """
            INSERT INTO books (title, author, isbn, genre, total_copies, avail_copies,
                               published_year, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (body.title, body.author, body.isbn, body.genre,
             body.total_copies, body.total_copies,
             body.published_year, body.description),
        )
    return _row_to_book(row)


@router.get("/", response_model=PaginatedBooks)
def list_books(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
):
    offset = (page - 1) * per_page
    with DB() as db:
        if search:
            like = f"%{search}%"
            rows = db.fetchall(
                """
                SELECT * FROM books
                WHERE title ILIKE %s OR author ILIKE %s OR isbn ILIKE %s
                ORDER BY title LIMIT %s OFFSET %s
                """,
                (like, like, like, per_page, offset),
            )
            total = db.fetchone(
                "SELECT COUNT(*) AS c FROM books WHERE title ILIKE %s OR author ILIKE %s OR isbn ILIKE %s",
                (like, like, like),
            )["c"]
        else:
            rows = db.fetchall("SELECT * FROM books ORDER BY title LIMIT %s OFFSET %s", (per_page, offset))
            total = db.fetchone("SELECT COUNT(*) AS c FROM books")["c"]
    return PaginatedBooks(books=[_row_to_book(r) for r in rows], total=total)


@router.get("/{book_id}", response_model=Book)
def get_book(book_id: int):
    with DB() as db:
        row = db.fetchone("SELECT * FROM books WHERE id = %s", (book_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    return _row_to_book(row)


@router.put("/{book_id}", response_model=Book)
def update_book(book_id: int, body: BookUpdate):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    # If total_copies changes, adjust avail_copies proportionally
    with DB() as db:
        existing = db.fetchone("SELECT * FROM books WHERE id = %s", (book_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Book not found")

        if "total_copies" in fields:
            diff = fields["total_copies"] - existing["total_copies"]
            fields["avail_copies"] = max(0, existing["avail_copies"] + diff)

        set_clause = ", ".join(f"{k} = %s" for k in fields)
        row = db.fetchone(
            f"UPDATE books SET {set_clause} WHERE id = %s RETURNING *",
            (*fields.values(), book_id),
        )
    return _row_to_book(row)


@router.delete("/{book_id}", response_model=DeleteResponse)
def delete_book(book_id: int):
    with DB() as db:
        active = db.fetchone(
            "SELECT COUNT(*) AS c FROM loans WHERE book_id = %s AND returned_at IS NULL",
            (book_id,),
        )
        if active["c"] > 0:
            raise HTTPException(status_code=409, detail="Book has active loans")
        result = db.fetchone("DELETE FROM books WHERE id = %s RETURNING id", (book_id,))
    if not result:
        raise HTTPException(status_code=404, detail="Book not found")
    return DeleteResponse(success=True, message="Book deleted")
