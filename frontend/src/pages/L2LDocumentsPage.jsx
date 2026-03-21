import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  FileText,
  Printer,
  Terminal,
  Shield,
  Globe,
  Users,
  CheckCircle,
  Clock,
  Building2,
  Landmark,
  CircleCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const TABS = [
  { id: 'terminal-black', label: 'Terminal Receipt (Black)', icon: Terminal },
  { id: 'terminal-white', label: 'Terminal Receipt (White)', icon: FileText },
  { id: 'nostro', label: 'Nostro Routing Confirmation', icon: Globe },
  { id: 'validation', label: 'Fund Movement Report', icon: Shield },
  { id: 'confirmation', label: 'Transaction Confirmation', icon: CheckCircle },
  { id: 'officer', label: 'Officer Communication', icon: Users },
];

const L2LDocumentsPage = () => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('terminal-black');

  useEffect(() => {
    fetchReceipt();
  }, []);

  const fetchReceipt = async () => {
    setLoading(true);
    try {
      const res = await api.get('/l2l-documents');
      setReceipt(res.data);
    } catch {
      toast.error('No L2L transfer documents found. Execute a transfer first.');
    } finally {
      setLoading(false);
    }
  };

  const printDocument = (htmlContent) => {
    const w = window.open('', '_blank');
    w.document.write(htmlContent);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Terminal className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 text-lg font-heading">No L2L Documents Available</p>
        <p className="text-slate-400 text-sm mt-2">Execute a Ledger to Ledger transfer first to generate documents.</p>
      </div>
    );
  }

  const nr = receipt.nostro_routing || {};
  const stages = nr.stages || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            L2L Transfer Documents
          </h1>
          <p className="text-slate-500 mt-1">Ledger to Ledger — Official Transfer Documentation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 text-xs rounded-sm border border-green-300">
            REF: {receipt.codes?.ref_num}
          </Badge>
          <Badge className="bg-slate-100 text-slate-700 text-xs rounded-sm border border-slate-300">
            {receipt.amount}
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition-all ${
                isActive
                  ? 'border-swiss-red text-swiss-red bg-red-50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'terminal-black' && <TerminalBlack receipt={receipt} onPrint={printDocument} />}
        {activeTab === 'terminal-white' && <TerminalWhite receipt={receipt} onPrint={printDocument} />}
        {activeTab === 'nostro' && <NostroConfirmation receipt={receipt} nr={nr} stages={stages} onPrint={printDocument} />}
        {activeTab === 'validation' && <ValidationReport receipt={receipt} nr={nr} stages={stages} onPrint={printDocument} />}
        {activeTab === 'confirmation' && <TransactionConfirmation receipt={receipt} nr={nr} onPrint={printDocument} />}
        {activeTab === 'officer' && <OfficerCommunication receipt={receipt} nr={nr} stages={stages} onPrint={printDocument} />}
      </div>
    </div>
  );
};

export default L2LDocumentsPage;

/* ============================================================
   TAB 1: TERMINAL RECEIPT (BLACK BACKGROUND)
   ============================================================ */
