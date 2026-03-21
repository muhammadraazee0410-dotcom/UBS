# UBS AG Admin Portal - PRD

## Original Problem Statement
CREATE UNION BANK OF SWITZERLAND AG BANK ADMIN PORTAL WITH ALL BANKING PLATFORM FUNCTIONS.
- Balances: EUR 150,000,883,990,393.93 | USD 15,235,883,900,008.07 | CHF 790,000,038,990.88
- International Transfer (MT103, PACS.008, PACS.009, GPI, Quick Wire)
- Domestic Transfer, Bill Payment, Transaction History, Payment Tracking
- Beneficiary Management, Server Console, Database Viewer
- Bank Letters, CIS, Account Profiles, Statements
- Ledger to Ledger Transfer with Nostro Routing
- SMTP Email System

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT (admin@ubs.ch / UBS@2024)
- **Theme**: White background, dark text, Swiss Red (#DC2626) accents
- **Email**: swiftfintrade@ubs.com via smtp.finance-ubs.com:587 (SIMULATED)

## Implemented Features (All Tested & Working)

### Core Banking
- [x] Dashboard with EUR/USD/CHF balance cards
- [x] International Transfers (MT103, PACS.008, PACS.009) with 4 receipt document types
- [x] Domestic Transfer, Bill Payment
- [x] Transaction History with search/filter
- [x] Payment Tracking with SWIFT GPI timeline
- [x] Beneficiary Management (CRUD)

### Ledger to Ledger
- [x] **L2L Transfer** — EUR 10,000,000,000.00, date 21/03/2025, Nostro routing tracker (5 animated stages)
- [x] **L2L Documents Page** — 6 tabs: Terminal Receipt (Black/White), Nostro Routing Confirmation, Fund Movement Report, Transaction Confirmation Letter, Bank Officer Communication Console

### SMTP Email Console
- [x] **Email Console Page** — swiftfintrade@ubs.com via smtp.finance-ubs.com:587
- [x] 3 views: Compose Email, Sent Emails, SMTP Log
- [x] 4 templates: L2L Confirmation, Transfer Notification, Bank Officer, Custom
- [x] SMTP transmission log with TLS handshake, DKIM signature
- [x] Sent email history with expandable details and print

### Documents & Profiles
- [x] CIS (Customer Information Sheet) with passport & MRZ
- [x] Bank Letters (5 types: Balance, Account, Officer, Reference, Asset)
- [x] Account Profile with BB BIOTECH AG, 3 signatories
- [x] Account Statement with running balances
- [x] Documents Page (8 tabs)
- [x] Server Console, Database Viewer

## Key Files
- `/app/backend/server.py` — All API endpoints
- `/app/frontend/src/pages/EmailConsolePage.jsx` — SMTP Email Console
- `/app/frontend/src/pages/L2LDocumentsPage.jsx` — L2L Documents (6 tabs)
- `/app/frontend/src/pages/LedgerTransferPage.jsx` — L2L Transfer + Nostro Tracker

## Prioritized Backlog
### P1
- [ ] SWIFT GPI Transfer and Quick Wire enhancement
- [ ] Domestic Transfers page enhancement
- [ ] Bill Payments page enhancement
- [ ] International Payment Tracking enhancement

### P2
- [ ] Multi-user admin, Role-based access, Audit logging
- [ ] Export CSV/PDF, Reporting dashboard

## Test Reports
- iteration_2 through iteration_5 — all 100% passed

## Critical Notes
- DO NOT add `data-testid` — user explicitly removed them
- White theme enforced — no dark mode
- All banking data is MOCKED/simulated
- SMTP email is SIMULATED — no real SMTP connection
