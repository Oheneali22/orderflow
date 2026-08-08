import pytest

from app import create_app, db


@pytest.fixture()
def client(tmp_path):
    database = tmp_path / "tickets.db"
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{database}",
            "SQLALCHEMY_ENGINE_OPTIONS": {},
        }
    )
    with app.app_context():
        db.create_all()
    with app.test_client() as test_client:
        yield test_client
    with app.app_context():
        db.drop_all()


def ticket_payload(**overrides):
    payload = {
        "title": "VPN access fails",
        "description": "The VPN client reports an authentication error.",
        "requester_email": "grace@example.com",
        "priority": "high",
    }
    payload.update(overrides)
    return payload


def test_liveness_does_not_depend_on_database(client):
    response = client.get("/api/live")
    assert response.status_code == 200
    assert response.get_json()["status"] == "alive"


def test_readiness_checks_database(client):
    response = client.get("/api/ready")
    assert response.status_code == 200
    assert response.get_json()["database"] == "connected"


def test_create_and_list_ticket(client):
    created = client.post("/api/tickets", json=ticket_payload())
    assert created.status_code == 201
    assert created.get_json()["status"] == "open"

    listed = client.get("/api/tickets")
    assert listed.status_code == 200
    assert len(listed.get_json()) == 1


def test_create_rejects_missing_fields(client):
    response = client.post("/api/tickets", json={"title": "Incomplete"})
    assert response.status_code == 400
    assert "description" in response.get_json()["fields"]


def test_create_rejects_invalid_priority(client):
    response = client.post("/api/tickets", json=ticket_payload(priority="urgent-ish"))
    assert response.status_code == 400


def test_update_status(client):
    ticket_id = client.post("/api/tickets", json=ticket_payload()).get_json()["id"]
    response = client.patch(
        f"/api/tickets/{ticket_id}/status", json={"status": "in_progress"}
    )
    assert response.status_code == 200
    assert response.get_json()["status"] == "in_progress"


def test_update_rejects_invalid_status(client):
    ticket_id = client.post("/api/tickets", json=ticket_payload()).get_json()["id"]
    response = client.patch(f"/api/tickets/{ticket_id}/status", json={"status": "lost"})
    assert response.status_code == 400


def test_filter_and_stats(client):
    client.post("/api/tickets", json=ticket_payload())
    second = client.post(
        "/api/tickets", json=ticket_payload(title="Printer offline", priority="low")
    ).get_json()
    client.patch(f"/api/tickets/{second['id']}/status", json={"status": "resolved"})

    resolved = client.get("/api/tickets?status=resolved").get_json()
    stats = client.get("/api/stats").get_json()
    assert len(resolved) == 1
    assert stats["total"] == 2
    assert stats["by_status"] == {"open": 1, "resolved": 1}


def test_delete_ticket(client):
    ticket_id = client.post("/api/tickets", json=ticket_payload()).get_json()["id"]
    assert client.delete(f"/api/tickets/{ticket_id}").status_code == 204
    assert client.get(f"/api/tickets/{ticket_id}").status_code == 404
