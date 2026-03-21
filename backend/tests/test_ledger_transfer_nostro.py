"""
UBS Admin Portal - Ledger to Ledger Transfer with Nostro Routing Tests
Tests the L2L transfer endpoint and nostro routing stages
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@ubs.ch"
TEST_PASSWORD = "UBS@2024"

# Expected Nostro routing details
EXPECTED_NOSTRO = {
    "nostro_bank": "HSBC CONTINENTAL EUROPE SA",
    "nostro_swift": "CCFRFRPP",
    "nostro_iban": "FR7630056000100010000405731"
}

# Expected receiver details (pre-filled in form)
EXPECTED_RECEIVER = {
    "name": "HONG KONG UNIWORLD LIMITED",
    "bank_name": "HONG KONG AND SHANGHAI BANKING CORPORATION",
    "swift": "HSBCHKHHHKH",
    "account": "165758772838",
    "address": "HSBC BUILDING, 82 NATHAN ROAD, KOWLOON, HK"
}


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Authentication failed - skipping tests")
    return response.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Create headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestLedgerTransferEndpoint:
    """Tests for POST /api/transfers/ledger endpoint"""
    
    def test_ledger_transfer_returns_nostro_routing(self, auth_headers):
        """Test that ledger transfer returns nostro_routing object with 5 stages"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "sender_iban": "CH93 0027 3001 8839 9039 39",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_bank_address": EXPECTED_RECEIVER["address"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_iban": "",
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,
            "currency": "EUR",
            "purpose": "INVESTMENT / INTERNAL LEDGER"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200, f"Transfer failed: {response.text}"
        
        data = response.json()
        
        # Verify nostro_routing object exists
        assert "nostro_routing" in data, "Response missing nostro_routing object"
        nostro = data["nostro_routing"]
        
        # Verify nostro_routing is enabled
        assert nostro.get("enabled") == True, "nostro_routing.enabled should be True"
        
        # Verify nostro_routing has 5 stages
        assert "stages" in nostro, "nostro_routing missing stages array"
        stages = nostro["stages"]
        assert len(stages) == 5, f"Expected 5 stages, got {len(stages)}"
        
        print(f"✓ Ledger transfer returned nostro_routing with {len(stages)} stages")
    
    def test_nostro_routing_contains_correct_nostro_details(self, auth_headers):
        """Test that nostro_routing contains correct Nostro SWIFT, IBAN, bank name"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "sender_iban": "CH93 0027 3001 8839 9039 39",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_bank_address": EXPECTED_RECEIVER["address"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200
        nostro = response.json()["nostro_routing"]
        
        # Verify Nostro bank details
        assert nostro["nostro_bank"] == EXPECTED_NOSTRO["nostro_bank"], \
            f"Expected nostro_bank '{EXPECTED_NOSTRO['nostro_bank']}', got '{nostro.get('nostro_bank')}'"
        
        assert nostro["nostro_swift"] == EXPECTED_NOSTRO["nostro_swift"], \
            f"Expected nostro_swift '{EXPECTED_NOSTRO['nostro_swift']}', got '{nostro.get('nostro_swift')}'"
        
        assert nostro["nostro_iban"] == EXPECTED_NOSTRO["nostro_iban"], \
            f"Expected nostro_iban '{EXPECTED_NOSTRO['nostro_iban']}', got '{nostro.get('nostro_iban')}'"
        
        print(f"✓ Nostro details correct: {nostro['nostro_bank']} / {nostro['nostro_swift']} / {nostro['nostro_iban']}")
    
    def test_all_5_stages_have_correct_structure(self, auth_headers):
        """Test that all 5 routing stages have correct institution names, SWIFT codes, and COMPLETED status"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200
        stages = response.json()["nostro_routing"]["stages"]
        
        # Expected stage details
        expected_stages = [
            {"step": 1, "label": "UBS AG SWIFT POOL", "swift_code": "UBSWCHZHXXX", "institution": "UNION BANK OF SWITZERLAND AG"},
            {"step": 2, "label": "ECB VALIDATION GATEWAY", "swift_code": "ECBFDEFFXXX", "institution": "EUROPEAN CENTRAL BANK"},
            {"step": 3, "label": "NOSTRO ACCOUNT — HSBC CONTINENTAL EUROPE SA", "swift_code": "CCFRFRPP", "institution": "HSBC CONTINENTAL EUROPE SA"},
            {"step": 4, "label": "RECEIVER BANK SWIFT POOL", "swift_code": "HSBCHKHHHKH", "institution": "HONG KONG AND SHANGHAI BANKING CORPORATION"},
            {"step": 5, "label": "BENEFICIARY CREDITED", "institution": EXPECTED_RECEIVER["name"]}
        ]
        
        for i, expected in enumerate(expected_stages):
            stage = stages[i]
            
            # Verify step number
            assert stage["step"] == expected["step"], f"Stage {i+1}: Expected step {expected['step']}, got {stage.get('step')}"
            
            # Verify status is COMPLETED
            assert stage["status"] == "COMPLETED", f"Stage {i+1}: Expected status 'COMPLETED', got '{stage.get('status')}'"
            
            # Verify institution
            assert stage["institution"] == expected["institution"], \
                f"Stage {i+1}: Expected institution '{expected['institution']}', got '{stage.get('institution')}'"
            
            # Verify SWIFT code (if expected)
            if "swift_code" in expected:
                assert stage.get("swift_code") == expected["swift_code"], \
                    f"Stage {i+1}: Expected swift_code '{expected['swift_code']}', got '{stage.get('swift_code')}'"
            
            # Verify timestamp exists
            assert "timestamp" in stage, f"Stage {i+1}: Missing timestamp"
            
            # Verify action exists
            assert "action" in stage, f"Stage {i+1}: Missing action"
            
            # Verify details exists
            assert "details" in stage, f"Stage {i+1}: Missing details"
            
            print(f"✓ Stage {i+1} ({stage['label']}): COMPLETED - {stage.get('swift_code', 'N/A')}")
    
    def test_stage_3_has_nostro_iban(self, auth_headers):
        """Test that Stage 3 (Nostro Account) has the correct IBAN"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200
        stages = response.json()["nostro_routing"]["stages"]
        
        # Stage 3 is the Nostro Account stage
        stage_3 = stages[2]
        
        assert stage_3["step"] == 3, "Stage 3 should have step=3"
        assert "iban" in stage_3, "Stage 3 should have IBAN"
        assert stage_3["iban"] == EXPECTED_NOSTRO["nostro_iban"], \
            f"Stage 3 IBAN: Expected '{EXPECTED_NOSTRO['nostro_iban']}', got '{stage_3.get('iban')}'"
        
        print(f"✓ Stage 3 Nostro IBAN correct: {stage_3['iban']}")
    
    def test_default_amount_99_million_eur(self, auth_headers):
        """Test transfer with default amount of EUR 99,000,000.00"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,  # EUR 99,000,000.00
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify amount in response
        assert data["raw_amount"] == 99000000.00, f"Expected raw_amount 99000000.00, got {data.get('raw_amount')}"
        assert data["currency"] == "EUR", f"Expected currency EUR, got {data.get('currency')}"
        assert "EUR 99,000,000.00" in data["amount"], f"Expected formatted amount 'EUR 99,000,000.00', got {data.get('amount')}"
        
        print(f"✓ Amount correct: {data['amount']}")
    
    def test_swift_routing_flow_in_terminal(self, auth_headers):
        """Test that terminal receipt shows correct SWIFT routing flow"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200
        nostro = response.json()["nostro_routing"]
        
        # Verify remittance info contains receiver name
        assert EXPECTED_RECEIVER["name"] in nostro["remittance_info"], \
            f"Remittance info should contain receiver name"
        
        # Verify stages contain expected SWIFT codes in order
        swift_codes = [s.get("swift_code") for s in nostro["stages"] if s.get("swift_code")]
        expected_swift_flow = ["UBSWCHZHXXX", "ECBFDEFFXXX", "CCFRFRPP", "HSBCHKHHHKH"]
        
        for expected_swift in expected_swift_flow:
            assert expected_swift in swift_codes, f"Missing SWIFT code {expected_swift} in routing flow"
        
        print(f"✓ SWIFT routing flow correct: {' → '.join(expected_swift_flow)}")
    
    def test_receiver_details_in_response(self, auth_headers):
        """Test that receiver details are correctly included in response"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_bank_address": EXPECTED_RECEIVER["address"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200
        receiver = response.json()["receiver"]
        
        assert receiver["name"] == EXPECTED_RECEIVER["name"], \
            f"Expected receiver name '{EXPECTED_RECEIVER['name']}', got '{receiver.get('name')}'"
        
        assert receiver["bank_name"] == EXPECTED_RECEIVER["bank_name"], \
            f"Expected bank name '{EXPECTED_RECEIVER['bank_name']}', got '{receiver.get('bank_name')}'"
        
        assert receiver["swift"] == EXPECTED_RECEIVER["swift"], \
            f"Expected SWIFT '{EXPECTED_RECEIVER['swift']}', got '{receiver.get('swift')}'"
        
        assert receiver["account"] == EXPECTED_RECEIVER["account"], \
            f"Expected account '{EXPECTED_RECEIVER['account']}', got '{receiver.get('account')}'"
        
        print(f"✓ Receiver details correct: {receiver['name']} at {receiver['bank_name']}")
    
    def test_transfer_creates_transaction_record(self, auth_headers):
        """Test that ledger transfer creates a transaction record in database"""
        transfer_data = {
            "sender_name": "DR. ERICH HUNZIKER",
            "sender_company": "BB BIOTECH AG",
            "sender_account": "001-8839903939",
            "receiver_bank_name": EXPECTED_RECEIVER["bank_name"],
            "receiver_swift": EXPECTED_RECEIVER["swift"],
            "receiver_account": EXPECTED_RECEIVER["account"],
            "receiver_name": EXPECTED_RECEIVER["name"],
            "amount": 99000000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        
        assert response.status_code == 200
        transfer_id = response.json()["transfer_id"]
        ref_num = response.json()["codes"]["ref_num"]
        
        # Verify transaction was created
        tx_response = requests.get(f"{BASE_URL}/api/transactions", headers=auth_headers)
        assert tx_response.status_code == 200
        
        transactions = tx_response.json()
        
        # Find the transaction with matching reference
        matching_tx = [tx for tx in transactions if tx.get("reference") == ref_num]
        assert len(matching_tx) > 0, f"No transaction found with reference {ref_num}"
        
        tx = matching_tx[0]
        assert tx["amount"] == -99000000.00, f"Expected debit amount -99000000.00, got {tx.get('amount')}"
        assert tx["currency"] == "EUR"
        assert "LEDGER_TO_LEDGER" in tx.get("type", "") or "L2L" in tx.get("description", "")
        
        print(f"✓ Transaction record created: {ref_num}")


class TestLedgerTransferValidation:
    """Validation tests for ledger transfer endpoint"""
    
    def test_transfer_requires_authentication(self):
        """Test that ledger transfer requires authentication"""
        transfer_data = {
            "sender_name": "Test",
            "sender_account": "123",
            "receiver_bank_name": "Test Bank",
            "receiver_swift": "TESTSWIFT",
            "receiver_account": "456",
            "receiver_name": "Test Receiver",
            "amount": 1000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", json=transfer_data)
        assert response.status_code in [401, 403], f"Expected auth error, got {response.status_code}"
        
        print("✓ Unauthenticated request correctly rejected")
    
    def test_transfer_requires_receiver_name(self, auth_headers):
        """Test that transfer requires receiver_name"""
        transfer_data = {
            "sender_name": "Test",
            "sender_account": "123",
            "receiver_bank_name": "Test Bank",
            "receiver_swift": "TESTSWIFT",
            "receiver_account": "456",
            # Missing receiver_name
            "amount": 1000.00,
            "currency": "EUR"
        }
        
        response = requests.post(f"{BASE_URL}/api/transfers/ledger", 
                                 json=transfer_data, 
                                 headers=auth_headers)
        assert response.status_code == 422, f"Expected 422 validation error, got {response.status_code}"
        
        print("✓ Missing receiver_name correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
