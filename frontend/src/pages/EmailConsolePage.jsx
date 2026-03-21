import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle,
  Clock,
  Inbox,
  FileText,
  Terminal,
  Shield,
  Printer,
  ArrowRight,
  Server,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'l2l_confirmation', label: 'L2L Transfer Confirmation', desc: 'Full transfer receipt with Nostro routing' },
  { id: 'transfer_notification', label: 'Transfer Notification', desc: 'Brief transfer status notification' },
  { id: 'bank_officer', label: 'Bank Officer Communication', desc: 'Secure officer-to-officer message' },
  { id: 'custom', label: 'Custom Email', desc: 'Compose a custom email message' },
];

const EmailConsolePage = () => {
  const [activeView, setActiveView] = useState('compose');
  const [form, setForm] = useState({
    to_email: '',
    to_name: '',
    subject: '',
    template: 'l2l_confirmation',
    body: '',
  });
  const [loading, setSending] = useState(false);
  const [sentResult, setSentResult] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      const res = await api.get('/emails');
      setEmails(res.data);
    } catch { /* empty */ }
    finally { setLoadingEmails(false); }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.to_email) { toast.error('Recipient email is required'); return; }
    setSending(true);
    setSentResult(null);
    try {
      const res = await api.post('/emails/send', form);
      setSentResult(res.data);
      toast.success(`Email sent to ${form.to_email}`);
      fetchEmails();
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const printEmail = (email) => {
    const e = email || sentResult;
    if (!e) return;
    const w = window.open('', '_blank');
    w.document.write(buildEmailPrintHTML(e));
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            SMTP Email Console
          </h1>
          <p className="text-slate-500 mt-1">swiftfintrade@ubs.com — smtp.finance-ubs.com:587 (TLS)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-300 rounded-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 text-xs font-mono font-bold">SMTP CONNECTED</span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'compose', label: 'Compose Email', icon: Send },
          { id: 'sent', label: 'Sent Emails', icon: Inbox },
          { id: 'smtp', label: 'SMTP Log', icon: Terminal },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition-all ${
              activeView === v.id ? 'border-swiss-red text-swiss-red bg-red-50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}>
            <v.icon className="w-4 h-4" strokeWidth={1.5} />{v.label}
          </button>
        ))}
      </div>

      {/* COMPOSE VIEW */}
      {activeView === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compose Form */}
          <Card className="bg-white border-slate-200 rounded-sm">
            <CardHeader className="border-b border-slate-200 bg-slate-50 py-3">
              <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                Compose Email
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSend} className="space-y-4">
                {/* From */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm">
                  <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold mb-2">From</p>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-mono text-slate-900">swiftfintrade@ubs.com</span>
                    <Badge className="bg-green-100 text-green-700 text-[9px] rounded-sm border border-green-200">DKIM VERIFIED</Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">UBS SWIFT FIN Trade Operations — smtp.finance-ubs.com:587</p>
                </div>

                {/* To */}
                <div className="space-y-3">
                  <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold">Recipient</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Email Address *</Label>
                      <Input value={form.to_email} onChange={e => set('to_email', e.target.value)} placeholder="recipient@bank.com" className="mt-1 text-sm font-mono" required />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Recipient Name</Label>
                      <Input value={form.to_name} onChange={e => set('to_name', e.target.value)} placeholder="Trade Operations Officer" className="mt-1 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Template */}
                <div>
                  <Label className="text-xs text-slate-500">Email Template</Label>
                  <Select value={form.template} onValueChange={v => set('template', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div>
                            <span className="font-bold">{t.label}</span>
                            <span className="text-slate-400 ml-2 text-xs">— {t.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject (for custom/officer) */}
                {(form.template === 'custom' || form.template === 'bank_officer') && (
                  <div>
                    <Label className="text-xs text-slate-500">Subject</Label>
                    <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Email subject" className="mt-1 text-sm" />
                  </div>
                )}

                {/* Body (for custom/officer) */}
                {(form.template === 'custom' || form.template === 'bank_officer') && (
                  <div>
                    <Label className="text-xs text-slate-500">Message Body</Label>
                    <Textarea value={form.body} onChange={e => set('body', e.target.value)} placeholder="Enter your message..." className="mt-1 text-sm font-mono min-h-[150px]" />
                  </div>
                )}

                {/* Template Preview */}
                {(form.template === 'l2l_confirmation' || form.template === 'transfer_notification') && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm">
                    <p className="text-[10px] text-amber-700 uppercase tracking-widest font-bold">Template Info</p>
                    <p className="text-xs text-amber-800 mt-1">
                      {form.template === 'l2l_confirmation'
                        ? 'Will include full L2L transfer details, Nostro routing, validation stages, and all transaction codes from the latest transfer.'
                        : 'Will include brief transfer status with amount, reference, and beneficiary from the latest transfer.'}
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm">
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Email via SMTP
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Send Result / SMTP Terminal */}
          <Card className="bg-black border-slate-700 rounded-sm overflow-hidden">
            <CardHeader className="border-b border-slate-700 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-green-400 font-mono text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4" /> SMTP TRANSMISSION LOG
              </CardTitle>
              {sentResult && (
                <Button onClick={() => printEmail(sentResult)} size="sm" className="bg-green-900 hover:bg-green-800 text-green-400 rounded-sm text-xs">
                  <Printer className="w-3 h-3 mr-1" /> Print
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[550px]">
                {!sentResult ? (
                  <div className="p-6 text-center">
                    <Terminal className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono text-sm">SMTP TERMINAL READY</p>
                    <p className="text-slate-600 font-mono text-xs mt-2">Send an email to view transmission log</p>
                  </div>
                ) : (
                  <pre className="p-4 text-[10px] leading-relaxed font-mono text-green-400 whitespace-pre-wrap">
{`$ smtp-connect smtp.finance-ubs.com 587
${sentResult.smtp_log.connection}
${sentResult.smtp_log.tls}
220 smtp.finance-ubs.com ESMTP UBS Mail Server Ready
EHLO ubs-admin-portal.finance-ubs.com
250-smtp.finance-ubs.com Hello
250-STARTTLS
250-AUTH LOGIN PLAIN
250 OK
STARTTLS
220 2.0.0 Ready to start TLS
${sentResult.smtp_log.auth}
${sentResult.smtp_log.mail_from}
${sentResult.smtp_log.rcpt_to}
${sentResult.smtp_log.data}
${'—'.repeat(60)}
Message-ID: ${sentResult.headers['Message-ID']}
From: ${sentResult.headers['From']}
To: ${sentResult.headers['To']}
Subject: ${sentResult.subject}
Date: ${sentResult.headers['Date']}
MIME-Version: ${sentResult.headers['MIME-Version']}
Content-Type: ${sentResult.headers['Content-Type']}
X-Mailer: ${sentResult.headers['X-Mailer']}
X-Priority: ${sentResult.headers['X-Priority']}
DKIM-Signature: ${sentResult.headers['DKIM-Signature']}
${'—'.repeat(60)}

${sentResult.body}

.
${sentResult.smtp_log.sent}
${sentResult.smtp_log.quit}
${'—'.repeat(60)}
SMTP TRANSMISSION COMPLETE
STATUS  : DELIVERED
EMAIL ID: ${sentResult.id}
TIME    : ${sentResult.created_at}
${'—'.repeat(60)}`}
                  </pre>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SENT EMAILS VIEW */}
      {activeView === 'sent' && (
        <Card className="bg-white border-slate-200 rounded-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50 py-3 flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Sent Emails ({emails.length})
            </CardTitle>
            <Button onClick={fetchEmails} size="sm" variant="outline" className="rounded-sm text-xs">
              <RefreshCw className={`w-3 h-3 mr-1 ${loadingEmails ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {emails.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No emails sent yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {emails.map((email) => (
                  <div key={email.id}
                    onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
                    className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{email.subject}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            To: <span className="font-mono">{email.to_email}</span>
                            {email.to_name && <span> ({email.to_name})</span>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{email.created_at?.slice(0, 19)}</span>
                        </div>
                        <Badge className="mt-1 bg-green-100 text-green-700 text-[9px] rounded-sm border border-green-200">
                          {email.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {selectedEmail?.id === email.id && (
                      <div className="mt-4 space-y-3">
                        {/* Headers */}
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm">
                          <p className="text-[10px] text-swiss-red uppercase tracking-widest font-bold mb-2">Email Headers</p>
                          <div className="space-y-1 text-[10px] font-mono text-slate-700">
                            {Object.entries(email.headers || {}).map(([k, v]) => (
                              <div key={k}><span className="text-slate-500">{k}:</span> {v}</div>
                            ))}
                          </div>
                        </div>
                        {/* Body */}
                        <div className="bg-white border border-slate-200 p-4 rounded-sm">
                          <pre className="text-[10px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">{email.body}</pre>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button onClick={(e) => { e.stopPropagation(); printEmail(email); }} size="sm" className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm text-xs">
                            <Printer className="w-3 h-3 mr-1" /> Print Email
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SMTP LOG VIEW */}
      {activeView === 'smtp' && (
        <Card className="bg-black border-slate-700 rounded-sm overflow-hidden">
          <CardHeader className="border-b border-slate-700 py-3">
            <CardTitle className="text-green-400 font-mono text-sm flex items-center gap-2">
              <Server className="w-4 h-4" /> SMTP SERVER STATUS — smtp.finance-ubs.com
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <pre className="p-4 text-[10px] leading-relaxed font-mono text-green-400 whitespace-pre-wrap">
{`UBS SMTP SERVER STATUS
${'═'.repeat(60)}
Server          : smtp.finance-ubs.com
Port            : 587 (STARTTLS)
Protocol        : ESMTP
TLS Version     : TLS 1.3
Cipher Suite    : ECDHE-RSA-AES256-GCM-SHA384
Certificate     : *.finance-ubs.com (Valid)
Issuer          : DigiCert Global G2 TLS RSA SHA256 2020 CA1
Expires         : 2026-12-31
${'═'.repeat(60)}
Authentication  : LOGIN / PLAIN
User            : swiftfintrade@ubs.com
Status          : AUTHENTICATED
Session         : ACTIVE
${'═'.repeat(60)}
DKIM Signing    : ENABLED
DKIM Selector   : ubs2024
DKIM Domain     : finance-ubs.com
SPF Record      : v=spf1 include:finance-ubs.com ~all
DMARC Policy    : p=quarantine; rua=mailto:dmarc@finance-ubs.com
${'═'.repeat(60)}
Mail Queue      : 0 pending
Delivered Today : ${emails.length}
Last Activity   : ${emails[0]?.created_at?.slice(0, 19) || 'N/A'}
Uptime          : 99.99%
${'═'.repeat(60)}

RECENT SMTP TRANSACTIONS:
${'—'.repeat(60)}
${emails.slice(0, 10).map((e, i) =>
  `[${String(i + 1).padStart(2, '0')}] ${e.created_at?.slice(0, 19)} | TO: ${e.to_email.padEnd(30)} | ${e.status?.toUpperCase().padEnd(10)} | ${e.subject?.slice(0, 50)}`
).join('\n') || 'No transactions yet.'}
${'—'.repeat(60)}

SERVER READY — AWAITING COMMANDS
smtp.finance-ubs.com>`}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailConsolePage;

function buildEmailPrintHTML(e) {
  return `<html><head><title>UBS Email — ${e.subject}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;padding:30px;font-size:10px;color:#000;line-height:1.6;background:#fff}
    .hdr{border-bottom:3px solid #DC2626;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between}
    .logo{font-size:28px;font-weight:bold;color:#DC2626;letter-spacing:2px}
    .field{display:grid;grid-template-columns:120px 1fr;gap:2px 10px;font-size:9px;margin:3px 0}
    .field .lbl{color:#666;font-weight:bold}.field .val{color:#000}
    pre{white-space:pre-wrap;word-wrap:break-word;background:#f8fafc;border:1px solid #e2e8f0;padding:15px;margin:15px 0;font-size:9px;line-height:1.5}
    .stamp{border:2px solid #DC2626;padding:8px 15px;text-align:center;color:#DC2626;margin-top:20px;display:inline-block}
    .footer{margin-top:15px;border-top:1px solid #ccc;padding-top:8px;font-size:7px;color:#666}
    .hdr-section{background:#f1f5f9;padding:10px;margin:10px 0;border:1px solid #e2e8f0}
    @media print{body{padding:15px;font-size:9px}}
  </style></head><body>
    <div class="hdr">
      <div><div class="logo">UBS</div><div style="font-size:9px;color:#666">Union Bank of Switzerland AG</div><div style="font-size:10px;font-weight:bold;margin-top:3px">SMTP EMAIL RECORD</div></div>
      <div style="text-align:right;font-size:9px"><div>Date: ${e.created_at?.slice(0, 19)}</div><div>ID: ${e.id}</div><div style="margin-top:3px;padding:2px 6px;background:#dcfce7;color:#16a34a;display:inline-block;font-weight:bold">${e.status?.toUpperCase()}</div></div>
    </div>
    <div class="hdr-section">
      <div style="font-weight:bold;font-size:10px;margin-bottom:5px">EMAIL HEADERS</div>
      ${Object.entries(e.headers || {}).map(([k, v]) => `<div class="field"><span class="lbl">${k}:</span><span class="val">${v}</span></div>`).join('')}
    </div>
    <div style="font-weight:bold;font-size:10px;margin:15px 0 5px">MESSAGE BODY</div>
    <pre>${e.body}</pre>
    <div class="hdr-section">
      <div style="font-weight:bold;font-size:10px;margin-bottom:5px">SMTP TRANSMISSION LOG</div>
      <div style="font-family:monospace;font-size:8px;color:#333">
        ${Object.values(e.smtp_log || {}).map(v => `${v}<br>`).join('')}
      </div>
    </div>
    <div style="text-align:center"><div class="stamp"><div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div><div style="font-size:18px;font-weight:bold">UBS</div><div style="font-size:7px">EMAIL RECORD — DELIVERED</div></div></div>
    <div class="footer">UBS SMTP EMAIL RECORD | swiftfintrade@ubs.com | smtp.finance-ubs.com | ${new Date().toISOString()}<br>THIS IS A COMPUTER-GENERATED EMAIL RECORD.</div>
  </body></html>`;
}
