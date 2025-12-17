"""
Example test file structure for pytest.
To run tests: pytest test_example.py -v
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_questions_empty():
    response = client.get("/questions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_question():
    response = client.post(
        "/questions",
        json={"user_name": "test_user", "message": "Test question"}
    )
    assert response.status_code == 200
    assert "id" in response.json()
    assert response.json()["message"] == "Test question"


def test_create_question_empty_message():
    response = client.post(
        "/questions",
        json={"user_name": "test_user", "message": ""}
    )
    assert response.status_code == 400


def test_register_user():
    response = client.post(
        "/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_register_duplicate_user():
    client.post(
        "/register",
        json={
            "username": "duplicate",
            "email": "duplicate@example.com",
            "password": "testpass123"
        }
    )
    response = client.post(
        "/register",
        json={
            "username": "duplicate",
            "email": "duplicate@example.com",
            "password": "testpass123"
        }
    )
    assert response.status_code == 400


def test_login_invalid_credentials():
    response = client.post(
        "/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        }
    )
    assert response.status_code == 401
