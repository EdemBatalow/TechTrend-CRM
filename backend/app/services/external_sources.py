from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
from statistics import mean
from urllib.error import HTTPError, URLError
import gzip
from urllib.request import Request, urlopen

from ..config import settings


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"


@dataclass
class ExternalSnapshot:
    avito_avg_price: float
    domclick_avg_price: float
    cian_avg_price: float
    cbr_key_rate: float


def _read_file(name: str) -> str:
    path = DATA_DIR / name
    return path.read_text(encoding="utf-8")


def _extract_numbers(pattern: str, text: str) -> list[float]:
    return [float(m.replace(" ", "").replace(",", ".")) for m in re.findall(pattern, text)]


def _fetch_html(url: str) -> str:
    if not url:
        raise ValueError("URL не указан")
    request = Request(
        url,
        headers={
            "User-Agent": "TechTrendCRM/1.0",
            "Accept-Encoding": "gzip",
        },
    )
    with urlopen(request, timeout=settings.EXTERNAL_REQUEST_TIMEOUT) as response:
        raw = response.read()
        if response.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return raw.decode("utf-8", errors="ignore")


def _parse_from_url(url: str, pattern: str, label: str) -> float:
    try:
        html = _fetch_html(url)
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError(f"{label}: ошибка запроса ({exc})") from exc
    values = _extract_numbers(pattern, html)
    if not values:
        raise RuntimeError(f"{label}: не найдены значения по шаблону")
    return float(mean(values))


def parse_avito() -> float:
    html = _read_file("avito.html")
    prices = _extract_numbers(settings.EXTERNAL_AVITO_REGEX, html)
    return float(mean(prices)) if prices else 0.0


def parse_domclick() -> float:
    html = _read_file("domclick.html")
    prices = _extract_numbers(settings.EXTERNAL_DOMCLICK_REGEX, html)
    return float(mean(prices)) if prices else 0.0


def parse_cian() -> float:
    html = _read_file("cian.html")
    prices = _extract_numbers(settings.EXTERNAL_CIAN_REGEX, html)
    return float(mean(prices)) if prices else 0.0


def parse_cbr() -> float:
    html = _read_file("cbr.html")
    rates = _extract_numbers(settings.EXTERNAL_CBR_RATE_REGEX, html)
    return float(mean(rates)) if rates else 0.0


def load_external_snapshot() -> ExternalSnapshot:
    errors: list[str] = []

    def resolve(label: str, url: str, pattern: str, fallback) -> float:
        if url:
            try:
                return _parse_from_url(url, pattern, label)
            except RuntimeError as exc:
                errors.append(str(exc))
        if settings.EXTERNAL_ALLOW_FIXTURES:
            return fallback()
        errors.append(f"{label}: URL не задана")
        return 0.0

    avito_avg_price = resolve("avito", settings.EXTERNAL_AVITO_URL, settings.EXTERNAL_AVITO_REGEX, parse_avito)
    domclick_avg_price = resolve("domclick", settings.EXTERNAL_DOMCLICK_URL, settings.EXTERNAL_DOMCLICK_REGEX, parse_domclick)
    cian_avg_price = resolve("cian", settings.EXTERNAL_CIAN_URL, settings.EXTERNAL_CIAN_REGEX, parse_cian)
    cbr_key_rate = resolve("cbr", settings.EXTERNAL_CBR_URL, settings.EXTERNAL_CBR_RATE_REGEX, parse_cbr)

    if errors and not settings.EXTERNAL_ALLOW_FIXTURES:
        raise RuntimeError("; ".join(errors))

    return ExternalSnapshot(
        avito_avg_price=avito_avg_price,
        domclick_avg_price=domclick_avg_price,
        cian_avg_price=cian_avg_price,
        cbr_key_rate=cbr_key_rate,
    )
