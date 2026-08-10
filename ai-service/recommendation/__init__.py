"""
Recommendation module for AgriConnect AI service.
"""

from .service import generate_recommendations
from .market import get_market_intel

__all__ = ["generate_recommendations", "get_market_intel"]
