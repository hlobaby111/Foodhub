#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FoodHubAPITester:
    def __init__(self, base_url="https://local-delivery-hub-27.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.customer_token = None
        self.owner_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

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
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

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

    def test_health_check(self):
        """Test API health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@foodhub.com", "password": "Admin@123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_customer_login(self):
        """Test customer login"""
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

    def test_owner_login(self):
        """Test restaurant owner login"""
        success, response = self.run_test(
            "Restaurant Owner Login",
            "POST",
            "auth/login",
            200,
            data={"email": "owner@test.com", "password": "owner123"}
        )
        if success and 'token' in response:
            self.owner_token = response['token']
            return True
        return False

    def test_customer_registration(self):
        """Test new customer registration"""
        test_email = f"newcustomer_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "auth/register",
            201,
            data={
                "name": "New Customer",
                "email": test_email,
                "password": "password123",
                "phone": "9876543210",
                "role": "customer",
                "address": {
                    "street": "123 Test Street",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400001"
                }
            }
        )
        return success

    def test_get_restaurants(self):
        """Test getting restaurants list"""
        success, response = self.run_test(
            "Get Restaurants",
            "GET",
            "restaurants",
            200
        )
        if success and 'restaurants' in response:
            restaurants = response['restaurants']
            if len(restaurants) >= 2:
                self.log_test("Restaurants Count Check", True, f"Found {len(restaurants)} restaurants")
                return True
            else:
                self.log_test("Restaurants Count Check", False, f"Expected at least 2 restaurants, found {len(restaurants)}")
        return False

    def test_get_restaurant_detail(self):
        """Test getting restaurant detail with menu"""
        # First get restaurants to get an ID
        success, response = self.run_test(
            "Get Restaurant for Detail Test",
            "GET",
            "restaurants",
            200
        )
        if success and response.get('restaurants'):
            restaurant_id = response['restaurants'][0]['_id']
            success, detail_response = self.run_test(
                "Get Restaurant Detail",
                "GET",
                f"restaurants/{restaurant_id}",
                200
            )
            if success and 'restaurant' in detail_response and 'menuItems' in detail_response:
                return True
        return False

    def test_search_restaurants(self):
        """Test restaurant search functionality"""
        success, response = self.run_test(
            "Search Restaurants",
            "GET",
            "restaurants?search=pizza",
            200
        )
        return success

    def test_location_filter(self):
        """Test location filter functionality"""
        success, response = self.run_test(
            "Location Filter",
            "GET",
            "restaurants?location=Mumbai",
            200
        )
        return success

    def test_create_order(self):
        """Test order creation (requires customer login)"""
        if not self.customer_token:
            self.log_test("Create Order", False, "Customer not logged in")
            return False

        # First get a restaurant and menu item
        success, response = self.run_test(
            "Get Restaurant for Order",
            "GET",
            "restaurants",
            200
        )
        if not success or not response.get('restaurants'):
            return False

        restaurant = response['restaurants'][0]
        restaurant_id = restaurant['_id']

        # Get menu items
        success, detail_response = self.run_test(
            "Get Menu for Order",
            "GET",
            f"restaurants/{restaurant_id}",
            200
        )
        if not success or not detail_response.get('menuItems'):
            return False

        menu_item = detail_response['menuItems'][0]

        order_data = {
            "restaurantId": restaurant_id,
            "items": [{
                "menuItemId": menu_item['_id'],
                "name": menu_item['name'],
                "quantity": 2
            }],
            "deliveryAddress": {
                "street": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "paymentMethod": "cash",
            "customerPhone": "9876543210",
            "notes": "Test order"
        }

        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            201,
            data=order_data,
            token=self.customer_token
        )
        return success

    def test_get_customer_orders(self):
        """Test getting customer orders"""
        if not self.customer_token:
            self.log_test("Get Customer Orders", False, "Customer not logged in")
            return False

        success, response = self.run_test(
            "Get Customer Orders",
            "GET",
            "orders/my",
            200,
            token=self.customer_token
        )
        return success

    def test_owner_dashboard_access(self):
        """Test owner dashboard endpoints"""
        if not self.owner_token:
            self.log_test("Owner Dashboard Access", False, "Owner not logged in")
            return False

        # Test getting owner's restaurants
        success1, _ = self.run_test(
            "Get Owner Restaurants",
            "GET",
            "restaurants/my",
            200,
            token=self.owner_token
        )

        # Test getting owner's menu items
        success2, _ = self.run_test(
            "Get Owner Menu Items",
            "GET",
            "menu/my",
            200,
            token=self.owner_token
        )

        # Test getting restaurant orders
        success3, _ = self.run_test(
            "Get Restaurant Orders",
            "GET",
            "orders/restaurant",
            200,
            token=self.owner_token
        )

        return success1 and success2 and success3

    def test_admin_dashboard_access(self):
        """Test admin dashboard endpoints"""
        if not self.admin_token:
            self.log_test("Admin Dashboard Access", False, "Admin not logged in")
            return False

        # Test getting dashboard stats
        success1, _ = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200,
            token=self.admin_token
        )

        # Test getting all users
        success2, _ = self.run_test(
            "Get All Users",
            "GET",
            "admin/users",
            200,
            token=self.admin_token
        )

        # Test getting all restaurants
        success3, _ = self.run_test(
            "Get All Restaurants (Admin)",
            "GET",
            "admin/restaurants",
            200,
            token=self.admin_token
        )

        # Test getting all orders
        success4, _ = self.run_test(
            "Get All Orders (Admin)",
            "GET",
            "admin/orders",
            200,
            token=self.admin_token
        )

        return success1 and success2 and success3 and success4

    def test_banners_endpoint(self):
        """Test banners endpoint for home page carousel"""
        success, response = self.run_test(
            "Get Banners",
            "GET",
            "banners",
            200
        )
        if success and 'banners' in response:
            banners = response['banners']
            self.log_test("Banners Count Check", True, f"Found {len(banners)} banners")
            return True
        return success

    def test_order_cancellation(self):
        """Test order cancellation functionality"""
        if not self.customer_token:
            self.log_test("Order Cancellation", False, "Customer not logged in")
            return False

        # First create an order to cancel
        success, response = self.run_test(
            "Get Restaurant for Cancel Test",
            "GET",
            "restaurants",
            200
        )
        if not success or not response.get('restaurants'):
            return False

        restaurant = response['restaurants'][0]
        restaurant_id = restaurant['_id']

        # Get menu items
        success, detail_response = self.run_test(
            "Get Menu for Cancel Test",
            "GET",
            f"restaurants/{restaurant_id}",
            200
        )
        if not success or not detail_response.get('menuItems'):
            return False

        menu_item = detail_response['menuItems'][0]

        order_data = {
            "restaurantId": restaurant_id,
            "items": [{
                "menuItemId": menu_item['_id'],
                "name": menu_item['name'],
                "quantity": 1
            }],
            "deliveryAddress": {
                "street": "123 Cancel Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "paymentMethod": "cash",
            "customerPhone": "9876543210",
            "notes": "Test order for cancellation"
        }

        success, order_response = self.run_test(
            "Create Order for Cancel Test",
            "POST",
            "orders",
            201,
            data=order_data,
            token=self.customer_token
        )
        
        if not success or 'order' not in order_response:
            return False

        order_id = order_response['order']['_id']

        # Test cancellation with insufficient reason (should fail)
        success, _ = self.run_test(
            "Cancel Order - Short Reason (Should Fail)",
            "PUT",
            f"orders/{order_id}/cancel",
            400,  # Should fail with 400
            data={"reason": "short"},
            token=self.customer_token
        )

        # Test cancellation with valid reason
        success, _ = self.run_test(
            "Cancel Order - Valid Reason",
            "PUT",
            f"orders/{order_id}/cancel",
            200,
            data={"reason": "Changed my mind about the order, no longer needed"},
            token=self.customer_token
        )

        return success

    def test_owner_notifications(self):
        """Test owner notifications functionality"""
        if not self.owner_token:
            self.log_test("Owner Notifications", False, "Owner not logged in")
            return False

        # Test getting notifications
        success1, _ = self.run_test(
            "Get Owner Notifications",
            "GET",
            "orders/notifications/list",
            200,
            token=self.owner_token
        )

        # Test marking notifications as read
        success2, _ = self.run_test(
            "Mark Notifications Read",
            "PUT",
            "orders/notifications/read",
            200,
            token=self.owner_token
        )

        return success1 and success2

    def test_unauthorized_access(self):
        """Test that protected endpoints require authentication"""
        success, _ = self.run_test(
            "Unauthorized Access Test",
            "GET",
            "auth/profile",
            401  # Should return 401 without token
        )
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting FoodHub API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False

        # Authentication tests
        print("\n🔐 Authentication Tests:")
        self.test_admin_login()
        self.test_customer_login()
        self.test_owner_login()
        self.test_customer_registration()
        self.test_unauthorized_access()

        # Restaurant tests
        print("\n🏪 Restaurant Tests:")
        self.test_get_restaurants()
        self.test_get_restaurant_detail()
        self.test_search_restaurants()
        self.test_location_filter()

        # Order tests
        print("\n📦 Order Tests:")
        self.test_create_order()
        self.test_get_customer_orders()

        # Dashboard tests
        print("\n📊 Dashboard Tests:")
        self.test_owner_dashboard_access()
        self.test_admin_dashboard_access()

        # New feature tests
        print("\n🆕 New Feature Tests:")
        self.test_banners_endpoint()
        self.test_order_cancellation()
        self.test_owner_notifications()

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
    tester = FoodHubAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())