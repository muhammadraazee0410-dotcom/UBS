import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import {
  FileText,
  Printer,
  History,
  CreditCard,
  FileSpreadsheet,
  Receipt,
  Server,
  Globe,
  MapPin,
  RefreshCw
} from 'lucide-react';

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const DocumentsPage = () => {
  const [activeTab, setActiveTab] = useState('transaction-history');
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, transferRes, balanceRes] = await Promise.all([
        api.get('/transactions?limit=100'),
        api.get('/transfers'),
        api.get('/balances')
      ]);
      setTransactions(txRes.data);
      setTransfers(transferRes.data);
      setBalances(balanceRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>UBS AG - Document Print</title>
          <style>
            body { font-family: monospace; padding: 40px; background: white; color: black; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 24px; margin: 0; color: #DC2626; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .footer { margin-top: 40px; border-top: 2px solid #000; text-align: center; }
            .stamp { border: 2px solid #DC2626; padding: 10px 20px; display: inline-block; margin-top: 20px; color: #DC2626; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const documentTypes = [
    { id: 'transaction-history', label: 'Transaction History', icon: History },
    { id: 'debit-account', label: 'Debit from Main Account', icon: CreditCard },
    { id: 'debit-note', label: 'Debit Note', icon: FileText },
    { id: 'remittance-advice', label: 'Remittance Advice', icon: Receipt },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: FileSpreadsheet },
    { id: 'server-tracker', label: 'Server Tracker', icon: Server },
    { id: 'alliance-report', label: 'Alliance Report', icon: Globe },
    { id: 'payment-trace', label: 'Payment Trace', icon: MapPin },
  ];

  const DocumentHeader = ({ title }) => (
    <div className="text-center border-b-2 border-white/20 pb-6 mb-8">
      <h1 className="font-heading font-black text-2xl text-swiss-red">UNION BANK OF SWITZERLAND AG</h1>
      <p className="text-swiss-text-muted text-sm">BAHNHOFSTRASSE 45, 8001 ZURICH, SWITZERLAND</p>
      <p className="text-swiss-text-muted text-xs mt-1">SWIFT: UBSWCHZHXXX</p>
      <h2 className="font-heading font-bold text-xl text-white uppercase mt-4">{title}</h2>
      <p className="text-swiss-text-muted text-xs mt-2">Date: {new Date().toLocaleDateString('en-GB')} | Ref: UBS-{Date.now()}</p>
    </div>
  );

  const DocumentFooter = () => (
    <div className="mt-8 pt-6 border-t-2 border-white/20 text-center">
      <div className="border-2 border-swiss-red px-6 py-3 inline-block mb-4">
        <p className="text-swiss-red font-bold text-sm">OFFICIAL DOCUMENT</p>
        <p className="text-swiss-red text-xs">UNION BANK OF SWITZERLAND AG</p>
      </div>
      <p className="text-swiss-text-muted text-xs">Document ID: DOC-{Date.now()}</p>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="documents-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Documents
          </h1>
          <p className="text-swiss-text-secondary mt-1">Official banking documents and reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" className="border-white/10 text-swiss-text-secondary hover:text-white rounded-sm" data-testid="refresh-docs">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button onClick={handlePrint} className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm" data-testid="print-pdf-btn">
            <Printer className="w-4 h-4 mr-2" />Print PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-swiss-bg-paper border border-white/10 p-1 rounded-sm h-auto flex-wrap gap-1">
          {documentTypes.map((doc) => (
            <TabsTrigger key={doc.id} value={doc.id} className="data-[state=active]:bg-swiss-red data-[state=active]:text-white text-swiss-text-secondary rounded-sm px-3 py-2 text-xs" data-testid={`doc-tab-${doc.id}`}>
              <doc.icon className="w-3 h-3 mr-1" />{doc.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div ref={printRef} className="p-6">
                <TabsContent value="transaction-history" className="mt-0">
                  <DocumentHeader title="Transaction History" />
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Date</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Type</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Description</th>
                      <th className="text-right py-3 px-2 text-swiss-text-muted uppercase text-xs">Amount</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Status</th>
                    </tr></thead>
                    <tbody>
                      {transactions.length === 0 ? <tr><td colSpan="5" className="text-center py-8 text-swiss-text-muted">No transactions</td></tr> :
                        transactions.map((tx, i) => (
                          <tr key={tx.id || i} className="border-b border-white/5">
                            <td className="py-3 px-2 font-mono text-xs text-swiss-text-secondary">{formatDate(tx.created_at)}</td>
                            <td className="py-3 px-2"><Badge className="bg-swiss-bg-subtle text-swiss-text-secondary rounded-sm text-xs">{tx.transaction_type}</Badge></td>
                            <td className="py-3 px-2 text-white text-xs">{tx.description}</td>
                            <td className={`py-3 px-2 text-right font-mono text-xs ${tx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(tx.amount, tx.currency)}</td>
                            <td className="py-3 px-2"><Badge className="bg-green-500/20 text-green-400 rounded-sm text-xs">{tx.status}</Badge></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <DocumentFooter />
                </TabsContent>

                <TabsContent value="debit-account" className="mt-0">
                  <DocumentHeader title="Debit from Main Account" />
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {balances.map((bal) => (
                      <div key={bal.currency} className="bg-swiss-bg-subtle p-4 rounded-sm">
                        <p className="text-swiss-text-muted text-xs uppercase">{bal.currency} Account</p>
                        <p className="font-mono text-lg text-white">{formatCurrency(bal.balance, bal.currency)}</p>
                        <p className="font-mono text-xs text-swiss-text-muted">{bal.iban}</p>
                      </div>
                    ))}
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Date</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Description</th>
                      <th className="text-right py-3 px-2 text-swiss-text-muted uppercase text-xs">Debit Amount</th>
                    </tr></thead>
                    <tbody>
                      {transactions.filter(t => t.amount < 0).map((tx, i) => (
                        <tr key={tx.id || i} className="border-b border-white/5">
                          <td className="py-3 px-2 font-mono text-xs text-swiss-text-secondary">{formatDate(tx.created_at)}</td>
                          <td className="py-3 px-2 text-white text-xs">{tx.description}</td>
                          <td className="py-3 px-2 text-right font-mono text-xs text-red-400">{formatCurrency(Math.abs(tx.amount), tx.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <DocumentFooter />
                </TabsContent>

                <TabsContent value="debit-note" className="mt-0">
                  <DocumentHeader title="Debit Note" />
                  {transactions.filter(t => t.amount < 0)[0] ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                          <p className="text-swiss-text-muted text-xs uppercase mb-2">Reference</p>
                          <p className="font-mono text-white">{transactions.filter(t => t.amount < 0)[0].reference}</p>
                        </div>
                        <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                          <p className="text-swiss-text-muted text-xs uppercase mb-2">Amount</p>
                          <p className="font-mono text-3xl text-red-400">{formatCurrency(Math.abs(transactions.filter(t => t.amount < 0)[0].amount), transactions.filter(t => t.amount < 0)[0].currency)}</p>
                        </div>
                      </div>
                      <div className="bg-swiss-bg-subtle p-4 rounded-sm">
                        <p className="text-swiss-text-muted text-xs uppercase mb-2">Description</p>
                        <p className="text-white">{transactions.filter(t => t.amount < 0)[0].description}</p>
                      </div>
                    </div>
                  ) : <p className="text-center py-8 text-swiss-text-muted">No debit transactions</p>}
                  <DocumentFooter />
                </TabsContent>

                <TabsContent value="remittance-advice" className="mt-0">
                  <DocumentHeader title="Remittance Advice" />
                  {transfers.slice(0, 5).map((t, i) => (
                    <div key={t.id || i} className="mb-4 p-4 bg-swiss-bg-subtle rounded-sm">
                      <div className="flex justify-between"><div><p className="text-white font-medium">{t.beneficiary_name}</p><p className="font-mono text-xs text-swiss-text-muted">{t.beneficiary_iban}</p></div>
                        <p className="font-mono text-xl text-white">{formatCurrency(t.amount, t.currency)}</p></div>
                      <div className="mt-2 text-xs text-swiss-text-muted">Ref: {t.reference} | {formatDate(t.created_at)}</div>
                    </div>
                  ))}
                  <DocumentFooter />
                </TabsContent>

                <TabsContent value="balance-sheet" className="mt-0">
                  <DocumentHeader title="Balance Sheet" />
                  <table className="w-full text-sm mb-6">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Account</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">IBAN</th>
                      <th className="text-right py-3 px-2 text-swiss-text-muted uppercase text-xs">Balance</th>
                    </tr></thead>
                    <tbody>
                      {balances.map((bal) => (
                        <tr key={bal.currency} className="border-b border-white/5">
                          <td className="py-3 px-2 text-white">{bal.currency}</td>
                          <td className="py-3 px-2 font-mono text-xs text-swiss-text-muted">{bal.iban}</td>
                          <td className="py-3 px-2 text-right font-mono text-green-400">{formatCurrency(bal.balance, bal.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-swiss-bg-subtle p-4 rounded-sm"><p className="text-swiss-text-muted text-xs">Total Debits</p><p className="font-mono text-xl text-red-400">{formatCurrency(transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), 'EUR')}</p></div>
                    <div className="bg-swiss-bg-subtle p-4 rounded-sm"><p className="text-swiss-text-muted text-xs">Total Credits</p><p className="font-mono text-xl text-green-400">{formatCurrency(transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0), 'EUR')}</p></div>
                  </div>
                  <DocumentFooter />
                </TabsContent>

                <TabsContent value="server-tracker" className="mt-0">
                  <DocumentHeader title="Server Tracker" />
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Service</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Status</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Uptime</th>
                    </tr></thead>
                    <tbody>
                      {[{n:'SWIFT Gateway',s:'ONLINE',u:'99.99%'},{n:'TARGET2',s:'ONLINE',u:'99.97%'},{n:'Core Banking',s:'ONLINE',u:'100%'},{n:'Database',s:'ONLINE',u:'99.99%'},{n:'API Gateway',s:'ONLINE',u:'99.98%'}].map((srv,i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-3 px-2 text-white">{srv.n}</td>
                          <td className="py-3 px-2"><Badge className="bg-green-500/20 text-green-400 rounded-sm text-xs">{srv.s}</Badge></td>
                          <td className="py-3 px-2 font-mono text-xs text-swiss-text-secondary">{srv.u}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 p-4 bg-swiss-bg-subtle rounded-sm"><p className="text-green-400 font-bold">ALL SYSTEMS OPERATIONAL</p></div>
                  <DocumentFooter />
                </TabsContent>

                <TabsContent value="alliance-report" className="mt-0">
                  <DocumentHeader title="SWIFT Alliance Report" />
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-swiss-bg-subtle p-4 rounded-sm"><p className="text-swiss-text-muted text-xs">Total Messages</p><p className="font-mono text-2xl text-white">{transfers.length}</p></div>
                    <div className="bg-swiss-bg-subtle p-4 rounded-sm"><p className="text-swiss-text-muted text-xs">Successful</p><p className="font-mono text-2xl text-green-400">{transfers.filter(t => t.status !== 'failed').length}</p></div>
                    <div className="bg-swiss-bg-subtle p-4 rounded-sm"><p className="text-swiss-text-muted text-xs">Pending</p><p className="font-mono text-2xl text-amber-400">{transfers.filter(t => t.status === 'processing').length}</p></div>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Type</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Tracking ID</th>
                      <th className="text-right py-3 px-2 text-swiss-text-muted uppercase text-xs">Amount</th>
                      <th className="text-left py-3 px-2 text-swiss-text-muted uppercase text-xs">Status</th>
                    </tr></thead>
                    <tbody>
                      {transfers.slice(0, 10).map((t, i) => (
                        <tr key={t.id || i} className="border-b border-white/5">
                          <td className="py-3 px-2"><Badge className="bg-blue-500/20 text-blue-400 rounded-sm text-xs">{t.transfer_type}</Badge></td>
                          <td className="py-3 px-2 font-mono text-xs text-swiss-text-secondary">{t.tracking_id}</td>
                          <td className="py-3 px-2 text-right font-mono text-xs text-white">{formatCurrency(t.amount, t.currency)}</td>
                          <td className="py-3 px-2"><Badge className="bg-green-500/20 text-green-400 rounded-sm text-xs">{t.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <DocumentFooter />
                </TabsContent>

                <TabsContent value="payment-trace" className="mt-0">
                  <DocumentHeader title="Payment Trace" />
                  {transfers.slice(0, 5).map((t, i) => (
                    <div key={t.id || i} className="mb-4 p-4 bg-swiss-bg-subtle rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div><p className="text-swiss-text-muted text-xs">Tracking ID</p><p className="font-mono text-sm text-white">{t.tracking_id}</p></div>
                        <Badge className="bg-green-500/20 text-green-400 rounded-sm">{t.status}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div><p className="text-swiss-text-muted">Beneficiary</p><p className="text-white">{t.beneficiary_name}</p></div>
                        <div><p className="text-swiss-text-muted">BIC</p><p className="font-mono text-white">{t.beneficiary_swift}</p></div>
                        <div><p className="text-swiss-text-muted">Amount</p><p className="font-mono text-white">{formatCurrency(t.amount, t.currency)}</p></div>
                        <div><p className="text-swiss-text-muted">Date</p><p className="text-white">{formatDate(t.created_at)}</p></div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 bg-green-400 rounded-full"></span><span className="text-green-400">Initiated</span>
                        <span className="flex-1 h-px bg-white/20"></span>
                        <span className="w-3 h-3 bg-green-400 rounded-full"></span><span className="text-green-400">Processing</span>
                        <span className="flex-1 h-px bg-white/20"></span>
                        <span className="w-3 h-3 bg-green-400 rounded-full"></span><span className="text-green-400">Delivered</span>
                      </div>
                    </div>
                  ))}
                  <DocumentFooter />
                </TabsContent>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default DocumentsPage;
