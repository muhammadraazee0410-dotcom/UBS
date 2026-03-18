import { useState } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  MapPin,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  Plane,
  Building2,
  ArrowRight
} from 'lucide-react';

const PaymentTrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      toast.error('Please enter a tracking ID');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/tracking/${trackingId}`);
      setTrackingData(response.data);
    } catch (error) {
      toast.error('Transfer not found');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'initiated':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'in_transit':
        return <Plane className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'initiated':
        return 'bg-blue-500 text-slate-900';
      case 'processing':
        return 'bg-amber-500 text-slate-900';
      case 'in_transit':
        return 'bg-purple-500 text-slate-900';
      case 'delivered':
        return 'bg-swiss-status-success text-slate-900';
      default:
        return 'bg-swiss-bg-subtle text-swiss-text-secondary';
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
          <MapPin className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
          Payment Tracking
        </h1>
        <p className="text-swiss-text-secondary mt-1">
          Track international payments with SWIFT GPI
        </p>
      </div>

      {/* Search Card */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardContent className="p-6">
          <form onSubmit={handleTrack} className="flex gap-4">
            <div className="flex-1">
              <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider mb-2 block">
                GPI Tracking ID / UETR
              </Label>
              <Input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="bg-swiss-bg-subtle border-slate-200 text-slate-900 font-mono rounded-sm h-12"
                placeholder="GPI12345678901234567890"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-8 bg-swiss-red hover:bg-swiss-red-hover text-white font-medium uppercase tracking-wider rounded-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Track
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {trackingData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transfer Details */}
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-slate-900">
                Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-swiss-bg-subtle rounded-sm">
                <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Amount</p>
                <p className="font-mono text-2xl text-slate-900">
                  {formatCurrency(trackingData.transfer.amount, trackingData.transfer.currency)}
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Type</p>
                  <Badge className="bg-blue-500/20 text-blue-400 rounded-sm">
                    {trackingData.transfer.transfer_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Beneficiary</p>
                  <p className="text-slate-900">{trackingData.transfer.beneficiary_name}</p>
                </div>
                <div>
                  <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">IBAN</p>
                  <p className="font-mono text-xs text-swiss-text-secondary">{trackingData.transfer.beneficiary_iban}</p>
                </div>
                <div>
                  <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">SWIFT/BIC</p>
                  <p className="font-mono text-sm text-swiss-text-secondary">{trackingData.transfer.beneficiary_swift}</p>
                </div>
                <div>
                  <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Reference</p>
                  <p className="text-swiss-text-secondary">{trackingData.transfer.reference}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-slate-900 flex items-center justify-between">
                <span>Tracking Timeline</span>
                <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Delivered
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-6 bottom-6 w-px bg-white/10" />
                  
                  <div className="space-y-6">
                    {trackingData.tracking_history.map((item, index) => (
                      <div key={index} className="relative flex gap-4">
                        {/* Status icon */}
                        <div className={`relative z-10 w-12 h-12 rounded-sm flex items-center justify-center ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-slate-900 font-medium capitalize">{item.status.replace('_', ' ')}</p>
                              <p className="text-swiss-text-secondary text-sm">{item.description}</p>
                            </div>
                            <p className="font-mono text-xs text-swiss-text-muted">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="w-3 h-3 text-swiss-text-muted" />
                            <p className="text-xs text-swiss-text-muted">{item.location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!trackingData && !loading && (
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-swiss-bg-subtle flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-swiss-text-muted" strokeWidth={1} />
            </div>
            <h3 className="font-heading text-xl text-slate-900 mb-2">Track Your Payment</h3>
            <p className="text-swiss-text-muted text-center max-w-md">
              Enter your GPI tracking ID or UETR to track the status of your international payment in real-time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentTrackingPage;
