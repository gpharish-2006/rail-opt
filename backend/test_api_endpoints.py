from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_routes():
    print("==================================================")
    print("Testing RailOpt FastAPI Endpoints")
    print("==================================================")

    # 1. Health check
    res = client.get("/health")
    print(f"1. GET /health -> Status: {res.status_code} | {res.json()}")
    assert res.status_code == 200

    # 2. Unified Defects
    res = client.get("/api/maintenance/unified-defects")
    print(f"2. GET /api/maintenance/unified-defects -> Status: {res.status_code} | Count: {len(res.json())}")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 3. Generate Plan with OR-Tools CP-SAT Solver
    res = client.post("/api/optimizer/generate-plan", json={"horizon": "24h", "corridor_id": 2, "max_simultaneous_blocks": 3})
    print(f"3. POST /api/optimizer/generate-plan -> Status: {res.status_code}")
    data = res.json()
    print(f"   Mega-Blocks Created: {data.get('mega_blocks_created')} | Hours Saved: {data.get('total_hours_saved')} hrs | Reduction: {data.get('downtime_reduction_pct')}%")
    assert res.status_code == 200
    assert data.get("success") is True

    # 4. Reschedule Event
    res = client.post("/api/optimizer/reschedule", json={"train_id": 1, "delay_mins": 30.0})
    print(f"4. POST /api/optimizer/reschedule -> Status: {res.status_code}")
    rdata = res.json()
    print(f"   Reschedule Event: {rdata.get('event')}")
    assert res.status_code == 200
    assert rdata.get("success") is True

    # 5. Legacy Maintenance Tasks (Frontend Compatibility)
    res = client.get("/api/maintenance")
    print(f"5. GET /api/maintenance -> Status: {res.status_code} | Count: {len(res.json())}")
    assert res.status_code == 200

    # 6. Legacy Blocks (Frontend Compatibility)
    res = client.get("/api/blocks")
    print(f"6. GET /api/blocks -> Status: {res.status_code} | Count: {len(res.json())}")
    assert res.status_code == 200

    print("\n==================================================")
    print("ALL FASTAPI ENDPOINTS TESTED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_routes()
