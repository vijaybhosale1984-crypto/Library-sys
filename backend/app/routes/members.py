"""Members CRUD endpoints."""
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import Member, MemberCreate, MemberUpdate, PaginatedMembers, DeleteResponse
from app.db.connection import DB

router = APIRouter(prefix="/members", tags=["Members"])


def _row_to_member(row) -> Member:
    return Member(**dict(row))


@router.post("/", response_model=Member, status_code=201)
def create_member(body: MemberCreate):
    with DB() as db:
        existing = db.fetchone("SELECT id FROM members WHERE email = %s", (body.email,))
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        row = db.fetchone(
            """
            INSERT INTO members (name, email, phone, address)
            VALUES (%s, %s, %s, %s)
            RETURNING *
            """,
            (body.name, body.email, body.phone, body.address),
        )
    return _row_to_member(row)


@router.get("/", response_model=PaginatedMembers)
def list_members(
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
                SELECT * FROM members
                WHERE name ILIKE %s OR email ILIKE %s
                ORDER BY name LIMIT %s OFFSET %s
                """,
                (like, like, per_page, offset),
            )
            total = db.fetchone(
                "SELECT COUNT(*) AS c FROM members WHERE name ILIKE %s OR email ILIKE %s",
                (like, like),
            )["c"]
        else:
            rows = db.fetchall("SELECT * FROM members ORDER BY name LIMIT %s OFFSET %s", (per_page, offset))
            total = db.fetchone("SELECT COUNT(*) AS c FROM members")["c"]
    return PaginatedMembers(members=[_row_to_member(r) for r in rows], total=total)


@router.get("/{member_id}", response_model=Member)
def get_member(member_id: int):
    with DB() as db:
        row = db.fetchone("SELECT * FROM members WHERE id = %s", (member_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Member not found")
    return _row_to_member(row)


@router.put("/{member_id}", response_model=Member)
def update_member(member_id: int, body: MemberUpdate):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    with DB() as db:
        existing = db.fetchone("SELECT id FROM members WHERE id = %s", (member_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Member not found")

        set_clause = ", ".join(f"{k} = %s" for k in fields)
        row = db.fetchone(
            f"UPDATE members SET {set_clause} WHERE id = %s RETURNING *",
            (*fields.values(), member_id),
        )
    return _row_to_member(row)


@router.delete("/{member_id}", response_model=DeleteResponse)
def delete_member(member_id: int):
    with DB() as db:
        active = db.fetchone(
            "SELECT COUNT(*) AS c FROM loans WHERE member_id = %s AND returned_at IS NULL",
            (member_id,),
        )
        if active["c"] > 0:
            raise HTTPException(status_code=409, detail="Member has active loans")
        result = db.fetchone("DELETE FROM members WHERE id = %s RETURNING id", (member_id,))
    if not result:
        raise HTTPException(status_code=404, detail="Member not found")
    return DeleteResponse(success=True, message="Member deleted")
