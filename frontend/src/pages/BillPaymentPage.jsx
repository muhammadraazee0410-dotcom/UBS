import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Receipt, Send, CheckCircle2, Loader2, History } from 'lucide-react';

const BillPaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPayments, setFetchingPayments] = useState(true);
  
  const [formData, setFormData] = useState({
    biller_name: '',
    biller_account: '',
    amount: '',
    currency: 'CHF',
    reference: ''
  });

  const fetchPayments = async () => {
    try {
      const response = await api.get('/bills');
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to fetch bill payments');
    } finally {
      setFetchingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/bills/pay', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      toast.success('Bill payment completed successfully');
      setFormData({
        biller_name: '',
        biller_account: '',
        amount: '',
        currency: 'CHF',
        reference: ''
      });
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <Receipt className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
          Bill Payment
        </h1>
        <p className="text-swiss-text-secondary mt-1">
          Pay utility bills, invoices, and other payments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900">
              New Bill Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Biller Name */}
              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  Biller Name
                </Label>
                <Input
                  value={formData.biller_name}
                  onChange={(e) => setFormData({ ...formData, biller_name: e.target.value })}
                  className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11"
                  placeholder="Swiss Electric Company"
                  required
                />
              </div>

              {/* Biller Account */}
              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  Biller Account / Reference Number
                </Label>
                <Input
                  value={formData.biller_account}
                  onChange={(e) => setFormData({ ...formData, biller_account: e.target.value })}
                  className="bg-swiss-bg-subtle border-slate-200 text-slate-900 font-mono rounded-sm h-11"
                  placeholder="CH93 0027 3001 8839 9039 39"
                  required
                />
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                    Amount
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-swiss-bg-subtle border-slate-200 text-slate-900 font-mono rounded-sm h-11"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                    Currency
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-swiss-bg-paper border-slate-200">
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  Payment Reference
                </Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11"
                  placeholder="Invoice #12345"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-swiss-red hover:bg-swiss-red-hover text-white font-medium uppercase tracking-wider rounded-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Pay Bill
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Recent Payments
            </CardTitle>
            <Badge className="bg-swiss-bg-subtle text-swiss-text-secondary rounded-sm">
              {payments.length} payments
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {fetchingPayments ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-swiss-text-muted" />
                </div>
              ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-swiss-text-muted">
                  <Receipt className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                  <p className="text-sm">No bill payments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 bg-swiss-bg-subtle/50 rounded-sm border border-slate-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-slate-900 font-medium">{payment.biller_name}</p>
                          <p className="text-xs text-swiss-text-muted font-mono">{payment.biller_account}</p>
                        </div>
                        <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <p className="text-xs text-swiss-text-muted">Reference</p>
                          <p className="text-sm text-swiss-text-secondary">{payment.reference}</p>
                        </div>
                        <p className="font-mono text-lg text-slate-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                      <p className="text-xs text-swiss-text-muted mt-2">
                        {new Date(payment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillPaymentPage;
