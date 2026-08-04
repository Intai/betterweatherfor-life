import sys
from unittest.mock import MagicMock

import pytest

# Mock LLM modules before any langraph imports to avoid API key validation at import time.
sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())
sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


@pytest.fixture
def sample_state():
    """Full ForecastState with all required and optional fields."""
    return {
        "latitude": "-36.8485",
        "longitude": "174.7633",
        "date": "2026-03-24",
        "timezone": "Pacific/Auckland",
        "location_slug": "mission-bay",
        "water_quality": '{"quality": "Green"}',
        "tides": '{"nextHigh": "10:30"}',
        "weather": '{"temp": 22}',
        "marine": '{"seaTempC": 20, "waveHeightM": 0.5}',
        "sun_times": '{"sunrise": "07:15", "sunset": "19:30"}',
    }


@pytest.fixture
def minimal_state():
    """ForecastState with only required fields."""
    return {
        "latitude": "-36.8485",
        "longitude": "174.7633",
        "date": "2026-03-24",
        "timezone": "Pacific/Auckland",
        "location_slug": "mission-bay",
    }
