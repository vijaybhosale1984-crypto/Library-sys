# Athenaeum — Library Management System

A full-stack neighborhood library management system built with:

- **Backend**: Python + FastAPI + PostgreSQL (REST API with Protobuf definitions)
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 16

---

## Quick Start (Docker)

```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| API      | http://localhost:8000        |
| Swagger  | http://localhost:8000/docs   |

---

## Manual Setup

See the **Setup Guide** section in the docs or follow:

1. Start PostgreSQL and run `backend/schema.sql`
2. `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
3. `cd frontend && npm install && npm run dev`

Full instructions: see `SETUP.md`

---

## API Endpoints

### Books
| Method | Path            | Description        |
|--------|-----------------|--------------------|
| GET    | /books/         | List / search books|
| POST   | /books/         | Create book        |
| GET    | /books/{id}     | Get book           |
| PUT    | /books/{id}     | Update book        |
| DELETE | /books/{id}     | Delete book        |

### Members
| Method | Path             | Description         |
|--------|------------------|---------------------|
| GET    | /members/        | List / search       |
| POST   | /members/        | Create member       |
| GET    | /members/{id}    | Get member          |
| PUT    | /members/{id}    | Update member       |
| DELETE | /members/{id}    | Delete member       |

### Loans
| Method | Path                  | Description       |
|--------|-----------------------|-------------------|
| GET    | /loans/               | List loans        |
| POST   | /loans/borrow         | Borrow a book     |
| POST   | /loans/return/{id}    | Return a book     |
| GET    | /loans/{id}           | Get loan details  |

### Dashboard
| Method | Path               | Description    |
|--------|--------------------|----------------|
| GET    | /dashboard/stats   | Summary stats  |

---

## Project Structure

```
library-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── db/connection.py # DB pool
│   │   ├── models/schemas.py# Pydantic models
│   │   └── routes/          # books, members, loans, dashboard
│   ├── proto/library.proto  # Protobuf definitions
│   ├── schema.sql           # DB schema + seed data
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           # Next.js pages (index, books, members, loans)
│       ├── components/      # Layout, UI components
│       └── lib/api.ts       # Axios API client
└── docker-compose.yml
```
