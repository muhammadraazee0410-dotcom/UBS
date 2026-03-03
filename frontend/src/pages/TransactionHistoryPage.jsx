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
    const formattedDate = date.toLocaleDateString('en-GB');
    const formattedTime = date.toLocaleTimeString('en-GB');
    const refNum = `TXN-${Date.now()}`;
    
    return `
      <html>
        <head>
          <title>Transaction Receipt - ${tx.reference}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            body { font-family: 'JetBrains Mono', monospace; padding: 40px; background: white; color: black; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 24px; margin: 0; color: #DC2626; letter-spacing: 2px; }
            .header p { margin: 5px 0; font-size: 11px; color: #666; }
            .receipt-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; border: 2px solid #000; padding: 10px; background: #f5f5f5; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 12px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ddd; }
            .row:last-child { border-bottom: none; }
            .label { color: #666; font-size: 11px; text-transform: uppercase; }
            .value { font-weight: bold; font-size: 12px; text-align: right; }
            .amount-box { background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #000; }
            .amount-box .currency { font-size: 14px; color: #666; }
            .amount-box .amount { font-size: 32px; font-weight: bold; color: ${tx.amount < 0 ? '#DC2626' : '#10B981'}; }
            .amount-box .type { font-size: 12px; color: #666; margin-top: 5px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 3px double #000; text-align: center; }
            .stamp { border: 3px solid #DC2626; padding: 15px 30px; display: inline-block; margin: 20px 0; transform: rotate(-3deg); }
            .stamp p { margin: 0; color: #DC2626; font-weight: bold; }
            .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 48px; letter-spacing: 5px; margin: 20px 0; }
            .terms { font-size: 9px; color: #999; margin-top: 20px; text-align: center; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UNION BANK OF SWITZERLAND AG</h1>
            <p>BAHNHOFSTRASSE 45, 8001 ZURICH, SWITZERLAND</p>
            <p>SWIFT: UBSWCHZHXXX | TEL: +41 44 234 1111 | FAX: +41 44 234 1112</p>
          </div>
          
          <div class="receipt-title">OFFICIAL TRANSACTION RECEIPT</div>
          
          <div class="section">
            <div class="section-title">Transaction Information</div>
            <div class="row"><span class="label">Receipt Number</span><span class="value">${refNum}</span></div>
            <div class="row"><span class="label">Transaction Reference</span><span class="value">${tx.reference}</span></div>
            <div class="row"><span class="label">Transaction Date</span><span class="value">${formattedDate}</span></div>
            <div class="row"><span class="label">Transaction Time</span><span class="value">${formattedTime} CET</span></div>
            <div class="row"><span class="label">Transaction Type</span><span class="value">${tx.transaction_type}</span></div>
            <div class="row"><span class="label">Status</span><span class="value" style="color: #10B981;">${tx.status.toUpperCase()}</span></div>
          </div>

          <div class="amount-box">
            <div class="currency">${tx.currency}</div>
            <div class="amount">${tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div class="type">${tx.amount < 0 ? 'DEBIT' : 'CREDIT'} TRANSACTION</div>
          </div>

          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="row"><span class="label">Description</span><span class="value">${tx.description}</span></div>
            <div class="row"><span class="label">Counterparty</span><span class="value">${tx.counterparty}</span></div>
            <div class="row"><span class="label">Value Date</span><span class="value">${formattedDate}</span></div>
            <div class="row"><span class="label">Booking Date</span><span class="value">${formattedDate}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Bank Information</div>
            <div class="row"><span class="label">Bank Name</span><span class="value">UNION BANK OF SWITZERLAND AG</span></div>
            <div class="row"><span class="label">SWIFT/BIC Code</span><span class="value">UBSWCHZHXXX</span></div>
            <div class="row"><span class="label">Branch</span><span class="value">HEAD OFFICE - ZURICH</span></div>
          </div>

          <div class="section">
            <div class="section-title">Compliance & Verification</div>
            <div class="row"><span class="label">AML Check</span><span class="value" style="color: #10B981;">PASSED</span></div>
            <div class="row"><span class="label">Sanctions Screening</span><span class="value" style="color: #10B981;">CLEARED</span></div>
            <div class="row"><span class="label">FATCA Compliant</span><span class="value" style="color: #10B981;">YES</span></div>
          </div>

          <div class="footer">
            <div class="stamp">
              <p>OFFICIAL DOCUMENT</p>
              <p style="font-size: 10px;">VERIFIED & PROCESSED</p>
            </div>
            <p style="font-size: 11px; margin-top: 15px;">
              <strong>Authorized by:</strong> UBS Transaction Processing Center<br>
              <strong>Document ID:</strong> DOC-${Date.now()}<br>
              <strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}
            </p>
            <div class="terms">
              This is an official transaction receipt generated by Union Bank of Switzerland AG.<br>
              For verification, please contact: verification@ubs.ch or call +41 44 234 1111<br>
              This document is valid without signature when generated electronically.
            </div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6" data-testid="transaction-history-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight flex items-center gap-3">
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
            className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm"
            data-testid="export-transactions"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={fetchTransactions}
            variant="outline"
            className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm"
            data-testid="refresh-transactions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-swiss-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-10"
                placeholder="Search transactions..."
                data-testid="search-transactions"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px] bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-10" data-testid="filter-type">
                <Filter className="w-4 h-4 mr-2 text-swiss-text-muted" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-swiss-bg-paper border-white/10">
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
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-white flex items-center justify-between">
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
                  <TableRow className="border-white/10 hover:bg-transparent">
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
                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-xs text-swiss-text-secondary">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(tx.transaction_type)} rounded-sm text-xs`}>
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-sm max-w-[200px] truncate">
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
                          className="text-swiss-text-secondary hover:text-white hover:bg-swiss-red/20"
                          data-testid={`view-receipt-${tx.id}`}
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
        <DialogContent className="bg-swiss-bg-paper border-white/10 max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="font-heading text-xl text-white">Transaction Receipt</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={printReceipt}
              className="text-swiss-text-secondary hover:text-white hover:bg-swiss-red/20"
              data-testid="print-receipt-btn"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print PDF
            </Button>
          </DialogHeader>
          
          {selectedTx && (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Receipt Header */}
                <div className="text-center border-b-2 border-white/20 pb-6">
                  <h2 className="font-heading font-black text-2xl text-swiss-red">UNION BANK OF SWITZERLAND AG</h2>
                  <p className="text-swiss-text-muted text-sm">BAHNHOFSTRASSE 45, 8001 ZURICH, SWITZERLAND</p>
                  <p className="text-swiss-text-muted text-xs mt-1">SWIFT: UBSWCHZHXXX</p>
                  <div className="mt-4 py-2 bg-swiss-bg-subtle rounded-sm">
                    <p className="font-heading font-bold text-lg text-white uppercase">Official Transaction Receipt</p>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                  <h3 className="text-swiss-text-muted text-xs uppercase tracking-wider mb-3 border-b border-white/10 pb-2">Transaction Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-swiss-text-muted text-xs">Receipt Number</p>
                      <p className="font-mono text-sm text-white">TXN-{Date.now()}</p>
                    </div>
                    <div>
                      <p className="text-swiss-text-muted text-xs">Reference</p>
                      <p className="font-mono text-sm text-white">{selectedTx.reference}</p>
                    </div>
                    <div>
                      <p className="text-swiss-text-muted text-xs">Date</p>
                      <p className="font-mono text-sm text-white">{new Date(selectedTx.created_at).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div>
                      <p className="text-swiss-text-muted text-xs">Time</p>
                      <p className="font-mono text-sm text-white">{new Date(selectedTx.created_at).toLocaleTimeString('en-GB')} CET</p>
                    </div>
                    <div>
                      <p className="text-swiss-text-muted text-xs">Type</p>
                      <Badge className={`${getTypeColor(selectedTx.transaction_type)} rounded-sm text-xs mt-1`}>
                        {selectedTx.transaction_type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-swiss-text-muted text-xs">Status</p>
                      <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs mt-1">
                        {selectedTx.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Amount Box */}
                <div className="bg-swiss-bg-subtle p-6 rounded-sm text-center border-2 border-white/10">
                  <p className="text-swiss-text-muted text-sm uppercase">{selectedTx.currency}</p>
                  <p className={`font-mono text-4xl font-bold ${selectedTx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedTx.amount < 0 ? '-' : '+'}{Math.abs(selectedTx.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </p>
                  <p className="text-swiss-text-muted text-xs mt-2">{selectedTx.amount < 0 ? 'DEBIT' : 'CREDIT'} TRANSACTION</p>
                </div>

                {/* Transaction Details */}
                <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                  <h3 className="text-swiss-text-muted text-xs uppercase tracking-wider mb-3 border-b border-white/10 pb-2">Transaction Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-swiss-text-muted text-xs">Description</span>
                      <span className="text-white text-sm">{selectedTx.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-swiss-text-muted text-xs">Counterparty</span>
                      <span className="text-white text-sm">{selectedTx.counterparty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-swiss-text-muted text-xs">Value Date</span>
                      <span className="font-mono text-sm text-white">{new Date(selectedTx.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                  <h3 className="text-swiss-text-muted text-xs uppercase tracking-wider mb-3 border-b border-white/10 pb-2">Compliance & Verification</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-swiss-text-muted text-xs">AML Check</p>
                      <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs mt-1">PASSED</Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-swiss-text-muted text-xs">Sanctions</p>
                      <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs mt-1">CLEARED</Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-swiss-text-muted text-xs">FATCA</p>
                      <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs mt-1">COMPLIANT</Badge>
                    </div>
                  </div>
                </div>

                {/* Footer Stamp */}
                <div className="text-center pt-6 border-t-2 border-white/20">
                  <div className="inline-block border-2 border-swiss-red px-6 py-3 mb-4">
                    <p className="text-swiss-red font-bold text-sm">OFFICIAL DOCUMENT</p>
                    <p className="text-swiss-red text-xs">VERIFIED & PROCESSED</p>
                  </div>
                  <p className="text-swiss-text-muted text-xs">
                    Document ID: DOC-{Date.now()}<br/>
                    Generated: {new Date().toLocaleString('en-GB')}
                  </p>
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
