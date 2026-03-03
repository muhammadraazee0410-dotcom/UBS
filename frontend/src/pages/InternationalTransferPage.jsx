import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import {
  Globe,
  Send,
  FileCode2,
  Copy,
  CheckCircle2,
  ArrowRight,
  Zap,
  FileText,
  Loader2
} from 'lucide-react';

const transferTypes = [
  { id: 'MT103', name: 'MT103 Single Customer Credit', description: 'Standard SWIFT payment message' },
  { id: 'PACS008', name: 'PACS.008 ISO 20022', description: 'FI to FI Customer Credit Transfer' },
  { id: 'PACS009', name: 'PACS.009 ISO 20022', description: 'FI to FI Institution Credit Transfer' },
  { id: 'GPI', name: 'SWIFT GPI Transfer', description: 'Global Payments Innovation tracker' },
  { id: 'QUICK_WIRE', name: 'SWIFT Quick Wire', description: 'Express international wire transfer' },
];

const chargeOptions = [
  { value: 'SHA', label: 'SHA - Shared', description: 'Charges shared between parties' },
  { value: 'OUR', label: 'OUR - Ours', description: 'All charges paid by sender' },
  { value: 'BEN', label: 'BEN - Beneficiary', description: 'All charges paid by beneficiary' },
];

const InternationalTransferPage = () => {
  const [activeType, setActiveType] = useState('MT103');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [swiftMessage, setSwiftMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'EUR',
    sender_account: '',
    beneficiary_id: '',
    reference: '',
    purpose: '',
    charge_option: 'SHA'
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
          setFormData(prev => ({ ...prev, sender_account: balRes.data[0].iban }));
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
    try {
      const response = await api.post('/transfers/international', {
        transfer_type: activeType,
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      setSwiftMessage(response.data.swift_message);
      toast.success(`Transfer initiated successfully. Tracking ID: ${response.data.tracking_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(swiftMessage);
    setCopied(true);
    toast.success('SWIFT message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" data-testid="international-transfer-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            International Transfer
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            SWIFT MT103, MX PACS.008, PACS.009, GPI & Quick Wire
          </p>
        </div>
      </div>

      {/* Transfer Type Selection */}
      <Tabs value={activeType} onValueChange={setActiveType} className="space-y-6">
        <TabsList className="bg-swiss-bg-paper border border-white/10 p-1 rounded-sm h-auto flex-wrap">
          {transferTypes.map((type) => (
            <TabsTrigger
              key={type.id}
              value={type.id}
              className="data-[state=active]:bg-swiss-red data-[state=active]:text-white text-swiss-text-secondary rounded-sm px-4 py-2"
              data-testid={`transfer-type-${type.id}`}
            >
              <span className="font-mono text-xs">{type.id}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {transferTypes.map((type) => (
          <TabsContent key={type.id} value={type.id} className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transfer Form */}
              <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                    {type.name}
                  </CardTitle>
                  <p className="text-sm text-swiss-text-muted">{type.description}</p>
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
                          className="bg-swiss-bg-subtle border-white/10 text-white font-mono rounded-sm h-11"
                          placeholder="0.00"
                          data-testid="transfer-amount"
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
                          <SelectTrigger className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-11" data-testid="transfer-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-swiss-bg-paper border-white/10">
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Sender Account */}
                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                        Sender Account (IBAN)
                      </Label>
                      <Select
                        value={formData.sender_account}
                        onValueChange={(value) => setFormData({ ...formData, sender_account: value })}
                      >
                        <SelectTrigger className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-11" data-testid="transfer-sender">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent className="bg-swiss-bg-paper border-white/10">
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
                        Beneficiary
                      </Label>
                      <Select
                        value={formData.beneficiary_id}
                        onValueChange={(value) => setFormData({ ...formData, beneficiary_id: value })}
                      >
                        <SelectTrigger className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-11" data-testid="transfer-beneficiary">
                          <SelectValue placeholder="Select beneficiary" />
                        </SelectTrigger>
                        <SelectContent className="bg-swiss-bg-paper border-white/10">
                          {beneficiaries.length === 0 ? (
                            <div className="p-2 text-sm text-swiss-text-muted">
                              No beneficiaries. Add one first.
                            </div>
                          ) : (
                            beneficiaries.map((ben) => (
                              <SelectItem key={ben.id} value={ben.id}>
                                <span>{ben.name}</span>
                                <span className="text-swiss-text-muted ml-2">- {ben.bank_name}</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Charge Option */}
                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                        Charge Option
                      </Label>
                      <Select
                        value={formData.charge_option}
                        onValueChange={(value) => setFormData({ ...formData, charge_option: value })}
                      >
                        <SelectTrigger className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-11" data-testid="transfer-charge">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-swiss-bg-paper border-white/10">
                          {chargeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span>{opt.label}</span>
                            </SelectItem>
                          ))}
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
                        className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-11"
                        placeholder="Invoice #12345"
                        data-testid="transfer-reference"
                        required
                      />
                    </div>

                    {/* Purpose */}
                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                        Purpose (Optional)
                      </Label>
                      <Input
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-11"
                        placeholder="Payment for services"
                        data-testid="transfer-purpose"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || beneficiaries.length === 0}
                      className="w-full h-12 bg-swiss-red hover:bg-swiss-red-hover text-white font-medium uppercase tracking-wider rounded-sm"
                      data-testid="submit-transfer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Initiate {type.id} Transfer
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* SWIFT Message Preview */}
              <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-heading text-lg text-white flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                    SWIFT Message Preview
                  </CardTitle>
                  {swiftMessage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="text-swiss-text-secondary hover:text-white"
                      data-testid="copy-swift-message"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-swiss-status-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {swiftMessage ? (
                      <pre className="font-mono text-xs text-green-400 bg-black p-4 rounded-sm whitespace-pre-wrap">
                        {swiftMessage}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-swiss-text-muted">
                        <FileCode2 className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                        <p className="text-sm">SWIFT message will appear here after submission</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Transfer Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {transferTypes.map((type) => (
          <Card
            key={type.id}
            className={`bg-swiss-bg-paper border-white/10 rounded-sm cursor-pointer transition-all ${
              activeType === type.id ? 'border-swiss-red' : 'hover:border-white/20'
            }`}
            onClick={() => setActiveType(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {type.id === 'GPI' ? (
                  <Zap className="w-4 h-4 text-swiss-red" strokeWidth={1.5} />
                ) : (
                  <FileText className="w-4 h-4 text-swiss-text-muted" strokeWidth={1.5} />
                )}
                <Badge
                  variant="outline"
                  className={`text-xs rounded-sm ${
                    activeType === type.id
                      ? 'border-swiss-red text-swiss-red'
                      : 'border-white/20 text-swiss-text-secondary'
                  }`}
                >
                  {type.id}
                </Badge>
              </div>
              <p className="text-xs text-swiss-text-muted">{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InternationalTransferPage;
