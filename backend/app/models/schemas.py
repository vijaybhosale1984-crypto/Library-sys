"""Pydantic schemas for request validation and response serialization."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ─── Book ─────────────────────────────────────────────────────────────────────

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    isbn: Optional[str] = Field(None, max_length=20)
    genre: Optional[str] = Field(None, max_length=100)
    total_copies: int = Field(1, ge=1)
    published_year: Optional[int] = None
    description: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    isbn: Optional[str] = None
    genre: Optional[str] = None
    total_copies: Optional[int] = Field(None, ge=1)
    published_year: Optional[int] = None
    description: Optional[str] = None


class Book(BookBase):
    id: int
    avail_copies: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Member ───────────────────────────────────────────────────────────────────

class MemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    address: Optional[str] = None


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class Member(MemberBase):
    id: int
    member_since: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Loan ─────────────────────────────────────────────────────────────────────

class LoanCreate(BaseModel):
    book_id: int
    member_id: int
    loan_days: int = Field(14, ge=1, le=90)


class Loan(BaseModel):
    id: int
    book_id: int
    member_id: int
    book_title: Optional[str] = None
    member_name: Optional[str] = None
    borrowed_at: datetime
    due_date: datetime
    returned_at: Optional[datetime] = None
    fine_amount: float
    status: str  # active | returned | overdue

    class Config:
        from_attributes = True


# ─── Generic responses ────────────────────────────────────────────────────────

class PaginatedBooks(BaseModel):
    books: List[Book]
    total: int


class PaginatedMembers(BaseModel):
    members: List[Member]
    total: int


class PaginatedLoans(BaseModel):
    loans: List[Loan]
    total: int


class DeleteResponse(BaseModel):
    success: bool
    message: str


class DashboardStats(BaseModel):
    total_books: int
    total_members: int
    active_loans: int
    overdue_loans: int
    total_fines: float
