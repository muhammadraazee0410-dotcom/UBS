import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  MapPin,
  Loader2,
  ArrowRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PaymentTrackingPage = () => {
  const location = useLocation();
  const [uetr, setUetr] = useState('');
  const [sourceTransactionId, setSourceTransactionId] = useState('');
  const [sourceScreen, setSourceScreen] = useState('APPLICATION_MENU');
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [enquiryData, setEnquiryData] = useState(null);
  const [apiStatusData, setApiStatusData] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    const state = location.state || {};
    if (state.programCode === 'PXDGPIEN') {
      setSourceScreen(state.sourceScreen || 'APPLICATION_MENU');
    }
    if (state.sourceTransactionId) {
      setSourceTransactionId(state.sourceTransactionId);
      setSourceScreen(state.sourceScreen || 'PXSOVIEW');
      prefillFromSourceTransaction(state.sourceTransactionId, state.sourceScreen || 'PXSOVIEW');
    }
  }, [location.state]);

  const prefillFromSourceTransaction = async (transactionId, screen) => {
    try {
      const response = await api.get('/tracker-enquiry/prefill', {
        params: {
          source_transaction_id: transactionId,
          source_screen: screen,
        },
      });
      setUetr(response.data.uetr || '');
      setEnquiryData(response.data);
    } catch (error) {
      toast.error('Unable to prefill data from selected transaction');
    }
  };

  const handleEnquiryRequest = async (e) => {
    e.preventDefault();

    if (!sourceTransactionId && !uetr.trim()) {
      toast.error('Please specify UETR');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/tracker-enquiry', {
        uetr: sourceTransactionId ? undefined : uetr,
        source_transaction_id: sourceTransactionId || undefined,
        source_screen: sourceScreen,
      });
      setEnquiryData(response.data);
      setUetr(response.data.uetr || uetr);
      toast.success('Enquiry request sent to Tracker');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process enquiry request');
      setEnquiryData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApiResponseStatus = async () => {
    if (!enquiryData?.enquiry_reference_number) {
      return;
    }

    setStatusLoading(true);
    try {
      const response = await api.get(
        `/tracker-enquiry/response-status/${enquiryData.enquiry_reference_number}`
      );
      setApiStatusData(response.data);
      setStatusDialogOpen(true);
    } catch (error) {
      toast.error('Unable to fetch API response status');
    } finally {
      setStatusLoading(false);
    }
  };

  const fieldRows = [
    ['UETR', enquiryData?.uetr || '-'],
    ['Enquiry Reference Number', enquiryData?.enquiry_reference_number || '-'],
    ['Transaction Reference', enquiryData?.transaction_reference || '-'],
    ['Enquiry Source Reference', enquiryData?.enquiry_source_reference || '-'],
    ['Source Reference', enquiryData?.source_reference || '-'],
    ['Enquiry Source', enquiryData?.enquiry_source || '-'],
    ['Transaction Type', enquiryData?.transaction_type || '-'],
    ['Account', enquiryData?.account || '-'],
    ['Confirmation Status', enquiryData?.confirmation_status || '-'],
    ['Status Description', enquiryData?.status_description || '-'],
    ['Status Reason', enquiryData?.status_reason || '-'],
    ['Reason Description', enquiryData?.reason_description || '-'],
    ['Cancellation Status', enquiryData?.cancellation_status || '-'],
    ['Cancellation Status Description', enquiryData?.cancellation_status_description || '-'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <MapPin className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
          gpi Tracker Enquiry by UETR
        </h1>
        <p className="text-swiss-text-secondary mt-1">
          Submit an enquiry request and view Tracker response details
        </p>
      </div>

      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardContent className="p-6">
          <form onSubmit={handleEnquiryRequest} className="space-y-4">
            <div>
              <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider mb-2 block">
                UETR
              </Label>
              <Input
                value={uetr}
                onChange={(e) => setUetr(e.target.value.trim())}
                className="bg-swiss-bg-subtle border-slate-200 text-slate-900 font-mono rounded-sm h-12"
                placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
                disabled={!!sourceTransactionId}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-6 bg-swiss-red hover:bg-swiss-red-hover text-white font-medium uppercase tracking-wider rounded-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Enquiry Request
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!enquiryData?.enquiry_reference_number || statusLoading}
                onClick={handleViewApiResponseStatus}
                className="h-10 px-6 border-slate-200 text-slate-900 rounded-sm"
              >
                {statusLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                API Response Status
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {enquiryData && (
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-500 rounded-sm border border-blue-500/30">
                Figure 10-36
              </Badge>
              Enquiry Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRows.map(([label, value]) => (
                <div key={label} className="p-3 border border-slate-200 rounded-sm bg-white">
                  <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-sm ${label.includes('UETR') || label.includes('Reference') || label === 'Account' ? 'font-mono text-slate-900' : 'text-slate-900'}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!enquiryData && !loading && (
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-swiss-bg-subtle flex items-center justify-center mb-6">
              <ArrowRight className="w-10 h-10 text-swiss-text-muted" strokeWidth={1} />
            </div>
            <h3 className="font-heading text-xl text-slate-900 mb-2">Submit UETR Enquiry</h3>
            <p className="text-swiss-text-muted text-center max-w-xl">
              Enter a valid UETR in lowercase format and click Enquiry Request to generate a 16-digit enquiry reference and fetch Tracker response details.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-slate-900 flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-500 rounded-sm border border-purple-500/30">
                Figure 10-37
              </Badge>
              View API Response Status
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 border border-slate-200 rounded-sm bg-swiss-bg-paper">
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">DCN</p>
              <p className="font-mono text-sm text-slate-900">{apiStatusData?.dcn || '-'}</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-sm bg-swiss-bg-paper">
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Response Status</p>
              <p className="text-sm text-slate-900">{apiStatusData?.response_status || '-'}</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-sm bg-swiss-bg-paper">
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Response Code</p>
              <p className="font-mono text-sm text-slate-900">{apiStatusData?.response_code || '-'}</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-sm bg-swiss-bg-paper md:col-span-2">
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Error</p>
              <p className="text-sm text-slate-900">{apiStatusData?.error || '-'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentTrackingPage;
