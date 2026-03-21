from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'ubs-admin-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Create the main app
app = FastAPI(title="Union Bank of Switzerland AG Admin Portal")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ================ MODELS ================

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    full_name: str
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class AccountBalance(BaseModel):
    currency: str
    balance: float
    account_number: str
    iban: str

class Beneficiary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bank_name: str
    account_number: str
    iban: str
    swift_bic: str
    country: str
    address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BeneficiaryCreate(BaseModel):
    name: str
    bank_name: str
    account_number: str
    iban: str
    swift_bic: str
    country: str
    address: str

class TransferBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transfer_type: str
    amount: float
    currency: str
    sender_account: str
    beneficiary_id: str
    beneficiary_name: str
    beneficiary_iban: str
    beneficiary_swift: str
    reference: str
    status: str = "pending"
    swift_message: Optional[str] = None
    tracking_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InternationalTransferCreate(BaseModel):
    transfer_type: str  # MT103, PACS008, PACS009, GPI, QUICK_WIRE
    amount: float
    currency: str
    sender_account: str
    beneficiary_id: str
    reference: str
    purpose: Optional[str] = None
    charge_option: str = "SHA"  # SHA, OUR, BEN

class DomesticTransferCreate(BaseModel):
    amount: float
    currency: str
    sender_account: str
    beneficiary_id: str
    reference: str

class BillPayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    biller_name: str
    biller_account: str
    amount: float
    currency: str
    reference: str
    status: str = "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BillPaymentCreate(BaseModel):
    biller_name: str
    biller_account: str
    amount: float
    currency: str
    reference: str

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_type: str
    amount: float
    currency: str
    description: str
    status: str
    reference: str
    counterparty: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServerLog(BaseModel):
    timestamp: str
    level: str
    message: str
    service: str

# ================ AUTH HELPERS ================

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ================ SWIFT MESSAGE GENERATORS ================

def generate_mt103(transfer: dict, beneficiary: dict) -> str:
    ref = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
    timestamp = datetime.now(timezone.utc)
    value_date = timestamp.strftime("%y%m%d")
    full_date = timestamp.strftime("%d/%m/%Y")
    time_stamp = timestamp.strftime("%H:%M:%S")
    officer_pin = ''.join(random.choices(string.digits, k=5))
    
    # Generate realistic SWIFT header blocks
    sender_bic = "UBSWCHZHXXX"
    session_num = ''.join(random.choices(string.digits, k=4))
    sequence_num = ''.join(random.choices(string.digits, k=6))
    
    return f"""
================================================================================
                         UNION BANK OF SWITZERLAND AG
                              SWIFT MESSAGE COPY
                          MT103 SINGLE CUSTOMER CREDIT TRANSFER
================================================================================
DATE: {full_date}                                           TIME: {time_stamp} CET
--------------------------------------------------------------------------------

SWIFT OUTPUT FIN                                              COPY FOR RECORDS
================================================================================

{{1:F01{sender_bic}{session_num}{sequence_num}}}
{{2:O103{value_date}1200{beneficiary['swift_bic']}N}}
{{3:{{108:{ref}}}}}
{{4:
:20:{ref}
:23B:CRED
:32A:{value_date}{transfer['currency']}{transfer['amount']:,.2f}
:33B:{transfer['currency']}{transfer['amount']:,.2f}
:50K:/{transfer['sender_account']}
UNION BANK OF SWITZERLAND AG
BAHNHOFSTRASSE 45
8001 ZURICH, SWITZERLAND
:52A:{sender_bic}
UNION BANK OF SWITZERLAND AG
:53A:{sender_bic}
:57A:{beneficiary['swift_bic']}
{beneficiary['bank_name'].upper()}
:59:/{beneficiary['account_number']}
{beneficiary['name'].upper()}
{beneficiary['address'].upper()}
{beneficiary['country'].upper()}
:70:{transfer['reference']}
{transfer.get('purpose', 'COMMERCIAL PAYMENT')}
:71A:{transfer.get('charge_option', 'SHA')}
:72:/REC/UNION BANK OF SWITZERLAND AG
/ACC/INVESTMENT TRANSACTION
-}}
{{5:{{MAC:00000000}}{{CHK:123456789ABC}}}}

================================================================================
                        TARGET2 CLEARING ACKNOWLEDGMENT
================================================================================
ACKNOWLEDGED BY TARGET2 [TRABORERXXX] [ACK]
SETTLEMENT STATUS: SETTLED
SETTLEMENT DATE: {full_date}
SETTLEMENT TIME: {time_stamp} CET
================================================================================

================================================================================
                    OFFICIAL CUSTOMER STATEMENT MESSAGE
================================================================================
DATE        TYPE      REFERENCE              AMOUNT           CURRENCY
--------------------------------------------------------------------------------
{full_date}  DEBIT     {ref}    {transfer['amount']:>15,.2f}      {transfer['currency']}
--------------------------------------------------------------------------------
                                    TOTAL:   {transfer['amount']:>15,.2f}      {transfer['currency']}
================================================================================

================================================================================
              OFFICIAL REPORTING DOCUMENT RS/FATCA/AML COMPLIANCE
================================================================================
COMPLIANCE STATUS: VERIFIED
SCREENING RESULT: PASSED
SANCTIONS CHECK: CLEARED
AML VERIFICATION: APPROVED
================================================================================

================================================================================
                              AUTHORIZED OFFICER
================================================================================
REFERENCE: {ref}
AUTHORIZED BY: MR. JOHANNES WEBER
OFFICER PIN: {officer_pin}
DIGITAL SIGNATURE: VERIFIED
================================================================================

                              [OFFICIAL STAMP]
                        UNION BANK OF SWITZERLAND AG
                            TRANSACTION VERIFIED
                              {full_date}

================================================================================
                          TRANSPARENCY COMPLIANT
              This document is an official SWIFT copy for records
================================================================================
"""

def generate_pacs008(transfer: dict, beneficiary: dict) -> str:
    msg_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=35))
    instr_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
    uetr = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+01:00"
    settlement_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!--  
