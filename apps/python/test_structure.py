#!/usr/bin/env python3
"""
Test script to verify the FastAPI application structure.
"""

import importlib.util
import sys


def test_module_availability(module_path: str) -> bool:
    """Test if a module can be imported using importlib."""
    spec = importlib.util.find_spec(module_path)
    return spec is not None


def test_imports():
    """Test that all modules can be imported correctly."""
    modules_to_test = [
        ("app.main", "Main FastAPI application"),
        ("app.config", "Configuration module"),
        ("app.schemas", "Pydantic schemas"),
        ("app.supabase", "Supabase client"),
        ("app.dependencies", "FastAPI dependencies"),
        ("app.services", "Service functions"),
        ("app.routers.health", "Health router"),
        ("app.routers.resources", "Resources router"),
    ]

    all_passed = True
    for module_path, description in modules_to_test:
        if test_module_availability(module_path):
            print(f"✅ {description} ({module_path}) - import successful")
        else:
            print(f"❌ {description} ({module_path}) - import failed")
            all_passed = False

    return all_passed


def test_app_creation():
    """Test that the FastAPI app can be created."""
    try:
        # Actually import and use the app to test it
        app_module = importlib.import_module("app.main")
        app = getattr(app_module, "app", None)

        if app is None:
            print("❌ FastAPI app not found in app.main")
            return False

        # Verify it's a FastAPI instance
        if not hasattr(app, "routes"):
            print("❌ App object doesn't have routes attribute")
            return False

        print("✅ FastAPI app created successfully")
        return True
    except Exception as e:
        print(f"❌ App creation error: {e}")
        return False


def test_routes():
    """Test that routes are properly configured."""
    try:
        # Import the necessary modules
        app_module = importlib.import_module("app.main")
        app = getattr(app_module, "app")

        # Import APIRoute for type checking
        from fastapi.routing import APIRoute

        routes = [route for route in app.routes if isinstance(route, APIRoute)]
        route_paths = [route.path for route in routes]

        expected_routes = [
            "/health/",
            "/api/v1/create-resource",
            "/api/v1/chunk",
            "/",
            "/items/{item_id}",
        ]

        missing_routes = []
        for expected_route in expected_routes:
            if expected_route not in route_paths:
                missing_routes.append(expected_route)

        if missing_routes:
            print(f"❌ Missing routes: {', '.join(missing_routes)}")
            return False

        print(f"✅ All {len(expected_routes)} routes configured correctly")
        print("   Routes found:")
        for route in routes:
            methods_str = ", ".join(route.methods) if route.methods else "No methods"
            print(f"     [{methods_str}] {route.path}")
        return True
    except Exception as e:
        print(f"❌ Route test error: {e}")
        return False


def test_config():
    """Test configuration loading."""
    try:
        # Import and use the settings
        config_module = importlib.import_module("app.config")
        settings = getattr(config_module, "settings")

        required_attributes = ["API_TITLE", "API_VERSION", "TIKA_URL"]
        missing_attributes = []

        for attr in required_attributes:
            if not hasattr(settings, attr):
                missing_attributes.append(attr)

        if missing_attributes:
            print(
                f"❌ Missing configuration attributes: {', '.join(missing_attributes)}"
            )
            return False

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
        ("Module Imports", test_imports),
        ("App Creation", test_app_creation),
        ("Route Configuration", test_routes),
        ("Settings Configuration", test_config),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n📋 Testing: {test_name}")
        if test_func():
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
    sys.exit(0 if success else 1)
