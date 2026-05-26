-- Library Management System – PostgreSQL Schema
-- Run: psql -U postgres -d library_db -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Books ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
    id             SERIAL PRIMARY KEY,
    title          VARCHAR(255)   NOT NULL,
    author         VARCHAR(255)   NOT NULL,
    isbn           VARCHAR(20)    UNIQUE,
    genre          VARCHAR(100),
    total_copies   INT            NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    avail_copies   INT            NOT NULL DEFAULT 1 CHECK (avail_copies >= 0),
    published_year INT,
    description    TEXT,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Members ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    email        VARCHAR(255)  NOT NULL UNIQUE,
    phone        VARCHAR(30),
    address      TEXT,
    member_since TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Loans ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
    id          SERIAL PRIMARY KEY,
    book_id     INT           NOT NULL REFERENCES books(id)   ON DELETE RESTRICT,
    member_id   INT           NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    borrowed_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    due_date    TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    returned_at TIMESTAMPTZ,
    fine_amount NUMERIC(8,2)  NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_loans_book_id    ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_member_id  ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_returned   ON loans(returned_at) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_books_title      ON books USING gin(to_tsvector('english', title || ' ' || author));

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_books_updated_at   ON books;
DROP TRIGGER IF EXISTS trg_members_updated_at ON members;
DROP TRIGGER IF EXISTS trg_loans_updated_at   ON loans;

CREATE TRIGGER trg_books_updated_at   BEFORE UPDATE ON books   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_loans_updated_at   BEFORE UPDATE ON loans   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Seed data ────────────────────────────────────────────────────────────────
INSERT INTO books (title, author, isbn, genre, total_copies, avail_copies, published_year, description) VALUES
  ('The Great Gatsby',            'F. Scott Fitzgerald', '978-0743273565', 'Fiction',       3, 3, 1925, 'A story of the fabulously wealthy Jay Gatsby.'),
  ('To Kill a Mockingbird',       'Harper Lee',          '978-0061935466', 'Fiction',       4, 4, 1960, 'A lawyer defends a Black man in the American South.'),
  ('1984',                        'George Orwell',       '978-0451524935', 'Dystopian',     5, 5, 1949, 'A chilling portrait of a totalitarian society.'),
  ('Pride and Prejudice',         'Jane Austen',         '978-0141439518', 'Romance',       3, 3, 1813, 'The story of Elizabeth Bennet and Mr. Darcy.'),
  ('The Hitchhiker''s Guide',     'Douglas Adams',       '978-0345391803', 'Sci-Fi',        2, 2, 1979, 'An unforgettable comic science fiction series.'),
  ('Sapiens',                     'Yuval Noah Harari',   '978-0062316097', 'Non-Fiction',   4, 4, 2011, 'A brief history of humankind.'),
  ('Dune',                        'Frank Herbert',       '978-0441013593', 'Sci-Fi',        3, 3, 1965, 'An epic tale of interstellar politics and ecology.')
ON CONFLICT DO NOTHING;

INSERT INTO members (name, email, phone, address) VALUES
  ('Alice Johnson', 'alice@example.com',   '555-0101', '12 Oak Street'),
  ('Bob Smith',     'bob@example.com',     '555-0102', '34 Maple Ave'),
  ('Carol White',   'carol@example.com',   '555-0103', '56 Pine Road')
ON CONFLICT DO NOTHING;