================================================================================
SWIFT MX pacs.008.001.08 - FI to FI Customer Credit Transfer
Union Bank of Switzerland AG - CONFIDENTIAL
Business Service: swift.finplus
================================================================================
-->
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>{msg_id}</MsgId>
      <CreDtTm>{timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="{transfer['currency']}">{transfer['amount']:.2f}</TtlIntrBkSttlmAmt>
      <IntrBkSttlmDt>{settlement_date}</IntrBkSttlmDt>
      <SttlmInf>
        <SttlmMtd>INGA</SttlmMtd>
      </SttlmInf>
      <InstgAgt>
        <FinInstnId>
          <BICFI>UBSWCHZHXXX</BICFI>
          <Nm>UNION BANK OF SWITZERLAND AG</Nm>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
          <Nm>{beneficiary['bank_name']}</Nm>
        </FinInstnId>
      </InstdAgt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>{instr_id}</InstrId>
        <EndToEndId>{transfer['reference']}</EndToEndId>
        <UETR>{uetr}</UETR>
      </PmtId>
      <PmtTpInf>
        <InstrPrty>NORM</InstrPrty>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>INST</Cd>
        </LclInstrm>
        <CtgyPurp>
          <Cd>SUPP</Cd>
        </CtgyPurp>
      </PmtTpInf>
      <IntrBkSttlmAmt Ccy="{transfer['currency']}">{transfer['amount']:.2f}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>{settlement_date}</IntrBkSttlmDt>
      <ChrgBr>{transfer.get('charge_option', 'SHAR')}</ChrgBr>
      <InstgAgt>
        <FinInstnId>
          <BICFI>UBSWCHZHXXX</BICFI>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
        </FinInstnId>
      </InstdAgt>
      <Dbtr>
        <Nm>UNION BANK OF SWITZERLAND AG</Nm>
        <PstlAdr>
          <StrtNm>BAHNHOFSTRASSE 45</StrtNm>
          <PstCd>8001</PstCd>
          <TwnNm>ZURICH</TwnNm>
          <Ctry>CH</Ctry>
        </PstlAdr>
        <Id>
          <OrgId>
            <AnyBIC>UBSWCHZHXXX</AnyBIC>
          </OrgId>
        </Id>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>{transfer['sender_account']}</IBAN>
        </Id>
        <Tp>
          <Cd>CACC</Cd>
        </Tp>
        <Ccy>{transfer['currency']}</Ccy>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>UBSWCHZHXXX</BICFI>
          <Nm>UNION BANK OF SWITZERLAND AG</Nm>
          <PstlAdr>
            <Ctry>CH</Ctry>
          </PstlAdr>
        </FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
          <Nm>{beneficiary['bank_name']}</Nm>
          <PstlAdr>
            <Ctry>{beneficiary['country'][:2].upper()}</Ctry>
          </PstlAdr>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>{beneficiary['name']}</Nm>
        <PstlAdr>
          <StrtNm>{beneficiary['address']}</StrtNm>
          <Ctry>{beneficiary['country'][:2].upper()}</Ctry>
        </PstlAdr>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>{beneficiary['iban']}</IBAN>
        </Id>
        <Tp>
          <Cd>CACC</Cd>
        </Tp>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>{transfer['reference']}</Ustrd>
        <Ustrd>{transfer.get('purpose', 'COMMERCIAL PAYMENT')}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
<!--
================================================================================
SETTLEMENT CONFIRMATION
--------------------------------------------------------------------------------
System Status:         FINALIZED
Network Status:        NETWORK ACK (SUCCESSFUL)  
Global Server Status:  ACTIVE ON GLOBAL SWIFT SERVER
Settlement Method:     INGA
Settlement Priority:   NORMAL
Settlement Date:       {settlement_date}
Settlement Amount:     {transfer['currency']} {transfer['amount']:,.2f}
UETR:                  {uetr}
Charge Bearer:         {transfer.get('charge_option', 'SHAR')}
Reversal Possibility:  NONE
Manual Intervention:   NOT REQUIRED
================================================================================
-->"""

def generate_pacs009(transfer: dict, beneficiary: dict) -> str:
    msg_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=35))
    instr_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
    uetr = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+01:00"
    settlement_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<!--  
================================================================================
SWIFT MX pacs.009.001.08 - Financial Institution Credit Transfer
Union Bank of Switzerland AG - CONFIDENTIAL
Business Service: swift.finplus
================================================================================
-->
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08">
  <FICdtTrf>
    <GrpHdr>
      <MsgId>{msg_id}</MsgId>
      <CreDtTm>{timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INGA</SttlmMtd>
      </SttlmInf>
      <InstgAgt>
        <FinInstnId>
          <BICFI>UBSWCHZHXXX</BICFI>
          <Nm>UNION BANK OF SWITZERLAND AG</Nm>
          <PstlAdr>
            <StrtNm>BAHNHOFSTRASSE 45</StrtNm>
            <PstCd>8001</PstCd>
            <TwnNm>ZURICH</TwnNm>
            <Ctry>CH</Ctry>
          </PstlAdr>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
          <Nm>{beneficiary['bank_name']}</Nm>
        </FinInstnId>
      </InstdAgt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>{instr_id}</InstrId>
        <EndToEndId>{transfer['reference']}</EndToEndId>
        <UETR>{uetr}</UETR>
      </PmtId>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>INST</Cd>
        </LclInstrm>
      </PmtTpInf>
      <IntrBkSttlmAmt Ccy="{transfer['currency']}">{transfer['amount']:.2f}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>{settlement_date}</IntrBkSttlmDt>
      <SttlmPrty>NORM</SttlmPrty>
      <InstgAgt>
        <FinInstnId>
          <BICFI>UBSWCHZHXXX</BICFI>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
        </FinInstnId>
      </InstdAgt>
      <Dbtr>
        <FinInstnId>
          <BICFI>UBSWCHZHXXX</BICFI>
          <Nm>UNION BANK OF SWITZERLAND AG</Nm>
          <PstlAdr>
            <StrtNm>BAHNHOFSTRASSE 45</StrtNm>
            <PstCd>8001</PstCd>
            <TwnNm>ZURICH</TwnNm>
            <Ctry>CH</Ctry>
          </PstlAdr>
        </FinInstnId>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>{transfer['sender_account']}</IBAN>
        </Id>
        <Tp>
          <Cd>CACC</Cd>
        </Tp>
      </DbtrAcct>
      <Cdtr>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
          <Nm>{beneficiary['bank_name']}</Nm>
          <PstlAdr>
            <Ctry>{beneficiary['country'][:2].upper()}</Ctry>
          </PstlAdr>
        </FinInstnId>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>{beneficiary['iban']}</IBAN>
        </Id>
        <Tp>
          <Cd>CACC</Cd>
        </Tp>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>{transfer.get('purpose', 'INVESTMENT PURPOSES')}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FICdtTrf>
</Document>
<!--
================================================================================
SETTLEMENT CONFIRMATION
--------------------------------------------------------------------------------
System Status:         FINALIZED
Network Status:        NETWORK ACK (SUCCESSFUL)  
Global Server Status:  ACTIVE ON GLOBAL SWIFT SERVER
Settlement Method:     INGA
Settlement Priority:   NORMAL
Settlement Date:       {settlement_date}
Settlement Amount:     {transfer['currency']} {transfer['amount']:,.2f}
UETR:                  {uetr}
Reversal Possibility:  NONE
Manual Intervention:   NOT REQUIRED
================================================================================
-->"""

def generate_tracking_id() -> str:
    return f"GPI{''.join(random.choices(string.digits, k=20))}"

# ================ AUTH ROUTES ================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Check for default admin
    user = await db.admin_users.find_one({"email": request.email}, {"_id": 0})
    
    if not user:
        # Create default admin if not exists
        if request.email == "admin@ubs.ch" and request.password == "UBS@2024":
            password_hash = bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()
            new_user = AdminUser(
                email="admin@ubs.ch",
                password_hash=password_hash,
                full_name="UBS Administrator",
                role="admin"
            )
            doc = new_user.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.admin_users.insert_one(doc)
            
            token = create_token(new_user.id, new_user.email)
            return LoginResponse(
                token=token,
                user={"id": new_user.id, "email": new_user.email, "full_name": new_user.full_name, "role": new_user.role}
            )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(request.password.encode(), user['password_hash'].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'])
    return LoginResponse(
        token=token,
        user={"id": user['id'], "email": user['email'], "full_name": user['full_name'], "role": user['role']}
    )

@api_router.get("/auth/me")
async def get_current_user(payload: dict = Depends(verify_token)):
    user = await db.admin_users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ================ BALANCE ROUTES ================

@api_router.get("/balances", response_model=List[AccountBalance])
async def get_balances(payload: dict = Depends(verify_token)):
    return [
        AccountBalance(
            currency="EUR",
            balance=150000883990393.93,
            account_number="001-8839903939",
            iban="CH93 0027 3001 8839 9039 39"
        ),
        AccountBalance(
            currency="USD",
            balance=15235883900008.07,
            account_number="002-5883900008",
            iban="CH93 0027 3002 5883 9000 08"
        ),
        AccountBalance(
            currency="CHF",
            balance=790000038990.88,
            account_number="003-0000389908",
            iban="CH93 0027 3003 0000 3899 08"
        )
    ]

# ================ BENEFICIARY ROUTES ================

@api_router.get("/beneficiaries", response_model=List[Beneficiary])
async def get_beneficiaries(payload: dict = Depends(verify_token)):
    beneficiaries = await db.beneficiaries.find({}, {"_id": 0}).to_list(1000)
    for b in beneficiaries:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return beneficiaries

@api_router.post("/beneficiaries", response_model=Beneficiary)
async def create_beneficiary(data: BeneficiaryCreate, payload: dict = Depends(verify_token)):
    beneficiary = Beneficiary(**data.model_dump())
    doc = beneficiary.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.beneficiaries.insert_one(doc)
    return beneficiary

@api_router.delete("/beneficiaries/{beneficiary_id}")
async def delete_beneficiary(beneficiary_id: str, payload: dict = Depends(verify_token)):
    result = await db.beneficiaries.delete_one({"id": beneficiary_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    return {"message": "Beneficiary deleted"}

# ================ TRANSFER ROUTES ================

@api_router.post("/transfers/international")
async def create_international_transfer(data: InternationalTransferCreate, payload: dict = Depends(verify_token)):
    # Get beneficiary details
    beneficiary = await db.beneficiaries.find_one({"id": data.beneficiary_id}, {"_id": 0})
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    transfer_data = data.model_dump()
    transfer_data['beneficiary_name'] = beneficiary['name']
    transfer_data['beneficiary_iban'] = beneficiary['iban']
    transfer_data['beneficiary_swift'] = beneficiary['swift_bic']
    
    # Generate SWIFT message based on type
    if data.transfer_type == "MT103":
        swift_message = generate_mt103(transfer_data, beneficiary)
    elif data.transfer_type == "PACS008":
        swift_message = generate_pacs008(transfer_data, beneficiary)
    elif data.transfer_type == "PACS009":
        swift_message = generate_pacs009(transfer_data, beneficiary)
    elif data.transfer_type in ["GPI", "QUICK_WIRE"]:
        swift_message = generate_mt103(transfer_data, beneficiary)
    else:
        swift_message = generate_mt103(transfer_data, beneficiary)
    
    transfer = TransferBase(
        transfer_type=data.transfer_type,
        amount=data.amount,
        currency=data.currency,
        sender_account=data.sender_account,
        beneficiary_id=data.beneficiary_id,
        beneficiary_name=beneficiary['name'],
        beneficiary_iban=beneficiary['iban'],
        beneficiary_swift=beneficiary['swift_bic'],
        reference=data.reference,
        status="processing",
        swift_message=swift_message,
        tracking_id=generate_tracking_id()
    )
    
    doc = transfer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transfers.insert_one(doc)
    
    # Create transaction record
    tx = Transaction(
        transaction_type=f"INTL_{data.transfer_type}",
        amount=-data.amount,
        currency=data.currency,
        description=f"International transfer to {beneficiary['name']}",
        status="completed",
        reference=data.reference,
        counterparty=beneficiary['name']
    )
    tx_doc = tx.model_dump()
    tx_doc['created_at'] = tx_doc['created_at'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return {
        "id": transfer.id,
        "tracking_id": transfer.tracking_id,
        "status": transfer.status,
        "swift_message": swift_message
    }

@api_router.post("/transfers/domestic")
async def create_domestic_transfer(data: DomesticTransferCreate, payload: dict = Depends(verify_token)):
    beneficiary = await db.beneficiaries.find_one({"id": data.beneficiary_id}, {"_id": 0})
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    transfer = TransferBase(
        transfer_type="DOMESTIC",
        amount=data.amount,
        currency=data.currency,
        sender_account=data.sender_account,
        beneficiary_id=data.beneficiary_id,
        beneficiary_name=beneficiary['name'],
        beneficiary_iban=beneficiary['iban'],
        beneficiary_swift=beneficiary['swift_bic'],
        reference=data.reference,
        status="completed",
        tracking_id=generate_tracking_id()
    )
    
    doc = transfer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transfers.insert_one(doc)
    
    # Create transaction
    tx = Transaction(
        transaction_type="DOMESTIC",
        amount=-data.amount,
        currency=data.currency,
        description=f"Domestic transfer to {beneficiary['name']}",
        status="completed",
        reference=data.reference,
        counterparty=beneficiary['name']
    )
    tx_doc = tx.model_dump()
    tx_doc['created_at'] = tx_doc['created_at'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return {"id": transfer.id, "status": transfer.status, "tracking_id": transfer.tracking_id}

# ================ BILL PAYMENT ROUTES ================

@api_router.post("/bills/pay", response_model=BillPayment)
async def pay_bill(data: BillPaymentCreate, payload: dict = Depends(verify_token)):
    payment = BillPayment(**data.model_dump())
    doc = payment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.bill_payments.insert_one(doc)
    
    # Create transaction
    tx = Transaction(
        transaction_type="BILL_PAYMENT",
        amount=-data.amount,
        currency=data.currency,
        description=f"Bill payment to {data.biller_name}",
        status="completed",
        reference=data.reference,
        counterparty=data.biller_name
    )
    tx_doc = tx.model_dump()
    tx_doc['created_at'] = tx_doc['created_at'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return payment

@api_router.get("/bills", response_model=List[BillPayment])
async def get_bill_payments(payload: dict = Depends(verify_token)):
    payments = await db.bill_payments.find({}, {"_id": 0}).to_list(1000)
    for p in payments:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return payments

# ================ TRANSACTION HISTORY ================

@api_router.get("/transactions")
async def get_transactions(
    limit: int = 100,
    transaction_type: Optional[str] = None,
    payload: dict = Depends(verify_token)
):
    query = {}
    if transaction_type:
        query['transaction_type'] = transaction_type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for tx in transactions:
        if isinstance(tx.get('created_at'), str):
            tx['created_at'] = datetime.fromisoformat(tx['created_at'])
    return transactions

# ================ PAYMENT TRACKING ================

@api_router.get("/tracking/{tracking_id}")
async def track_payment(tracking_id: str, payload: dict = Depends(verify_token)):
    transfer = await db.transfers.find_one({"tracking_id": tracking_id}, {"_id": 0})
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Simulate tracking status
    statuses = [
        {"status": "initiated", "timestamp": datetime.now(timezone.utc) - timedelta(hours=2), "location": "Zurich, Switzerland", "description": "Payment initiated"},
        {"status": "processing", "timestamp": datetime.now(timezone.utc) - timedelta(hours=1), "location": "SWIFT Network", "description": "Processing through SWIFT"},
        {"status": "in_transit", "timestamp": datetime.now(timezone.utc) - timedelta(minutes=30), "location": "Correspondent Bank", "description": "At correspondent bank"},
        {"status": "delivered", "timestamp": datetime.now(timezone.utc), "location": "Beneficiary Bank", "description": "Delivered to beneficiary bank"}
    ]
    
    return {
        "tracking_id": tracking_id,
        "transfer": transfer,
        "tracking_history": [{"status": s["status"], "timestamp": s["timestamp"].isoformat(), "location": s["location"], "description": s["description"]} for s in statuses]
    }

@api_router.get("/transfers")
async def get_transfers(payload: dict = Depends(verify_token)):
    transfers = await db.transfers.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for t in transfers:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return transfers

# ================ SERVER CONSOLE ================

@api_router.get("/server/logs")
async def get_server_logs(payload: dict = Depends(verify_token)):
    logs = [
        {"timestamp": (datetime.now(timezone.utc) - timedelta(minutes=i)).isoformat(), "level": random.choice(["INFO", "DEBUG", "WARN"]), "message": msg, "service": "UBS-CORE"}
        for i, msg in enumerate([
            "SWIFT Gateway connection established",
            "Balance sync completed for all accounts",
            "Incoming MT103 processed successfully",
            "GPI tracking update received",
            "Database backup completed",
            "Security scan completed - no threats detected",
            "SSL certificate valid for 365 days",
            "API rate limiter reset",
            "Transaction batch processed: 1,234 entries",
            "System health check: ALL SERVICES OPERATIONAL"
        ])
    ]
    return logs

@api_router.post("/server/command")
async def execute_command(command: dict, payload: dict = Depends(verify_token)):
    cmd = command.get("command", "").strip().lower()
    
    responses = {
        "help": "Available commands: status, balance, swift-status, db-status, clear, time, version",
        "status": "ALL SYSTEMS OPERATIONAL\n- SWIFT Gateway: CONNECTED\n- Database: ONLINE\n- API: HEALTHY",
        "balance": "EUR: 150,000,883,990,393.93\nUSD: 15,235,883,900,008.07\nCHF: 790,000,038,990.88",
        "swift-status": "SWIFT Network: CONNECTED\nLast heartbeat: 2s ago\nMessages today: 12,456",
        "db-status": "MongoDB: CONNECTED\nCollections: 6\nDocuments: 45,892",
        "clear": "CLEAR",
        "time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "version": "UBS Admin Portal v2.4.1\nBuild: 20240115\nEnvironment: Production"
    }
    
    return {"output": responses.get(cmd, f"Unknown command: {cmd}. Type 'help' for available commands.")}

# ================ DATABASE VIEWER ================

@api_router.get("/database/collections")
async def get_collections(payload: dict = Depends(verify_token)):
    collections = await db.list_collection_names()
    result = []
    for col in collections:
        count = await db[col].count_documents({})
        result.append({"name": col, "count": count})
    return result

@api_router.get("/database/{collection}")
async def get_collection_data(collection: str, limit: int = 50, payload: dict = Depends(verify_token)):
    if collection not in await db.list_collection_names():
        raise HTTPException(status_code=404, detail="Collection not found")
    
    docs = await db[collection].find({}, {"_id": 0}).to_list(limit)
    return docs

# ================ LEDGER TO LEDGER TRANSFER ================

class LedgerTransferRequest(BaseModel):
    sender_name: str
    sender_company: str = ""
    sender_account: str
    sender_iban: str = ""
    receiver_bank_name: str
    receiver_bank_address: str = ""
    receiver_swift: str
    receiver_account: str
    receiver_iban: str = ""
    receiver_name: str
    amount: float
    currency: str = "EUR"
    purpose: str = "INVESTMENT / INTERNAL LEDGER"

@api_router.post("/transfers/ledger")
async def create_ledger_transfer(req: LedgerTransferRequest, payload: dict = Depends(verify_token)):
    now = datetime(2025, 3, 21, 10, 30, 0, tzinfo=timezone.utc)
    tx_id = f"{random.randint(10000000,99999999)}CH{random.randint(100000,999999)}"
    ref_num = f"UBSW{random.randint(1000000000,9999999999)}{random.randint(100000,999999)}"
    msg_code = f"CH{random.randint(1000000000,9999999999)}"
    deposit_code = f"UBSW{random.randint(10000000,99999999)}"
    scf_num = f"SCF-{random.randint(1,9)}B{random.randint(1000000000,9999999999)}"
    link_code = str(random.randint(100000000,999999999))
    channel_code = str(random.randint(100000000000,999999999999))
    sat_code = f"{random.randint(100000000000,999999999999)}.0XC{random.randint(1000000,9999999)}E{random.randint(10,99)}.UBS{random.randint(100,999)}"
    identity_code = f"27C UBS CH ZH {random.randint(10,99)}BEH"
    sort_code = f"{random.randint(100,999)} {random.randint(100,999)} {random.randint(10,99)}"
    release_code = f"UBSW{random.randint(10000000000000,99999999999999)}"
    access_code = f"UBSW{random.randint(1000000,9999999)}"
    bonding_key = f"SP{random.randint(10000000000,99999999999)}"
    activation_code = f"{random.randint(1000000,9999999)}/GM{random.randint(10000000,99999999)}"
    feds_code = f"F-{random.randint(10000000,99999999)}.{random.randint(1000,9999)}.G{random.randint(100,999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}-{random.randint(100,999)}"
    intl_deposit = f"UBS{random.randint(100000000,999999999)} LTOL/ NO. {random.randint(10000,99999)}-CA-{random.randint(10000,99999)}"
    dep_tx = f"LEG/NOG{random.randint(100,999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}.G{random.randint(1000,9999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}"
    seq_num = random.randint(100000,999999)

    # hex dump lines
    hex_lines = []
    for i in range(10):
        addr = f"{i*16:04X}"
        b = [f"{random.choice('0123456789ABCDEF')}{random.choice('0123456789ABCDEF')}" for _ in range(8)]
        hex_lines.append(f"{addr} - {' '.join(b[:4])}-{' '.join(b[4:])} {random.choice('.:*<>?/')}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.choice('0123456789')}{random.choice('0123456789')}")

    formatted_amount = f"{req.currency} {req.amount:,.2f}"

    receipt = {
        "transfer_id": str(uuid.uuid4()),
        "timestamp": now.isoformat(),
        "formatted_time": now.strftime("%A, %B %d, %Y %H:%M:%S"),
        "delivery_datetime": now.strftime("%Y-%m-%d %H:%M:%S"),
        "connection": {
            "ip": "194.150.245.0/24",
            "cert_chain": "Depth=2 c=CH, O=\"Symantec Corporation\", OU=Symantec Trust Network, CN=Symantec Class 3 public Primary Certificate Authority - G5",
            "cert_subject": "S:/1.3.6.1.4.1.311.60.2.1.3=Switzerland/1.3.6.1.4.1.311.60.2.1=Bahnhofstrasse 45, 8001 Zurich/businessCategory=Private organization/serialNumber=CHE102169627/C=Switzerland/O=Union Bank of Switzerland AG",
            "cert_issuer": "i:/C=Switzerland/O=Symantec Corporation/OU=Symantec Trust Network/CN=Symantec Class 3 EV SSL CA - G3",
        },
        "sender": {
            "swift": "UBSWCHZHXXX",
            "ip": "194.150.245.0/24",
            "network_status": "GLOBAL ACK",
            "server_id": f"AS{random.randint(1000,9999)}",
            "tx_id": tx_id,
            "serial_id": f"ISP{random.randint(1,9)}CH{random.randint(10,99)}D{random.randint(10,99)}",
            "srv_names": [
                "SRV1 NAME = IP_BANKINGUBS1.UBS.COM",
                "SRV2 NAME = IP_BANKINGUBS2.UBS.COM",
                "SRV3 NAME = IP_BANKINGUBS3.UBS.COM",
            ],
            "identity_code": identity_code,
            "name": req.sender_name,
            "company": req.sender_company or "BB BIOTECH AG",
            "bank_address": "BAHNHOFSTRASSE 45, 8001, ZURICH, SWITZERLAND",
            "account": req.sender_account,
            "iban": req.sender_iban,
        },
        "receiver": {
            "bank_name": req.receiver_bank_name,
            "bank_address": req.receiver_bank_address,
            "swift": req.receiver_swift,
            "account": req.receiver_account,
            "iban": req.receiver_iban,
            "name": req.receiver_name,
            "server_ip": f"{random.randint(100,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
            "server_id": f"AS{random.randint(10000,99999)}",
        },
        "amount": formatted_amount,
        "raw_amount": req.amount,
        "currency": req.currency,
        "purpose": req.purpose,
        "codes": {
            "msg_code": msg_code,
            "tx_id": tx_id,
            "ref_num": ref_num,
            "scf_num": scf_num,
            "link_code": link_code,
            "channel_code": channel_code,
            "deposit_code": deposit_code,
            "blocking_code": "SET BY RECEIVING BANK",
            "reference_code": f"{random.randint(1000,9999)}-{random.randint(1000,9999)}-G{random.randint(100,999)}-{random.randint(1000,9999)}-{ref_num}",
            "feds_code": feds_code,
            "security_code": "SET BY RECEIVING BANK",
            "withdrawal_feds_code": "SET BY RECEIVING BANK",
            "intl_deposit_code": intl_deposit,
            "deposit_tx": dep_tx,
            "sat_code": sat_code,
            "identity_code": identity_code,
            "sort_code": sort_code,
            "release_code": release_code,
            "access_code": access_code,
            "bonding_key": bonding_key,
            "activation_code": activation_code,
        },
        "answerback": {
            "status": "DELIVERED",
            "sender": "UNION BANK OF SWITZERLAND AG",
            "category_code": "RF",
            "sequence_number": seq_num,
            "receipt_swift": "UBSWCHZHXXX",
        },
        "hex_dump": hex_lines,
        "tls": {
            "depth": "DEPTH=L C=CH, O=SYMANTEC CORPORATION, OU=SYMANTEC TRUST NETWORK, CH=SYMANTEC CLASS 3 SECURE SERVER CA - G4 VERIFY RETURN: CORRESPONDING",
            "psk": "NONE",
            "srp": "NONE",
            "ticket_lifetime": "6800 (SECONDS)",
        },
    }

    # Nostro routing stages
    stage_base = now
    nostro_routing = {
        "enabled": True,
        "nostro_bank": "HSBC CONTINENTAL EUROPE SA",
        "nostro_swift": "CCFRFRPP",
        "nostro_iban": "FR7630056000100010000405731",
        "remittance_info": f"For credit to {req.receiver_name}, account no. {req.receiver_account}",
        "stages": [
            {
                "step": 1,
                "label": "UBS AG SWIFT POOL",
                "institution": "UNION BANK OF SWITZERLAND AG",
                "swift_code": "UBSWCHZHXXX",
                "location": "ZURICH, SWITZERLAND",
                "status": "COMPLETED",
                "action": "TRANSFER INITIATED — DEBIT AUTHORIZATION CONFIRMED",
                "timestamp": stage_base.strftime("%Y-%m-%d %H:%M:%S"),
                "details": f"Originator: {req.sender_name} / {req.sender_company or 'BB BIOTECH AG'} | Account: {req.sender_account} | Amount: {formatted_amount}",
            },
            {
                "step": 2,
                "label": "ECB VALIDATION GATEWAY",
                "institution": "EUROPEAN CENTRAL BANK",
                "swift_code": "ECBFDEFFXXX",
                "location": "FRANKFURT, GERMANY",
                "status": "COMPLETED",
                "action": "COMPLIANCE / AML / KYC SCREENING CLEARED",
                "timestamp": (stage_base + timedelta(seconds=12)).strftime("%Y-%m-%d %H:%M:%S"),
                "details": f"Sanction screening: PASSED | FATF compliance: VERIFIED | Transaction ref: {ref_num}",
            },
            {
                "step": 3,
                "label": "NOSTRO ACCOUNT — HSBC CONTINENTAL EUROPE SA",
                "institution": "HSBC CONTINENTAL EUROPE SA",
                "swift_code": "CCFRFRPP",
                "iban": "FR7630056000100010000405731",
                "location": "PARIS, FRANCE",
                "status": "COMPLETED",
                "action": "FUNDS ROUTED VIA NOSTRO CORRESPONDENT ACCOUNT",
                "timestamp": (stage_base + timedelta(seconds=34)).strftime("%Y-%m-%d %H:%M:%S"),
                "details": f"Nostro IBAN: FR7630056000100010000405731 | Correspondent SWIFT: CCFRFRPP | Value date: {stage_base.strftime('%Y-%m-%d')}",
            },
            {
                "step": 4,
                "label": "RECEIVER BANK SWIFT POOL",
                "institution": "HONG KONG AND SHANGHAI BANKING CORPORATION",
                "swift_code": "HSBCHKHHHKH",
                "location": "KOWLOON, HONG KONG",
                "status": "COMPLETED",
                "action": "FUNDS ARRIVED AT DESTINATION BANK SWIFT POOL",
                "timestamp": (stage_base + timedelta(seconds=58)).strftime("%Y-%m-%d %H:%M:%S"),
                "details": f"Receiver bank: HSBC BUILDING, 82 NATHAN ROAD, KOWLOON, HK | Incoming ref: {ref_num}",
            },
            {
                "step": 5,
                "label": "BENEFICIARY CREDITED",
                "institution": req.receiver_name,
                "account": req.receiver_account,
                "location": "HONG KONG",
                "status": "COMPLETED",
                "action": "BENEFICIARY ACCOUNT CREDITED SUCCESSFULLY",
                "timestamp": (stage_base + timedelta(seconds=73)).strftime("%Y-%m-%d %H:%M:%S"),
                "details": f"Account: {req.receiver_account} (MULTI-CURRENCY) | Beneficiary: {req.receiver_name} | Credited: {formatted_amount}",
            },
        ],
    }
    receipt["nostro_routing"] = nostro_routing

    # Save to DB
    actual_now = datetime.now(timezone.utc)
    tx_record = {
        "id": receipt["transfer_id"],
        "type": "LEDGER_TO_LEDGER",
        "transaction_type": "debit",
        "amount": -req.amount,
        "currency": req.currency,
        "description": f"L2L Transfer to {req.receiver_name} via {req.receiver_bank_name}",
        "reference": ref_num,
        "status": "completed",
        "created_at": actual_now,
    }
    await db.transactions.insert_one(tx_record)

    # Save full receipt for L2L Documents page
    l2l_doc = {**receipt, "created_at": actual_now}
    await db.l2l_receipts.insert_one(l2l_doc)

    return receipt

# ================ L2L DOCUMENTS ================

@api_router.get("/l2l-documents")
async def get_l2l_documents(payload: dict = Depends(verify_token)):
    doc = await db.l2l_receipts.find_one(
        {},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    if not doc:
        raise HTTPException(status_code=404, detail="No L2L transfer found")
    if "created_at" in doc and hasattr(doc["created_at"], "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc

# ================ CIS (Customer Information Sheet) ================

@api_router.get("/cis")
async def get_cis(payload: dict = Depends(verify_token)):
    now = datetime.now(timezone.utc)
    ref_base = now.strftime("%Y%m%d")

    balances_data = []
    for cur, acct in STATIC_BALANCES.items():
        balances_data.append({
            "currency": cur,
            "balance": acct["balance"],
            "account_number": acct["account_number"],
            "iban": acct["iban"],
        })

    return {
        "date": now.isoformat(),
        "reference": f"UBS/CIS/{ref_base}/001",
        "bank": {
            "name": "UNION BANK OF SWITZERLAND AG",
            "short_name": "UBS",
            "swift": "UBSWCHZHXXX",
            "bic": "UBSWCHZH80A",
            "address": "Bahnhofstrasse 45, 8001 Zurich, Switzerland",
            "phone": "+41 44 234 1111",
            "fax": "+41 44 234 3399",
            "website": "www.ubs.com",
            "regulator": "Swiss Financial Market Supervisory Authority (FINMA)",
            "bank_license": "Issued 29 June 1998",
        },
        "client": {
            "name": "BB BIOTECH AG",
            "id_number": "CHE-102.169.627",
            "legal_form": "Aktiengesellschaft (AG) / Public Limited Company",
            "address": "Schwertstrasse 6, 8200 Schaffhausen, Zurich, Switzerland",
            "domicile": "Schaffhausen, Switzerland",
            "date_of_incorporation": "09 November 1993",
            "purpose": "Investment company specialising in the biotechnology sector",
            "listed_exchange": "SIX Swiss Exchange (Ticker: BION)",
            "sector": "Healthcare / Biotechnology Investments",
            "tax_domicile": "Switzerland",
            "vat_number": "CHE-102.169.627 MWST",
            "lei": "5493007YRWSIH4POTF83",
        },
        "relationship": {
            "account_opened": "15 January 2008",
            "relationship_manager": "MR. JOHANNES WEBER",
            "rm_title": "Senior Vice President, Private Banking",
            "rm_department": "Institutional & Corporate Clients Division",
            "rm_id": "JW-" + now.strftime("%y") + "-4821",
            "rm_phone": "+41 44 234 4821",
            "rm_email": "johannes.weber@ubs.com",
            "client_segment": "Institutional - Corporate",
            "risk_rating": "Low",
            "kyc_status": "Verified",
            "kyc_last_review": "15 January 2024",
            "kyc_next_review": "15 January 2025",
            "aml_status": "Compliant",
            "fatca_status": "Compliant (Non-US Entity)",
            "crs_status": "Reporting - Switzerland",
            "pep_status": "Not a PEP",
        },
        "signatories": [
            {
                "name": "DR. ERICH HUNZIKER",
                "title": "POA Holder/Authorised Signatory",
                "passport_number": "S1B4753",
                "passport_type": "PM",
                "country_code": "CHE",
                "country_of_issue": "SWITZERLAND",
                "nationality": "Swiss",
                "date_of_birth": "15.09.1953",
                "sex": "M",
                "height": "178 cm",
                "place_of_origin": "Moosleerau AG",
                "date_of_issue": "11.10.2023",
                "date_of_expiry": "10.10.2033",
                "issuing_authority": "Aargau AG",
                "mrz": "PMCHEHUNZIKER<<ERICH / S1B4753<4CHE5309153M3310104",
                "passport_image": "https://customer-assets.emergentagent.com/job_10a739d3-c9f8-41a3-878d-904e8c09e1cd/artifacts/yp8shjfw_IMG-20260319-WA0010.jpg",
            },
            {
                "name": "DR. SERGE COTTENCON",
                "title": "POA Holder/Authorised Signatory",
                "passport_number": "14DA52103",
                "country_of_issue": "FRANCE",
                "nationality": "French",
            },
            {
                "name": "MR. GABRIEL EGO",
                "title": "POA Holder/Authorised Signatory (jointly with two)",
                "origin": "Schwyz",
                "residence": "Seewen SZ (Schwyz)",
                "country_of_issue": "SWITZERLAND",
                "nationality": "Swiss",
                "signing_authority": "Jointly with two",
            },
        ],
        "accounts": balances_data,
        "services": [
            "Current Accounts (Multi-Currency)",
            "International Wire Transfers (SWIFT MT103 / PACS.008 / PACS.009)",
            "SWIFT GPI Payments",
            "Documentary Credits",
            "Foreign Exchange Services",
            "Securities Custody",
            "Cash Management",
            "Online Banking (UBS e-Banking)",
        ],
    }

# ================ BANK LETTERS ================

@api_router.get("/bank-letters")
async def get_bank_letters(payload: dict = Depends(verify_token)):
    now = datetime.now(timezone.utc)
    ref_base = now.strftime("%Y%m%d")
    officer_id = "JW-" + now.strftime("%y") + "-4821"

    profile = {
        "company_name": "BB BIOTECH AG",
        "company_id": "CHE-102.169.627",
        "address": "SCHWERTSTRASSE 6, 8200 SCHAFFHAUSEN, ZURICH, SWITZERLAND",
        "authorized_person": "DR. ERICH HUNZIKER & MR. GABRIEL EGO",
        "authorized_title": "POA Holders/Authorised Signatories",
        "passport": "S1B4753",
    }

    balances_data = []
    for cur, acct in STATIC_BALANCES.items():
        balances_data.append({
            "currency": cur,
            "balance": acct["balance"],
            "account_number": acct["account_number"],
            "iban": acct["iban"],
        })

    return {
        "date": now.isoformat(),
        "profile": profile,
        "balances": balances_data,
        "officer": {
            "name": "MR. JOHANNES WEBER",
            "title": "Senior Vice President, Private Banking",
            "department": "Institutional & Corporate Clients Division",
            "direct_line": "+41 44 234 4821",
            "email": "johannes.weber@ubs.com",
            "officer_id": officer_id,
        },
        "signatories": [
            {
                "name": "DR. ERICH HUNZIKER",
                "title": "POA Holder/Authorised Signatory",
                "passport_number": "S1B4753",
                "passport_type": "PM",
                "country_code": "CHE",
                "country_of_issue": "SWITZERLAND",
                "date_of_birth": "15.09.1953",
                "sex": "M",
                "height": "178 cm",
                "place_of_origin": "Moosleerau AG",
                "date_of_issue": "11.10.2023",
                "date_of_expiry": "10.10.2033",
                "issuing_authority": "Aargau AG",
            },
            {
                "name": "DR. SERGE COTTENCON",
                "title": "POA Holder/Authorised Signatory",
                "passport_number": "14DA52103",
                "country_of_issue": "FRANCE",
                "date_of_issue": "04.09.2014",
                "date_of_expiry": "03.09.2024",
            },
            {
                "name": "MR. GABRIEL EGO",
                "title": "POA Holder/Authorised Signatory (jointly with two)",
                "origin": "SCHWYZ",
                "residence": "SEEWEN SZ (SCHWYZ)",
                "signing_authority": "Authorized to sign jointly with two persons",
                "country_of_issue": "SWITZERLAND",
            },
        ],
        "references": {
            "relationship_ref": f"UBS/RL/{ref_base}/001",
            "confirmation_ref": f"UBS/BCL/{ref_base}/001",
            "statement_ref": f"UBS/STM/{ref_base}/001",
            "asset_ref": f"UBS/ACF/{ref_base}/001",
            "auth_balance_ref": f"UBS/ABL/{ref_base}/001",
        },
        "account_opened": "15 January 2008",
        "relationship_since": "2008",
    }

# ================ ACCOUNT PROFILE ================

@api_router.get("/account-profile")
async def get_account_profile(payload: dict = Depends(verify_token)):
    return {
        "company": {
            "name": "BB BIOTECH AG",
            "id_number": "CHE-102.169.627",
            "address": "SCHWERTSTRASSE 6",
            "postal_code": "8200",
            "city": "SCHAFFHAUSEN",
            "region": "ZURICH",
            "country": "SWITZERLAND",
        },
        "signatories": [
            {
                "name": "DR. ERICH HUNZIKER",
                "title": "POA Holder/Authorised Signatory",
                "passport_number": "S1B4753",
                "passport_type": "PM",
                "country_code": "CHE",
                "country_of_issue": "SWITZERLAND",
                "date_of_birth": "15.09.1953",
                "sex": "M",
                "height": "178 cm",
                "place_of_origin": "Moosleerau AG",
                "date_of_issue": "11.10.2023",
                "date_of_expiry": "10.10.2033",
                "issuing_authority": "Aargau AG",
            },
            {
                "name": "DR. SERGE COTTENCON",
                "title": "POA Holder/Authorised Signatory",
                "passport_number": "14DA52103",
                "country_of_issue": "FRANCE",
                "date_of_issue": "04.09.2014",
                "date_of_expiry": "03.09.2024",
            },
            {
                "name": "MR. GABRIEL EGO",
                "title": "POA Holder/Authorised Signatory (jointly with two)",
                "origin": "SCHWYZ",
                "residence": "SEEWEN SZ (SCHWYZ)",
                "signing_authority": "Authorized to sign jointly with two persons",
                "country_of_issue": "SWITZERLAND",
            },
        ],
        "declaration": "I, DR. ERICH HUNZIKER, DR. SERGE COTTENCON & MR. GABRIEL EGO hereby swear under penalty of perjury, that the information provided herein is accurate and true as of this date.",
        "bank": {
            "name": "UNION BANK OF SWITZERLAND AG",
            "swift": "UBSWCHZHXXX",
            "address": "BAHNHOFSTRASSE 45, 8001 ZURICH, SWITZERLAND",
        },
    }

# ================ ACCOUNT STATEMENT ================

STATIC_BALANCES = {
    "EUR": {"balance": 150000883990393.93, "account_number": "001-8839903939", "iban": "CH93 0027 3001 8839 9039 39"},
    "USD": {"balance": 15235883900008.07, "account_number": "002-5883900008", "iban": "CH93 0027 3002 5883 9000 08"},
    "CHF": {"balance": 790000038990.88, "account_number": "003-0000389908", "iban": "CH93 0027 3003 0000 3899 08"},
}

@api_router.get("/statements/{currency}")
async def get_account_statement(currency: str, payload: dict = Depends(verify_token)):
    currency = currency.upper()
    if currency not in STATIC_BALANCES:
        raise HTTPException(status_code=400, detail="Invalid currency. Use EUR, USD, or CHF")

    acct = STATIC_BALANCES[currency]
    closing_balance = acct["balance"]

    # Get transactions for this currency, sorted oldest first
    transactions = await db.transactions.find(
        {"currency": currency}, {"_id": 0}
    ).sort("created_at", 1).to_list(1000)

    for tx in transactions:
        if isinstance(tx.get("created_at"), str):
            tx["created_at"] = datetime.fromisoformat(tx["created_at"])

    # Calculate opening balance by reversing all movements
    total_movement = sum(tx.get("amount", 0) for tx in transactions)
    opening_balance = closing_balance - total_movement

    # Build statement lines with running balance
    running = opening_balance
    statement_lines = []
    for tx in transactions:
        running += tx.get("amount", 0)
        statement_lines.append({
            "id": tx.get("id", ""),
            "date": tx["created_at"].isoformat() if isinstance(tx["created_at"], datetime) else tx["created_at"],
            "description": tx.get("description", ""),
            "reference": tx.get("reference", ""),
            "transaction_type": tx.get("transaction_type", ""),
            "debit": abs(tx["amount"]) if tx["amount"] < 0 else 0,
            "credit": tx["amount"] if tx["amount"] > 0 else 0,
            "balance": round(running, 2),
        })

    return {
        "currency": currency,
        "account_number": acct["account_number"],
        "iban": acct["iban"],
        "statement_date": datetime.now(timezone.utc).isoformat(),
        "period_start": transactions[0]["created_at"].isoformat() if transactions else datetime.now(timezone.utc).isoformat(),
        "period_end": datetime.now(timezone.utc).isoformat(),
        "opening_balance": round(opening_balance, 2),
        "closing_balance": round(closing_balance, 2),
        "total_debits": round(sum(abs(tx["amount"]) for tx in transactions if tx["amount"] < 0), 2),
        "total_credits": round(sum(tx["amount"] for tx in transactions if tx["amount"] > 0), 2),
        "transaction_count": len(transactions),
        "lines": statement_lines,
    }

@api_router.get("/statements")
async def get_all_statements_summary(payload: dict = Depends(verify_token)):
    result = []
    for cur, acct in STATIC_BALANCES.items():
        tx_count = await db.transactions.count_documents({"currency": cur})
        result.append({
            "currency": cur,
            "account_number": acct["account_number"],
            "iban": acct["iban"],
            "balance": acct["balance"],
            "transaction_count": tx_count,
        })
    return result

# ================ DASHBOARD STATS ================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(payload: dict = Depends(verify_token)):
    tx_count = await db.transactions.count_documents({})
    transfer_count = await db.transfers.count_documents({})
    beneficiary_count = await db.beneficiaries.count_documents({})
    
    return {
        "total_transactions": tx_count,
        "total_transfers": transfer_count,
        "total_beneficiaries": beneficiary_count,
        "pending_transfers": await db.transfers.count_documents({"status": "processing"}),
        "system_status": "operational"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