function TerminalBlack({ receipt, onPrint }) {
  const r = receipt;
  const nr = r.nostro_routing || {};
  const terminalText = buildTerminalText(r, nr);

  const handlePrint = () => {
    onPrint(`<html><head><title>UBS L2L Terminal Receipt</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#000;color:#22c55e;font-family:'Courier New',monospace;font-size:9px;padding:20px;line-height:1.5}
      pre{white-space:pre-wrap;word-wrap:break-word}
      .hdr{border-bottom:1px solid #22c55e;padding-bottom:10px;margin-bottom:15px;display:flex;justify-content:space-between}
      .logo{font-size:20px;font-weight:bold;color:#DC2626}
      @media print{body{background:#000;color:#22c55e;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
      <div class="hdr"><div><div class="logo">UBS</div><div>SWIFT FIN TERMINAL — LEDGER TO LEDGER</div></div><div style="text-align:right">${r.delivery_datetime}<br>REF: ${r.codes.ref_num}</div></div>
      <pre>${terminalText}</pre>
    </body></html>`);
  };

  return (
    <Card className="bg-black border-slate-700 rounded-sm overflow-hidden">
      <CardHeader className="border-b border-slate-700 py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-green-400 font-mono text-sm flex items-center gap-2">
          <Terminal className="w-4 h-4" /> SWIFT FIN TERMINAL — L2L RECEIPT (ORIGINAL)
        </CardTitle>
        <Button onClick={handlePrint} size="sm" className="bg-green-900 hover:bg-green-800 text-green-400 rounded-sm text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[700px]">
          <pre className="p-4 text-[10px] leading-relaxed font-mono text-green-400 whitespace-pre-wrap">{terminalText}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   TAB 2: TERMINAL RECEIPT (WHITE BACKGROUND)
   ============================================================ */
function TerminalWhite({ receipt, onPrint }) {
  const r = receipt;
  const nr = r.nostro_routing || {};
  const terminalText = buildTerminalText(r, nr);

  const handlePrint = () => {
    onPrint(`<html><head><title>UBS L2L Terminal Receipt (Print)</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#fff;color:#000;font-family:'Courier New',monospace;font-size:9px;padding:20px;line-height:1.5}
      pre{white-space:pre-wrap;word-wrap:break-word}
      .hdr{border-bottom:2px solid #DC2626;padding-bottom:10px;margin-bottom:15px;display:flex;justify-content:space-between}
      .logo{font-size:24px;font-weight:bold;color:#DC2626}
      .stamp{border:2px solid #DC2626;padding:8px 15px;text-align:center;color:#DC2626;margin-top:20px;display:inline-block}
      .footer{margin-top:15px;border-top:1px solid #ccc;padding-top:10px;font-size:7px;color:#666}
      @media print{body{padding:10px;font-size:8px}}
    </style></head><body>
      <div class="hdr"><div><div class="logo">UBS</div><div>Union Bank of Switzerland AG</div><div style="color:#666">SWIFT FIN LEDGER TO LEDGER TRANSFER — TERMINAL OUTPUT</div></div><div style="text-align:right"><div>Date: ${r.delivery_datetime}</div><div>Ref: ${r.codes.ref_num}</div></div></div>
      <pre>${terminalText}</pre>
      <div style="text-align:center"><div class="stamp"><div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div><div style="font-size:18px;font-weight:bold">UBS</div><div style="font-size:7px">L2L TERMINAL OUTPUT — VERIFIED</div></div></div>
      <div class="footer">LEDGER TO LEDGER TRANSFER | REF: ${r.codes.ref_num} | ${new Date().toISOString()}<br>THIS IS A COMPUTER-GENERATED DOCUMENT.</div>
    </body></html>`);
  };

  return (
    <Card className="bg-white border-slate-200 rounded-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 py-3 flex flex-row items-center justify-between bg-slate-50">
        <CardTitle className="text-slate-900 font-mono text-sm flex items-center gap-2">
          <Terminal className="w-4 h-4 text-swiss-red" /> SWIFT FIN TERMINAL — L2L RECEIPT (PRINT)
        </CardTitle>
        <Button onClick={handlePrint} size="sm" className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[700px]">
          <pre className="p-4 text-[10px] leading-relaxed font-mono text-slate-900 whitespace-pre-wrap">{terminalText}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   TAB 3: NOSTRO ROUTING CONFIRMATION
   ============================================================ */
function NostroConfirmation({ receipt, nr, stages, onPrint }) {
  const r = receipt;
  const handlePrint = () => {
    const stageRows = stages.map((s, i) => `
      <tr><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;background:#dcfce7">${s.step}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;font-weight:bold">${s.institution}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;font-family:monospace;font-size:8px">${s.swift_code || '-'}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;font-size:8px">${s.location}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;color:#16a34a;font-weight:bold">VERIFIED</td></tr>
    `).join('');
    onPrint(`<html><head><title>UBS Nostro Routing Confirmation</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;padding:40px;font-size:10px;color:#000;line-height:1.6;background:#fff}
      .hdr{border-bottom:3px solid #DC2626;padding-bottom:15px;margin-bottom:25px;display:flex;justify-content:space-between}
      .logo{font-size:32px;font-weight:bold;color:#DC2626;letter-spacing:2px}
      h2{font-size:14px;margin:20px 0 10px;text-transform:uppercase;letter-spacing:1px;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:5px}
      table{width:100%;border-collapse:collapse;font-size:9px;margin:10px 0}
      th{background:#1e293b;color:white;padding:8px 10px;text-align:left;border:1px solid #334155;font-size:8px}
      .nostro-box{background:#fffbeb;border:2px solid #f59e0b;padding:15px;margin:15px 0;border-radius:2px}
      .stamp{border:2px solid #DC2626;padding:10px 20px;text-align:center;color:#DC2626;margin-top:25px;display:inline-block}
      .footer{margin-top:20px;border-top:1px solid #ccc;padding-top:10px;font-size:7px;color:#666}
      .info-grid{display:grid;grid-template-columns:180px 1fr;gap:4px 15px;font-size:9px;margin:8px 0}
      .info-grid .lbl{color:#64748b;font-weight:bold}.info-grid .val{font-family:monospace;color:#1e293b}
      @media print{body{padding:20px;font-size:9px}}
    </style></head><body>
      <div class="hdr"><div><div class="logo">UBS</div><div style="font-size:10px;color:#64748b">Union Bank of Switzerland AG</div><div style="font-size:11px;font-weight:bold;margin-top:5px;color:#1e293b">NOSTRO ROUTING CONFIRMATION</div><div style="font-size:9px;color:#64748b">Ledger to Ledger Transfer — Correspondent Banking</div></div><div style="text-align:right;font-size:9px"><div>Date: ${r.delivery_datetime}</div><div>Ref: ${r.codes.ref_num}</div><div style="margin-top:5px;padding:3px 8px;background:#dcfce7;color:#16a34a;display:inline-block;font-weight:bold">ROUTING VERIFIED</div></div></div>
      <h2>Transfer Summary</h2>
      <div class="info-grid">
        <span class="lbl">Transfer Amount:</span><span class="val">${r.amount}</span>
        <span class="lbl">Originator:</span><span class="val">${r.sender.name} / ${r.sender.company}</span>
        <span class="lbl">Originator Account:</span><span class="val">${r.sender.account} | IBAN: ${r.sender.iban}</span>
        <span class="lbl">Originator SWIFT:</span><span class="val">${r.sender.swift}</span>
        <span class="lbl">Beneficiary:</span><span class="val">${r.receiver.name}</span>
        <span class="lbl">Beneficiary Bank:</span><span class="val">${r.receiver.bank_name}</span>
        <span class="lbl">Beneficiary SWIFT:</span><span class="val">${r.receiver.swift}</span>
        <span class="lbl">Beneficiary Account:</span><span class="val">${r.receiver.account}</span>
        <span class="lbl">Transaction ID:</span><span class="val">${r.codes.tx_id}</span>
      </div>
      <div class="nostro-box">
        <div style="font-weight:bold;font-size:10px;margin-bottom:8px;text-transform:uppercase;color:#92400e">Nostro Correspondent Account (EUR)</div>
        <div class="info-grid">
          <span class="lbl">Institution:</span><span class="val">${nr.nostro_bank}</span>
          <span class="lbl">SWIFT / BIC:</span><span class="val">${nr.nostro_swift}</span>
          <span class="lbl">IBAN:</span><span class="val">${nr.nostro_iban}</span>
          <span class="lbl">Remittance Information:</span><span class="val">${nr.remittance_info}</span>
        </div>
      </div>
      <h2>Routing Path Confirmation</h2>
      <table><tr><th>Step</th><th>Institution</th><th>SWIFT Code</th><th>Location</th><th>Status</th></tr>${stageRows}</table>
      <div style="text-align:center;margin:15px 0;font-family:monospace;font-size:9px;padding:8px;background:#f0fdf4;border:1px solid #86efac">UBSWCHZHXXX &rarr; ECBFDEFFXXX &rarr; CCFRFRPP &rarr; HSBCHKHHHKH &rarr; BENEFICIARY CREDITED</div>
      <div style="text-align:center"><div class="stamp"><div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div><div style="font-size:20px;font-weight:bold">UBS</div><div style="font-size:7px">NOSTRO ROUTING CONFIRMED</div></div></div>
      <div class="footer">NOSTRO ROUTING CONFIRMATION | Correspondent: ${nr.nostro_swift} / ${nr.nostro_iban} | REF: ${r.codes.ref_num} | ${new Date().toISOString()}<br>THIS DOCUMENT CONFIRMS FUNDS WERE ROUTED VIA THE SPECIFIED NOSTRO CORRESPONDENT ACCOUNT. COMPUTER-GENERATED — NO SIGNATURE REQUIRED.</div>
    </body></html>`);
  };

  return (
    <Card className="bg-white border-slate-200 rounded-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50 py-4 flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
          NOSTRO ROUTING CONFIRMATION
        </CardTitle>
        <Button onClick={handlePrint} size="sm" className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print PDF
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Transfer Summary */}
        <div>
          <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold mb-3">Transfer Summary</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Transfer Amount" value={r.amount} mono />
            <Row label="Originator" value={`${r.sender.name} / ${r.sender.company}`} />
            <Row label="Originator Account" value={`${r.sender.account} | IBAN: ${r.sender.iban}`} mono />
            <Row label="Beneficiary" value={r.receiver.name} />
            <Row label="Beneficiary Bank" value={r.receiver.bank_name} />
            <Row label="Beneficiary SWIFT" value={r.receiver.swift} mono />
            <Row label="Beneficiary Account" value={r.receiver.account} mono />
            <Row label="Transaction ID" value={r.codes.tx_id} mono />
          </div>
        </div>

        {/* Nostro Account */}
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-sm">
          <p className="text-[10px] text-amber-800 uppercase tracking-widest font-bold mb-3">Nostro Correspondent Account (EUR)</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Institution" value={nr.nostro_bank} />
            <Row label="SWIFT / BIC" value={nr.nostro_swift} mono />
            <Row label="IBAN" value={nr.nostro_iban} mono />
            <Row label="Remittance Info" value={nr.remittance_info} />
          </div>
        </div>

        {/* Routing Path */}
        <div>
          <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold mb-3">Routing Path Confirmation</p>
          <div className="space-y-3">
            {stages.map((s) => (
              <div key={s.step} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-sm">
                <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{s.institution}</p>
                  <p className="text-xs text-slate-600">{s.swift_code} — {s.location}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 text-[9px] rounded-sm border border-green-200">VERIFIED</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Flow Bar */}
        <div className="p-3 bg-slate-900 rounded-sm">
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {stages.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[10px] font-mono px-2 py-1 bg-green-900 text-green-400 border border-green-700 rounded">{s.swift_code || s.institution}</span>
                {i < stages.length - 1 && <ArrowRight className="w-4 h-4 text-green-500" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   TAB 4: FUND MOVEMENT VALIDATION REPORT
   ============================================================ */
function ValidationReport({ receipt, nr, stages, onPrint }) {
  const r = receipt;
  const handlePrint = () => {
    const stageRows = stages.map(s => `
      <tr>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;background:#dcfce7">${s.step}</td>
        <td style="padding:8px 10px;border:1px solid #ddd"><strong>${s.label}</strong><br><span style="font-size:7px;color:#666">${s.institution}</span></td>
        <td style="padding:8px 10px;border:1px solid #ddd;font-family:monospace;font-size:8px">${s.swift_code || '-'}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;font-size:8px">${s.location}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;font-size:8px">${s.action}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;font-family:monospace;font-size:8px">${s.timestamp}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;font-size:8px;word-break:break-all">${s.details}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#16a34a;font-weight:bold">COMPLETED</td>
      </tr>
    `).join('');
    onPrint(`<html><head><title>UBS Fund Movement Validation Report</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;padding:30px;font-size:10px;color:#000;line-height:1.5;background:#fff}
      .hdr{border-bottom:3px solid #DC2626;padding-bottom:15px;margin-bottom:20px;display:flex;justify-content:space-between}
      .logo{font-size:32px;font-weight:bold;color:#DC2626;letter-spacing:2px}
      h2{font-size:12px;margin:18px 0 8px;text-transform:uppercase;letter-spacing:1px;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;font-size:8px;margin:10px 0}
      th{background:#1e293b;color:white;padding:6px 8px;text-align:left;border:1px solid #334155;font-size:7px}
      .stamp{border:2px solid #DC2626;padding:10px 20px;text-align:center;color:#DC2626;margin-top:25px;display:inline-block}
      .footer{margin-top:20px;border-top:1px solid #ccc;padding-top:10px;font-size:7px;color:#666}
      .info-grid{display:grid;grid-template-columns:160px 1fr;gap:3px 12px;font-size:9px;margin:5px 0}
      .info-grid .lbl{color:#64748b;font-weight:bold}.info-grid .val{font-family:monospace;color:#1e293b}
      .summary-box{background:#f0fdf4;border:1px solid #86efac;padding:12px;margin:15px 0;text-align:center}
      @media print{body{padding:15px;font-size:8px}}
    </style></head><body>
      <div class="hdr"><div><div class="logo">UBS</div><div style="font-size:10px;color:#64748b">Union Bank of Switzerland AG</div><div style="font-size:12px;font-weight:bold;margin-top:5px">FUND MOVEMENT VALIDATION REPORT</div><div style="font-size:9px;color:#64748b">Ledger to Ledger Transfer — Nostro Routing Validation</div></div><div style="text-align:right;font-size:9px"><div>Date: ${r.delivery_datetime}</div><div>Ref: ${r.codes.ref_num}</div><div>TX ID: ${r.codes.tx_id}</div><div style="margin-top:5px;padding:3px 8px;background:#dcfce7;color:#16a34a;font-weight:bold;display:inline-block">ALL STAGES VERIFIED</div></div></div>
      <h2>Transaction Details</h2>
      <div class="info-grid">
        <span class="lbl">Transfer Amount:</span><span class="val">${r.amount}</span>
        <span class="lbl">Originator:</span><span class="val">${r.sender.name} / ${r.sender.company}</span>
        <span class="lbl">Beneficiary:</span><span class="val">${r.receiver.name}</span>
        <span class="lbl">Beneficiary Bank:</span><span class="val">${r.receiver.bank_name} (${r.receiver.swift})</span>
        <span class="lbl">Nostro Account:</span><span class="val">${nr.nostro_bank} (${nr.nostro_swift}) — ${nr.nostro_iban}</span>
        <span class="lbl">Reference:</span><span class="val">${r.codes.ref_num}</span>
      </div>
      <h2>Validation Stages</h2>
      <table><tr><th>#</th><th>Stage</th><th>SWIFT</th><th>Location</th><th>Action</th><th>Timestamp</th><th>Details</th><th>Status</th></tr>${stageRows}</table>
      <div class="summary-box"><strong>ROUTING PATH:</strong> UBSWCHZHXXX &rarr; ECBFDEFFXXX &rarr; CCFRFRPP &rarr; HSBCHKHHHKH &rarr; BENEFICIARY CREDITED<br><br>ALL 5 VALIDATION STAGES COMPLETED SUCCESSFULLY. FUNDS ROUTED VIA NOSTRO CORRESPONDENT ACCOUNT.</div>
      <div style="text-align:center"><div class="stamp"><div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div><div style="font-size:20px;font-weight:bold">UBS</div><div style="font-size:7px">FUND MOVEMENT VALIDATED</div></div></div>
      <div class="footer">FUND MOVEMENT VALIDATION REPORT | REF: ${r.codes.ref_num} | TX: ${r.codes.tx_id} | ${new Date().toISOString()}<br>THIS REPORT CONFIRMS ALL FUND MOVEMENT STAGES HAVE BEEN VALIDATED AND COMPLETED. COMPUTER-GENERATED.</div>
    </body></html>`);
  };

  return (
    <Card className="bg-white border-slate-200 rounded-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50 py-4 flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
          FUND MOVEMENT VALIDATION REPORT
        </CardTitle>
        <Button onClick={handlePrint} size="sm" className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print PDF
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Amount</p>
            <p className="font-mono text-lg font-bold text-slate-900 mt-1">{r.amount}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Stages</p>
            <p className="font-mono text-lg font-bold text-green-600 mt-1">5 / 5 PASSED</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</p>
            <p className="text-lg font-bold text-green-600 mt-1">ALL VERIFIED</p>
          </div>
        </div>

        {/* Detailed Stages */}
        <div>
          <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold mb-3">Validation Stages</p>
          <div className="space-y-3">
            {stages.map((s) => (
              <div key={s.step} className="p-4 bg-white border border-green-200 rounded-sm shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</div>
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase">{s.label}</p>
                      <p className="text-sm font-bold text-slate-900">{s.institution}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.action}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{s.details}</p>
                      {s.iban && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-sm">
                          <p className="text-[10px] font-mono text-amber-800">NOSTRO IBAN: {s.iban} | SWIFT: {s.swift_code}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" /><span className="font-mono">{s.timestamp}</span>
                    </div>
                    <Badge className="mt-1 bg-green-100 text-green-700 text-[9px] rounded-sm border border-green-200">COMPLETED</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   TAB 5: TRANSACTION CONFIRMATION LETTER
   ============================================================ */
function TransactionConfirmation({ receipt, nr, onPrint }) {
  const r = receipt;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    onPrint(`<html><head><title>UBS Transaction Confirmation Letter</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;padding:50px 60px;font-size:11px;color:#000;line-height:1.8;background:#fff}
      .hdr{border-bottom:3px solid #DC2626;padding-bottom:15px;margin-bottom:30px}
      .logo{font-size:36px;font-weight:bold;color:#DC2626;letter-spacing:3px}
      .addr{font-size:9px;color:#666;margin-top:3px}
      .date{text-align:right;margin-bottom:20px;font-size:10px}
      .subject{font-weight:bold;font-size:12px;text-decoration:underline;margin:20px 0 15px}
      .table{width:100%;border-collapse:collapse;margin:15px 0;font-size:10px}
      .table td{padding:6px 10px;border:1px solid #ddd}.table td:first-child{background:#f8fafc;font-weight:bold;width:200px}
      .sig{margin-top:40px;display:flex;justify-content:space-between}
      .sig-block{text-align:center;width:200px}
      .sig-line{border-top:1px solid #000;margin-top:40px;padding-top:5px;font-size:9px}
      .stamp{border:2px solid #DC2626;padding:8px 15px;text-align:center;color:#DC2626;display:inline-block;margin-top:20px}
      .footer{margin-top:30px;border-top:1px solid #ccc;padding-top:10px;font-size:7px;color:#666}
      @media print{body{padding:30px 40px;font-size:10px}}
    </style></head><body>
      <div class="hdr"><div class="logo">UBS</div><div class="addr">Union Bank of Switzerland AG | Bahnhofstrasse 45 | CH-8001 Zurich, Switzerland</div><div class="addr">Tel: +41 44 234 1111 | SWIFT: UBSWCHZHXXX | www.ubs.com</div></div>
      <div class="date">${today}</div>
      <p><strong>TO:</strong> ${r.receiver.name}<br>${r.receiver.bank_name}<br>${r.receiver.bank_address}</p>
      <p class="subject">RE: CONFIRMATION OF LEDGER TO LEDGER FUND TRANSFER</p>
      <p>Dear Sir/Madam,</p>
      <p>We hereby confirm that the following Ledger to Ledger fund transfer has been executed and completed successfully through our SWIFT FIN secure network, routed via the designated Nostro correspondent account.</p>
      <table class="table">
        <tr><td>Reference Number</td><td>${r.codes.ref_num}</td></tr>
        <tr><td>Transaction ID</td><td>${r.codes.tx_id}</td></tr>
        <tr><td>Transfer Amount</td><td>${r.amount}</td></tr>
        <tr><td>Value Date</td><td>${r.delivery_datetime}</td></tr>
        <tr><td>Originator</td><td>${r.sender.name} — ${r.sender.company}</td></tr>
        <tr><td>Originator Account</td><td>${r.sender.account} | IBAN: ${r.sender.iban}</td></tr>
        <tr><td>Originator SWIFT</td><td>${r.sender.swift}</td></tr>
        <tr><td>Beneficiary</td><td>${r.receiver.name}</td></tr>
        <tr><td>Beneficiary Account</td><td>${r.receiver.account}</td></tr>
        <tr><td>Beneficiary Bank</td><td>${r.receiver.bank_name}</td></tr>
        <tr><td>Beneficiary SWIFT</td><td>${r.receiver.swift}</td></tr>
        <tr><td>Nostro Correspondent</td><td>${nr.nostro_bank} (${nr.nostro_swift})</td></tr>
        <tr><td>Nostro IBAN</td><td>${nr.nostro_iban}</td></tr>
        <tr><td>Routing Path</td><td>UBSWCHZHXXX &rarr; ECBFDEFFXXX &rarr; CCFRFRPP &rarr; HSBCHKHHHKH</td></tr>
        <tr><td>Status</td><td style="color:#16a34a;font-weight:bold">COMPLETED — BENEFICIARY CREDITED</td></tr>
      </table>
      <p>This transfer has been processed in compliance with all applicable regulations, including Anti-Money Laundering (AML), Know Your Customer (KYC), and FATF requirements. All validation stages have been completed and verified.</p>
      <p>Should you require any further information or clarification regarding this transaction, please do not hesitate to contact the undersigned officers.</p>
      <p>Yours faithfully,</p>
      <div class="sig">
        <div class="sig-block"><div class="sig-line">DR. ERICH HUNZIKER<br>Authorized Signatory<br>Union Bank of Switzerland AG</div></div>
        <div style="text-align:center"><div class="stamp"><div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div><div style="font-size:20px;font-weight:bold">UBS</div><div style="font-size:7px">TRANSACTION CONFIRMED</div></div></div>
        <div class="sig-block"><div class="sig-line">DR. DANIEL COTTENCON<br>Authorized Signatory<br>Union Bank of Switzerland AG</div></div>
      </div>
      <div class="footer">Union Bank of Switzerland AG | Bahnhofstrasse 45, CH-8001 Zurich | CHE-102.169.627 | Member of Swiss Bankers Association<br>This letter is an official document issued by Union Bank of Switzerland AG and confirms the transfer described above.</div>
    </body></html>`);
  };

  return (
    <Card className="bg-white border-slate-200 rounded-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50 py-4 flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
          TRANSACTION CONFIRMATION LETTER
        </CardTitle>
        <Button onClick={handlePrint} size="sm" className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print PDF
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Letter Header */}
          <div className="border-b-2 border-swiss-red pb-4">
            <p className="text-3xl font-bold text-swiss-red tracking-wider">UBS</p>
            <p className="text-xs text-slate-500 mt-1">Union Bank of Switzerland AG | Bahnhofstrasse 45 | CH-8001 Zurich, Switzerland</p>
            <p className="text-xs text-slate-500">Tel: +41 44 234 1111 | SWIFT: UBSWCHZHXXX | www.ubs.com</p>
          </div>

          <p className="text-right text-sm text-slate-700">{today}</p>

          <div className="text-sm text-slate-900">
            <p className="font-bold">TO: {r.receiver.name}</p>
            <p>{r.receiver.bank_name}</p>
            <p>{r.receiver.bank_address}</p>
          </div>

          <p className="font-bold text-sm underline">RE: CONFIRMATION OF LEDGER TO LEDGER FUND TRANSFER</p>

          <p className="text-sm text-slate-700">Dear Sir/Madam,</p>
          <p className="text-sm text-slate-700">We hereby confirm that the following Ledger to Ledger fund transfer has been executed and completed successfully through our SWIFT FIN secure network, routed via the designated Nostro correspondent account.</p>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Reference Number', r.codes.ref_num],
                  ['Transaction ID', r.codes.tx_id],
                  ['Transfer Amount', r.amount],
                  ['Value Date', r.delivery_datetime],
                  ['Originator', `${r.sender.name} — ${r.sender.company}`],
                  ['Originator Account', `${r.sender.account} | IBAN: ${r.sender.iban}`],
                  ['Beneficiary', r.receiver.name],
                  ['Beneficiary Account', r.receiver.account],
                  ['Beneficiary Bank', `${r.receiver.bank_name} (${r.receiver.swift})`],
                  ['Nostro Correspondent', `${nr.nostro_bank} (${nr.nostro_swift})`],
                  ['Nostro IBAN', nr.nostro_iban],
                  ['Routing Path', 'UBSWCHZHXXX → ECBFDEFFXXX → CCFRFRPP → HSBCHKHHHKH'],
                  ['Status', 'COMPLETED — BENEFICIARY CREDITED'],
                ].map(([k, v], i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 bg-slate-50 font-bold text-slate-700 w-48">{k}</td>
                    <td className={`px-4 py-2 font-mono text-xs ${k === 'Status' ? 'text-green-700 font-bold' : 'text-slate-900'}`}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-700">This transfer has been processed in compliance with all applicable regulations, including Anti-Money Laundering (AML), Know Your Customer (KYC), and FATF requirements.</p>
          <p className="text-sm text-slate-700">Yours faithfully,</p>

          {/* Signatures */}
          <div className="flex justify-between items-end mt-10 pt-4">
            <div className="text-center">
              <div className="border-t border-slate-900 w-48 pt-2 mt-12">
                <p className="text-xs font-bold">DR. ERICH HUNZIKER</p>
                <p className="text-[10px] text-slate-500">Authorized Signatory</p>
              </div>
            </div>
            <div className="text-center border-2 border-swiss-red px-6 py-3">
              <p className="text-[8px] text-swiss-red">UNION BANK OF SWITZERLAND AG</p>
              <p className="text-xl font-bold text-swiss-red">UBS</p>
              <p className="text-[8px] text-swiss-red">TRANSACTION CONFIRMED</p>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-900 w-48 pt-2 mt-12">
                <p className="text-xs font-bold">DR. DANIEL COTTENCON</p>
                <p className="text-[10px] text-slate-500">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   TAB 6: BANK OFFICER TO BANK OFFICER COMMUNICATION CONSOLE
   ============================================================ */
function OfficerCommunication({ receipt, nr, stages, onPrint }) {
  const r = receipt;
  const now = new Date();
  const ts = (offset) => {
    const d = new Date(now.getTime() + offset * 1000);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  };

  const messages = [
    { from: 'UBS-OFFICER-CH', to: 'HSBC-OFFICER-HK', time: ts(-320), channel: 'SWIFT Y-COPY / MT299', subject: 'L2L TRANSFER NOTIFICATION — PRE-ADVICE',
      body: `ATTENTION: TRADE OPERATIONS OFFICER\nHSBC HONG KONG — KOWLOON BRANCH\n\nRE: LEDGER TO LEDGER FUND TRANSFER — PRE-ADVICE\n\nWE HEREBY ADVISE THAT A LEDGER TO LEDGER CASH TRANSFER IS BEING INITIATED\nFROM OUR CLIENT ACCOUNT FOR THE FOLLOWING TRANSACTION:\n\nORIGINATOR   : ${r.sender.name} / ${r.sender.company}\nACCOUNT      : ${r.sender.account}\nIBAN         : ${r.sender.iban}\nSWIFT        : ${r.sender.swift}\n\nBENEFICIARY  : ${r.receiver.name}\nACCOUNT      : ${r.receiver.account}\nBANK         : ${r.receiver.bank_name}\nSWIFT        : ${r.receiver.swift}\n\nAMOUNT       : ${r.amount}\nREFERENCE    : ${r.codes.ref_num}\nTX ID        : ${r.codes.tx_id}\n\nROUTING      : VIA NOSTRO — ${nr.nostro_bank} (${nr.nostro_swift})\nNOSTRO IBAN  : ${nr.nostro_iban}\nREMITTANCE   : ${nr.remittance_info}\n\nPLEASE CONFIRM RECEIPT AND READINESS TO CREDIT BENEFICIARY ACCOUNT.\n\nBEST REGARDS,\nTRADE OPERATIONS — UNION BANK OF SWITZERLAND AG\nBAHNHOFSTRASSE 45, 8001 ZURICH, SWITZERLAND` },
    { from: 'HSBC-OFFICER-HK', to: 'UBS-OFFICER-CH', time: ts(-240), channel: 'SWIFT Y-COPY / MT299', subject: 'ACKNOWLEDGEMENT — READY TO RECEIVE',
      body: `ATTENTION: TRADE OPERATIONS OFFICER\nUNION BANK OF SWITZERLAND AG — ZURICH\n\nRE: ACKNOWLEDGEMENT OF L2L TRANSFER PRE-ADVICE\nREF: ${r.codes.ref_num}\n\nWE ACKNOWLEDGE RECEIPT OF YOUR PRE-ADVICE FOR THE ABOVE-REFERENCED\nLEDGER TO LEDGER TRANSFER.\n\nCONFIRMATION:\n— BENEFICIARY ACCOUNT ${r.receiver.account} (MULTI-CURRENCY) IS ACTIVE AND VERIFIED\n— ACCOUNT NAME: ${r.receiver.name} — CONFIRMED\n— NOSTRO ROUTING VIA ${nr.nostro_swift} / ${nr.nostro_iban} — ACKNOWLEDGED\n— COMPLIANCE CHECKS: KYC/AML — CLEARED FOR INCOMING CREDIT\n— READY TO RECEIVE AND CREDIT UPON ARRIVAL OF FUNDS\n\nPLEASE PROCEED WITH TRANSFER EXECUTION.\n\nBEST REGARDS,\nTRADE OPERATIONS — HSBC HONG KONG\nHSBC BUILDING, 82 NATHAN ROAD, KOWLOON, HK` },
    { from: 'UBS-OFFICER-CH', to: 'HSBC-OFFICER-HK', time: ts(-160), channel: 'SWIFT Y-COPY / MT299', subject: 'TRANSFER EXECUTED — FUNDS DISPATCHED',
      body: `ATTENTION: TRADE OPERATIONS OFFICER\nHSBC HONG KONG — KOWLOON BRANCH\n\nRE: L2L TRANSFER EXECUTION CONFIRMATION\nREF: ${r.codes.ref_num}\n\nWE CONFIRM THE FOLLOWING TRANSFER HAS BEEN EXECUTED:\n\nAMOUNT       : ${r.amount}\nTX ID        : ${r.codes.tx_id}\nVALUE DATE   : ${r.delivery_datetime}\n\nFUND MOVEMENT ROUTING:\nSTEP 1: UBS AG SWIFT POOL (UBSWCHZHXXX) — DEBIT AUTHORIZED\nSTEP 2: ECB VALIDATION (ECBFDEFFXXX) — AML/KYC CLEARED\nSTEP 3: NOSTRO ${nr.nostro_bank} (${nr.nostro_swift}) — FUNDS DISPATCHED\n         IBAN: ${nr.nostro_iban}\nSTEP 4: AWAITING ARRIVAL AT HSBC HK SWIFT POOL (${r.receiver.swift})\nSTEP 5: PENDING BENEFICIARY CREDIT\n\nIDENTITY CODE    : ${r.codes.identity_code}\nDEPOSIT CODE     : ${r.codes.deposit_code}\nACTIVATION CODE  : ${r.codes.activation_code}\n\nPLEASE CONFIRM RECEIPT OF FUNDS AND BENEFICIARY CREDIT.\n\nBEST REGARDS,\nTRADE OPERATIONS — UNION BANK OF SWITZERLAND AG` },
    { from: 'HSBC-OFFICER-HK', to: 'UBS-OFFICER-CH', time: ts(-80), channel: 'SWIFT Y-COPY / MT299', subject: 'FUNDS RECEIVED — BENEFICIARY CREDITED',
      body: `ATTENTION: TRADE OPERATIONS OFFICER\nUNION BANK OF SWITZERLAND AG — ZURICH\n\nRE: CONFIRMATION OF FUNDS RECEIPT AND BENEFICIARY CREDIT\nREF: ${r.codes.ref_num}\n\nWE CONFIRM:\n\n— FUNDS RECEIVED AT HSBC HK SWIFT POOL (${r.receiver.swift})\n— AMOUNT: ${r.amount}\n— NOSTRO RECONCILIATION: MATCHED WITH ${nr.nostro_swift} / ${nr.nostro_iban}\n\nBENEFICIARY CREDIT:\n— ACCOUNT: ${r.receiver.account} (MULTI-CURRENCY)\n— NAME: ${r.receiver.name}\n— STATUS: CREDITED SUCCESSFULLY\n— CREDIT TIMESTAMP: ${ts(-75)}\n— AVAILABLE BALANCE: UPDATED\n\nALL COMPLIANCE CHECKS PASSED. TRANSACTION COMPLETE.\nNO FURTHER ACTION REQUIRED.\n\nBEST REGARDS,\nTRADE OPERATIONS — HSBC HONG KONG\nHSBC BUILDING, 82 NATHAN ROAD, KOWLOON, HK` },
  ];

  const handlePrint = () => {
    const msgHTML = messages.map((m, i) => `
      <div style="margin:15px 0;padding:15px;border:1px solid #ddd;background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:9px;border-bottom:1px solid #e2e8f0;padding-bottom:5px">
          <div><strong>FROM:</strong> ${m.from} &rarr; <strong>TO:</strong> ${m.to}</div>
          <div>${m.time} | ${m.channel}</div>
        </div>
        <div style="font-size:10px;font-weight:bold;margin-bottom:8px">${m.subject}</div>
        <pre style="font-family:'Courier New',monospace;font-size:8px;white-space:pre-wrap;line-height:1.5">${m.body}</pre>
      </div>
    `).join('');
    onPrint(`<html><head><title>UBS Officer Communication Console</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;padding:30px;font-size:10px;color:#000;line-height:1.5;background:#fff}
      .hdr{border-bottom:3px solid #DC2626;padding-bottom:15px;margin-bottom:20px;display:flex;justify-content:space-between}
      .logo{font-size:32px;font-weight:bold;color:#DC2626;letter-spacing:2px}
      .stamp{border:2px solid #DC2626;padding:8px 15px;text-align:center;color:#DC2626;display:inline-block;margin-top:20px}
      .footer{margin-top:20px;border-top:1px solid #ccc;padding-top:10px;font-size:7px;color:#666}
      @media print{body{padding:15px;font-size:9px}}
    </style></head><body>
      <div class="hdr"><div><div class="logo">UBS</div><div style="font-size:10px;color:#666">Union Bank of Switzerland AG</div><div style="font-size:12px;font-weight:bold;margin-top:5px">BANK OFFICER TO BANK OFFICER COMMUNICATION LOG</div><div style="font-size:9px;color:#666">Ledger to Ledger Transfer — Secure SWIFT Channel</div></div><div style="text-align:right;font-size:9px"><div>Ref: ${r.codes.ref_num}</div><div>TX: ${r.codes.tx_id}</div><div>Amount: ${r.amount}</div></div></div>
      ${msgHTML}
      <div style="text-align:center"><div class="stamp"><div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div><div style="font-size:20px;font-weight:bold">UBS</div><div style="font-size:7px">OFFICER COMMUNICATION LOG</div></div></div>
      <div class="footer">BANK OFFICER COMMUNICATION LOG | REF: ${r.codes.ref_num} | ${new Date().toISOString()}<br>SECURE SWIFT Y-COPY CHANNEL — ALL COMMUNICATIONS ENCRYPTED AND LOGGED.</div>
    </body></html>`);
  };

  return (
    <Card className="bg-white border-slate-200 rounded-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-900 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-white font-mono text-sm flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          BANK OFFICER TO BANK OFFICER — SECURE COMMUNICATION CONSOLE
        </CardTitle>
        <Button onClick={handlePrint} size="sm" className="bg-green-900 hover:bg-green-800 text-green-400 rounded-sm text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print Log
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {/* Console Header */}
        <div className="bg-slate-800 px-6 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-green-400 font-mono">CHANNEL: SWIFT Y-COPY / MT299</span>
              <span className="text-slate-500 font-mono">|</span>
              <span className="text-slate-400 font-mono">REF: {r.codes.ref_num}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 font-mono text-[10px]">SECURE CONNECTION — ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-4">
            {messages.map((m, i) => {
              const isUBS = m.from.startsWith('UBS');
              return (
                <div key={i} className={`rounded-sm border overflow-hidden ${isUBS ? 'border-blue-200' : 'border-green-200'}`}>
                  {/* Message Header */}
                  <div className={`px-4 py-2 flex items-center justify-between text-xs ${isUBS ? 'bg-blue-50 border-b border-blue-200' : 'bg-green-50 border-b border-green-200'}`}>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[9px] rounded-sm ${isUBS ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-green-100 text-green-800 border border-green-300'}`}>
                        {m.from}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <Badge className={`text-[9px] rounded-sm ${!isUBS ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-green-100 text-green-800 border border-green-300'}`}>
                        {m.to}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">{m.time}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono">{m.channel}</span>
                    </div>
                  </div>
                  {/* Subject */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{m.subject}</p>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-3 bg-white">
                    <pre className="text-[10px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">{m.body}</pre>
                  </div>
                </div>
              );
            })}

            {/* Status Bar */}
            <div className="bg-green-50 border border-green-300 rounded-sm p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-bold text-green-800">COMMUNICATION COMPLETE — ALL CONFIRMATIONS RECEIVED</p>
              </div>
              <p className="text-[10px] text-green-600 font-mono mt-1">
                {r.receiver.name} — Account {r.receiver.account} — {r.amount} — CREDITED
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   SHARED UTILITIES
   ============================================================ */
function Row({ label, value, mono }) {
  return (
    <>
      <span className="text-xs text-slate-500 font-bold">{label}:</span>
      <span className={`text-xs text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </>
  );
}

function buildTerminalText(r, nr) {
  return `CONNECTED (${r.connection.ip})
${'—'.repeat(80)}
${r.connection.cert_chain}
Certificate Chain
0 ${r.connection.cert_subject}
  ${r.connection.cert_issuer}
1 S:/C=Switzerland/O=Symantec Corporation/CN=Symantec Class 3 EV SSL CA - G3
  I:/C=Switzerland/O=Symantec Corporation/CN=Symantec Primary Certificate Authority - G5
Access to GLOBAL ACK NETWORK
Initialising......
Struedit.bui –r-s-author
Sys_log = true; CONNECTION ESTABLISHED***
/CONNECTED GLOBAL SECURE SYSTEMS 4.2816.4
/https://secure.ubs.com/ch/p/dc/corporate/li/en/payments/authorized/files/L2L
payment/ubsag/private
suite.bui
TIMEOUT: 300 (SEC)
DOWNLOADED: (1)
VERIFY RETURN CODE: 1 (OK) [√]
VERIFICATION PERFORMED
*LEDGER TO LEDGER CASH DELIVERY
/REPORT TIME ZONE: +01:00 GMT
/DELIVERY DATE / TIME: ${r.delivery_datetime}
/MESSAGE TRANSACTION CODE: ${r.codes.msg_code} [√]
/MESSAGE TRANSACTION ID: ${r.codes.tx_id} [√]
/REFERENCE NUMBER: ${r.codes.ref_num}
/YOUR MESSAGES ARE SHOWN BELOW: UBSW0009876554
/FROM UNION BANK OF SWITZERLAND AG TO: ${r.receiver.bank_name.toUpperCase()}
/ORIGIN CUSTOMER: ${r.sender.name}, ${r.sender.company}
${'—'.repeat(25)}LEDGER TO LEDGER TRANSFER SWIFT MESSAGE${'—'.repeat(20)}
456 : /BANK SENDER SWIFT: ${r.sender.swift}
295 : /BANK SENDER GLOBAL IP: ${r.sender.ip}
095 : /BANK SENDER NETWORK DELIVERY STATUS: ${r.sender.network_status}
485 : /BANK GLOBAL SERVER ID: ${r.sender.server_id}
104 : /BANK SOURCE TRANSACTION ID: ${r.codes.tx_id}
356 : /BANK SERVER SERIAL ID: ${r.sender.serial_id}
              1 : ///${r.sender.srv_names[0]}
              2 : ///${r.sender.srv_names[1]}
              3 : ///${r.sender.srv_names[2]}
758 : /UBS IDENTITY CODE: ${r.codes.identity_code}
864 : /INPUT BY SWITZERLAND GLOBAL TIME: ${r.formatted_time.toUpperCase()}
658 : /PERMIT ARRIVAL MONEY NU: ${r.codes.scf_num}
564 : /BANK UNIQUE TRANSACTION REFERENCE: ${r.codes.ref_num}
937 : /CLIENT SENDER ACCOUNT NAME: ${r.sender.company}
855 : /COMPANY REPRESENTED BY: ${r.sender.name}
037 : /CLIENT BANK ADDRESS: ${r.sender.bank_address}
396 : /CLIENT SWIFT CODE OR BIC: ${r.sender.swift}
105 : /CLIENT ACCOUNT NUMBER IN UBS: ${r.sender.account}
106 : /CLIENT IBAN: ${r.sender.iban}
107 : /SEND AMOUNT: ${r.amount}
>>>ADDITIONAL INFORMATION:
***LINK CODE: ${r.codes.link_code}
***CHANNEL CODE: ${r.codes.channel_code}
***LINK CODE (CENTRAL BANK: ${Math.floor(Math.random() * 900000000) + 100000000})

${'*'.repeat(20)}NOSTRO CORRESPONDENT ROUTING${'*'.repeat(20)}
NOSTRO BANK       : ${nr.nostro_bank}
NOSTRO SWIFT      : ${nr.nostro_swift}
NOSTRO IBAN       : ${nr.nostro_iban}
REMITTANCE INFO   : ${nr.remittance_info}
ROUTING PATH      : UBSWCHZHXXX → ECBFDEFFXXX → CCFRFRPP → HSBCHKHHHKH
VALIDATION STATUS : ALL STAGES COMPLETED [√]

${'*'.repeat(40)}RECEIVER INFORMATION${'*'.repeat(35)}
103 : /RECEIVER/BANK NAME: ${r.receiver.bank_name.toUpperCase()}
927 : /RECEIVER/BANK ADDRESS: ${r.receiver.bank_address}
183 : /RECEIVER/SWIFT CODE: ${r.receiver.swift}
364 : /RECEIVER/ACCOUNT NUMBER: ${r.receiver.account}
365 : /RECEIVER/IBAN NUMBER: ${r.receiver.iban}
198 : /RECEIVER/ACCOUNT NAME: ${r.receiver.name}
109 : /RECEIVER/GLOBAL SERVER IP: ${r.receiver.server_ip}
968 : /RECEIVER/GLOBAL SERVER ID: ${r.receiver.server_id}
968 : /RECEIVER BALANCE ACCOUNT: LINE 1 BOX - : 1 PARTS: ${r.amount}
${'*'.repeat(40)}ADDITIONAL REFERENCES${'*'.repeat(34)}
>>>REF.SCRT388-1D${r.codes.identity_code.replace(/ /g, '')}RLN000000 [√]
>>>NO.SCFRT388-1D ${r.codes.identity_code} [√]
${'*'.repeat(20)}TRANSMISSION LEDGER TO LEDGER CASH TRANSFER SWIFT${'*'.repeat(18)}
//:TRANSMITTING BANK: UNION BANK OF SWITZERLAND AG
//:CABLE ADDRESS: UBS–C-/ B-${Math.floor(Math.random() * 900000000) + 100000000}–ZURICH SWITZERLAND
//:1)DEPOSIT CODE: ${r.codes.deposit_code}
//:2)BLOCKING CODE: ${r.codes.blocking_code}
//:3)REFERENCE CODE: ${r.codes.reference_code}
//:4)FEDS CODE: ${r.codes.feds_code}
//:5)SECURITY CODE: ${r.codes.security_code}
//:6)WITHDRAWAL FEDS CODE: ${r.codes.withdrawal_feds_code}
//:7)INTERNATIONAL DEPOSIT CODE: ${r.codes.intl_deposit_code}
//:8)DEPOSIT TRANSACTION NO S: ${r.codes.deposit_tx}
//:9)ZURICH HEAD OFFICE: ART/Y-LAW-21-ZURICH GOVERNMENT,TCL${Math.floor(Math.random() * 90000) + 10000}
//:10)ONE-TIME SATELLITE SWIFT DOWNLOAD ACCESS WITHDRAW CODE:
${r.codes.sat_code}
${'—'.repeat(80)}
***TITLE CONFIRMATION ANSWERBACK:
***(XMT DELIVERY REPORT)
***ANSWERBACK PAGE CONFIRMATION SYSTEM
ACKNOWLEDGEMENT RECEIPT ${r.answerback.receipt_swift}
STATUS : ${r.answerback.status}
SENDER : ${r.answerback.sender}
CATEGORY CODE : ${r.answerback.category_code}
SEQUENCE/NUMBER : ${r.answerback.sequence_number}
${'—'.repeat(30)}END OF CODE TRANSMISSION${'—'.repeat(30)}

1. IDENTITY CODE/FINAL CODE                             : ${r.codes.identity_code}
2. SORT CODE                                            : ${r.codes.sort_code}
3. RELEASE CODE                                         : ${r.codes.release_code}   [√]
4. ACCESS CODE                                          : ${r.codes.access_code} [√]
5. BLOCKING CODE                                        : ********************************
6. WRS SERVER                                           : UBS:S 0200235 OR S 020005635
7. BONDING KEY                                          : ${r.codes.bonding_key}
9. ACTIVATION CODE                                      : ${r.codes.activation_code} [√]
TRANSMISSION SUCCESSFUL
OK
DISCONNECTING. . .
[REPORT END]
ACKNOWLEDGEMENT RECEIPT DATE AND TIME- ${r.delivery_datetime}
${r.hex_dump.join('\n')}
${r.tls.depth}
PSK IDENTITY: ${r.tls.psk}
SRP USERNAME: ${r.tls.srp}
TLS SESSION TICKET LIFETIME HINT: ${r.tls.ticket_lifetime}
TLS SESSION TICKET:
UPLOAD PROTOCOL . .
REPORT
158: /PURPOSE OF REMITTANCE: ${r.purpose}
172: /CHARGES: SHA
199: /PROTOCOL
U225:/INTERNAL LEDGER TO LEDGER
U334:/RECEIVER BANK INSTITUTION: ${r.receiver.bank_name.toUpperCase()}
OBTAINED VALUES

 MESSAGES REPORT!!!!!
 COMPLETED !!!!!
 TRANSACTION SUCCESS !!!!!
 WEBSITE WWW.UBS.COM EMAIL : INFO@UBS.COM
 COPYRIGHT 2023-2024 UNION BANK OF SWITZERLAND AG SWIFT FIN LEDGER TO LEDGER TRANSFER
 HOME PAGE SWISS NATIONAL BANK: HTTPS://WWW.SNB.CH/EN`;
}
