"""
Test suite for UBS Admin Portal - Email Console Feature
Tests POST /api/emails/send and GET /api/emails endpoints
SMTP email sending is SIMULATED - no real SMTP connection
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEmailConsole:
    """Email Console API tests - SMTP is SIMULATED"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@ubs.ch",
            "password": "UBS@2024"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    # ============ POST /api/emails/send Tests ============
    
    def test_send_email_l2l_confirmation_template(self):
        """Test sending email with l2l_confirmation template - auto-populates from latest L2L transfer"""
        response = requests.post(f"{BASE_URL}/api/emails/send", 
            headers=self.headers,
            json={
                "to_email": "test@bank.com",
                "to_name": "Test Officer",
                "template": "l2l_confirmation"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify full email record structure
        assert "id" in data, "Missing email id"
        assert "message_id" in data, "Missing message_id"
        assert "from_email" in data and data["from_email"] == "swiftfintrade@ubs.com"
        assert "to_email" in data and data["to_email"] == "test@bank.com"
        assert "subject" in data, "Missing subject"
        assert "body" in data, "Missing body"
        assert "status" in data and data["status"] == "delivered"
        assert "smtp_log" in data, "Missing smtp_log"
        assert "headers" in data, "Missing headers"
        
        # Verify SMTP log structure
        smtp_log = data["smtp_log"]
        assert "connection" in smtp_log
        assert "tls" in smtp_log
        assert "auth" in smtp_log
        assert "mail_from" in smtp_log
        assert "rcpt_to" in smtp_log
        
        # Verify headers include DKIM
        headers = data["headers"]
        assert "DKIM-Signature" in headers
        assert "Message-ID" in headers
        assert "X-Mailer" in headers
        
        # Verify body contains L2L transfer details (EUR 10,000,000,000.00 amount)
        body = data["body"]
        assert "LEDGER TO LEDGER" in body or "L2L" in body.upper()
        assert "NOSTRO" in body.upper() or "nostro" in body.lower()
        print(f"✓ L2L confirmation email sent successfully with subject: {data['subject']}")
    
    def test_send_email_transfer_notification_template(self):
        """Test sending email with transfer_notification template"""
        response = requests.post(f"{BASE_URL}/api/emails/send",
            headers=self.headers,
            json={
                "to_email": "officer@correspondent.bank",
                "to_name": "Correspondent Officer",
                "template": "transfer_notification"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "delivered"
        assert data["from_email"] == "swiftfintrade@ubs.com"
        assert "NOTIFICATION" in data["subject"].upper() or "TRANSFER" in data["subject"].upper()
        assert "smtp_log" in data
        print(f"✓ Transfer notification email sent: {data['subject']}")
    
    def test_send_email_bank_officer_template_with_custom_body(self):
        """Test sending email with bank_officer template and custom subject/body"""
        custom_subject = "Urgent: Fund Transfer Verification Required"
        custom_body = "Please verify the incoming transfer reference UBSW1234567890."
        
        response = requests.post(f"{BASE_URL}/api/emails/send",
            headers=self.headers,
            json={
                "to_email": "senior.officer@hsbc.com",
                "to_name": "Senior Trade Officer",
                "template": "bank_officer",
                "subject": custom_subject,
                "body": custom_body
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "delivered"
        assert custom_subject in data["subject"] or "Bank Officer" in data["subject"]
        assert custom_body in data["body"]
        assert "CONFIDENTIAL" in data["body"].upper() or "BANK OFFICER" in data["body"].upper()
        print(f"✓ Bank officer email sent with custom content")
    
    def test_send_email_custom_template(self):
        """Test sending email with custom template"""
        response = requests.post(f"{BASE_URL}/api/emails/send",
            headers=self.headers,
            json={
                "to_email": "custom@example.com",
                "to_name": "Custom Recipient",
                "template": "custom",
                "subject": "Custom Test Email",
                "body": "This is a custom email body for testing purposes."
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "delivered"
        assert data["template"] == "custom"
        assert "smtp_log" in data
        assert "headers" in data
        print(f"✓ Custom email sent successfully")
    
    def test_send_email_requires_auth(self):
        """Test that sending email requires authentication"""
        response = requests.post(f"{BASE_URL}/api/emails/send",
            json={
                "to_email": "test@test.com",
                "template": "custom"
            }
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Email send endpoint requires authentication")
    
    def test_send_email_smtp_log_contains_tls_handshake(self):
        """Verify SMTP log shows TLS handshake simulation"""
        response = requests.post(f"{BASE_URL}/api/emails/send",
            headers=self.headers,
            json={
                "to_email": "tls-test@bank.com",
                "template": "custom",
                "subject": "TLS Test",
                "body": "Testing TLS"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        smtp_log = data["smtp_log"]
        # Verify TLS handshake info
        assert "TLS" in smtp_log.get("tls", "").upper()
        assert "smtp.finance-ubs.com" in smtp_log.get("connection", "")
        assert "587" in smtp_log.get("connection", "")
        print("✓ SMTP log contains TLS handshake simulation")
    
    def test_send_email_headers_include_dkim_signature(self):
        """Verify email headers include DKIM signature"""
        response = requests.post(f"{BASE_URL}/api/emails/send",
            headers=self.headers,
            json={
                "to_email": "dkim-test@bank.com",
                "template": "custom",
                "subject": "DKIM Test",
                "body": "Testing DKIM"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        headers = data["headers"]
        assert "DKIM-Signature" in headers
        dkim = headers["DKIM-Signature"]
        assert "v=1" in dkim
        assert "a=rsa-sha256" in dkim
        assert "d=finance-ubs.com" in dkim
        print("✓ Email headers include valid DKIM signature format")
    
    # ============ GET /api/emails Tests ============
    
    def test_get_sent_emails_returns_list(self):
        """Test GET /api/emails returns list of sent emails sorted by date descending"""
        response = requests.get(f"{BASE_URL}/api/emails", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Expected list of emails"
        if len(data) > 0:
            email = data[0]
            assert "id" in email
            assert "subject" in email
            assert "to_email" in email
            assert "status" in email
            assert "created_at" in email
            print(f"✓ GET /api/emails returned {len(data)} emails")
            
            # Verify sorted by date descending (most recent first)
            if len(data) > 1:
                first_date = data[0].get("created_at", "")
                second_date = data[1].get("created_at", "")
                assert first_date >= second_date, "Emails should be sorted by date descending"
                print("✓ Emails are sorted by date descending")
    
    def test_get_emails_requires_auth(self):
        """Test that getting emails requires authentication"""
        response = requests.get(f"{BASE_URL}/api/emails")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ GET /api/emails requires authentication")
    
    def test_email_persisted_in_database(self):
        """Test that sent email is persisted and retrievable"""
        # Send a unique email
        unique_subject = f"Persistence Test {os.urandom(4).hex()}"
        send_response = requests.post(f"{BASE_URL}/api/emails/send",
            headers=self.headers,
            json={
                "to_email": "persistence@test.com",
                "template": "custom",
                "subject": unique_subject,
                "body": "Testing persistence"
            }
        )
        assert send_response.status_code == 200
        sent_email = send_response.json()
        
        # Retrieve emails and verify our email is there
        get_response = requests.get(f"{BASE_URL}/api/emails", headers=self.headers)
        assert get_response.status_code == 200
        emails = get_response.json()
        
        found = any(e.get("subject") == unique_subject for e in emails)
        assert found, f"Sent email with subject '{unique_subject}' not found in email list"
        print("✓ Sent email is persisted and retrievable")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
