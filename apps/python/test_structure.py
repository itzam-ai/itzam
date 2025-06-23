#!/usr/bin/env python3
"""
Test script to verify the FastAPI application structure.
"""

def test_imports():
    """Test that all modules can be imported correctly."""
    try:
        from app.main import app
        from app.config import settings
        from app.schemas import HealthResponse, CreateResourceRequest
        from app.supabase import get_supabase_client
        from app.dependencies import verify_auth_token
        from app.services import get_text_from_tika, generate_file_title
        from app.routers import health, resources
        
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_app_creation():
    """Test that the FastAPI app can be created."""
    try:
        from app.main import app
        assert app is not None
        assert hasattr(app, 'routes')
        print("✅ FastAPI app created successfully")
        return True
    except Exception as e:
        print(f"❌ App creation error: {e}")
        return False

def test_routes():
    """Test that routes are properly configured."""
    try:
        from app.main import app
        from fastapi.routing import APIRoute
        
        routes = [route for route in app.routes if isinstance(route, APIRoute)]
        route_paths = [route.path for route in routes]
        
        expected_routes = [
            "/health/",
            "/api/v1/create-resource",
            "/api/v1/rescrape",
            "/"
        ]
        
        for expected_route in expected_routes:
            if expected_route not in route_paths:
                print(f"❌ Missing route: {expected_route}")
                return False
        
        print(f"✅ All {len(expected_routes)} routes configured correctly")
        print("   Routes found:")
        for route in routes:
            print(f"     {list(route.methods)} {route.path}")
        return True
    except Exception as e:
        print(f"❌ Route test error: {e}")
        return False

def test_config():
    """Test configuration loading."""
    try:
        from app.config import settings
        
        assert hasattr(settings, 'API_TITLE')
        assert hasattr(settings, 'API_VERSION')
        assert hasattr(settings, 'TIKA_URL')
        
        print("✅ Configuration loaded successfully")
        print(f"   API Title: {settings.API_TITLE}")
        print(f"   API Version: {settings.API_VERSION}")
        print(f"   Tika URL: {settings.TIKA_URL}")
        return True
    except Exception as e:
        print(f"❌ Config test error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing FastAPI Application Structure")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_app_creation,
        test_routes,
        test_config
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! FastAPI structure is working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 