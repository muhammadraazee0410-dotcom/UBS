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
    timestamp = datetime.now(timezone.utc).strftime("%y%m%d%H%M")
    return f""":20:{ref}
:23B:CRED
:32A:{timestamp}{transfer['currency']}{transfer['amount']:.2f}
:33B:{transfer['currency']}{transfer['amount']:.2f}
:50K:/{transfer['sender_account']}
UNION BANK OF SWITZERLAND AG
BAHNHOFSTRASSE 45
8001 ZURICH SWITZERLAND
:52A:UBSWCHZH80A
:53A:UBSWCHZH80A
:57A:{beneficiary['swift_bic']}
:59:/{beneficiary['account_number']}
{beneficiary['name']}
{beneficiary['address']}
{beneficiary['country']}
:70:{transfer['reference']}
:71A:{transfer.get('charge_option', 'SHA')}
:72:/REC/UNION BANK OF SWITZERLAND
-"""

def generate_pacs008(transfer: dict, beneficiary: dict) -> str:
    msg_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=35))
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>{msg_id}</MsgId>
      <CreDtTm>{timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>{msg_id[:16]}</InstrId>
        <EndToEndId>{transfer['reference']}</EndToEndId>
        <UETR>{str(uuid.uuid4())}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="{transfer['currency']}">{transfer['amount']:.2f}</IntrBkSttlmAmt>
      <ChrgBr>{transfer.get('charge_option', 'SHAR')}</ChrgBr>
      <InstgAgt>
        <FinInstnId>
          <BICFI>UBSWCHZH80A</BICFI>
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
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>{transfer['sender_account']}</IBAN>
        </Id>
      </DbtrAcct>
      <Cdtr>
        <Nm>{beneficiary['name']}</Nm>
        <PstlAdr>
          <Ctry>{beneficiary['country']}</Ctry>
        </PstlAdr>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>{beneficiary['iban']}</IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>{transfer['reference']}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>"""

def generate_pacs009(transfer: dict, beneficiary: dict) -> str:
    msg_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=35))
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08">
  <FICdtTrf>
    <GrpHdr>
      <MsgId>{msg_id}</MsgId>
      <CreDtTm>{timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>{msg_id[:16]}</InstrId>
        <EndToEndId>{transfer['reference']}</EndToEndId>
        <UETR>{str(uuid.uuid4())}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="{transfer['currency']}">{transfer['amount']:.2f}</IntrBkSttlmAmt>
      <InstgAgt>
        <FinInstnId>
          <BICFI>UBSWCHZH80A</BICFI>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
        </FinInstnId>
      </InstdAgt>
      <Dbtr>
        <FinInstnId>
          <BICFI>UBSWCHZH80A</BICFI>
          <Nm>UNION BANK OF SWITZERLAND AG</Nm>
        </FinInstnId>
      </Dbtr>
      <Cdtr>
        <FinInstnId>
          <BICFI>{beneficiary['swift_bic']}</BICFI>
          <Nm>{beneficiary['bank_name']}</Nm>
        </FinInstnId>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>{beneficiary['iban']}</IBAN>
        </Id>
      </CdtrAcct>
    </CdtTrfTxInf>
  </FICdtTrf>
</Document>"""

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
