import os
import time
import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from auth import verify_supabase_token


TEST_SECRET = "super-secret-supabase-jwt-key-for-testing-12345"


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    monkeypatch.setenv("USE_DEV_AUTH", "false")


def test_verify_supabase_token_valid():
    user_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    payload = {
        "sub": user_id,
        "email": "farmer@agriconnect.in",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    verified_id = verify_supabase_token(creds)
    assert verified_id == user_id


def test_verify_supabase_token_expired():
    payload = {
        "sub": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "aud": "authenticated",
        "exp": int(time.time()) - 3600,
    }
    token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token(creds)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


def test_verify_supabase_token_invalid_secret():
    payload = {
        "sub": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, "wrong-secret-key", algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(HTTPException) as exc_info:
        verify_supabase_token(creds)

    assert exc_info.value.status_code == 401


def test_verify_supabase_token_dev_auth_fallback(monkeypatch):
    monkeypatch.setenv("USE_DEV_AUTH", "true")
    verified_id = verify_supabase_token(None)
    assert verified_id == "00000000-0000-0000-0000-000000000000"
