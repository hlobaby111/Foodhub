#!/usr/bin/env python3
"""
FoodHub Order Flow Testing
Tests the complete order journey from customer registration to delivery completion
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

class OrderFlowTester:
    def __init__(self):
        self.customer_token = None
        self.restaurant_token = None
        self.delivery_token = None
        self.customer_id = None
        self.restaurant_id = None
        self.delivery_partner_id = None
        self.order_id = None
        self.menu_item_id = None
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
    
    def test_health_check(self):
        """Test basic health check"""
        try:
            response = requests.get(f"{API_BASE}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, f"Backend is running - {data.get('message', '')}")
                return True
            else:
                self.log_result("Health Check", False, f"Health check failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Cannot connect to backend: {str(e)}")
            return False
    
    def register_customer(self):
        """Step 1: Login Customer using existing credentials"""
        try:
            # Use existing customer credentials from test_credentials.md
            login_data = {
                "email": "customer@test.com",
                "password": "customer123"
            }
            
            response = requests.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.customer_token = data.get('accessToken') or data.get('token')
                self.customer_id = data.get('user', {}).get('_id') or data.get('user', {}).get('id')
                self.log_result("Login Customer", True, f"Customer logged in successfully - ID: {self.customer_id}")
                return True
            else:
                self.log_result("Login Customer", False, f"Login failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Login Customer", False, f"Login error: {str(e)}")
            return False
    
    def setup_test_data(self):
        """Setup restaurant and menu items for testing"""
        try:
            # Create test restaurant and menu items directly in database
            import pymongo
            from bson import ObjectId
            from datetime import datetime
            
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client.foodhub
            
            # Create test restaurant
            restaurant_data = {
                "_id": ObjectId(),
                "name": "Test Restaurant",
                "description": "Test restaurant for order flow testing",
                "phone": "9876543210",
                "email": "restaurant@test.com",
                "address": "123 Test Street, Test City",
                "location": "Test City",
                "cuisineType": "Multi-Cuisine",
                "status": "approved",
                "isActive": True,
                "openingHours": {
                    "monday": {"open": "09:00", "close": "22:00"},
                    "tuesday": {"open": "09:00", "close": "22:00"},
                    "wednesday": {"open": "09:00", "close": "22:00"},
                    "thursday": {"open": "09:00", "close": "22:00"},
                    "friday": {"open": "09:00", "close": "22:00"},
                    "saturday": {"open": "09:00", "close": "22:00"},
                    "sunday": {"open": "09:00", "close": "22:00"}
                },
                "minimumOrder": 100,
                "deliveryTime": "30-45 mins",
                "rating": 4.5,
                "createdAt": datetime.now()
            }
            
            # Insert or update restaurant
            existing_restaurant = db.restaurants.find_one({"name": "Test Restaurant"})
            if existing_restaurant:
                self.restaurant_id = str(existing_restaurant["_id"])
            else:
                result = db.restaurants.insert_one(restaurant_data)
                self.restaurant_id = str(result.inserted_id)
            
            # Create test menu item
            menu_item_data = {
                "_id": ObjectId(),
                "restaurant": ObjectId(self.restaurant_id),
                "name": "Test Burger",
                "description": "Delicious test burger",
                "price": 299,
                "category": "Main Course",
                "isVegetarian": False,
                "isAvailable": True,
                "createdAt": datetime.now()
            }
            
            # Insert or update menu item
            existing_item = db.menuitems.find_one({"name": "Test Burger", "restaurant": ObjectId(self.restaurant_id)})
            if existing_item:
                self.menu_item_id = str(existing_item["_id"])
            else:
                result = db.menuitems.insert_one(menu_item_data)
                self.menu_item_id = str(result.inserted_id)
            
            self.log_result("Setup Test Data", True, f"Restaurant ID: {self.restaurant_id}, Menu Item ID: {self.menu_item_id}")
            return True
            
        except Exception as e:
            self.log_result("Setup Test Data", False, f"Setup error: {str(e)}")
            return False
    
    def create_order(self):
        """Step 2: Create Order"""
        if not self.customer_token or not self.restaurant_id or not self.menu_item_id:
            self.log_result("Create Order", False, "Missing prerequisites (customer token, restaurant ID, or menu item ID)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.customer_token}"}
            order_data = {
                "restaurantId": self.restaurant_id,
                "items": [
                    {
                        "menuItemId": self.menu_item_id,
                        "name": "Test Burger",
                        "quantity": 2,
                        "price": 299
                    }
                ],
                "deliveryAddress": {
                    "street": "123 Test Street",
                    "city": "Bangalore",
                    "pincode": "560001"
                },
                "paymentMethod": "cash",
                "customerPhone": "+919876543210",
                "notes": "Test order for automated testing"
            }
            
            response = requests.post(f"{API_BASE}/orders", json=order_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                order = data.get('order')
                if order and order.get('_id'):
                    self.order_id = order['_id']
                    self.log_result("Create Order", True, f"Order created successfully - ID: {self.order_id}")
                    return True
                else:
                    self.log_result("Create Order", False, "Invalid order response structure", data)
                    return False
            else:
                self.log_result("Create Order", False, f"Order creation failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Create Order", False, f"Order creation error: {str(e)}")
            return False
    
    def get_order_details(self):
        """Step 3: Get Order Details"""
        if not self.customer_token or not self.order_id:
            self.log_result("Get Order Details", False, "Missing customer token or order ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.customer_token}"}
            response = requests.get(f"{API_BASE}/orders/{self.order_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                order = data.get('order')
                if order and order.get('_id') == self.order_id:
                    self.log_result("Get Order Details", True, f"Order details retrieved - Status: {order.get('orderStatus', 'unknown')}")
                    return True
                else:
                    self.log_result("Get Order Details", False, "Invalid order details response", data)
                    return False
            else:
                self.log_result("Get Order Details", False, f"Failed to get order details: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Order Details", False, f"Get order details error: {str(e)}")
            return False
    
    def setup_restaurant_owner(self):
        """Setup restaurant owner for order management"""
        try:
            # Use existing restaurant owner credentials
            login_data = {
                "email": "owner@test.com",
                "password": "owner123"
            }
            
            response = requests.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.restaurant_token = data.get('accessToken') or data.get('token')
                owner_id = data.get('user', {}).get('_id') or data.get('user', {}).get('id')
                
                # Update restaurant with owner
                import pymongo
                from bson import ObjectId
                
                client = pymongo.MongoClient("mongodb://localhost:27017")
                db = client.foodhub
                
                # Update restaurant with owner
                db.restaurants.update_one(
                    {"_id": ObjectId(self.restaurant_id)},
                    {"$set": {"owner": ObjectId(owner_id)}}
                )
                
                self.log_result("Setup Restaurant Owner", True, "Restaurant owner logged in and linked")
                return True
            else:
                self.log_result("Setup Restaurant Owner", False, f"Owner login failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Setup Restaurant Owner", False, f"Owner setup error: {str(e)}")
            return False
    
    def list_restaurant_orders(self):
        """Step 4: List Orders for Restaurant"""
        if not self.restaurant_token:
            self.log_result("List Restaurant Orders", False, "Missing restaurant token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.restaurant_token}"}
            response = requests.get(f"{API_BASE}/orders/restaurant", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                orders = data.get('orders', [])
                self.log_result("List Restaurant Orders", True, f"Retrieved {len(orders)} orders for restaurant")
                return True
            else:
                self.log_result("List Restaurant Orders", False, f"Failed to get restaurant orders: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("List Restaurant Orders", False, f"List restaurant orders error: {str(e)}")
            return False
    
    def accept_order(self):
        """Step 5: Accept Order (restaurant accepts)"""
        if not self.restaurant_token or not self.order_id:
            self.log_result("Accept Order", False, "Missing restaurant token or order ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.restaurant_token}"}
            accept_data = {"status": "accepted"}
            
            response = requests.put(f"{API_BASE}/orders/{self.order_id}/status", json=accept_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Accept Order", True, "Order accepted by restaurant")
                return True
            else:
                self.log_result("Accept Order", False, f"Failed to accept order: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Accept Order", False, f"Accept order error: {str(e)}")
            return False
    
    def mark_order_ready(self):
        """Step 6: Mark Order Ready (restaurant)"""
        if not self.restaurant_token or not self.order_id:
            self.log_result("Mark Order Ready", False, "Missing restaurant token or order ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.restaurant_token}"}
            ready_data = {"status": "ready"}
            
            response = requests.put(f"{API_BASE}/orders/{self.order_id}/status", json=ready_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Mark Order Ready", True, "Order marked as ready for pickup")
                return True
            else:
                self.log_result("Mark Order Ready", False, f"Failed to mark order ready: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Mark Order Ready", False, f"Mark order ready error: {str(e)}")
            return False
    
    def setup_delivery_partner(self):
        """Setup delivery partner for order delivery"""
        try:
            # Use existing delivery partner credentials
            login_data = {
                "email": "delivery@test.com",
                "password": "delivery123"
            }
            
            response = requests.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.delivery_token = data.get('accessToken') or data.get('token')
                self.delivery_partner_id = data.get('user', {}).get('_id') or data.get('user', {}).get('id')
                self.log_result("Setup Delivery Partner", True, f"Delivery partner logged in - ID: {self.delivery_partner_id}")
                return True
            else:
                self.log_result("Setup Delivery Partner", False, f"Delivery partner login failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Setup Delivery Partner", False, f"Delivery partner setup error: {str(e)}")
            return False
    
    def get_available_orders_for_delivery(self):
        """Step 7: Get Available Orders for Delivery"""
        if not self.delivery_token:
            self.log_result("Get Available Orders", False, "Missing delivery token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.delivery_token}"}
            response = requests.get(f"{API_BASE}/delivery/available", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                orders = data.get('orders', [])
                self.log_result("Get Available Orders", True, f"Retrieved {len(orders)} available orders for delivery")
                return True
            else:
                self.log_result("Get Available Orders", False, f"Failed to get available orders: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Available Orders", False, f"Get available orders error: {str(e)}")
            return False
    
    def accept_delivery(self):
        """Step 8: Accept Delivery (delivery partner)"""
        if not self.delivery_token or not self.order_id:
            self.log_result("Accept Delivery", False, "Missing delivery token or order ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.delivery_token}"}
            response = requests.put(f"{API_BASE}/delivery/accept/{self.order_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Accept Delivery", True, "Delivery accepted by partner")
                return True
            else:
                self.log_result("Accept Delivery", False, f"Failed to accept delivery: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Accept Delivery", False, f"Accept delivery error: {str(e)}")
            return False
    
    def update_delivery_status(self):
        """Step 9: Update Delivery Status"""
        if not self.delivery_token or not self.order_id:
            self.log_result("Update Delivery Status", False, "Missing delivery token or order ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.delivery_token}"}
            location_data = {"lat": 12.9716, "lng": 77.5946}  # Bangalore coordinates
            
            response = requests.put(f"{API_BASE}/delivery/location/{self.order_id}", json=location_data, headers=headers)
            
            if response.status_code == 200:
                self.log_result("Update Delivery Status", True, "Delivery location updated")
                return True
            else:
                self.log_result("Update Delivery Status", False, f"Failed to update delivery status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Update Delivery Status", False, f"Update delivery status error: {str(e)}")
            return False
    
    def complete_delivery(self):
        """Step 10: Complete Delivery"""
        if not self.delivery_token or not self.order_id:
            self.log_result("Complete Delivery", False, "Missing delivery token or order ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.delivery_token}"}
            response = requests.put(f"{API_BASE}/delivery/delivered/{self.order_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Complete Delivery", True, "Order marked as delivered")
                return True
            else:
                self.log_result("Complete Delivery", False, f"Failed to complete delivery: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Complete Delivery", False, f"Complete delivery error: {str(e)}")
            return False
    
    def verify_final_order_status(self):
        """Verify final order status"""
        if not self.customer_token or not self.order_id:
            self.log_result("Verify Final Status", False, "Missing customer token or order ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.customer_token}"}
            response = requests.get(f"{API_BASE}/orders/{self.order_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                order = data.get('order')
                if order:
                    status = order.get('orderStatus')
                    payment_status = order.get('paymentStatus')
                    self.log_result("Verify Final Status", True, f"Final order status: {status}, Payment: {payment_status}")
                    return True
                else:
                    self.log_result("Verify Final Status", False, "Invalid order response")
                    return False
            else:
                self.log_result("Verify Final Status", False, f"Failed to verify final status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Verify Final Status", False, f"Verify final status error: {str(e)}")
            return False
    
    def run_complete_order_flow(self):
        """Run the complete order flow test"""
        print("🚀 Starting FoodHub Complete Order Flow Testing")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 80)
        
        # Step 0: Health check
        if not self.test_health_check():
            print("❌ Cannot proceed without backend connectivity")
            return False
        
        # Setup phase
        if not self.setup_test_data():
            print("❌ Cannot proceed without test data setup")
            return False
        
        # Step 1: Login Customer
        if not self.register_customer():
            print("❌ Cannot proceed without customer registration")
            return False
        
        # Step 2: Create Order
        if not self.create_order():
            print("❌ Cannot proceed without order creation")
            return False
        
        # Step 3: Get Order Details
        self.get_order_details()
        
        # Setup restaurant owner
        if not self.setup_restaurant_owner():
            print("⚠️ Restaurant owner setup failed, continuing with limited testing")
        else:
            # Step 4: List Restaurant Orders
            self.list_restaurant_orders()
            
            # Step 5: Accept Order
            self.accept_order()
            
            # Step 6: Mark Order Ready
            self.mark_order_ready()
        
        # Setup delivery partner
        if not self.setup_delivery_partner():
            print("⚠️ Delivery partner setup failed, continuing with limited testing")
        else:
            # Step 7: Get Available Orders
            self.get_available_orders_for_delivery()
            
            # Step 8: Accept Delivery
            self.accept_delivery()
            
            # Step 9: Update Delivery Status
            self.update_delivery_status()
            
            # Step 10: Complete Delivery
            self.complete_delivery()
        
        # Final verification
        self.verify_final_order_status()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 ORDER FLOW TEST SUMMARY")
        print("=" * 80)
        
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
        
        # Show successful tests
        successful_tests = [r for r in self.results if r['success']]
        if successful_tests:
            print("\n✅ SUCCESSFUL TESTS:")
            for test in successful_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = OrderFlowTester()
    success = tester.run_complete_order_flow()
    sys.exit(0 if success else 1)