import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Building2, Send, CheckCircle2, Loader2 } from 'lucide-react';

const DomesticTransferPage = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'CHF',
    sender_account: '',
    beneficiary_id: '',
    reference: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [benRes, balRes] = await Promise.all([
          api.get('/beneficiaries'),
          api.get('/balances')
        ]);
        setBeneficiaries(benRes.data);
        setBalances(balRes.data);
        if (balRes.data.length > 0) {
          const chfAccount = balRes.data.find(b => b.currency === 'CHF') || balRes.data[0];
          setFormData(prev => ({ ...prev, sender_account: chfAccount.iban }));
        }
      } catch (error) {
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.beneficiary_id) {
      toast.error('Please select a beneficiary');
      return;
    }
    
    setLoading(true);
    setSuccess(null);
    
    try {
      const response = await api.post('/transfers/domestic', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      setSuccess(response.data);
      toast.success('Domestic transfer completed successfully');
      setFormData(prev => ({ ...prev, amount: '', reference: '' }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedBeneficiary = beneficiaries.find(b => b.id === formData.beneficiary_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <Building2 className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
          Domestic Transfer
        </h1>
        <p className="text-swiss-text-secondary mt-1">
          Swiss domestic payment transfers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900">
              New Domestic Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sender Account */}
              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  From Account
                </Label>
                <Select
                  value={formData.sender_account}
                  onValueChange={(value) => setFormData({ ...formData, sender_account: value })}
                >
                  <SelectTrigger className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-swiss-bg-paper border-slate-200">
                    {balances.map((bal) => (
                      <SelectItem key={bal.iban} value={bal.iban}>
                        <span className="font-mono text-sm">{bal.iban}</span>
                        <span className="text-swiss-text-muted ml-2">({bal.currency})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Beneficiary */}
              <div className="space-y-2">
                <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                  To Beneficiary
                </Label>
                <Select
                  value={formData.beneficiary_id}
                  onValueChange={(value) => setFormData({ ...formData, beneficiary_id: value })}
                >
                  <SelectTrigger className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11">
                    <SelectValue placeholder="Select beneficiary" />
                  </SelectTrigger>
                  <SelectContent className="bg-swiss-bg-paper border-slate-200">
                    {beneficiaries.length === 0 ? (
                      <div className="p-2 text-sm text-swiss-text-muted">
                        No beneficiaries. Add one first.
                      </div>
                    ) : (
                      beneficiaries.map((ben) => (
                        <SelectItem key={ben.id} value={ben.id}>
                          {ben.name} - {ben.bank_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                disabled={loading || beneficiaries.length === 0}
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
                    Execute Transfer
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transfer Summary / Success */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900">
              Transfer Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-6">
                  <div className="w-16 h-16 rounded-full bg-swiss-status-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-swiss-status-success" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-heading font-bold text-slate-900">Transfer Completed</p>
                  <p className="text-swiss-text-muted text-sm mt-1">Transaction processed successfully</p>
                </div>
                <div className="space-y-3 bg-swiss-bg-subtle p-4 rounded-sm">
                  <div className="flex justify-between">
                    <span className="text-swiss-text-muted text-sm">Tracking ID</span>
                    <span className="font-mono text-sm text-slate-900">{success.tracking_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-swiss-text-muted text-sm">Status</span>
                    <span className="text-swiss-status-success text-sm uppercase">{success.status}</span>
                  </div>
                </div>
              </div>
            ) : selectedBeneficiary ? (
              <div className="space-y-4">
                <div className="p-4 bg-swiss-bg-subtle rounded-sm">
                  <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-2">Beneficiary Details</p>
                  <p className="text-slate-900 font-medium">{selectedBeneficiary.name}</p>
                  <p className="text-swiss-text-secondary text-sm">{selectedBeneficiary.bank_name}</p>
                  <p className="font-mono text-xs text-swiss-text-muted mt-2">{selectedBeneficiary.iban}</p>
                </div>
                {formData.amount && (
                  <div className="p-4 bg-swiss-bg-subtle rounded-sm">
                    <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-2">Amount</p>
                    <p className="font-mono text-2xl text-slate-900">
                      {formData.currency} {parseFloat(formData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-swiss-text-muted">
                <Building2 className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                <p className="text-sm">Select a beneficiary to see transfer details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DomesticTransferPage;
