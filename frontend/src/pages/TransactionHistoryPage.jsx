import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  History,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  Printer,
  X
} from 'lucide-react';

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?transaction_type=${filter}` : '';
      const response = await api.get(`/transactions${params}`);
      setTransactions(response.data);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Math.abs(amount));
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.reference?.toLowerCase().includes(searchLower) ||
      tx.counterparty?.toLowerCase().includes(searchLower)
    );
  });

  const getTypeColor = (type) => {
    if (type.includes('INTL')) return 'bg-blue-500/20 text-blue-400';
    if (type === 'DOMESTIC') return 'bg-emerald-500/20 text-emerald-400';
    if (type === 'BILL_PAYMENT') return 'bg-amber-500/20 text-amber-400';
    return 'bg-swiss-bg-subtle text-swiss-text-secondary';
  };

  const viewReceipt = (tx) => {
    setSelectedTx(tx);
    setReceiptOpen(true);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    const tx = selectedTx;
    const receiptHtml = generateReceiptHTML(tx);
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generateReceiptHTML = (tx) => {
    const date = new Date(tx.created_at);
    const formattedDate = date.toLocaleDateString('en-GB').replace(/\//g, '/');
    const isoDate = date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
    const trn = `UBS${Date.now().toString().substring(0, 13)}`;
    const uetr = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 14)}`;
    const mur = `0${Math.floor(Math.random() * 9999999999999)}`;
    
    return `
      <html>
        <head>
          <title>SWIFT Transaction Receipt - ${tx.reference}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'JetBrains Mono', 'Courier New', monospace; padding: 30px; background: white; color: #000; font-size: 11px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .header-left { display: flex; align-items: center; gap: 15px; }
            .bank-logo { font-size: 24px; font-weight: bold; color: #DC2626; }
            .header-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .swift-logo { font-size: 18px; font-weight: bold; }
            .ack-box { border: 2px solid #000; padding: 15px; text-align: center; margin: 20px 0; background: #f9f9f9; }
            .ack-box h2 { font-size: 16px; letter-spacing: 2px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; text-align: center; color: #666; }
            .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 5px; }
            .info-grid .label { color: #666; text-transform: uppercase; font-size: 10px; }
            .info-grid .value { font-weight: bold; }
            .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .col-box { border: 1px solid #ccc; padding: 15px; }
            .col-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .status-box { text-align: center; border: 2px solid #000; padding: 20px; margin: 20px 0; background: #f5f5f5; }
            .status-box p { margin: 5px 0; }
            .barcode { text-align: center; margin: 30px 0; font-family: 'Libre Barcode 39', cursive; font-size: 48px; letter-spacing: 3px; }
            .barcode-text { font-size: 10px; margin-top: 5px; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 9px; color: #666; }
            .qr-placeholder { width: 80px; height: 80px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; }
            .amount-highlight { font-size: 14px; color: #DC2626; }
            .validation-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; font-size: 9px; }
            .validation-row { display: flex; justify-content: space-between; padding: 2px 5px; background: #f9f9f9; }
            .validation-row.valid .status { color: green; }
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <div class="bank-logo">UBS</div>
              <div class="header-title">MT103 ANSWER BACK - TARGET2 CLEARING ACKNOWLEDGMENT</div>
            </div>
            <div class="swift-logo">⊕ Swift</div>
          </div>

          <!-- ACK Box -->
          <div class="ack-box">
            <h2>ACKNOWLEDGED BY TARGET2 [TRGTXEPMLVP] (ACK)</h2>
          </div>

          <!-- Transaction Reference Section -->
          <div class="section">
            <div class="section-title">Transaction Reference</div>
            <div style="display: flex; justify-content: space-between;">
              <div class="info-grid" style="flex: 1;">
                <span class="label">Transaction Reference Number (TRN):</span>
                <span class="value">${trn}</span>
                <span class="label">UETR:</span>
                <span class="value">${uetr}</span>
                <span class="label">MUR:</span>
                <span class="value">${mur}</span>
                <span class="label">Transaction Amount:</span>
                <span class="value amount-highlight">${tx.currency} ${Math.abs(tx.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} (PENDING TARGET2 CLEARING)</span>
                <span class="label">Value Date:</span>
                <span class="value">${formattedDate} (SETTLEMENT: ${formattedDate})</span>
              </div>
              <div class="qr-placeholder">[QR CODE]</div>
            </div>
          </div>

          <!-- Processing Timestamps -->
          <div class="section">
            <div class="section-title">Processing Timestamps</div>
            <div class="info-grid">
              <span class="label">Date:</span>
              <span class="value">${formattedDate}</span>
              <span class="label">Creation Time:</span>
              <span class="value">${formattedDate} - ${isoDate}</span>
              <span class="label">Transmission Time:</span>
              <span class="value">${formattedDate} - 40.000 SECONDS</span>
              <span class="label">TARGET2 Acknowledgment Time:</span>
              <span class="value">${formattedDate} - ${new Date(date.getTime() + 40000).toISOString().replace('T', ' ').substring(0, 19)}Z</span>
              <span class="label">End Time:</span>
              <span class="value">${formattedDate} - ${new Date(date.getTime() + 41000).toISOString().replace('T', ' ').substring(0, 19)}Z</span>
              <span class="label">Processing Duration:</span>
              <span class="value">40.000 SECONDS (TO TARGET2)</span>
            </div>
          </div>

          <!-- Network Confirmation -->
          <div class="section">
            <div class="section-title">Network Confirmation</div>
            <div class="info-grid">
              <span class="label">SWIFT Network Status:</span>
              <span class="value">MESSAGE ACKNOWLEDGED - SUBMITTED TO TARGET2</span>
              <span class="label">Delivery Status:</span>
              <span class="value">DELIVERED TO TARGET2 FOR CLEARING</span>
              <span class="label">Settlement Pipeline:</span>
              <span class="value">TARGET2 [CONFIRMED] -> UBSWCHZHXXX [PENDING]</span>
              <span class="label">Receiver BIC:</span>
              <span class="value">UBSWCHZHXXX</span>
              <span class="label">Receiver Institution:</span>
              <span class="value">UNION BANK OF SWITZERLAND AG (PENDING DELIVERY)</span>
              <span class="label">ACK Reference:</span>
              <span class="value">TARGET2-ACK-${Date.now()} 1</span>
              <span class="label">ACK Processing Status:</span>
              <span class="value">ACKNOWLEDGED</span>
              <span class="label">Technical Validation:</span>
              <span class="value" style="color: green;">PASSED</span>
              <span class="label">Business Validation:</span>
              <span class="value" style="color: green;">PASSED</span>
              <span class="label">Settlement Status:</span>
              <span class="value">SUBMITTED TO SWIFT FOR CROSS-BORDER SETTLEMENT</span>
              <span class="label">Tracker Status:</span>
              <span class="value">ACTIVE</span>
              <span class="label">Next Agent:</span>
              <span class="value">ECBFDEFFXXX</span>
            </div>
          </div>

          <!-- Settlement Confirmation -->
          <div class="section">
            <div class="section-title">Settlement Confirmation</div>
            <div class="two-col">
              <div class="col-box">
                <h4>Sender Confirmation</h4>
                <div class="info-grid" style="grid-template-columns: 120px 1fr;">
                  <span class="label">Debit Status:</span>
                  <span class="value">COMPLETED - SENT TO TARGET2</span>
                  <span class="label">Debit Account:</span>
                  <span class="value">CH93002730018839903939</span>
                  <span class="label">Debit Time:</span>
                  <span class="value">${isoDate}</span>
                  <span class="label">Balance After Debit:</span>
                  <span class="value">${tx.currency} ***,***,***.00</span>
                  <span class="label">TARGET2 Position:</span>
                  <span class="value">SUBMITTED FOR CLEARING</span>
                </div>
              </div>
              <div class="col-box">
                <h4>Receiver Confirmation</h4>
                <div class="info-grid" style="grid-template-columns: 120px 1fr;">
                  <span class="label">Credit Status:</span>
                  <span class="value">PENDING TARGET2 [ECBFDEFFXXX] CLEARING</span>
                  <span class="label">Credit Account:</span>
                  <span class="value">${tx.counterparty ? '***CONFIDENTIAL***' : 'N/A'}</span>
                  <span class="label">Expected Via SWIFT:</span>
                  <span class="value">${new Date(date.getTime() + 86400000).toISOString().substring(0, 10)}</span>
                  <span class="label">Expected Credit Time:</span>
                  <span class="value">${new Date(date.getTime() + 86400000).toISOString().replace('T', ' ').substring(0, 19)}Z</span>
                  <span class="label">Notification:</span>
                  <span class="value">PENDING TARGET2 PROCESSING</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Confirmation Status -->
          <div class="status-box">
            <div class="section-title" style="border: none; margin: 0;">Confirmation Status</div>
            <p style="margin: 15px 0;">THIS ACKNOWLEDGMENT CONFIRMS THAT THE MT103 MESSAGE HAS BEEN</p>
            <p>SUCCESSFULLY RECEIVED AND ACCEPTED BY TARGET2 [ECBFDEFFXXX] FOR CLEARING</p>
            <p>TO THE BENEFICIARY BANK VIA SWIFT NETWORK</p>
            <p style="margin-top: 15px;"><strong>REFERENCE: ${trn} | STATUS: ACKNOWLEDGED BY TARGET2 [ECBFDEFFXXX]</strong></p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>MT103 ANSWER BACK - TARGET2 [ECBFDEFFXXX] CLEARING ACKNOWLEDGMENT | GENERATED: ${isoDate}</p>
            <p>TRANSACTION REFERENCE: ${trn} | UETR: ${uetr}</p>
            <br>
            <p style="color: #999; font-size: 8px;">ANSWER BACK GENERATED BY: UNION BANK OF SWITZERLAND AG SWIFT PROCESSING SYSTEM</p>
            <p style="color: #999; font-size: 8px;">POWERED BY: BOTTOMLINE TECHNOLOGIES | SWIFT INTEGRATION</p>
            <p style="color: #999; font-size: 8px;">PLATFORM VERSION: 2024.3.1 | TEMPLATE: CH-PBC2024-STD20240575</p>
          </div>

          <!-- Barcode -->
          <div class="barcode">
            <div style="font-family: monospace; font-size: 12px; letter-spacing: 3px;">
              ||||| |||| | ||| |||| ||||| || ||| |||| | |||| ||| |||| || ||||| ||| || |||| |||||
            </div>
            <div class="barcode-text">${trn}</div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Transaction History
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            Complete record of all transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-200 text-swiss-text-secondary hover:text-slate-900 hover:bg-slate-100 rounded-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={fetchTransactions}
            variant="outline"
            className="border-slate-200 text-swiss-text-secondary hover:text-slate-900 hover:bg-slate-100 rounded-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-swiss-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-10"
                placeholder="Search transactions..."
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px] bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-10">
                <Filter className="w-4 h-4 mr-2 text-swiss-text-muted" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-swiss-bg-paper border-slate-200">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="INTL_MT103">International MT103</SelectItem>
                <SelectItem value="INTL_PACS008">International PACS.008</SelectItem>
                <SelectItem value="INTL_PACS009">International PACS.009</SelectItem>
                <SelectItem value="INTL_GPI">SWIFT GPI</SelectItem>
                <SelectItem value="DOMESTIC">Domestic</SelectItem>
                <SelectItem value="BILL_PAYMENT">Bill Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-slate-900 flex items-center justify-between">
            <span>Transactions</span>
            <Badge className="bg-swiss-bg-subtle text-swiss-text-secondary rounded-sm">
              {filteredTransactions.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-swiss-text-muted" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-swiss-text-muted">
                <History className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                <p className="text-sm">No transactions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Date</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Type</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Description</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Reference</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider text-right">Amount</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Status</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider text-center">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-slate-100 hover:bg-slate-100">
                      <TableCell className="font-mono text-xs text-swiss-text-secondary">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(tx.transaction_type)} rounded-sm text-xs`}>
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-900 text-sm max-w-[200px] truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-swiss-text-muted">
                        {tx.reference}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.amount < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className={`font-mono text-sm ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formatCurrency(tx.amount, tx.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewReceipt(tx)}
                          className="text-swiss-text-secondary hover:text-slate-900 hover:bg-swiss-red/20"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="bg-swiss-bg-paper border-slate-200 max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="font-heading text-xl text-slate-900">Transaction Receipt</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={printReceipt}
              className="text-swiss-text-secondary hover:text-slate-900 hover:bg-swiss-red/20"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print PDF
            </Button>
          </DialogHeader>
          
          {selectedTx && (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-4 font-mono text-xs">
                {/* Header */}
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-swiss-red">UBS</span>
                    <span className="text-sm uppercase tracking-wider">MT103 ANSWER BACK - TARGET2 CLEARING ACKNOWLEDGMENT</span>
                  </div>
                  <span className="text-lg font-bold">⊕ Swift</span>
                </div>

                {/* ACK Box */}
                <div className="border-2 border-white/30 p-4 text-center bg-swiss-bg-subtle">
                  <h2 className="text-lg font-bold tracking-widest">ACKNOWLEDGED BY TARGET2 [TRGTXEPMLVP] (ACK)</h2>
                </div>

                {/* Transaction Reference */}
                <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                  <h3 className="text-swiss-text-muted text-[10px] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 text-center">Transaction Reference</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-swiss-text-muted">TRN:</span>
                    <span className="text-slate-900 font-bold">UBS{Date.now().toString().substring(0, 13)}</span>
                    <span className="text-swiss-text-muted">UETR:</span>
                    <span className="text-slate-900">{`${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-4b32c873cd3b`}</span>
                    <span className="text-swiss-text-muted">MUR:</span>
                    <span className="text-slate-900">0{Math.floor(Math.random() * 9999999999999)}</span>
                    <span className="text-swiss-text-muted">Transaction Amount:</span>
                    <span className={`font-bold ${selectedTx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedTx.currency} {Math.abs(selectedTx.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} (PENDING TARGET2 CLEARING)
                    </span>
                    <span className="text-swiss-text-muted">Value Date:</span>
                    <span className="text-slate-900">{new Date(selectedTx.created_at).toLocaleDateString('en-GB')} (SETTLEMENT)</span>
                  </div>
                </div>

                {/* Processing Timestamps */}
                <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                  <h3 className="text-swiss-text-muted text-[10px] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 text-center">Processing Timestamps</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-swiss-text-muted">Creation Time:</span>
                    <span className="text-slate-900">{new Date(selectedTx.created_at).toISOString().replace('T', ' ').substring(0, 19)}Z</span>
                    <span className="text-swiss-text-muted">TARGET2 ACK Time:</span>
                    <span className="text-slate-900">{new Date(new Date(selectedTx.created_at).getTime() + 40000).toISOString().replace('T', ' ').substring(0, 19)}Z</span>
                    <span className="text-swiss-text-muted">Processing Duration:</span>
                    <span className="text-slate-900">40.000 SECONDS (TO TARGET2)</span>
                  </div>
                </div>

                {/* Network Confirmation */}
                <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                  <h3 className="text-swiss-text-muted text-[10px] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 text-center">Network Confirmation</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-swiss-text-muted">SWIFT Network Status:</span>
                    <span className="text-slate-900">MESSAGE ACKNOWLEDGED - SUBMITTED TO TARGET2</span>
                    <span className="text-swiss-text-muted">Delivery Status:</span>
                    <span className="text-slate-900">DELIVERED TO TARGET2 FOR CLEARING</span>
                    <span className="text-swiss-text-muted">Settlement Pipeline:</span>
                    <span className="text-slate-900">TARGET2 [CONFIRMED] → UBSWCHZHXXX [PENDING]</span>
                    <span className="text-swiss-text-muted">Technical Validation:</span>
                    <span className="text-green-400">PASSED</span>
                    <span className="text-swiss-text-muted">Business Validation:</span>
                    <span className="text-green-400">PASSED</span>
                    <span className="text-swiss-text-muted">Settlement Status:</span>
                    <span className="text-slate-900">SUBMITTED TO SWIFT FOR CROSS-BORDER SETTLEMENT</span>
                    <span className="text-swiss-text-muted">Tracker Status:</span>
                    <span className="text-green-400">ACTIVE</span>
                  </div>
                </div>

                {/* Settlement Confirmation */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-swiss-bg-subtle p-4 rounded-sm border border-slate-200">
                    <h4 className="text-swiss-text-muted text-[10px] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Sender Confirmation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-swiss-text-muted">Debit Status:</span><span className="text-slate-900">COMPLETED</span></div>
                      <div className="flex justify-between"><span className="text-swiss-text-muted">Debit Time:</span><span className="text-slate-900">{new Date(selectedTx.created_at).toISOString().substring(0, 19)}Z</span></div>
                      <div className="flex justify-between"><span className="text-swiss-text-muted">TARGET2:</span><span className="text-slate-900">SUBMITTED</span></div>
                    </div>
                  </div>
                  <div className="bg-swiss-bg-subtle p-4 rounded-sm border border-slate-200">
                    <h4 className="text-swiss-text-muted text-[10px] uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Receiver Confirmation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-swiss-text-muted">Credit Status:</span><span className="text-amber-400">PENDING</span></div>
                      <div className="flex justify-between"><span className="text-swiss-text-muted">Expected:</span><span className="text-slate-900">{new Date(new Date(selectedTx.created_at).getTime() + 86400000).toISOString().substring(0, 10)}</span></div>
                      <div className="flex justify-between"><span className="text-swiss-text-muted">Notification:</span><span className="text-slate-900">PROCESSING</span></div>
                    </div>
                  </div>
                </div>

                {/* Confirmation Status */}
                <div className="border-2 border-slate-300 p-4 text-center bg-swiss-bg-subtle">
                  <h3 className="text-swiss-text-muted text-[10px] uppercase tracking-widest mb-2">Confirmation Status</h3>
                  <p className="text-slate-900 text-sm">THIS ACKNOWLEDGMENT CONFIRMS THAT THE MT103 MESSAGE HAS BEEN</p>
                  <p className="text-slate-900 text-sm">SUCCESSFULLY RECEIVED AND ACCEPTED BY TARGET2 FOR CLEARING</p>
                  <p className="text-slate-900 text-sm">TO THE BENEFICIARY BANK VIA SWIFT NETWORK</p>
                  <p className="text-swiss-text-secondary text-xs mt-3">REFERENCE: {selectedTx.reference} | STATUS: <span className="text-green-400">ACKNOWLEDGED BY TARGET2</span></p>
                </div>

                {/* Footer */}
                <div className="text-center pt-4 border-t border-slate-300">
                  <p className="text-swiss-text-muted text-[10px]">MT103 ANSWER BACK - TARGET2 CLEARING ACKNOWLEDGMENT | GENERATED: {new Date().toISOString()}</p>
                  <p className="text-swiss-text-muted text-[10px]">POWERED BY: UNION BANK OF SWITZERLAND AG SWIFT PROCESSING SYSTEM</p>
                  <div className="mt-4 font-mono tracking-widest text-swiss-text-muted">
                    ||||| |||| | ||| |||| ||||| || ||| |||| | |||| ||| |||| || ||||| ||| || |||| |||||
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistoryPage;
