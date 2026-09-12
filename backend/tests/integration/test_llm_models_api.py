"""The model endpoints, against the real database."""

from uuid import uuid4

from fastapi.testclient import TestClient


def unique(prefix: str) -> str:
    """A name no existing row can already be using."""
    return f"{prefix}-{uuid4().hex[:8]}"


def as_int(value: object) -> int:
    """Narrow a JSON field for the type checker, asserting its shape."""
    assert isinstance(value, int)

    return value


def make_provider(client: TestClient) -> int:
    """Add a provider and return its id."""
    response = client.post("/providers", json={"name": unique("PROVIDER")})

    assert response.status_code == 201

    return int(response.json()["id"])


def create(
    client: TestClient,
    provider_id: int | None = None,
    **fields: object,
) -> dict[str, object]:
    """Add a model and return the body the API sent back."""
    payload: dict[str, object] = {
        "provider_id": provider_id or make_provider(client),
        "name": unique("model"),
        **fields,
    }
    response = client.post("/models", json=payload)

    assert response.status_code == 201

    return dict(response.json())


def test_creating_a_model_returns_it(client: TestClient) -> None:
    """The new row comes back with its id and defaults filled in."""
    body = create(client)

    assert body["is_active"] is True
    assert body["input_price"] == "0.000000"


def test_prices_are_stored_as_given(client: TestClient) -> None:
    """All four rates round-trip at full precision."""
    body = create(
        client,
        input_price="1.250000",
        cached_input_price="0.125000",
        cache_write_price="1.562500",
        output_price="6.250000",
    )

    assert body["input_price"] == "1.250000"
    assert body["cached_input_price"] == "0.125000"
    assert body["cache_write_price"] == "1.562500"
    assert body["output_price"] == "6.250000"


def test_a_model_needs_a_real_provider(client: TestClient) -> None:
    """A dangling provider id is a 404, not a 500 from the foreign key."""
    response = client.post(
        "/models",
        json={"provider_id": 999999, "name": unique("model")},
    )

    assert response.status_code == 404


def test_a_negative_price_is_rejected(client: TestClient) -> None:
    """Validation refuses it before the check constraint has to."""
    response = client.post(
        "/models",
        json={
            "provider_id": make_provider(client),
            "name": unique("model"),
            "input_price": "-1.0",
        },
    )

    assert response.status_code == 422


def test_a_duplicate_name_under_one_provider_is_a_conflict(
    client: TestClient,
) -> None:
    """The same provider cannot list a model twice."""
    body = create(client)

    response = client.post(
        "/models",
        json={"provider_id": body["provider_id"], "name": body["name"]},
    )

    assert response.status_code == 409


def test_the_same_name_under_two_providers_is_fine(
    client: TestClient,
) -> None:
    """Uniqueness is per provider, not global."""
    first = create(client)

    response = client.post(
        "/models",
        json={"provider_id": make_provider(client), "name": first["name"]},
    )

    assert response.status_code == 201


def test_reading_a_model_returns_it(client: TestClient) -> None:
    """The id from a create round-trips."""
    body = create(client)

    response = client.get(f"/models/{body['id']}")

    assert response.status_code == 200
    assert response.json()["name"] == body["name"]


def test_reading_an_unknown_model_is_a_404(client: TestClient) -> None:
    """Not a 500, and not an empty 200."""
    assert client.get("/models/999999").status_code == 404


def test_listing_can_be_narrowed_to_one_provider(client: TestClient) -> None:
    """The manage screen groups models under their provider."""
    mine = create(client)
    create(client)

    listed = client.get(
        "/models",
        params={"provider_id": as_int(mine["provider_id"])},
    ).json()

    assert [model["id"] for model in listed] == [mine["id"]]


def test_updating_a_price_leaves_the_others_alone(client: TestClient) -> None:
    """A PATCH must not blank the three rates it does not mention."""
    body = create(client, input_price="2.000000", output_price="8.000000")

    response = client.patch(
        f"/models/{body['id']}",
        json={"output_price": "9.000000"},
    )

    assert response.json()["output_price"] == "9.000000"
    assert response.json()["input_price"] == "2.000000"


def test_renaming_onto_a_taken_name_is_a_conflict(client: TestClient) -> None:
    """The per-provider rule holds on update as well as create."""
    taken = create(client)
    other = create(client, provider_id=as_int(taken["provider_id"]))

    response = client.patch(
        f"/models/{other['id']}",
        json={"name": taken["name"]},
    )

    assert response.status_code == 409


def test_updating_an_unknown_model_is_a_404(client: TestClient) -> None:
    """Nothing to patch."""
    response = client.patch("/models/999999", json={"name": unique("model")})

    assert response.status_code == 404


def test_delete_retires_rather_than_removes(client: TestClient) -> None:
    """Recorded usage still points at it, so the row has to stay."""
    body = create(client)

    assert client.delete(f"/models/{body['id']}").status_code == 204

    after = client.get(f"/models/{body['id']}")

    assert after.status_code == 200
    assert after.json()["is_active"] is False


def test_deleting_an_unknown_model_is_a_404(client: TestClient) -> None:
    """Nothing to retire."""
    assert client.delete("/models/999999").status_code == 404


def test_listing_can_hide_the_retired(client: TestClient) -> None:
    """Callers picking a model want only the live ones."""
    body = create(client)
    client.delete(f"/models/{body['id']}")

    active = client.get("/models", params={"include_inactive": False}).json()

    assert body["id"] not in [model["id"] for model in active]
