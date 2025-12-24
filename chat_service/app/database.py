from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, QueuePool
import os
from dotenv import load_dotenv

load_dotenv()

# Lấy connection string từ biến môi trường
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://neondb_owner:npg_KAfWchp6Yk2M@ep-aged-art-a1d5mj5h-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
)

# Configure engine with connection pool settings
# NullPool: Tạo connection mới cho mỗi request (tránh connection reuse issues)
# Hoặc dùng QueuePool với pool settings nếu muốn connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Tạo connection mới mỗi lần, tránh stale connections
    # Alternative với pooling:
    # poolclass=QueuePool,
    # pool_size=5,
    # max_overflow=10,
    # pool_pre_ping=True,  # Test connection trước khi dùng
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency để inject database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()