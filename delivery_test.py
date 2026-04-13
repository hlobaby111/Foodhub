#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DeliveryAPITester:
    def __init__(self, base_url="https://local-delivery-hub-27.preview.emergentagent.com"):
        self.base_url = base_url
        self.delivery_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            if not success:
                details += f" (expected {expected_status})"
                try:
                    error_data = response.json()
                    if 'message' in error_data:
                        details += f" - {error_data['message']}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_delivery_login(self):
        """Test delivery partner login"""
        success, response = self.run_test(
            "Delivery Partner Login",
            "POST",
            "auth/login",
            200,
            data={"email": "delivery@test.com", "password": "delivery123"}
        )
        if success and 'token' in response:
            self.delivery_token = response['token']
            return True
        return False

    def test_customer_login(self):
        """Test customer login for address tests"""
        success, response = self.run_test(
            "Customer Login",
            "POST",
            "auth/login",
            200,
            data={"email": "customer@test.com", "password": "customer123"}
        )
        if success and 'token' in response:
            self.customer_token = response['token']
            return True
        return False

    def test_delivery_dashboard(self):
        """Test delivery dashboard endpoint"""
        if not self.delivery_token:
            self.log_test("Delivery Dashboard", False, "Delivery partner not logged in")
            return False

        success, response = self.run_test(
            "Get Delivery Dashboard",
            "GET",
            "delivery/dashboard",
            200,
            token=self.delivery_token
        )
        
        if success and 'activeOrders' in response:
            self.log_test("Dashboard Data Check", True, f"Active orders: {len(response['activeOrders'])}")
            return True
        return success

    def test_available_orders(self):
        """Test getting available orders for delivery"""
        if not self.delivery_token:
            self.log_test("Available Orders", False, "Delivery partner not logged in")
            return False

        success, response = self.run_test(
            "Get Available Orders",
            "GET",
            "delivery/available",
            200,
            token=self.delivery_token
        )
        
        if success and 'orders' in response:
            self.log_test("Available Orders Check", True, f"Available orders: {len(response['orders'])}")
            return True
        return success

    def test_toggle_availability(self):
        """Test toggling delivery partner availability"""
        if not self.delivery_token:
            self.log_test("Toggle Availability", False, "Delivery partner not logged in")
            return False

        success, response = self.run_test(
            "Toggle Availability",
            "PUT",
            "delivery/toggle-availability",
            200,
            token=self.delivery_token
        )
        
        if success and 'isAvailable' in response:
            self.log_test("Availability Toggle Check", True, f"Available: {response['isAvailable']}")
            return True
        return success

    def test_address_endpoints(self):
        """Test address management endpoints"""
        if not self.customer_token:
            self.log_test("Address Endpoints", False, "Customer not logged in")
            return False

        # Test getting saved addresses
        success1, response1 = self.run_test(
            "Get Saved Addresses",
            "GET",
            "addresses",
            200,
            token=self.customer_token
        )

        # Test adding new address
        address_data = {
            "label": "Test Address",
            "street": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "isDefault": False
        }

        success2, response2 = self.run_test(
            "Add New Address",
            "POST",
            "addresses",
            201,
            data=address_data,
            token=self.customer_token
        )

        return success1 and success2

    def test_search_endpoint(self):
        """Test instant search endpoint"""
        success, response = self.run_test(
            "Search API - Pizza",
            "GET",
            "search?q=pizza",
            200
        )
        
        if success and ('restaurants' in response or 'dishMatches' in response):
            restaurants = response.get('restaurants', [])
            dishes = response.get('dishMatches', [])
            self.log_test("Search Results Check", True, f"Restaurants: {len(restaurants)}, Dishes: {len(dishes)}")
            return True
        return success

    def run_all_tests(self):
        """Run all delivery and new feature tests"""
        print("🚀 Starting Delivery & New Features API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Authentication
        print("\n🔐 Authentication Tests:")
        self.test_delivery_login()
        self.test_customer_login()

        # Delivery endpoints
        print("\n🚚 Delivery Partner Tests:")
        self.test_delivery_dashboard()
        self.test_available_orders()
        self.test_toggle_availability()

        # Address management
        print("\n📍 Address Management Tests:")
        self.test_address_endpoints()

        # Search functionality
        print("\n🔍 Search Tests:")
        self.test_search_endpoint()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = DeliveryAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())