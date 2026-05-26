"""Database connection pool and helpers."""
import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

_pool: pool.ThreadedConnectionPool | None = None


def get_pool() -> pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        dsn = os.getenv(
            "DATABASE_URL",
            "postgresql://library_user:library_pass@localhost:5432/library_db",
        )
        _pool = pool.ThreadedConnectionPool(minconn=1, maxconn=10, dsn=dsn)
    return _pool


def get_conn():
    return get_pool().getconn()


def release_conn(conn):
    get_pool().putconn(conn)


class DB:
    """Context-manager that borrows a connection from the pool."""

    def __enter__(self):
        self.conn = get_conn()
        self.conn.autocommit = False
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.conn.rollback()
        else:
            self.conn.commit()
        release_conn(self.conn)

    def cursor(self):
        return self.conn.cursor(cursor_factory=RealDictCursor)

    def execute(self, sql: str, params=None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def fetchone(self, sql: str, params=None):
        cur = self.execute(sql, params)
        return cur.fetchone()

    def fetchall(self, sql: str, params=None):
        cur = self.execute(sql, params)
        return cur.fetchall()
