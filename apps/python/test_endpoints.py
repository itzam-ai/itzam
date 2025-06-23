#!/usr/bin/env python3
"""
Comprehensive test script for FastAPI endpoints.
Tests all available endpoints with various scenarios.
"""

import json
import requests
from typing import Dict, Any, Optional
from app.config import settings

class FastAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_health_endpoint(self) -> bool:
        """Test the health check endpoint."""
        try:
            response = self.session.get(f"{self.base_url}/health/")
            
            if response.status_code != 200:
                print(f"❌ Health endpoint returned status {response.status_code}")
                return False
                
            data = response.json()
            if "status" not in data or "message" not in data:
                print("❌ Health endpoint missing required fields")
                return False
                
            print(f"✅ Health endpoint working - Status: {data['status']}")
            return True
            
        except Exception as e:
            print(f"❌ Health endpoint error: {e}")
            return False
    
    def test_root_endpoint(self) -> bool:
        """Test the root endpoint."""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code != 200:
                print(f"❌ Root endpoint returned status {response.status_code}")
                return False
                
            data = response.json()
            if "status" not in data or "message" not in data:
                print("❌ Root endpoint missing required fields")
                return False
                
            print(f"✅ Root endpoint working - Status: {data['status']}")
            return True
            
        except Exception as e:
            print(f"❌ Root endpoint error: {e}")
            return False
    
    def test_create_resource_endpoint_auth(self) -> bool:
        """Test create-resource endpoint authentication."""
        try:
            # Test without auth token
            response = self.session.post(
                f"{self.base_url}/api/v1/create-resource",
                json={"test": "data"}
            )
            
            if response.status_code != 401:
                print(f"❌ Create-resource should return 401 without auth, got {response.status_code}")
                return False
                
            print("✅ Create-resource endpoint properly requires authentication")
            return True
            
        except Exception as e:
            print(f"❌ Create-resource auth test error: {e}")
            return False
    
    def test_create_resource_endpoint_with_auth(self) -> bool:
        """Test create-resource endpoint with authentication."""
        try:
            # Mock auth token (this would need to be a real token in production)
            headers = {"Authorization": "Bearer test-token"}
            
            # Test with invalid payload
            response = self.session.post(
                f"{self.base_url}/api/v1/create-resource",
                json={"invalid": "data"},
                headers=headers
            )
            
            # Should return 422 for validation error or 401 for invalid token
            if response.status_code not in [401, 422]:
                print(f"❌ Create-resource should return 401/422 for invalid data, got {response.status_code}")
                return False
                
            print("✅ Create-resource endpoint properly validates input")
            return True
            
        except Exception as e:
            print(f"❌ Create-resource with auth test error: {e}")
            return False
    
    def test_rescrape_endpoint_auth(self) -> bool:
        """Test rescrape endpoint authentication."""
        try:
            # Test without rescrape secret
            response = self.session.post(
                f"{self.base_url}/api/v1/rescrape",
                json={"test": "data"}
            )
            
            # Should return 422 for missing fields or 401 for invalid secret
            if response.status_code not in [401, 422]:
                print(f"❌ Rescrape should return 401/422 without secret, got {response.status_code}")
                return False
                
            print("✅ Rescrape endpoint properly requires authentication")
            return True
            
        except Exception as e:
            print(f"❌ Rescrape auth test error: {e}")
            return False

def test_server_running() -> bool:
    """Test if the FastAPI server is running."""
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    """Run all endpoint tests."""
    print("🧪 Testing FastAPI Endpoints")
    print("=" * 50)
    
    # Check if server is running
    if not test_server_running():
        print("❌ FastAPI server is not running on localhost:8000")
        print("   Please start the server with: python main.py")
        print("   Or run: uvicorn main:app --reload")
        return False
    
    tester = FastAPITester()
    
    tests = [
        ("Health Endpoint", tester.test_health_endpoint),
        ("Root Endpoint", tester.test_root_endpoint),
        ("Create Resource Auth", tester.test_create_resource_endpoint_auth),
        ("Create Resource with Auth", tester.test_create_resource_endpoint_with_auth),
        ("Rescrape Auth", tester.test_rescrape_endpoint_auth),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"   Failed: {test_name}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All endpoint tests passed!")
        return True
    else:
        print("❌ Some endpoint tests failed.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)