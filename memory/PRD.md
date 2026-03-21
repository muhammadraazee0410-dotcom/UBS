# UBS AG Admin Portal - PRD

## Original Problem Statement
CREATE UNION BANK OF SWITZERLAND AG BANK ADMIN PORTAL WITH INCLUDES ALL BANKING PLATFORM AND FUNCTION AND WITH BALANCE OF EURO 150,000,883,990,393.93 AND USD BALANCE 15, 235,883,900,008.07 CHF 790,000,038,990.88
- INTERNATIONAL TRANSFER (SWIFT MX PACS.008 ISO 20022, SWIFT MX PACS.009 ISO 20022, MT 103 SINGLE CUSTOMER CREDIT TRANSFER, SWIFT GPI TRANSFER, SWIFT QUICK WIRE)
- DOMESTIC TRANSFER
- BILL PAYMENT 
- COMPLETE ALL TRANSACTION HISTORY 
- SERVER CONSOLE / SERVER TERMINAL
- INTERNATIONAL PAYMENT TRACKING SYSTEM
- ADD BENEFICIARY 
- DATABASE

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Authentication**: JWT-based admin authentication
- **Design**: White background (#FFFFFF) with dark text, Swiss Red accents
- **PDF Generation**: Client-side via window.open + print

## Design Theme
- **Background**: White (#FFFFFF)
- **Text**: Dark/Black (slate-900)
- **Sidebar**: Dark (slate-900) with light text
- **Accent**: Swiss Red (#DC2626)
- **Cards**: Light gray (#F8FAFC)
- **Borders**: Slate-200
- Email: admin@ubs.ch
- Password: UBS@2024

## What's Been Implemented

### Core Features (All Working - Tested Feb/Mar 2026)
- [x] JWT Authentication with admin user creation
- [x] Dashboard with EUR, USD, CHF balance cards + statistics + quick actions
- [x] International Transfers (MT103, PACS.008, PACS.009, GPI, Quick Wire) with SWIFT message generation
- [x] **4 Receipt Document Types** after international transfer: Debit Note, PACS.002, MT950, Tax Compliance (CRS/FATCA/AEOI)
- [x] Domestic Transfer with tracking ID
- [x] Bill Payment with payment history
- [x] Transaction History with search/filter + View Receipt modal (MT103 Answer Back)
- [x] Payment Tracking with SWIFT GPI timeline visualization
- [x] Beneficiary Management (CRUD)
- [x] **Ledger to Ledger Transfer** — SWIFT FIN terminal-style transfer with full receipt, Nostro routing, Print PDF
- [x] **Enhanced L2L with Nostro Routing Tracker** — 5-stage Fund Movement Validation Tracker (UBS SWIFT Pool → ECB → Nostro HSBC Continental Europe SA → HSBC Hong Kong SWIFT Pool → Beneficiary HONG KONG UNIWORLD LIMITED). Animated stage progression, SWIFT routing flow bar, detailed stage cards with timestamps. Pre-filled with EUR 99,000,000.00 transfer. Nostro details: CCFRFRPP / FR7630056000100010000405731. Print receipt includes tracker table.
- [x] **CIS (Customer Information Sheet)** — Combined UBS & BB BIOTECH AG document with bank details, client entity, relationship manager, compliance/KYC status, accounts, signatories, services, Print PDF
- [x] **Bank Letters Page** with 5 official UBS letter types: Authorised Balance Confirmation, Account Relationship, Bank Officer, Bank Reference, Asset Control — all with Print PDF
- [x] **Account Profile Page** with BB BIOTECH AG company info, authorised signatories, passport details, sworn declaration, signature blocks, Print PDF
- [x] **Account Statement Page** with running balance per currency, opening/closing balances, Print PDF
- [x] Documents Page with 8 document tabs + Print PDF
- [x] Server Console with command interface
- [x] Database Viewer with collection browser

### Frontend Pages
- LoginPage, DashboardPage, InternationalTransferPage, DomesticTransferPage
- BillPaymentPage, TransactionHistoryPage, PaymentTrackingPage
- BeneficiaryPage, StatementPage, DocumentsPage, ServerConsolePage, DatabasePage
- AccountProfilePage, BankLettersPage, CISPage, LedgerTransferPage

### Key Files
- `/app/backend/server.py` - All API logic
- `/app/frontend/src/pages/LedgerTransferPage.jsx` - L2L Transfer + Nostro Tracker
- `/app/frontend/src/pages/InternationalTransferPage.jsx` - Transfer flow + 4 receipt generators
- `/app/frontend/src/pages/DocumentsPage.jsx` - 8 document tabs + print
- `/app/frontend/src/components/Layout.jsx` - Sidebar navigation + UBS logo

## Prioritized Backlog

### P1 - High Priority
- [ ] SMTP email setup to send email to client (pending credentials)
- [ ] SWIFT GPI Transfer and Quick Wire implementation
- [ ] Domestic Transfers page enhancement
- [ ] Bill Payments page enhancement
- [ ] International Payment Tracking page enhancement
- [ ] Export transactions to CSV/PDF

### P2 - Medium Priority
- [ ] Multi-user admin management
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Enhanced reporting dashboard with charts/analytics

### P3 - Low Priority
- [ ] Scheduled transfers
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Multi-level transaction approval workflow
- [ ] Batch transfer processing
- [ ] Language localization

## Test Status
- Backend: 100% (All tests passed)
- Frontend: 100% (All UI flows tested)
- Test reports: `/app/test_reports/iteration_2.json`, `/app/test_reports/iteration_3.json`
- Test files: `/app/backend/tests/test_ubs_portal.py`, `/app/backend/tests/test_ledger_transfer_nostro.py`

## Project Health
- **Broken**: Nothing
- **Mocked**: All banking data is mock/simulated (balances static, SWIFT messages generated, tracking simulated)

## Critical Notes
- DO NOT add `data-testid` attributes — user explicitly requested removal
- White background theme enforced — no dark mode
- User provides exact real-world data payloads — copy values exactly into mock data
