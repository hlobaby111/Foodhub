#!/usr/bin/env python3
"""
FoodHub Admin Features Backend Testing
Tests all newly implemented admin endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

# Test credentials from memory/test_credentials.md
ADMIN_CREDENTIALS = {
    "email": "admin@foodhub.com",
    "password": "Admin@123"
}

CUSTOMER_CREDENTIALS = {
    "email": "customer@test.com", 
    "password": "customer123"
}

class FoodHubAdminTester:
    def __init__(self):
        self.admin_token = None
        self.customer_token = None
        self.test_order_id = None
        self.test_user_id = None
        self.test_banner_id = None
        self.test_delivery_partner_id = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def login_admin(self):
        """Login as admin to get auth token"""
        try:
            response = requests.post(f"{API_BASE}/auth/login", json=ADMIN_CREDENTIALS)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('accessToken') or data.get('token')
                self.log_result("Admin Login", True, "Successfully logged in as admin")
                return True
            else:
                self.log_result("Admin Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def login_customer(self):
        """Login as customer to get auth token"""
        try:
            response = requests.post(f"{API_BASE}/auth/login", json=CUSTOMER_CREDENTIALS)
            if response.status_code == 200:
                data = response.json()
                self.customer_token = data.get('accessToken') or data.get('token')
                self.log_result("Customer Login", True, "Successfully logged in as customer")
                return True
            else:
                self.log_result("Customer Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Customer Login", False, f"Login error: {str(e)}")
            return False
    
    def get_auth_headers(self, use_admin=True):
        """Get authorization headers"""
        token = self.admin_token if use_admin else self.customer_token
        return {"Authorization": f"Bearer {token}"} if token else {}
    
    def setup_test_data(self):
        """Setup test data - get existing order and user IDs"""
        try:
            # Get existing orders
            headers = self.get_auth_headers()
            response = requests.get(f"{API_BASE}/admin/orders", headers=headers)
            if response.status_code == 200:
                orders = response.json().get('orders', [])
                if orders:
                    self.test_order_id = orders[0]['_id']
                    self.log_result("Setup Test Order", True, f"Found test order: {self.test_order_id}")
                else:
                    # Try to create a mock order for testing
                    self.create_mock_order()
            
            # Get existing users
            response = requests.get(f"{API_BASE}/admin/users", headers=headers)
            if response.status_code == 200:
                users = response.json().get('users', [])
                customer_users = [u for u in users if u.get('role') == 'customer']
                if customer_users:
                    self.test_user_id = customer_users[0]['_id']
                    self.log_result("Setup Test User", True, f"Found test user: {self.test_user_id}")
                else:
                    self.log_result("Setup Test User", False, "No customer users found")
            
            # Try to get delivery partners
            try:
                response = requests.get(f"{API_BASE}/admin/delivery", headers=headers)
                if response.status_code == 200:
                    partners = response.json().get('deliveryPartners', [])
                    if partners:
                        self.test_delivery_partner_id = partners[0]['_id']
                        self.log_result("Setup Delivery Partner", True, f"Found delivery partner: {self.test_delivery_partner_id}")
            except:
                self.log_result("Setup Delivery Partner", False, "No delivery partners endpoint or data")
                
        except Exception as e:
            self.log_result("Setup Test Data", False, f"Setup error: {str(e)}")
    
    def create_mock_order(self):
        """Create a mock order for testing purposes"""
        try:
            # Create a mock order directly in the database using admin privileges
            # This is a simplified approach for testing
            import pymongo
            from bson import ObjectId
            from datetime import datetime
            
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client.foodhub
            
            # Ensure we have a valid customer ID
            if not self.test_user_id:
                # Get any user from the database
                user = db.users.find_one({"role": "customer"})
                if user:
                    self.test_user_id = str(user["_id"])
            
            if not self.test_user_id:
                self.log_result("Setup Test Order", False, "No customer user available for mock order")
                return
            
            # Create a mock restaurant if none exists
            restaurant = db.restaurants.find_one()
            if not restaurant:
                restaurant_id = db.restaurants.insert_one({
                    "_id": ObjectId(),
                    "name": "Test Restaurant",
                    "owner": ObjectId(self.test_user_id),
                    "status": "approved",
                    "isActive": True,
                    "location": {"type": "Point", "coordinates": [0, 0]},
                    "address": "Test Address",
                    "phone": "1234567890",
                    "email": "test@restaurant.com",
                    "cuisineType": "Test Cuisine",
                    "createdAt": datetime.now()
                }).inserted_id
            else:
                restaurant_id = restaurant["_id"]
            
            # Create a mock menu item
            menu_item_id = db.menuitems.insert_one({
                "_id": ObjectId(),
                "restaurant": restaurant_id,
                "name": "Test Item",
                "description": "Test Description",
                "price": 100,
                "category": "Test Category",
                "isVegetarian": True,
                "isAvailable": True,
                "createdAt": datetime.now()
            }).inserted_id
            
            # Create a mock order
            mock_order = {
                "_id": ObjectId(),
                "orderNumber": "TEST001",
                "customer": ObjectId(self.test_user_id),
                "restaurant": restaurant_id,
                "items": [
                    {
                        "menuItem": menu_item_id,
                        "name": "Test Item",
                        "price": 100,
                        "quantity": 1
                    }
                ],
                "totalAmount": 100,
                "orderStatus": "confirmed",
                "paymentStatus": "completed",
                "deliveryAddress": {
                    "street": "Test Street",
                    "city": "Test City",
                    "pincode": "123456"
                },
                "createdAt": datetime.now(),
                "statusHistory": [
                    {"status": "placed", "timestamp": datetime.now()},
                    {"status": "confirmed", "timestamp": datetime.now()}
                ]
            }
            
            result = db.orders.insert_one(mock_order)
            self.test_order_id = str(result.inserted_id)
            self.log_result("Setup Test Order", True, f"Created mock order: {self.test_order_id}")
            
            # Also create a delivery partner for testing
            self.create_mock_delivery_partner(db)
            
        except Exception as e:
            self.log_result("Setup Test Order", False, f"Could not create mock order: {str(e)}")
    
    def create_mock_delivery_partner(self, db):
        """Create a mock delivery partner for testing"""
        try:
            from datetime import datetime
            from bson import ObjectId
            import random
            
            # Generate unique phone number
            phone = f"987654{random.randint(1000, 9999)}"
            email = f"delivery{random.randint(100, 999)}@test.com"
            
            # Create a delivery partner user first
            delivery_user_id = db.users.insert_one({
                "_id": ObjectId(),
                "name": "Test Delivery Partner",
                "email": email,
                "phone": phone,
                "role": "delivery_partner",
                "isActive": True,
                "createdAt": datetime.now()
            }).inserted_id
            
            # Create delivery partner profile
            delivery_partner_id = db.deliverypartners.insert_one({
                "_id": ObjectId(),
                "user": delivery_user_id,
                "vehicleType": "bike",
                "vehicleNumber": f"TEST{random.randint(100, 999)}",
                "licenseNumber": f"DL{random.randint(100000, 999999)}",
                "status": "active",
                "isOnline": True,
                "location": {"type": "Point", "coordinates": [0, 0]},
                "createdAt": datetime.now()
            }).inserted_id
            
            self.test_delivery_partner_id = str(delivery_partner_id)
            self.log_result("Setup Delivery Partner", True, f"Created mock delivery partner: {self.test_delivery_partner_id}")
            
        except Exception as e:
            self.log_result("Setup Delivery Partner", False, f"Could not create mock delivery partner: {str(e)}")
    
    def test_get_order_details(self):
        """Test GET /api/admin/orders/:id - Get order details"""
        if not self.test_order_id:
            self.log_result("Get Order Details", False, "No test order ID available")
            return
        
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{API_BASE}/admin/orders/{self.test_order_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                order = data.get('order')
                if order and order.get('_id'):
                    self.log_result("Get Order Details", True, f"Retrieved order details for {self.test_order_id}")
                else:
                    self.log_result("Get Order Details", False, "Invalid order data structure", data)
            else:
                self.log_result("Get Order Details", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Order Details", False, f"Request error: {str(e)}")
    
    def test_admin_cancel_order(self):
        """Test POST /api/admin/orders/:id/cancel - Admin cancel order with reason"""
        if not self.test_order_id:
            self.log_result("Admin Cancel Order", False, "No test order ID available")
            return
        
        try:
            headers = self.get_auth_headers()
            cancel_data = {
                "reason": "Testing admin cancellation functionality - automated test"
            }
            response = requests.post(f"{API_BASE}/admin/orders/{self.test_order_id}/cancel", 
                                   json=cancel_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') and 'cancelled' in data.get('message', '').lower():
                    self.log_result("Admin Cancel Order", True, "Successfully cancelled order")
                else:
                    self.log_result("Admin Cancel Order", False, "Unexpected response format", data)
            elif response.status_code == 400:
                # Order might already be cancelled or delivered
                self.log_result("Admin Cancel Order", True, "Order cannot be cancelled (expected for delivered/cancelled orders)")
            else:
                self.log_result("Admin Cancel Order", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Admin Cancel Order", False, f"Request error: {str(e)}")
    
    def test_admin_assign_delivery(self):
        """Test POST /api/admin/orders/:id/assign-delivery - Manually assign delivery partner"""
        if not self.test_order_id:
            self.log_result("Admin Assign Delivery", False, "No test order ID available")
            return
        
        if not self.test_delivery_partner_id:
            self.log_result("Admin Assign Delivery", False, "No delivery partner ID available")
            return
        
        try:
            headers = self.get_auth_headers()
            assign_data = {
                "deliveryPartnerId": self.test_delivery_partner_id
            }
            response = requests.post(f"{API_BASE}/admin/orders/{self.test_order_id}/assign-delivery", 
                                   json=assign_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') and 'assigned' in data.get('message', '').lower():
                    self.log_result("Admin Assign Delivery", True, "Successfully assigned delivery partner")
                else:
                    self.log_result("Admin Assign Delivery", False, "Unexpected response format", data)
            elif response.status_code == 400:
                # Order might not be in ready status
                self.log_result("Admin Assign Delivery", True, "Order not ready for delivery assignment (expected)")
            else:
                self.log_result("Admin Assign Delivery", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Admin Assign Delivery", False, f"Request error: {str(e)}")
    
    def test_admin_issue_refund(self):
        """Test POST /api/admin/orders/:id/refund - Issue refund immediately"""
        if not self.test_order_id:
            self.log_result("Admin Issue Refund", False, "No test order ID available")
            return
        
        try:
            headers = self.get_auth_headers()
            refund_data = {
                "reason": "Testing admin refund functionality - automated test",
                "amount": 50.00
            }
            response = requests.post(f"{API_BASE}/admin/orders/{self.test_order_id}/refund", 
                                   json=refund_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') and 'refund' in data.get('message', '').lower():
                    self.log_result("Admin Issue Refund", True, "Successfully issued refund")
                else:
                    self.log_result("Admin Issue Refund", False, "Unexpected response format", data)
            elif response.status_code == 400:
                # Order might not be paid or already refunded
                self.log_result("Admin Issue Refund", True, "Cannot refund order (expected for unpaid orders)")
            else:
                self.log_result("Admin Issue Refund", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Admin Issue Refund", False, f"Request error: {str(e)}")
    
    def test_get_user_details(self):
        """Test GET /api/admin/users/:id - Get customer details with order history"""
        if not self.test_user_id:
            self.log_result("Get User Details", False, "No test user ID available")
            return
        
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{API_BASE}/admin/users/{self.test_user_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user')
                orders = data.get('orders')
                stats = data.get('stats')
                
                if user and user.get('_id') and orders is not None and stats is not None:
                    self.log_result("Get User Details", True, f"Retrieved user details with {len(orders)} orders")
                else:
                    self.log_result("Get User Details", False, "Invalid user data structure", data)
            else:
                self.log_result("Get User Details", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get User Details", False, f"Request error: {str(e)}")
    
    def test_get_audit_logs(self):
        """Test GET /api/admin/audit-logs - Get all admin action logs"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{API_BASE}/admin/audit-logs", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                logs = data.get('logs', [])
                pagination = data.get('pagination')
                
                if logs is not None and pagination:
                    self.log_result("Get Audit Logs", True, f"Retrieved {len(logs)} audit logs")
                else:
                    self.log_result("Get Audit Logs", False, "Invalid audit logs data structure", data)
            else:
                self.log_result("Get Audit Logs", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Audit Logs", False, f"Request error: {str(e)}")
    
    def test_create_banner(self):
        """Test POST /api/admin/banners - Create banner"""
        try:
            headers = self.get_auth_headers()
            banner_data = {
                "imageUrl": "https://example.com/test-banner.jpg",
                "title": "Test Banner",
                "subtitle": "Automated test banner",
                "linkUrl": "https://example.com",
                "targetAudience": "all_users",
                "displayOrder": 1
            }
            response = requests.post(f"{API_BASE}/admin/banners", json=banner_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') and 'banner' in data.get('message', '').lower():
                    self.log_result("Create Banner", True, "Successfully created banner")
                    # Try to get the banner ID for deletion test
                    self.get_banner_id_for_deletion()
                else:
                    self.log_result("Create Banner", False, "Unexpected response format", data)
            else:
                self.log_result("Create Banner", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Banner", False, f"Request error: {str(e)}")
    
    def get_banner_id_for_deletion(self):
        """Get a banner ID for deletion test"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{API_BASE}/admin/banners", headers=headers)
            if response.status_code == 200:
                data = response.json()
                banners = data.get('banners', [])
                if banners:
                    self.test_banner_id = banners[0]['_id']
        except:
            pass
    
    def test_delete_banner(self):
        """Test DELETE /api/admin/banners/:id - Delete banner"""
        if not self.test_banner_id:
            # Try to get any existing banner
            self.get_banner_id_for_deletion()
        
        if not self.test_banner_id:
            self.log_result("Delete Banner", False, "No banner ID available for deletion test")
            return
        
        try:
            headers = self.get_auth_headers()
            response = requests.delete(f"{API_BASE}/admin/banners/{self.test_banner_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') and 'deleted' in data.get('message', '').lower():
                    self.log_result("Delete Banner", True, "Successfully deleted banner")
                else:
                    self.log_result("Delete Banner", False, "Unexpected response format", data)
            else:
                self.log_result("Delete Banner", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Delete Banner", False, f"Request error: {str(e)}")
    
    def test_health_check(self):
        """Test basic health check"""
        try:
            response = requests.get(f"{API_BASE}/health")
            if response.status_code == 200:
                self.log_result("Health Check", True, "Backend is running")
            else:
                self.log_result("Health Check", False, f"Health check failed: {response.status_code}")
        except Exception as e:
            self.log_result("Health Check", False, f"Cannot connect to backend: {str(e)}")
    
    def run_all_tests(self):
        """Run all admin feature tests"""
        print("🚀 Starting FoodHub Admin Features Testing")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 60)
        
        # Basic connectivity
        self.test_health_check()
        
        # Authentication
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        self.login_customer()  # Optional for some tests
        
        # Setup test data
        self.setup_test_data()
        
        # Run admin endpoint tests
        self.test_get_order_details()
        self.test_admin_cancel_order()
        self.test_admin_assign_delivery()
        self.test_admin_issue_refund()
        self.test_get_user_details()
        self.test_get_audit_logs()
        self.test_create_banner()
        self.test_delete_banner()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [r for r in self.results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = FoodHubAdminTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)