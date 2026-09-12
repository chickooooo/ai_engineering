"""The provider endpoints, against the real database."""

from uuid import uuid4

from fastapi.testclient import TestClient


def unique(prefix: str = "PROVIDER") -> str:
    """A name no existing row can already be using."""
    return f"{prefix}-{uuid4().hex[:8]}"


def create(client: TestClient, name: str | None = None) -> dict[str, object]:
    """Add a provider and return the body the API sent back."""
    response = client.post("/providers", json={"name": name or unique()})

    assert response.status_code == 201

    return dict(response.json())


def test_creating_a_provider_returns_it(client: TestClient) -> None:
    """The new row comes back with its id and defaults filled in."""
    name = unique()
    body = create(client, name)

    assert body["name"] == name
    assert body["is_active"] is True
    assert isinstance(body["id"], int)


def test_a_created_provider_is_listed(client: TestClient) -> None:
    """It is readable straight after the write."""
    body = create(client)

    listed = client.get("/providers").json()

    assert body["id"] in [provider["id"] for provider in listed]


def test_a_duplicate_name_is_a_conflict(client: TestClient) -> None:
    """Two providers of one name would split every cost rollup."""
    name = unique()
    create(client, name)

    response = client.post("/providers", json={"name": name})

    assert response.status_code == 409


def test_an_empty_name_is_rejected(client: TestClient) -> None:
    """Validation refuses it before it reaches the table."""
    assert client.post("/providers", json={"name": ""}).status_code == 422


def test_reading_a_provider_returns_it(client: TestClient) -> None:
    """The id from a create round-trips."""
    body = create(client)

    response = client.get(f"/providers/{body['id']}")

    assert response.status_code == 200
    assert response.json()["name"] == body["name"]


def test_reading_an_unknown_provider_is_a_404(client: TestClient) -> None:
    """Not a 500, and not an empty 200."""
    assert client.get("/providers/999999").status_code == 404


def test_renaming_a_provider(client: TestClient) -> None:
    """A PATCH changes only what it names."""
    body = create(client)
    new_name = unique()

    response = client.patch(
        f"/providers/{body['id']}", json={"name": new_name}
    )

    assert response.status_code == 200
    assert response.json()["name"] == new_name
    assert response.json()["is_active"] is True


def test_renaming_onto_a_taken_name_is_a_conflict(client: TestClient) -> None:
    """The uniqueness rule holds on update as well as create."""
    taken = create(client)
    other = create(client)

    response = client.patch(
        f"/providers/{other['id']}",
        json={"name": taken["name"]},
    )

    assert response.status_code == 409


def test_renaming_a_provider_to_its_own_name_is_allowed(
    client: TestClient,
) -> None:
    """Saving an unchanged form must not trip the uniqueness check."""
    body = create(client)

    response = client.patch(
        f"/providers/{body['id']}",
        json={"name": body["name"]},
    )

    assert response.status_code == 200


def test_deactivating_and_reactivating(client: TestClient) -> None:
    """`is_active` is what the manage screen toggles."""
    body = create(client)

    deactivated = client.patch(
        f"/providers/{body['id']}",
        json={"is_active": False},
    )
    assert deactivated.json()["is_active"] is False

    reactivated = client.patch(
        f"/providers/{body['id']}",
        json={"is_active": True},
    )
    assert reactivated.json()["is_active"] is True


def test_updating_an_unknown_provider_is_a_404(client: TestClient) -> None:
    """Nothing to patch."""
    response = client.patch("/providers/999999", json={"name": unique()})

    assert response.status_code == 404


def test_delete_retires_rather_than_removes(client: TestClient) -> None:
    """Recorded usage still points at it, so the row has to stay."""
    body = create(client)

    assert client.delete(f"/providers/{body['id']}").status_code == 204

    after = client.get(f"/providers/{body['id']}")

    assert after.status_code == 200
    assert after.json()["is_active"] is False


def test_deleting_an_unknown_provider_is_a_404(client: TestClient) -> None:
    """Nothing to retire."""
    assert client.delete("/providers/999999").status_code == 404


def test_listing_can_hide_the_retired(client: TestClient) -> None:
    """The manage screen shows everything; other callers want the live set."""
    body = create(client)
    client.delete(f"/providers/{body['id']}")

    active = client.get(
        "/providers", params={"include_inactive": False}
    ).json()

    assert body["id"] not in [provider["id"] for provider in active]
