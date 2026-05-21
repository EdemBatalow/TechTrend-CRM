from pathlib import Path
from dotenv import load_dotenv
import os
from typing import List


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/techtrend_crm",
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_SUPER_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_API_BASE_URL: str = os.getenv("AI_API_BASE_URL", "https://api.openai.com/v1")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    AI_REQUEST_TIMEOUT: int = int(os.getenv("AI_REQUEST_TIMEOUT", "30"))
    EXTERNAL_AVITO_URL: str = os.getenv("EXTERNAL_AVITO_URL", "")
    EXTERNAL_DOMCLICK_URL: str = os.getenv("EXTERNAL_DOMCLICK_URL", "")
    EXTERNAL_CIAN_URL: str = os.getenv("EXTERNAL_CIAN_URL", "")
    EXTERNAL_CBR_URL: str = os.getenv("EXTERNAL_CBR_URL", "")
    EXTERNAL_AVITO_REGEX: str = os.getenv("EXTERNAL_AVITO_REGEX", r'data-price="([\d\s]+)"')
    EXTERNAL_DOMCLICK_REGEX: str = os.getenv("EXTERNAL_DOMCLICK_REGEX", r'data-price="([\d\s]+)"')
    EXTERNAL_CIAN_REGEX: str = os.getenv("EXTERNAL_CIAN_REGEX", r'data-price="([\d\s]+)"')
    EXTERNAL_CBR_RATE_REGEX: str = os.getenv("EXTERNAL_CBR_RATE_REGEX", r'(\d+[.,]\d+)\s*%')
    EXTERNAL_ALLOW_FIXTURES: bool = os.getenv("EXTERNAL_ALLOW_FIXTURES", "false").lower() in {"1", "true", "yes"}
    EXTERNAL_REQUEST_TIMEOUT: int = int(os.getenv("EXTERNAL_REQUEST_TIMEOUT", "10"))

    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "BACKEND_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]


settings = Settings()

