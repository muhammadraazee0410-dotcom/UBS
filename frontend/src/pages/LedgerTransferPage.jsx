import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  ArrowRightLeft,
  Printer,
  Send,
  RefreshCw,
  CheckCircle,
  Terminal,
  Shield,
  Building2,
  Landmark,
  Globe,
  ArrowRight,
  Clock,
  CircleCheck,
} from 'lucide-react';

const LedgerTransferPage = () => {
  const [form, setForm] = useState({
    sender_name: 'DR. ERICH HUNZIKER',
    sender_company: 'BB BIOTECH AG',
    sender_account: '001-8839903939',
    sender_iban: 'CH93 0027 3001 8839 9039 39',
    receiver_bank_name: 'HONG KONG AND SHANGHAI BANKING CORPORATION',
    receiver_bank_address: 'HSBC BUILDING, 82 NATHAN ROAD, KOWLOON, HK',
    receiver_swift: 'HSBCHKHHHKH',
    receiver_account: '165758772838',
    receiver_iban: '',
    receiver_name: 'HONG KONG UNIWORLD LIMITED',
    amount: '10000000000',
    currency: 'EUR',
    purpose: 'INVESTMENT / INTERNAL LEDGER',
  });
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [trackerAnimating, setTrackerAnimating] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const trackerRef = useRef(null);

  useEffect(() => {
    api.get('/beneficiaries').then(r => setBeneficiaries(r.data)).catch(() => {});
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const animateTracker = (stages) => {
    setTrackerAnimating(true);
    setActiveStage(0);
    stages.forEach((_, i) => {
      setTimeout(() => {
        setActiveStage(i);
        if (i === stages.length - 1) {
          setTimeout(() => setTrackerAnimating(false), 600);
        }
      }, (i + 1) * 900);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.receiver_name || !form.receiver_swift || !form.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    setReceipt(null);
    setActiveStage(-1);
    try {
      const res = await api.post('/transfers/ledger', { ...form, amount: parseFloat(form.amount) });
      setReceipt(res.data);
      toast.success('Ledger to Ledger transfer completed');
      if (res.data.nostro_routing?.stages) {
        setTimeout(() => {
          animateTracker(res.data.nostro_routing.stages);
          if (trackerRef.current) {
            trackerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 400);
      }
    } catch {
      toast.error('Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    if (!receipt) return;
    const html = buildReceiptHTML(receipt);
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  const selectBeneficiary = (id) => {
    const b = beneficiaries.find(x => x.id === id);
    if (b) {
      set('receiver_name', b.name);
      set('receiver_swift', b.swift_bic || b.swift_code || b.swift || '');
      set('receiver_account', b.account_number || '');
      set('receiver_iban', b.iban || '');
      set('receiver_bank_name', b.bank_name || '');
      set('receiver_bank_address', b.bank_address || b.address || '');
    }
  };

  const stageIcons = [
    <Building2 className="w-5 h-5" />,
    <Landmark className="w-5 h-5" />,
    <Globe className="w-5 h-5" />,
    <Building2 className="w-5 h-5" />,
    <CircleCheck className="w-5 h-5" />,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Ledger to Ledger Transfer
          </h1>
          <p className="text-swiss-text-secondary mt-1">SWIFT FIN Ledger to Ledger Cash Transfer — Nostro Routing</p>
        </div>
        {receipt && (
          <Button onClick={printReceipt} className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm">
            <Printer className="w-4 h-4 mr-2" />Print Receipt
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sender */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-3">
                <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold">Sender (UBS AG)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-slate-500">Name</Label><Input value={form.sender_name} onChange={e => set('sender_name', e.target.value)} className="mt-1 text-sm" /></div>
                  <div><Label className="text-xs text-slate-500">Company</Label><Input value={form.sender_company} onChange={e => set('sender_company', e.target.value)} className="mt-1 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-slate-500">Account</Label><Input value={form.sender_account} onChange={e => set('sender_account', e.target.value)} className="mt-1 text-sm font-mono" /></div>
                  <div><Label className="text-xs text-slate-500">IBAN</Label><Input value={form.sender_iban} onChange={e => set('sender_iban', e.target.value)} className="mt-1 text-sm font-mono" /></div>
                </div>
              </div>

              {/* Receiver */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold">Receiver</p>
                  {beneficiaries.length > 0 && (
                    <Select onValueChange={selectBeneficiary}>
                      <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Select beneficiary" /></SelectTrigger>
                      <SelectContent>{beneficiaries.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-slate-500">Bank Name *</Label><Input value={form.receiver_bank_name} onChange={e => set('receiver_bank_name', e.target.value)} className="mt-1 text-sm" required /></div>
                  <div><Label className="text-xs text-slate-500">SWIFT / BIC *</Label><Input value={form.receiver_swift} onChange={e => set('receiver_swift', e.target.value)} className="mt-1 text-sm font-mono" required /></div>
                </div>
                <div><Label className="text-xs text-slate-500">Bank Address</Label><Input value={form.receiver_bank_address} onChange={e => set('receiver_bank_address', e.target.value)} className="mt-1 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-slate-500">Account Number</Label><Input value={form.receiver_account} onChange={e => set('receiver_account', e.target.value)} className="mt-1 text-sm font-mono" /></div>
                  <div><Label className="text-xs text-slate-500">IBAN</Label><Input value={form.receiver_iban} onChange={e => set('receiver_iban', e.target.value)} className="mt-1 text-sm font-mono" /></div>
                </div>
                <div><Label className="text-xs text-slate-500">Beneficiary Name *</Label><Input value={form.receiver_name} onChange={e => set('receiver_name', e.target.value)} className="mt-1 text-sm" required /></div>
              </div>

              {/* Nostro Info Box */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm">
                <p className="text-[10px] text-amber-700 uppercase tracking-widest font-bold mb-2">Nostro Correspondent Account (EUR)</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-amber-600">Institution:</span><span className="font-mono text-slate-800">HSBC CONTINENTAL EUROPE SA</span>
                  <span className="text-amber-600">SWIFT:</span><span className="font-mono text-slate-800">CCFRFRPP</span>
                  <span className="text-amber-600">IBAN:</span><span className="font-mono text-slate-800">FR7630056000100010000405731</span>
                  <span className="text-amber-600">Remittance:</span><span className="text-slate-800">For credit to beneficiary account</span>
                </div>
              </div>

              {/* Amount */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Label className="text-xs text-slate-500">Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className="mt-1 text-sm font-mono" required /></div>
                <div><Label className="text-xs text-slate-500">Currency</Label>
                  <Select value={form.currency} onValueChange={v => set('currency', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="CHF">CHF</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs text-slate-500">Purpose</Label><Input value={form.purpose} onChange={e => set('purpose', e.target.value)} className="mt-1 text-sm" /></div>

              <Button type="submit" disabled={loading} className="w-full bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Execute Ledger to Ledger Transfer
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Receipt Terminal */}
        <Card className="bg-black border-slate-700 rounded-sm overflow-hidden">
          <CardHeader className="border-b border-slate-700 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-400 font-mono text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                SWIFT FIN TERMINAL — LEDGER TO LEDGER
              </CardTitle>
              {receipt && <Badge className="bg-green-900 text-green-400 text-[10px] rounded-sm">TRANSMITTED</Badge>}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[650px]">
              {!receipt ? (
                <div className="p-6 text-center">
                  <Terminal className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-mono text-sm">AWAITING TRANSFER INSTRUCTION...</p>
                  <p className="text-slate-600 font-mono text-xs mt-2">Submit transfer to generate SWIFT receipt</p>
                </div>
              ) : (
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-green-400 whitespace-pre-wrap">
{`CONNECTED (${receipt.connection.ip})
${'—'.repeat(80)}
${receipt.connection.cert_chain}
Certificate Chain
0 ${receipt.connection.cert_subject}
  ${receipt.connection.cert_issuer}
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
/DELIVERY DATE / TIME: ${receipt.delivery_datetime}
/MESSAGE TRANSACTION CODE: ${receipt.codes.msg_code} [√]
/MESSAGE TRANSACTION ID: ${receipt.codes.tx_id} [√]
/REFERENCE NUMBER: ${receipt.codes.ref_num}
/YOUR MESSAGES ARE SHOWN BELOW: UBSW0009876554
/FROM UNION BANK OF SWITZERLAND AG TO: ${receipt.receiver.bank_name.toUpperCase()}
/ORIGIN CUSTOMER: ${receipt.sender.name}, ${receipt.sender.company}
${'—'.repeat(25)}LEDGER TO LEDGER TRANSFER SWIFT MESSAGE${'—'.repeat(20)}
456 : /BANK SENDER SWIFT: ${receipt.sender.swift}
295 : /BANK SENDER GLOBAL IP: ${receipt.sender.ip}
095 : /BANK SENDER NETWORK DELIVERY STATUS: ${receipt.sender.network_status}
485 : /BANK GLOBAL SERVER ID: ${receipt.sender.server_id}
104 : /BANK SOURCE TRANSACTION ID: ${receipt.codes.tx_id}
356 : /BANK SERVER SERIAL ID: ${receipt.sender.serial_id}
              1 : ///${receipt.sender.srv_names[0]}
              2 : ///${receipt.sender.srv_names[1]}
              3 : ///${receipt.sender.srv_names[2]}
758 : /UBS IDENTITY CODE: ${receipt.codes.identity_code}
864 : /INPUT BY SWITZERLAND GLOBAL TIME: ${receipt.formatted_time.toUpperCase()}
658 : /PERMIT ARRIVAL MONEY NU: ${receipt.codes.scf_num}
564 : /BANK UNIQUE TRANSACTION REFERENCE: ${receipt.codes.ref_num}
937 : /CLIENT SENDER ACCOUNT NAME: ${receipt.sender.company}
855 : /COMPANY REPRESENTED BY: ${receipt.sender.name}
037 : /CLIENT BANK ADDRESS: ${receipt.sender.bank_address}
396 : /CLIENT SWIFT CODE OR BIC: ${receipt.sender.swift}
105 : /CLIENT ACCOUNT NUMBER IN UBS: ${receipt.sender.account}
106 : /CLIENT IBAN: ${receipt.sender.iban}
107 : /SEND AMOUNT: ${receipt.amount}
>>>ADDITIONAL INFORMATION:
***LINK CODE: ${receipt.codes.link_code}
***CHANNEL CODE: ${receipt.codes.channel_code}
***LINK CODE (CENTRAL BANK: ${Math.floor(Math.random() * 900000000) + 100000000})

${'*'.repeat(20)}NOSTRO CORRESPONDENT ROUTING${'*'.repeat(20)}
NOSTRO BANK       : HSBC CONTINENTAL EUROPE SA
NOSTRO SWIFT      : ${receipt.nostro_routing.nostro_swift}
NOSTRO IBAN       : ${receipt.nostro_routing.nostro_iban}
REMITTANCE INFO   : ${receipt.nostro_routing.remittance_info}
ROUTING PATH      : UBSWCHZHXXX → ECBFDEFFXXX → CCFRFRPP → HSBCHKHHHKH
VALIDATION STATUS : ALL STAGES COMPLETED [√]

${'*'.repeat(40)}RECEIVER INFORMATION${'*'.repeat(35)}
103 : /RECEIVER/BANK NAME: ${receipt.receiver.bank_name.toUpperCase()}
927 : /RECEIVER/BANK ADDRESS: ${receipt.receiver.bank_address}
183 : /RECEIVER/SWIFT CODE: ${receipt.receiver.swift}
364 : /RECEIVER/ACCOUNT NUMBER: ${receipt.receiver.account}
365 : /RECEIVER/IBAN NUMBER: ${receipt.receiver.iban}
198 : /RECEIVER/ACCOUNT NAME: ${receipt.receiver.name}
109 : /RECEIVER/GLOBAL SERVER IP: ${receipt.receiver.server_ip}
968 : /RECEIVER/GLOBAL SERVER ID: ${receipt.receiver.server_id}
968 : /RECEIVER BALANCE ACCOUNT: LINE 1 BOX - : 1 PARTS: ${receipt.amount}
${'*'.repeat(40)}ADDITIONAL REFERENCES${'*'.repeat(34)}
>>>REF.SCRT388-1D${receipt.codes.identity_code.replace(/ /g,'')}RLN000000 [√]
>>>NO.SCFRT388-1D ${receipt.codes.identity_code} [√]
${'*'.repeat(20)}TRANSMISSION LEDGER TO LEDGER CASH TRANSFER SWIFT${'*'.repeat(18)}
//:TRANSMITTING BANK: UNION BANK OF SWITZERLAND AG
//:CABLE ADDRESS: UBS–C-/ B-${Math.floor(Math.random()*900000000)+100000000}–ZURICH SWITZERLAND
//:1)DEPOSIT CODE: ${receipt.codes.deposit_code}
//:2)BLOCKING CODE: ${receipt.codes.blocking_code}
//:3)REFERENCE CODE: ${receipt.codes.reference_code}
//:4)FEDS CODE: ${receipt.codes.feds_code}
//:5)SECURITY CODE: ${receipt.codes.security_code}
//:6)WITHDRAWAL FEDS CODE: ${receipt.codes.withdrawal_feds_code}
//:7)INTERNATIONAL DEPOSIT CODE: ${receipt.codes.intl_deposit_code}
//:8)DEPOSIT TRANSACTION NO S: ${receipt.codes.deposit_tx}
//:9)ZURICH HEAD OFFICE: ART/Y-LAW-21-ZURICH GOVERNMENT,TCL${Math.floor(Math.random()*90000)+10000}
//:10)ONE-TIME SATELLITE SWIFT DOWNLOAD ACCESS WITHDRAW CODE:
${receipt.codes.sat_code}
${'—'.repeat(80)}
***TITLE CONFIRMATION ANSWERBACK:
***(XMT DELIVERY REPORT)
***ANSWERBACK PAGE CONFIRMATION SYSTEM
ACKNOWLEDGEMENT RECEIPT ${receipt.answerback.receipt_swift}
STATUS : ${receipt.answerback.status}
SENDER : ${receipt.answerback.sender}
CATEGORY CODE : ${receipt.answerback.category_code}
SEQUENCE/NUMBER : ${receipt.answerback.sequence_number}
${'—'.repeat(30)}END OF CODE TRANSMISSION${'—'.repeat(30)}

1. IDENTITY CODE/FINAL CODE                             : ${receipt.codes.identity_code}
2. SORT CODE                                            : ${receipt.codes.sort_code}
3. RELEASE CODE                                         : ${receipt.codes.release_code}   [√]
4. ACCESS CODE                                          : ${receipt.codes.access_code} [√]
5. BLOCKING CODE                                        : ********************************
6. WRS SERVER                                           : UBS:S 0200235 OR S 020005635
7. BONDING KEY                                          : ${receipt.codes.bonding_key}
9. ACTIVATION CODE                                      : ${receipt.codes.activation_code} [√]
TRANSMISSION SUCCESSFUL
OK
DISCONNECTING. . .
[REPORT END]
ACKNOWLEDGEMENT RECEIPT DATE AND TIME- ${receipt.delivery_datetime}
${receipt.hex_dump.join('\n')}
${receipt.tls.depth}
PSK IDENTITY: ${receipt.tls.psk}
SRP USERNAME: ${receipt.tls.srp}
TLS SESSION TICKET LIFETIME HINT: ${receipt.tls.ticket_lifetime}
TLS SESSION TICKET:
UPLOAD PROTOCOL . .
REPORT
158: /PURPOSE OF REMITTANCE: ${receipt.purpose}
172: /CHARGES: SHA
199: /PROTOCOL
U225:/INTERNAL LEDGER TO LEDGER
U334:/RECEIVER BANK INSTITUTION: ${receipt.receiver.bank_name.toUpperCase()}
OBTAINED VALUES

 MESSAGES REPORT!!!!!
 COMPLETED !!!!!
 TRANSACTION SUCCESS !!!!!
 WEBSITE WWW.UBS.COM EMAIL : INFO@UBS.COM
 COPYRIGHT 2023-2024 UNION BANK OF SWITZERLAND AG SWIFT FIN LEDGER TO LEDGER TRANSFER
 HOME PAGE SWISS NATIONAL BANK: HTTPS://WWW.SNB.CH/EN`}
                </pre>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Fund Movement Tracker */}
      {receipt && receipt.nostro_routing && (
        <div ref={trackerRef}>
          <Card className="bg-white border-slate-200 rounded-sm overflow-hidden">
            <CardHeader className="border-b border-slate-200 bg-slate-50 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                  FUND MOVEMENT VALIDATION TRACKER
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 text-[10px] rounded-sm border border-green-300">
                    NOSTRO ROUTING VERIFIED
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 text-[10px] rounded-sm border border-slate-300">
                    REF: {receipt.codes.ref_num}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Transfer amount: <span className="font-mono font-bold text-slate-900">{receipt.amount}</span> — Routing via Nostro correspondent account
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {/* Horizontal Tracker */}
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-8 left-0 right-0 h-0.5 bg-slate-200 z-0" />
                <div
                  className="absolute top-8 left-0 h-0.5 bg-green-500 z-10 transition-all duration-700 ease-out"
                  style={{ width: activeStage >= 0 ? `${Math.min(100, (activeStage / 4) * 100)}%` : '0%' }}
                />

                {/* Stages */}
                <div className="relative z-20 flex justify-between">
                  {receipt.nostro_routing.stages.map((stage, i) => {
                    const isActive = i <= activeStage;
                    const isCurrent = i === activeStage && trackerAnimating;
                    return (
                      <div key={i} className="flex flex-col items-center" style={{ width: '18%' }}>
                        {/* Icon Circle */}
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isActive
                              ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200'
                              : 'bg-white border-slate-300 text-slate-400'
                          } ${isCurrent ? 'scale-110 ring-4 ring-green-200' : ''}`}
                        >
                          {isActive ? <CheckCircle className="w-6 h-6" /> : stageIcons[i]}
                        </div>

                        {/* Label */}
                        <div className="mt-3 text-center">
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-green-700' : 'text-slate-400'}`}>
                            STEP {stage.step}
                          </p>
                          <p className={`text-xs font-bold mt-0.5 leading-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                            {stage.label}
                          </p>
                          {stage.swift_code && (
                            <p className={`text-[10px] font-mono mt-0.5 ${isActive ? 'text-slate-600' : 'text-slate-300'}`}>
                              {stage.swift_code}
                            </p>
                          )}
                          <p className={`text-[10px] mt-0.5 ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>
                            {stage.location}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="mt-2">
                          {isActive ? (
                            <Badge className="bg-green-100 text-green-700 text-[9px] rounded-sm border border-green-200">
                              COMPLETED
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-400 text-[9px] rounded-sm border border-slate-200">
                              PENDING
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arrow Flow Summary */}
              <div className="mt-8 p-4 bg-slate-900 rounded-sm">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {receipt.nostro_routing.stages.map((stage, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className={`text-[10px] font-mono px-2 py-1 rounded ${
                        i <= activeStage ? 'bg-green-900 text-green-400 border border-green-700' : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {stage.swift_code || stage.institution}
                      </span>
                      {i < receipt.nostro_routing.stages.length - 1 && (
                        <ArrowRight className={`w-4 h-4 ${i < activeStage ? 'text-green-500' : 'text-slate-600'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Stage Cards */}
              <div className="mt-6 space-y-3">
                {receipt.nostro_routing.stages.map((stage, i) => {
                  const isActive = i <= activeStage;
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-sm border transition-all duration-500 ${
                        isActive
                          ? 'bg-white border-green-200 shadow-sm'
                          : 'bg-slate-50 border-slate-100 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isActive ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {stage.step}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{stage.institution}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{stage.action}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{stage.details}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span className="font-mono">{stage.timestamp}</span>
                          </div>
                          {isActive && (
                            <Badge className="mt-1 bg-green-100 text-green-700 text-[9px] rounded-sm border border-green-200">
                              VERIFIED
                            </Badge>
                          )}
                        </div>
                      </div>
                      {stage.iban && (
                        <div className="mt-2 ml-11 p-2 bg-amber-50 border border-amber-200 rounded-sm">
                          <p className="text-[10px] font-mono text-amber-800">
                            NOSTRO IBAN: {stage.iban} | SWIFT: {stage.swift_code}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Bar */}
      {receipt && (
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-slate-900 font-bold text-sm">Transfer Completed Successfully — Nostro Routing Verified</p>
                  <p className="text-slate-500 text-xs font-mono">Ref: {receipt.codes.ref_num} | Nostro: CCFRFRPP / FR7630056000100010000405731</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>TX ID: <span className="font-mono text-slate-700">{receipt.codes.tx_id}</span></span>
                <span className="h-3 w-px bg-slate-200" />
                <span>{receipt.delivery_datetime}</span>
                <span className="h-3 w-px bg-slate-200" />
                <Badge className="bg-green-100 text-green-800 rounded-sm text-xs border border-green-300">DELIVERED</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LedgerTransferPage;

function buildReceiptHTML(r) {
  const nostro = r.nostro_routing || {};
  const stages = nostro.stages || [];
  const stageHTML = stages.map((s, i) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;font-weight:bold;background:${i <= 4 ? '#dcfce7' : '#f1f5f9'}">${s.step}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-weight:bold">${s.institution}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-family:monospace;font-size:8px">${s.swift_code || '-'}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-size:8px">${s.location}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-size:8px">${s.action}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-family:monospace;font-size:8px">${s.timestamp}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;color:#16a34a;font-weight:bold">VERIFIED</td>
    </tr>
  `).join('');

  return `<html><head><title>UBS - Ledger to Ledger Transfer Receipt</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;padding:20px;font-size:9px;color:#000;line-height:1.4;background:#fff}
    pre{white-space:pre-wrap;word-wrap:break-word}
    .hdr{border-bottom:2px solid #DC2626;padding-bottom:10px;margin-bottom:15px;display:flex;justify-content:space-between}
    .logo{font-size:24px;font-weight:bold;color:#DC2626}
    .stamp{border:2px solid #DC2626;padding:8px 15px;text-align:center;color:#DC2626;margin-top:15px;display:inline-block}
    .footer{margin-top:15px;border-top:1px solid #ccc;padding-top:10px;font-size:7px;color:#666}
    table{width:100%;border-collapse:collapse;font-size:8px;margin:10px 0}
    th{background:#1e293b;color:white;padding:6px 8px;text-align:left;border:1px solid #334155}
    .nostro-box{background:#fffbeb;border:1px solid #fbbf24;padding:8px;margin:10px 0;font-size:8px}
    @media print{body{padding:10px;font-size:8px}}
  </style></head><body>
    <div class="hdr">
      <div><div class="logo">UBS</div><div>Union Bank of Switzerland AG</div><div style="color:#666">SWIFT FIN LEDGER TO LEDGER TRANSFER — NOSTRO ROUTING</div></div>
      <div style="text-align:right"><div>Date: ${r.delivery_datetime}</div><div>Ref: ${r.codes.ref_num}</div></div>
    </div>

    <div class="nostro-box">
      <strong>NOSTRO CORRESPONDENT ACCOUNT (EUR)</strong><br>
      Institution: HSBC CONTINENTAL EUROPE SA | SWIFT: ${nostro.nostro_swift || 'CCFRFRPP'} | IBAN: ${nostro.nostro_iban || 'FR7630056000100010000405731'}<br>
      Remittance: ${nostro.remittance_info || ''}
    </div>

    <div style="margin:10px 0;padding:8px;background:#f0fdf4;border:1px solid #86efac">
      <strong>FUND MOVEMENT VALIDATION TRACKER</strong>
      <table>
        <tr><th>Step</th><th>Institution</th><th>SWIFT</th><th>Location</th><th>Action</th><th>Timestamp</th><th>Status</th></tr>
        ${stageHTML}
      </table>
      <div style="text-align:center;font-family:monospace;font-size:8px;margin-top:5px">
        UBSWCHZHXXX → ECBFDEFFXXX → CCFRFRPP → HSBCHKHHHKH → BENEFICIARY CREDITED
      </div>
    </div>

    <pre>CONNECTED (${r.connection.ip})
${'-'.repeat(80)}
${r.connection.cert_chain}
Certificate Chain
0 ${r.connection.cert_subject}
  ${r.connection.cert_issuer}
Access to GLOBAL ACK NETWORK
Initialising......
CONNECTION ESTABLISHED***
/CONNECTED GLOBAL SECURE SYSTEMS 4.2816.4
VERIFY RETURN CODE: 1 (OK) [√]
*LEDGER TO LEDGER CASH DELIVERY
/DELIVERY DATE / TIME: ${r.delivery_datetime}
/MESSAGE TRANSACTION CODE: ${r.codes.msg_code} [√]
/MESSAGE TRANSACTION ID: ${r.codes.tx_id} [√]
/REFERENCE NUMBER: ${r.codes.ref_num}
/FROM UNION BANK OF SWITZERLAND AG TO: ${r.receiver.bank_name.toUpperCase()}
/ORIGIN CUSTOMER: ${r.sender.name}, ${r.sender.company}
${'—'.repeat(25)}LEDGER TO LEDGER TRANSFER SWIFT MESSAGE${'—'.repeat(20)}
456 : /BANK SENDER SWIFT: ${r.sender.swift}
295 : /BANK SENDER GLOBAL IP: ${r.sender.ip}
095 : /BANK SENDER NETWORK DELIVERY STATUS: ${r.sender.network_status}
104 : /BANK SOURCE TRANSACTION ID: ${r.codes.tx_id}
758 : /UBS IDENTITY CODE: ${r.codes.identity_code}
564 : /BANK UNIQUE TRANSACTION REFERENCE: ${r.codes.ref_num}
937 : /CLIENT SENDER ACCOUNT NAME: ${r.sender.company}
855 : /COMPANY REPRESENTED BY: ${r.sender.name}
037 : /CLIENT BANK ADDRESS: ${r.sender.bank_address}
396 : /CLIENT SWIFT CODE OR BIC: ${r.sender.swift}
105 : /CLIENT ACCOUNT NUMBER: ${r.sender.account}
106 : /CLIENT IBAN: ${r.sender.iban}
107 : /SEND AMOUNT: ${r.amount}

${'*'.repeat(20)}NOSTRO CORRESPONDENT ROUTING${'*'.repeat(20)}
NOSTRO BANK       : HSBC CONTINENTAL EUROPE SA
NOSTRO SWIFT      : ${nostro.nostro_swift || 'CCFRFRPP'}
NOSTRO IBAN       : ${nostro.nostro_iban || 'FR7630056000100010000405731'}
REMITTANCE INFO   : ${nostro.remittance_info || ''}
ROUTING PATH      : UBSWCHZHXXX → ECBFDEFFXXX → CCFRFRPP → HSBCHKHHHKH

${'*'.repeat(40)}RECEIVER INFORMATION${'*'.repeat(35)}
103 : /RECEIVER/BANK NAME: ${r.receiver.bank_name.toUpperCase()}
927 : /RECEIVER/BANK ADDRESS: ${r.receiver.bank_address}
183 : /RECEIVER/SWIFT CODE: ${r.receiver.swift}
364 : /RECEIVER/ACCOUNT NUMBER: ${r.receiver.account}
365 : /RECEIVER/IBAN NUMBER: ${r.receiver.iban}
198 : /RECEIVER/ACCOUNT NAME: ${r.receiver.name}
${'*'.repeat(20)}TRANSMISSION LEDGER TO LEDGER CASH TRANSFER SWIFT${'*'.repeat(18)}
//:TRANSMITTING BANK: UNION BANK OF SWITZERLAND AG
//:1)DEPOSIT CODE: ${r.codes.deposit_code}
//:2)BLOCKING CODE: ${r.codes.blocking_code}
//:3)REFERENCE CODE: ${r.codes.reference_code}
//:4)FEDS CODE: ${r.codes.feds_code}
//:5)SECURITY CODE: ${r.codes.security_code}
//:6)WITHDRAWAL FEDS CODE: ${r.codes.withdrawal_feds_code}
//:7)INTERNATIONAL DEPOSIT CODE: ${r.codes.intl_deposit_code}
//:8)DEPOSIT TRANSACTION NO: ${r.codes.deposit_tx}
//:10)SAT SWIFT ACCESS CODE: ${r.codes.sat_code}
${'—'.repeat(80)}
ACKNOWLEDGEMENT RECEIPT ${r.answerback.receipt_swift}
STATUS : ${r.answerback.status}
SENDER : ${r.answerback.sender}
SEQUENCE/NUMBER : ${r.answerback.sequence_number}
${'—'.repeat(30)}END OF CODE TRANSMISSION${'—'.repeat(30)}
1. IDENTITY CODE  : ${r.codes.identity_code}
2. SORT CODE      : ${r.codes.sort_code}
3. RELEASE CODE   : ${r.codes.release_code} [√]
4. ACCESS CODE    : ${r.codes.access_code} [√]
5. BLOCKING CODE  : ********************************
7. BONDING KEY    : ${r.codes.bonding_key}
9. ACTIVATION CODE: ${r.codes.activation_code} [√]
TRANSMISSION SUCCESSFUL
[REPORT END]
${r.hex_dump.join('\\n')}
TRANSACTION SUCCESS !!!!!
COPYRIGHT 2023-2024 UNION BANK OF SWITZERLAND AG SWIFT FIN LEDGER TO LEDGER TRANSFER</pre>
    <div style="text-align:center"><div class="stamp"><div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div><div style="font-size:18px;font-weight:bold">UBS</div><div style="font-size:7px">L2L TRANSFER — NOSTRO ROUTING CONFIRMED</div></div></div>
    <div class="footer">LEDGER TO LEDGER TRANSFER | NOSTRO: CCFRFRPP / ${nostro.nostro_iban || 'FR7630056000100010000405731'} | REF: ${r.codes.ref_num} | ${new Date().toISOString()}<br>THIS IS A COMPUTER-GENERATED DOCUMENT.</div>
  </body></html>`;
}
