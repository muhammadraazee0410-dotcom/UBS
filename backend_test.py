#!/usr/bin/env python3
"""
UBS Banking Portal Backend API Testing
Tests all banking functionality including authentication, transfers, beneficiaries, etc.
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

class UBSBankingAPITester:
    def __init__(self, base_url="https://swift-transfer-hub-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")

    def run_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Execute HTTP request and return success status and response data"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            response_data = {}
            
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    response_data = response.json()
                except:
                    response_data = {"raw_response": response.text}
            else:
                response_data = {"raw_response": response.text}
            
            if not success:
                response_data["status_code"] = response.status_code
                
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_authentication(self):
        """Test login functionality"""
        print("\n🔐 Testing Authentication...")
        
        # Test with correct credentials
        success, response = self.run_request(
            "POST", 
            "auth/login", 
            {"email": "admin@ubs.ch", "password": "UBS@2024"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_test_result("Admin Login", True, f"Token obtained: {response['token'][:20]}...")
            
            # Verify user data
            user_data = response.get('user', {})
            expected_fields = ['id', 'email', 'full_name', 'role']
            missing_fields = [field for field in expected_fields if field not in user_data]
            
            if not missing_fields:
                self.log_test_result("User Data Structure", True, f"User: {user_data.get('full_name')}")
            else:
                self.log_test_result("User Data Structure", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test_result("Admin Login", False, f"Response: {response}")
            return False

        # Test get current user
        success, response = self.run_request("GET", "auth/me")
        self.log_test_result("Get Current User", success, f"User ID: {response.get('id', 'N/A')}")
        
        return True

    def test_balances(self):
        """Test balance retrieval"""
        print("\n💰 Testing Account Balances...")
        
        success, response = self.run_request("GET", "balances")
        if success:
            balances = response if isinstance(response, list) else []
            expected_currencies = ['EUR', 'USD', 'CHF']
            expected_amounts = {
                'EUR': 150000883990393.93,
                'USD': 15235883900008.07,
                'CHF': 790000038990.88
            }
            
            found_currencies = []
            for balance in balances:
                currency = balance.get('currency')
                amount = balance.get('balance')
                found_currencies.append(currency)
                
                if currency in expected_amounts:
                    expected = expected_amounts[currency]
                    if abs(amount - expected) < 0.01:
                        self.log_test_result(f"{currency} Balance Verification", True, f"{amount:,.2f}")
                    else:
                        self.log_test_result(f"{currency} Balance Verification", False, f"Expected: {expected}, Got: {amount}")
                
            missing_currencies = set(expected_currencies) - set(found_currencies)
            if not missing_currencies:
                self.log_test_result("All Currencies Present", True, f"Found: {found_currencies}")
            else:
                self.log_test_result("All Currencies Present", False, f"Missing: {list(missing_currencies)}")
        else:
            self.log_test_result("Fetch Balances", False, f"Error: {response}")

    def test_beneficiary_management(self):
        """Test beneficiary CRUD operations"""
        print("\n👥 Testing Beneficiary Management...")
        
        # Get initial beneficiaries
        success, initial_beneficiaries = self.run_request("GET", "beneficiaries")
        self.log_test_result("Fetch Beneficiaries", success)
        
        # Create test beneficiary
        test_beneficiary = {
            "name": "Test Bank Customer",
            "bank_name": "Deutsche Bank AG",
            "account_number": "123456789",
            "iban": "DE89370400440532013000",
            "swift_bic": "DEUTDEFF",
            "country": "Germany",
            "address": "123 Frankfurt St, Frankfurt"
        }
        
        success, created_ben = self.run_request("POST", "beneficiaries", test_beneficiary, 200)
        if success:
            ben_id = created_ben.get('id')
            self.log_test_result("Create Beneficiary", True, f"ID: {ben_id}")
            
            # Verify beneficiary appears in list
            success, all_beneficiaries = self.run_request("GET", "beneficiaries")
            if success:
                ben_ids = [b.get('id') for b in (all_beneficiaries if isinstance(all_beneficiaries, list) else [])]
                found = ben_id in ben_ids
                self.log_test_result("Beneficiary in List", found, f"Total beneficiaries: {len(ben_ids)}")
                
                # Delete the test beneficiary
                if ben_id:
                    success, _ = self.run_request("DELETE", f"beneficiaries/{ben_id}")
                    self.log_test_result("Delete Beneficiary", success)
            else:
                self.log_test_result("Beneficiary in List", False, "Failed to fetch updated list")
        else:
            self.log_test_result("Create Beneficiary", False, f"Error: {created_ben}")

    def test_international_transfers(self):
        """Test international transfer functionality"""
        print("\n🌍 Testing International Transfers...")
        
        # First create a beneficiary for testing
        test_beneficiary = {
            "name": "Transfer Test Customer",
            "bank_name": "Test Bank Ltd",
            "account_number": "987654321",
            "iban": "GB82WEST12345698765432",
            "swift_bic": "TESTGB22",
            "country": "United Kingdom",
            "address": "456 London St, London"
        }
        
        success, ben_response = self.run_request("POST", "beneficiaries", test_beneficiary, 200)
        if not success:
            self.log_test_result("Create Test Beneficiary for Transfer", False, f"Error: {ben_response}")
            return
            
        ben_id = ben_response.get('id')
        self.log_test_result("Create Test Beneficiary for Transfer", True, f"ID: {ben_id}")
        
        # Test different transfer types
        transfer_types = ['MT103', 'PACS008', 'PACS009', 'GPI', 'QUICK_WIRE']
        
        for transfer_type in transfer_types:
            transfer_data = {
                "transfer_type": transfer_type,
                "amount": 1000.00,
                "currency": "EUR",
                "sender_account": "CH93 0027 3001 8839 9039 39",
                "beneficiary_id": ben_id,
                "reference": f"TEST-{transfer_type}-{datetime.now().strftime('%H%M%S')}",
                "purpose": f"Test {transfer_type} transfer",
                "charge_option": "SHA"
            }
            
            success, response = self.run_request("POST", "transfers/international", transfer_data)
            if success:
                tracking_id = response.get('tracking_id')
                swift_message = response.get('swift_message')
                has_swift = swift_message and len(swift_message) > 50
                self.log_test_result(f"{transfer_type} Transfer", True, f"Tracking: {tracking_id}, SWIFT: {'Yes' if has_swift else 'No'}")
            else:
                self.log_test_result(f"{transfer_type} Transfer", False, f"Error: {response}")
        
        # Cleanup - delete test beneficiary
        if ben_id:
            success, _ = self.run_request("DELETE", f"beneficiaries/{ben_id}")
            self.log_test_result("Cleanup Test Beneficiary", success)

    def test_domestic_transfers(self):
        """Test domestic transfer functionality"""
        print("\n🏠 Testing Domestic Transfers...")
        
        # Create test beneficiary for domestic transfer
        test_beneficiary = {
            "name": "Domestic Transfer Test",
            "bank_name": "Swiss Local Bank",
            "account_number": "555666777",
            "iban": "CH56 0483 5012 3456 7800 9",
            "swift_bic": "CRESCHZZ80A",
            "country": "Switzerland",
            "address": "789 Zurich St, Zurich"
        }
        
        success, ben_response = self.run_request("POST", "beneficiaries", test_beneficiary, 200)
        if not success:
            self.log_test_result("Create Domestic Test Beneficiary", False, f"Error: {ben_response}")
            return
            
        ben_id = ben_response.get('id')
        
        domestic_transfer = {
            "amount": 500.00,
            "currency": "CHF",
            "sender_account": "CH93 0027 3003 0000 3899 08",
            "beneficiary_id": ben_id,
            "reference": f"DOMESTIC-TEST-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_request("POST", "transfers/domestic", domestic_transfer)
        if success:
            tracking_id = response.get('tracking_id')
            self.log_test_result("Domestic Transfer", True, f"Tracking: {tracking_id}")
        else:
            self.log_test_result("Domestic Transfer", False, f"Error: {response}")
        
        # Cleanup
        if ben_id:
            success, _ = self.run_request("DELETE", f"beneficiaries/{ben_id}")

    def test_bill_payments(self):
        """Test bill payment functionality"""
        print("\n🧾 Testing Bill Payments...")
        
        bill_payment = {
            "biller_name": "Swiss Electric Company",
            "biller_account": "BILL-12345-CHF",
            "amount": 250.75,
            "currency": "CHF",
            "reference": f"BILL-PAY-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_request("POST", "bills/pay", bill_payment)
        if success:
            payment_id = response.get('id')
            self.log_test_result("Create Bill Payment", True, f"Payment ID: {payment_id}")
            
            # Fetch all bill payments
            success, bills = self.run_request("GET", "bills")
            if success:
                bill_count = len(bills if isinstance(bills, list) else [])
                self.log_test_result("Fetch Bill Payments", True, f"Total bills: {bill_count}")
            else:
                self.log_test_result("Fetch Bill Payments", False, f"Error: {bills}")
        else:
            self.log_test_result("Create Bill Payment", False, f"Error: {response}")

    def test_transactions_and_tracking(self):
        """Test transaction history and payment tracking"""
        print("\n📊 Testing Transactions & Tracking...")
        
        # Get transactions
        success, transactions = self.run_request("GET", "transactions?limit=50")
        if success:
            tx_count = len(transactions if isinstance(transactions, list) else [])
            self.log_test_result("Fetch Transactions", True, f"Found {tx_count} transactions")
        else:
            self.log_test_result("Fetch Transactions", False, f"Error: {transactions}")
        
        # Get transfers for tracking test
        success, transfers = self.run_request("GET", "transfers")
        if success and isinstance(transfers, list) and len(transfers) > 0:
            # Test tracking with first transfer
            first_transfer = transfers[0]
            tracking_id = first_transfer.get('tracking_id')
            
            if tracking_id:
                success, tracking_data = self.run_request("GET", f"tracking/{tracking_id}")
                if success:
                    tracking_history = tracking_data.get('tracking_history', [])
                    self.log_test_result("Payment Tracking", True, f"Tracking steps: {len(tracking_history)}")
                else:
                    self.log_test_result("Payment Tracking", False, f"Error: {tracking_data}")
            else:
                self.log_test_result("Payment Tracking", False, "No tracking ID found")
        else:
            self.log_test_result("Get Transfers for Tracking", False, "No transfers available")

    def test_server_console(self):
        """Test server console functionality"""
        print("\n⚡ Testing Server Console...")
        
        # Test server logs
        success, logs = self.run_request("GET", "server/logs")
        if success:
            log_count = len(logs if isinstance(logs, list) else [])
            self.log_test_result("Fetch Server Logs", True, f"Found {log_count} logs")
        else:
            self.log_test_result("Fetch Server Logs", False, f"Error: {logs}")
        
        # Test console commands
        commands = ['help', 'status', 'balance', 'time', 'version']
        
        for cmd in commands:
            success, response = self.run_request("POST", "server/command", {"command": cmd})
            if success:
                output = response.get('output', '')
                has_output = len(output.strip()) > 0
                self.log_test_result(f"Console Command '{cmd}'", has_output, f"Output length: {len(output)}")
            else:
                self.log_test_result(f"Console Command '{cmd}'", False, f"Error: {response}")

    def test_database_viewer(self):
        """Test database viewer functionality"""
        print("\n🗄️ Testing Database Viewer...")
        
        # Get collections
        success, collections = self.run_request("GET", "database/collections")
        if success:
            col_count = len(collections if isinstance(collections, list) else [])
            self.log_test_result("Fetch Collections", True, f"Found {col_count} collections")
            
            # Test viewing a collection if any exist
            if isinstance(collections, list) and len(collections) > 0:
                first_collection = collections[0].get('name', '')
                if first_collection:
                    success, data = self.run_request("GET", f"database/{first_collection}?limit=5")
                    if success:
                        doc_count = len(data if isinstance(data, list) else [])
                        self.log_test_result(f"View Collection '{first_collection}'", True, f"Docs: {doc_count}")
                    else:
                        self.log_test_result(f"View Collection '{first_collection}'", False, f"Error: {data}")
        else:
            self.log_test_result("Fetch Collections", False, f"Error: {collections}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n📈 Testing Dashboard Stats...")
        
        success, stats = self.run_request("GET", "dashboard/stats")
        if success:
            required_stats = ['total_transactions', 'total_transfers', 'total_beneficiaries', 'system_status']
            missing_stats = [stat for stat in required_stats if stat not in stats]
            
            if not missing_stats:
                self.log_test_result("Dashboard Stats Complete", True, f"Stats: {stats}")
            else:
                self.log_test_result("Dashboard Stats Complete", False, f"Missing: {missing_stats}")
        else:
            self.log_test_result("Dashboard Stats", False, f"Error: {stats}")

    def run_all_tests(self):
        """Execute all test suites"""
        print("🏦 Starting UBS Banking Portal API Tests")
        print("=" * 50)
        
        # Authentication must pass first
        if not self.test_authentication():
            print("\n❌ Authentication failed - cannot continue with other tests")
            return self.generate_summary()
        
        # Run all test suites
        self.test_balances()
        self.test_beneficiary_management()
        self.test_international_transfers()
        self.test_domestic_transfers()
        self.test_bill_payments()
        self.test_transactions_and_tracking()
        self.test_server_console()
        self.test_database_viewer()
        self.test_dashboard_stats()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test execution summary"""
        print("\n" + "=" * 50)
        print("🎯 TEST EXECUTION SUMMARY")
        print("=" * 50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return {
            "tests_run": self.tests_run,
            "tests_passed": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "failed_tests": failed_tests,
            "all_results": self.test_results
        }

def main():
    """Main test execution"""
    print("🔧 Initializing UBS Banking Portal API Tester...")
    
    tester = UBSBankingAPITester()
    results = tester.run_all_tests()
    
    # Return exit code based on results
    if results['success_rate'] >= 80:
        print("\n✅ API tests completed successfully!")
        return 0
    else:
        print(f"\n⚠️ API tests completed with {results['success_rate']:.1f}% success rate")
        return 1

if __name__ == "__main__":
    sys.exit(main())