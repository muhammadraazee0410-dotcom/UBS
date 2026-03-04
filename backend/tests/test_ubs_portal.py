"""
UBS Admin Portal Backend API Tests
Tests all core API endpoints for banking operations
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@ubs.ch"
TEST_PASSWORD = "UBS@2024"


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == TEST_EMAIL
        assert "id" in data["user"]
        assert "full_name" in data["user"]
        print(f"✓ Login successful, token received")
    
    def test_login_invalid_password(self):
        """Test login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid password correctly rejected")
    
    def test_login_invalid_email(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "test123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid email correctly rejected")


@pytest.fixture(scope="class")
def auth_token():
    """Get authentication token for protected endpoints"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Authentication failed - skipping authenticated tests")
    return response.json()["token"]


@pytest.fixture(scope="class")
def auth_headers(auth_token):
    """Create headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestBalances:
    """Balance endpoint tests"""
    
    def test_get_balances_authenticated(self, auth_headers):
        """Test getting account balances with valid auth"""
        response = requests.get(f"{BASE_URL}/api/balances", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get balances: {response.text}"
        
        balances = response.json()
        assert isinstance(balances, list), "Balances should be a list"
        assert len(balances) == 3, "Should have 3 currency balances"
        
        # Verify expected currencies
        currencies = [b["currency"] for b in balances]
        assert "EUR" in currencies, "EUR balance missing"
        assert "USD" in currencies, "USD balance missing"
        assert "CHF" in currencies, "CHF balance missing"
        
        # Verify EUR balance value (massive amount)
        eur_balance = next(b for b in balances if b["currency"] == "EUR")
        assert eur_balance["balance"] == 150000883990393.93, f"Unexpected EUR balance: {eur_balance['balance']}"
        assert "iban" in eur_balance
        assert "account_number" in eur_balance
        
        print(f"✓ Got {len(balances)} account balances")
    
    def test_get_balances_unauthenticated(self):
        """Test getting balances without auth token"""
        response = requests.get(f"{BASE_URL}/api/balances")
        assert response.status_code in [401, 403], f"Expected auth error, got {response.status_code}"
        print("✓ Unauthenticated access correctly rejected")


class TestBeneficiaries:
    """Beneficiary CRUD tests"""
    
    def test_get_beneficiaries(self, auth_headers):
        """Test listing beneficiaries"""
        response = requests.get(f"{BASE_URL}/api/beneficiaries", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get beneficiaries: {response.text}"
        
        beneficiaries = response.json()
        assert isinstance(beneficiaries, list)
        print(f"✓ Got {len(beneficiaries)} beneficiaries")
    
    def test_create_beneficiary(self, auth_headers):
        """Test creating a new beneficiary"""
        test_beneficiary = {
            "name": "TEST_QA Beneficiary",
            "bank_name": "TEST Bank AG",
            "account_number": "12345678901",
            "iban": "CH9300762011623852957",
            "swift_bic": "TESTCHZZ",
            "country": "Switzerland",
            "address": "Test Street 123, Zurich"
        }
        
        response = requests.post(f"{BASE_URL}/api/beneficiaries", 
                                 json=test_beneficiary, 
                                 headers=auth_headers)
        assert response.status_code == 200, f"Failed to create beneficiary: {response.text}"
        
        data = response.json()
        assert "id" in data, "No ID in response"
        assert data["name"] == test_beneficiary["name"]
        assert data["swift_bic"] == test_beneficiary["swift_bic"]
        
        # Store ID for deletion
        TestBeneficiaries.created_beneficiary_id = data["id"]
        print(f"✓ Created beneficiary: {data['id']}")
        return data["id"]
    
    def test_delete_beneficiary(self, auth_headers):
        """Test deleting a beneficiary"""
        # Get beneficiary ID from previous test or create one
        beneficiary_id = getattr(TestBeneficiaries, 'created_beneficiary_id', None)
        
        if not beneficiary_id:
            # Create one to delete
            beneficiary_id = self.test_create_beneficiary(auth_headers)
        
        response = requests.delete(f"{BASE_URL}/api/beneficiaries/{beneficiary_id}", 
                                   headers=auth_headers)
        assert response.status_code == 200, f"Failed to delete beneficiary: {response.text}"
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/api/beneficiaries", headers=auth_headers)
        beneficiaries = response.json()
        assert not any(b["id"] == beneficiary_id for b in beneficiaries), "Beneficiary still exists"
        
        print(f"✓ Deleted beneficiary: {beneficiary_id}")


class TestInternationalTransfers:
    """International transfer tests"""
    
    def test_create_mt103_transfer(self, auth_headers):
        """Test creating MT103 international transfer"""
        # First get a beneficiary ID
        ben_response = requests.get(f"{BASE_URL}/api/beneficiaries", headers=auth_headers)
        beneficiaries = ben_response.json()
        
        if not beneficiaries:
            pytest.skip("No beneficiaries available for transfer test")
        
        beneficiary_id = beneficiaries[0]["id"]
        
        # Get sender account
        bal_response = requests.get(f"{BASE_URL}/api/balances", headers=auth_headers)
        balances = bal_response.json()
        sender_iban = balances[0]["iban"]
        
        transfer_data = {
            "transfer_type": "MT103",
            "amount": 10000.50,
            "currency": "EUR",
            "sender_account": sender_iban,
            "beneficiary_id": beneficiary_id,
            "reference": "TEST_INV-2025-001",
            "purpose": "Test Payment",
            "charge_option": "SHA"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/international", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        assert response.status_code == 200, f"Failed to create transfer: {response.text}"
        
        data = response.json()
        assert "id" in data, "No ID in response"
        assert "tracking_id" in data, "No tracking_id in response"
        assert "swift_message" in data, "No swift_message in response"
        assert data["status"] in ["processing", "completed"]
        
        # Verify SWIFT message contains expected content
        swift_msg = data["swift_message"]
        assert "MT103" in swift_msg or "UNION BANK" in swift_msg, "SWIFT message missing expected content"
        
        # Store tracking ID for tracking test
        TestInternationalTransfers.tracking_id = data["tracking_id"]
        
        print(f"✓ Created MT103 transfer with tracking ID: {data['tracking_id']}")
    
    def test_create_pacs008_transfer(self, auth_headers):
        """Test creating PACS.008 international transfer"""
        ben_response = requests.get(f"{BASE_URL}/api/beneficiaries", headers=auth_headers)
        beneficiaries = ben_response.json()
        
        if not beneficiaries:
            pytest.skip("No beneficiaries available")
        
        bal_response = requests.get(f"{BASE_URL}/api/balances", headers=auth_headers)
        balances = bal_response.json()
        
        transfer_data = {
            "transfer_type": "PACS008",
            "amount": 25000.00,
            "currency": "USD",
            "sender_account": balances[1]["iban"],  # USD account
            "beneficiary_id": beneficiaries[0]["id"],
            "reference": "TEST_PACS-2025-001",
            "purpose": "PACS Test",
            "charge_option": "OUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/international", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        assert response.status_code == 200, f"Failed to create PACS.008 transfer: {response.text}"
        
        data = response.json()
        assert "swift_message" in data
        assert "xml" in data["swift_message"].lower() or "pacs" in data["swift_message"].lower()
        
        print(f"✓ Created PACS.008 transfer")


class TestDomesticTransfers:
    """Domestic transfer tests"""
    
    def test_create_domestic_transfer(self, auth_headers):
        """Test creating domestic transfer"""
        ben_response = requests.get(f"{BASE_URL}/api/beneficiaries", headers=auth_headers)
        beneficiaries = ben_response.json()
        
        if not beneficiaries:
            pytest.skip("No beneficiaries available")
        
        bal_response = requests.get(f"{BASE_URL}/api/balances", headers=auth_headers)
        balances = bal_response.json()
        chf_account = next((b for b in balances if b["currency"] == "CHF"), balances[0])
        
        transfer_data = {
            "amount": 5000.00,
            "currency": "CHF",
            "sender_account": chf_account["iban"],
            "beneficiary_id": beneficiaries[0]["id"],
            "reference": "TEST_DOM-2025-001"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/domestic", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        assert response.status_code == 200, f"Failed to create domestic transfer: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "tracking_id" in data
        assert data["status"] == "completed"
        
        print(f"✓ Created domestic transfer")


class TestBillPayments:
    """Bill payment tests"""
    
    def test_create_bill_payment(self, auth_headers):
        """Test creating bill payment"""
        payment_data = {
            "biller_name": "TEST Swiss Electricity",
            "biller_account": "CH9300270018839903939",
            "amount": 250.75,
            "currency": "CHF",
            "reference": "TEST_BILL-2025-001"
        }
        
        response = requests.post(f"{BASE_URL}/api/bills/pay", 
                                 json=payment_data, 
                                 headers=auth_headers)
        assert response.status_code == 200, f"Failed to create bill payment: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["biller_name"] == payment_data["biller_name"]
        assert data["status"] == "completed"
        
        print(f"✓ Created bill payment: {data['id']}")
    
    def test_get_bill_payments(self, auth_headers):
        """Test getting bill payment history"""
        response = requests.get(f"{BASE_URL}/api/bills", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get bills: {response.text}"
        
        payments = response.json()
        assert isinstance(payments, list)
        print(f"✓ Got {len(payments)} bill payments")


class TestTransactionHistory:
    """Transaction history tests"""
    
    def test_get_transactions(self, auth_headers):
        """Test getting transaction history"""
        response = requests.get(f"{BASE_URL}/api/transactions", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get transactions: {response.text}"
        
        transactions = response.json()
        assert isinstance(transactions, list)
        
        if transactions:
            tx = transactions[0]
            assert "id" in tx
            assert "transaction_type" in tx
            assert "amount" in tx
            assert "currency" in tx
            assert "status" in tx
        
        print(f"✓ Got {len(transactions)} transactions")
    
    def test_filter_transactions_by_type(self, auth_headers):
        """Test filtering transactions by type"""
        response = requests.get(f"{BASE_URL}/api/transactions?transaction_type=DOMESTIC", 
                                headers=auth_headers)
        assert response.status_code == 200
        
        transactions = response.json()
        for tx in transactions:
            assert tx["transaction_type"] == "DOMESTIC", f"Got non-domestic: {tx['transaction_type']}"
        
        print(f"✓ Filtered transactions by type")


class TestPaymentTracking:
    """Payment tracking tests"""
    
    def test_track_payment(self, auth_headers):
        """Test tracking a payment by ID"""
        # First get a transfer to track
        response = requests.get(f"{BASE_URL}/api/transfers", headers=auth_headers)
        transfers = response.json()
        
        if not transfers:
            pytest.skip("No transfers available for tracking")
        
        tracking_id = transfers[0].get("tracking_id")
        if not tracking_id:
            pytest.skip("No tracking ID available")
        
        response = requests.get(f"{BASE_URL}/api/tracking/{tracking_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed to track payment: {response.text}"
        
        data = response.json()
        assert "tracking_id" in data
        assert "transfer" in data
        assert "tracking_history" in data
        
        # Verify tracking history has expected statuses
        history = data["tracking_history"]
        assert len(history) >= 1
        
        for status in history:
            assert "status" in status
            assert "timestamp" in status
            assert "location" in status
        
        print(f"✓ Successfully tracked payment: {tracking_id}")
    
    def test_track_invalid_payment(self, auth_headers):
        """Test tracking non-existent payment"""
        response = requests.get(f"{BASE_URL}/api/tracking/INVALID123", headers=auth_headers)
        assert response.status_code == 404
        print("✓ Non-existent payment correctly returns 404")


class TestServerConsole:
    """Server console command tests"""
    
    def test_execute_status_command(self, auth_headers):
        """Test executing 'status' command"""
        response = requests.post(f"{BASE_URL}/api/server/command", 
                                 json={"command": "status"},
                                 headers=auth_headers)
        assert response.status_code == 200, f"Command failed: {response.text}"
        
        data = response.json()
        assert "output" in data
        assert "OPERATIONAL" in data["output"]
        
        print(f"✓ Status command executed successfully")
    
    def test_execute_balance_command(self, auth_headers):
        """Test executing 'balance' command"""
        response = requests.post(f"{BASE_URL}/api/server/command", 
                                 json={"command": "balance"},
                                 headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "EUR" in data["output"]
        assert "USD" in data["output"]
        assert "CHF" in data["output"]
        
        print(f"✓ Balance command executed successfully")
    
    def test_execute_help_command(self, auth_headers):
        """Test executing 'help' command"""
        response = requests.post(f"{BASE_URL}/api/server/command", 
                                 json={"command": "help"},
                                 headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "commands" in data["output"].lower()
        
        print(f"✓ Help command executed successfully")
    
    def test_get_server_logs(self, auth_headers):
        """Test getting server logs"""
        response = requests.get(f"{BASE_URL}/api/server/logs", headers=auth_headers)
        assert response.status_code == 200
        
        logs = response.json()
        assert isinstance(logs, list)
        
        if logs:
            log = logs[0]
            assert "timestamp" in log
            assert "level" in log
            assert "message" in log
            assert "service" in log
        
        print(f"✓ Got {len(logs)} server logs")


class TestDatabase:
    """Database viewer tests"""
    
    def test_get_collections(self, auth_headers):
        """Test getting database collections list"""
        response = requests.get(f"{BASE_URL}/api/database/collections", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get collections: {response.text}"
        
        collections = response.json()
        assert isinstance(collections, list)
        
        # Verify expected collections exist
        collection_names = [c["name"] for c in collections]
        expected = ["beneficiaries", "transfers", "transactions"]
        for exp in expected:
            assert exp in collection_names, f"Missing collection: {exp}"
        
        print(f"✓ Got {len(collections)} collections")
    
    def test_get_collection_data(self, auth_headers):
        """Test getting collection data"""
        response = requests.get(f"{BASE_URL}/api/database/transfers?limit=10", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} documents from transfers collection")


class TestDashboard:
    """Dashboard statistics tests"""
    
    def test_get_dashboard_stats(self, auth_headers):
        """Test getting dashboard statistics"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        stats = response.json()
        assert "total_transactions" in stats
        assert "total_transfers" in stats
        assert "total_beneficiaries" in stats
        assert "pending_transfers" in stats
        assert stats["system_status"] == "operational"
        
        print(f"✓ Dashboard stats: {stats['total_transactions']} tx, {stats['total_transfers']} transfers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
