"""
Test suite for L2L Documents API endpoint
Tests the GET /api/l2l-documents endpoint which returns the most recent L2L transfer receipt
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestL2LDocumentsAPI:
    """Tests for GET /api/l2l-documents endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@ubs.ch",
            "password": "UBS@2024"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_l2l_documents_requires_auth(self):
        """Test that endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents")
        assert response.status_code in [401, 403], "Should require authentication"
        print("PASSED: L2L documents endpoint requires authentication")
    
    def test_l2l_documents_returns_receipt(self):
        """Test that endpoint returns L2L receipt data"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents", headers=self.headers)
        assert response.status_code == 200, f"Failed to get L2L documents: {response.text}"
        data = response.json()
        
        # Verify basic receipt structure
        assert "transfer_id" in data, "Missing transfer_id"
        assert "timestamp" in data, "Missing timestamp"
        assert "sender" in data, "Missing sender"
        assert "receiver" in data, "Missing receiver"
        assert "amount" in data, "Missing amount"
        assert "codes" in data, "Missing codes"
        print("PASSED: L2L documents endpoint returns receipt data")
    
    def test_l2l_documents_has_nostro_routing(self):
        """Test that receipt includes nostro_routing object"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "nostro_routing" in data, "Missing nostro_routing"
        nr = data["nostro_routing"]
        
        # Verify nostro routing structure
        assert nr.get("enabled") == True, "nostro_routing.enabled should be True"
        assert "nostro_bank" in nr, "Missing nostro_bank"
        assert "nostro_swift" in nr, "Missing nostro_swift"
        assert "nostro_iban" in nr, "Missing nostro_iban"
        assert "stages" in nr, "Missing stages"
        
        # Verify correct Nostro account details
        assert nr["nostro_swift"] == "CCFRFRPP", f"Expected CCFRFRPP, got {nr['nostro_swift']}"
        assert nr["nostro_iban"] == "FR7630056000100010000405731", f"Expected FR7630056000100010000405731, got {nr['nostro_iban']}"
        print("PASSED: L2L documents has correct nostro_routing with CCFRFRPP and FR7630056000100010000405731")
    
    def test_l2l_documents_has_5_routing_stages(self):
        """Test that nostro_routing has 5 stages"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        stages = data["nostro_routing"]["stages"]
        assert len(stages) == 5, f"Expected 5 stages, got {len(stages)}"
        
        # Verify each stage has required fields
        for i, stage in enumerate(stages):
            assert stage["step"] == i + 1, f"Stage {i+1} has wrong step number"
            assert "label" in stage, f"Stage {i+1} missing label"
            assert "institution" in stage, f"Stage {i+1} missing institution"
            assert "status" in stage, f"Stage {i+1} missing status"
            assert stage["status"] == "COMPLETED", f"Stage {i+1} status should be COMPLETED"
        
        print("PASSED: L2L documents has 5 routing stages, all COMPLETED")
    
    def test_l2l_documents_sender_info(self):
        """Test sender information in receipt"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        sender = data["sender"]
        assert sender["swift"] == "UBSWCHZHXXX", f"Expected UBSWCHZHXXX, got {sender['swift']}"
        assert "name" in sender, "Missing sender name"
        assert "account" in sender, "Missing sender account"
        assert "iban" in sender, "Missing sender iban"
        print(f"PASSED: Sender info correct - {sender['name']}, SWIFT: {sender['swift']}")
    
    def test_l2l_documents_receiver_info(self):
        """Test receiver information in receipt"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        receiver = data["receiver"]
        assert "bank_name" in receiver, "Missing receiver bank_name"
        assert "swift" in receiver, "Missing receiver swift"
        assert "account" in receiver, "Missing receiver account"
        assert "name" in receiver, "Missing receiver name"
        print(f"PASSED: Receiver info correct - {receiver['name']} at {receiver['bank_name']}")
    
    def test_l2l_documents_codes(self):
        """Test that receipt has all required codes"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        codes = data["codes"]
        required_codes = ["ref_num", "tx_id", "msg_code", "deposit_code", "feds_code"]
        for code in required_codes:
            assert code in codes, f"Missing code: {code}"
        
        print(f"PASSED: All required codes present - ref_num: {codes['ref_num']}")
    
    def test_l2l_documents_hex_dump(self):
        """Test that receipt includes hex_dump"""
        response = requests.get(f"{BASE_URL}/api/l2l-documents", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "hex_dump" in data, "Missing hex_dump"
        assert isinstance(data["hex_dump"], list), "hex_dump should be a list"
        assert len(data["hex_dump"]) > 0, "hex_dump should not be empty"
        print(f"PASSED: hex_dump present with {len(data['hex_dump'])} lines")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
