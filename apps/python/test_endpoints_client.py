#!/usr/bin/env python3
"""
Test FastAPI endpoints using TestClient (no server required).
"""

from fastapi.testclient import TestClient
from app.main import app

def test_endpoints():
    """Test all FastAPI endpoints using TestClient."""
    print("🧪 Testing FastAPI Endpoints with TestClient")
    print("=" * 50)
    
    client = TestClient(app)
    passed = 0
    total = 0
    
    # Test 1: Health endpoint
    total += 1
    print("\n🔍 Testing Health Endpoint...")
    try:
        response = client.get("/health/")
        if response.status_code == 200:
            data = response.json()
            if "status" in data and "message" in data:
                print(f"✅ Health endpoint working - Status: {data['status']}")
                passed += 1
            else:
                print("❌ Health endpoint missing required fields")
        else:
            print(f"❌ Health endpoint returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    # Test 2: Root endpoint
    total += 1
    print("\n🔍 Testing Root Endpoint...")
    try:
        response = client.get("/")
        if response.status_code == 200:
            data = response.json()
            if "status" in data and "message" in data:
                print(f"✅ Root endpoint working - Status: {data['status']}")
                passed += 1
            else:
                print("❌ Root endpoint missing required fields")
        else:
            print(f"❌ Root endpoint returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    # Test 3: Create resource without auth
    total += 1
    print("\n🔍 Testing Create Resource Auth...")
    try:
        response = client.post("/api/v1/create-resource", json={"test": "data"})
        if response.status_code in [401, 403]:  # Both are valid auth failure codes
            print("✅ Create-resource endpoint properly requires authentication")
            passed += 1
        else:
            print(f"❌ Create-resource should return 401/403 without auth, got {response.status_code}")
    except Exception as e:
        print(f"❌ Create-resource auth test error: {e}")
    
    # Test 4: Rescrape without auth
    total += 1
    print("\n🔍 Testing Rescrape Auth...")
    try:
        response = client.post("/api/v1/rescrape", json={"test": "data"})
        if response.status_code in [401, 422]:  # 422 for validation error, 401 for auth
            print("✅ Rescrape endpoint properly requires authentication/validation")
            passed += 1
        else:
            print(f"❌ Rescrape should return 401/422, got {response.status_code}")
    except Exception as e:
        print(f"❌ Rescrape auth test error: {e}")
    
    # Test 5: OpenAPI docs
    total += 1
    print("\n🔍 Testing OpenAPI Docs...")
    try:
        response = client.get("/docs")
        if response.status_code == 200:
            print("✅ OpenAPI docs accessible")
            passed += 1
        else:
            print(f"❌ OpenAPI docs returned status {response.status_code}")
    except Exception as e:
        print(f"❌ OpenAPI docs error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All endpoint tests passed!")
        return True
    else:
        print("❌ Some endpoint tests failed.")
        return False

if __name__ == "__main__":
    success = test_endpoints()
    exit(0 if success else 1)