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
- Email: admin@ubs.ch / Password: UBS@2024

## What's Been Implemented

### Core Features (All Working - Tested Mar 2026)
- [x] JWT Authentication with admin user creation
- [x] Dashboard with EUR, USD, CHF balance cards + statistics + quick actions
- [x] International Transfers (MT103, PACS.008, PACS.009, GPI, Quick Wire) with SWIFT message generation
- [x] 4 Receipt Document Types after international transfer: Debit Note, PACS.002, MT950, Tax Compliance
- [x] Domestic Transfer with tracking ID
- [x] Bill Payment with payment history
- [x] Transaction History with search/filter + View Receipt modal
- [x] Payment Tracking with SWIFT GPI timeline visualization
- [x] Beneficiary Management (CRUD)
- [x] **Ledger to Ledger Transfer** with Nostro Routing Tracker (5-stage animated fund movement validation)
- [x] **L2L Documents Page** — 6 tabs:
  - Terminal Receipt (Black BG) — green-on-black SWIFT terminal output
  - Terminal Receipt (White BG) — same content for printing
  - Nostro Routing Confirmation — official UBS document with routing stages
  - Fund Movement Validation Report — 5-stage tracker with summary cards
  - Transaction Confirmation Letter — formal UBS letter with dual signatories
  - Bank Officer to Bank Officer Communication Console — 4 SWIFT MT299 messages between UBS-CH and HSBC-HK
- [x] CIS (Customer Information Sheet) with passport, MRZ, compliance status
- [x] Bank Letters Page with 5 official UBS letter types
- [x] Account Profile Page with BB BIOTECH AG, signatories, passport details
- [x] Account Statement Page with running balance per currency
- [x] Documents Page with 8 document tabs
- [x] Server Console with command interface
- [x] Database Viewer with collection browser

### Key Files
- `/app/backend/server.py` — All API logic
- `/app/frontend/src/pages/L2LDocumentsPage.jsx` — L2L Documents (6 tabs)
- `/app/frontend/src/pages/LedgerTransferPage.jsx` — L2L Transfer + Nostro Tracker
- `/app/frontend/src/pages/InternationalTransferPage.jsx` — International Transfer
- `/app/frontend/src/components/Layout.jsx` — Sidebar navigation

## Prioritized Backlog

### P1 - High Priority
- [ ] SMTP email setup (pending credentials from user)
- [ ] SWIFT GPI Transfer and Quick Wire implementation
- [ ] Domestic Transfers page enhancement
- [ ] Bill Payments page enhancement
- [ ] International Payment Tracking page enhancement

### P2 - Medium Priority
- [ ] Multi-user admin management
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Export transactions to CSV/PDF
- [ ] Enhanced reporting dashboard with charts/analytics

### P3 - Low Priority
- [ ] Scheduled transfers
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Multi-level transaction approval workflow
- [ ] Batch transfer processing

## Test Status
- Test reports: iteration_2, iteration_3, iteration_4 — all 100% passed
- Test files: `/app/backend/tests/`

## Critical Notes
- DO NOT add `data-testid` attributes — user explicitly requested removal
- White background theme — no dark mode
- All banking data is MOCKED/simulated
