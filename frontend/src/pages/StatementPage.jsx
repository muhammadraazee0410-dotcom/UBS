import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  FileSpreadsheet,
  Printer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const currencySymbols = { EUR: '\u20ac', USD: '$', CHF: 'CHF ' };

const StatementPage = () => {
  const [activeCurrency, setActiveCurrency] = useState('EUR');
  const [statement, setStatement] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSummaries = async () => {
    try {
      const res = await api.get('/statements');
      setSummaries(res.data);
    } catch { /* ignore */ }
  };

  const fetchStatement = async (cur) => {
    setLoading(true);
    try {
      const res = await api.get(`/statements/${cur}`);
      setStatement(res.data);
    } catch {
      toast.error('Failed to load statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
    fetchStatement(activeCurrency);
  }, []);

  const switchCurrency = (cur) => {
    setActiveCurrency(cur);
    fetchStatement(cur);
  };

  const printStatement = () => {
    if (!statement) return;
    const s = statement;
    const rows = s.lines.map((ln) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:10px;">${formatDate(ln.date)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:10px;">${ln.description}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:10px;font-family:monospace;">${ln.reference}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:10px;text-align:right;color:#DC2626;font-family:monospace;">${ln.debit ? formatCurrency(ln.debit, s.currency) : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:10px;text-align:right;color:#16a34a;font-family:monospace;">${ln.credit ? formatCurrency(ln.credit, s.currency) : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:10px;text-align:right;font-weight:bold;font-family:monospace;">${formatCurrency(ln.balance, s.currency)}</td>
      </tr>
    `).join('');

    const html = `<html><head><title>UBS Account Statement - ${s.currency}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; padding:30px; font-size:11px; color:#000; }
      .hdr { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #DC2626; padding-bottom:15px; margin-bottom:20px; }
      .logo { font-size:28px; font-weight:bold; color:#DC2626; }
      .title { text-align:center; font-size:16px; font-weight:bold; letter-spacing:2px; margin:15px 0; }
      table { width:100%; border-collapse:collapse; }
      th { background:#f5f5f5; padding:8px; text-align:left; font-size:9px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #333; }
      .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:20px 0; }
      .summary-box { border:1px solid #ddd; padding:12px; }
      .summary-box .label { font-size:9px; text-transform:uppercase; color:#666; }
      .summary-box .value { font-size:14px; font-weight:bold; font-family:monospace; }
      .balance-row { background:#ffffd0; font-weight:bold; }
      .stamp { border:2px solid #DC2626; padding:10px 20px; display:inline-block; text-align:center; color:#DC2626; margin-top:20px; }
      .footer { margin-top:30px; border-top:1px solid #ccc; padding-top:15px; font-size:8px; color:#666; }
      .barcode { text-align:center; margin:20px 0; font-size:28px; letter-spacing:2px; }
      @media print { body { padding:15px; } }
    </style></head><body>
      <div class="hdr">
        <div><div class="logo">UBS</div><div style="font-size:10px;">Union Bank of Switzerland AG</div><div style="font-size:9px;color:#666;">BAHNHOFSTRASSE 45, 8001 ZURICH</div></div>
        <div style="text-align:right;"><div style="font-size:10px;">SWIFT: UBSWCHZHXXX</div><div style="font-size:9px;color:#666;">Tel: +41 44 234 1111</div></div>
      </div>
      <div class="title">OFFICIAL ACCOUNT STATEMENT</div>
      <div class="summary-grid">
        <div class="summary-box"><div class="label">Account</div><div class="value">${s.account_number}</div><div style="font-size:9px;color:#666;">${s.iban}</div></div>
        <div class="summary-box"><div class="label">Currency</div><div class="value">${s.currency}</div></div>
        <div class="summary-box"><div class="label">Statement Period</div><div class="value">${formatDate(s.period_start)} - ${formatDate(s.period_end)}</div></div>
        <div class="summary-box"><div class="label">Statement Date</div><div class="value">${formatDate(s.statement_date)}</div></div>
      </div>
      <div class="summary-grid">
        <div class="summary-box balance-row"><div class="label">Opening Balance</div><div class="value">${formatCurrency(s.opening_balance, s.currency)}</div></div>
        <div class="summary-box balance-row"><div class="label">Closing Balance</div><div class="value">${formatCurrency(s.closing_balance, s.currency)}</div></div>
        <div class="summary-box"><div class="label">Total Debits</div><div class="value" style="color:#DC2626;">${formatCurrency(s.total_debits, s.currency)}</div></div>
        <div class="summary-box"><div class="label">Total Credits</div><div class="value" style="color:#16a34a;">${formatCurrency(s.total_credits, s.currency)}</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Date</th><th>Description</th><th>Reference</th><th style="text-align:right;">Debit</th><th style="text-align:right;">Credit</th><th style="text-align:right;">Balance</th>
        </tr></thead>
        <tbody>
          <tr class="balance-row"><td colspan="5" style="padding:6px 8px;font-size:10px;">OPENING BALANCE</td><td style="padding:6px 8px;text-align:right;font-size:10px;font-family:monospace;">${formatCurrency(s.opening_balance, s.currency)}</td></tr>
          ${rows}
          <tr class="balance-row"><td colspan="5" style="padding:6px 8px;font-size:10px;font-weight:bold;">CLOSING BALANCE</td><td style="padding:6px 8px;text-align:right;font-size:10px;font-family:monospace;font-weight:bold;">${formatCurrency(s.closing_balance, s.currency)}</td></tr>
        </tbody>
      </table>
      <div style="text-align:center;margin-top:25px;">
        <div class="stamp"><div style="font-size:8px;">UNION BANK OF SWITZERLAND AG</div><div class="logo" style="font-size:18px;">UBS</div><div style="font-size:8px;">OFFICIAL STATEMENT</div></div>
      </div>
      <div class="footer">
        ACCOUNT STATEMENT | GENERATED: ${new Date().toISOString()}<br>
        ACCOUNT: ${s.account_number} | IBAN: ${s.iban}<br><br>
        THIS IS A COMPUTER-GENERATED STATEMENT AND DOES NOT REQUIRE A SIGNATURE.
      </div>
      <div class="barcode">|||| |||| | ||| |||| ||||| || ||| |||| ||||</div>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Account Statement
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            Official account statement with running balance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchStatement(activeCurrency)}
            variant="outline"
            className="border-slate-200 text-swiss-text-secondary hover:text-slate-900 rounded-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={printStatement}
            disabled={!statement}
            className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Statement
          </Button>
        </div>
      </div>

      {/* Currency Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaries.map((s) => (
          <Card
            key={s.currency}
            onClick={() => switchCurrency(s.currency)}
            className={`bg-swiss-bg-paper border rounded-sm cursor-pointer transition-all ${
              activeCurrency === s.currency
                ? 'border-swiss-red ring-1 ring-swiss-red/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Badge
                  className={`rounded-sm text-xs ${
                    activeCurrency === s.currency
                      ? 'bg-swiss-red text-white'
                      : 'bg-swiss-bg-subtle text-swiss-text-secondary'
                  }`}
                >
                  {s.currency}
                </Badge>
                <span className="text-xs text-swiss-text-muted">{s.transaction_count} entries</span>
              </div>
              <p className="font-mono text-xl text-slate-900">
                {formatCurrency(s.balance, s.currency)}
              </p>
              <p className="font-mono text-xs text-swiss-text-muted mt-1">{s.iban}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statement Content */}
      {loading ? (
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardContent className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-swiss-text-muted" />
          </CardContent>
        </Card>
      ) : statement ? (
        <>
          {/* Balance Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
              <CardContent className="p-4">
                <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Opening Balance</p>
                <p className="font-mono text-lg text-slate-900">
                  {formatCurrency(statement.opening_balance, statement.currency)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
              <CardContent className="p-4">
                <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Total Debits</p>
                <p className="font-mono text-lg text-red-400">
                  {formatCurrency(statement.total_debits, statement.currency)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
              <CardContent className="p-4">
                <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Total Credits</p>
                <p className="font-mono text-lg text-emerald-400">
                  {formatCurrency(statement.total_credits, statement.currency)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-swiss-bg-paper border-swiss-red/30 rounded-sm ring-1 ring-swiss-red/20">
              <CardContent className="p-4">
                <p className="text-xs text-swiss-red uppercase tracking-wider mb-1">Closing Balance</p>
                <p className="font-mono text-lg text-slate-900 font-bold">
                  {formatCurrency(statement.closing_balance, statement.currency)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statement Table */}
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                {statement.currency} Account Statement
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-swiss-text-muted font-mono">
                  {formatDate(statement.period_start)} — {formatDate(statement.period_end)}
                </span>
                <Badge className="bg-swiss-bg-subtle text-swiss-text-secondary rounded-sm">
                  {statement.transaction_count} entries
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-swiss-bg-paper border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Description</th>
                      <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Reference</th>
                      <th className="text-right py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Debit</th>
                      <th className="text-right py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Credit</th>
                      <th className="text-right py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening balance row */}
                    <tr className="bg-amber-500/5 border-b border-slate-100">
                      <td className="py-3 px-4 font-mono text-xs text-swiss-text-secondary">{formatDate(statement.period_start)}</td>
                      <td colSpan="4" className="py-3 px-4 text-amber-700 text-xs font-medium uppercase tracking-wider">Opening Balance</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-900 font-bold">
                        {formatCurrency(statement.opening_balance, statement.currency)}
                      </td>
                    </tr>

                    {statement.lines.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-swiss-text-muted text-sm">
                          No transactions for this period
                        </td>
                      </tr>
                    ) : (
                      statement.lines.map((ln, i) => (
                        <tr key={ln.id || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-swiss-text-secondary">
                            {formatDate(ln.date)}
                          </td>
                          <td className="py-3 px-4 text-slate-900 text-xs max-w-[250px] truncate">
                            {ln.description}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-swiss-text-muted">
                            {ln.reference}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">
                            {ln.debit > 0 && (
                              <span className="text-red-400">{formatCurrency(ln.debit, statement.currency)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">
                            {ln.credit > 0 && (
                              <span className="text-emerald-400">{formatCurrency(ln.credit, statement.currency)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-slate-900 font-medium">
                            {formatCurrency(ln.balance, statement.currency)}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* Closing balance row */}
                    <tr className="bg-swiss-red/5 border-t-2 border-swiss-red/30">
                      <td className="py-3 px-4 font-mono text-xs text-swiss-text-secondary">{formatDate(statement.period_end)}</td>
                      <td colSpan="4" className="py-3 px-4 text-swiss-red text-xs font-bold uppercase tracking-wider">Closing Balance</td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-slate-900 font-bold">
                        {formatCurrency(statement.closing_balance, statement.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Statement Footer Info */}
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-swiss-text-muted">
                <div className="flex items-center gap-4">
                  <span className="font-mono">Account: {statement.account_number}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span className="font-mono">IBAN: {statement.iban}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span className="font-mono">SWIFT: UBSWCHZHXXX</span>
                </div>
                <span>Statement generated: {formatDateTime(statement.statement_date)}</span>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default StatementPage;
