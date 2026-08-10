"""
Database persistence module for AgriConnect AI Service.

Uses supabase-py with SUPABASE_SERVICE_ROLE_KEY to write generated recommendations
directly into Supabase Postgres `crop_recommendations` table.
"""

import os
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

try:
    from supabase import create_client, Client
except ImportError:
    Client = Any  # Fallback for typing if supabase-py isn't installed yet

logger = logging.getLogger("agriconnect.db")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_supabase_client: Optional[Any] = None


def get_supabase_client() -> Optional[Any]:
    """Lazy initializer for Supabase client using Service Role Key."""
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key or url.startswith("https://your-project"):
        logger.warning("⚠️ Supabase credentials not configured. DB persistence disabled.")
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        logger.info("✅ Supabase client initialized successfully")
        return _supabase_client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase client: {e}")
        return None


async def insert_recommendations(user_id: str, recommendations: List[Dict[str, Any]]) -> bool:
    """Insert generated crop recommendations into Supabase `crop_recommendations` table.

    Table Schema (`crop_recommendations`):
      - user_id: UUID
      - crop_name: text
      - suitability_score: numeric
      - profit_estimate: numeric (midpoint of profit_range)
      - risk_score: numeric
      - reasoning: text (newline separated reasoning bullet points)
      - created_at: timestamptz

    Args:
        user_id: Verified UUID of the farmer making the request.
        recommendations: List of crop recommendation dicts returned by service.py.

    Returns:
        bool: True if insert succeeded, False otherwise (never raises exception).
    """
    client = get_supabase_client()
    if not client:
        return False

    now_iso = datetime.now(timezone.utc).isoformat()
    rows_to_insert = []

    for rec in recommendations:
        crop_name = rec.get("crop", rec.get("crop_name", "Unknown"))
        score = rec.get("score", rec.get("suitability_score", 0))
        risk = rec.get("risk", rec.get("risk_score", 0))

        profit_range = rec.get("profit_range", {})
        min_p = profit_range.get("min", 0)
        max_p = profit_range.get("max", 0)
        profit_estimate = (min_p + max_p) / 2.0 if (min_p or max_p) else rec.get("estimated_profit_per_ha", 0)

        reasoning_list = rec.get("reasoning", [])
        reasoning_text = "\n".join(reasoning_list) if isinstance(reasoning_list, list) else str(reasoning_list)

        rows_to_insert.append({
            "user_id": user_id,
            "crop_name": crop_name,
            "suitability_score": score,
            "profit_estimate": profit_estimate,
            "risk_score": risk,
            "reasoning": reasoning_text,
            "created_at": now_iso
        })

    try:
        response = client.table("crop_recommendations").insert(rows_to_insert).execute()
        logger.info(f"✅ Saved {len(rows_to_insert)} recommendation records to Supabase for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"⚠️ Failed to insert recommendations into Supabase: {e}")
        return False
