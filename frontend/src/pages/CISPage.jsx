import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  FileText,
  Printer,
  Building,
  User,
  Shield,
  Globe,
  MapPin,
  Hash,
  Phone,
  Mail,
  CheckCircle,
  RefreshCw,
  Landmark,
  Briefcase,
} from 'lucide-react';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
const fmtCur = (a, c) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(a);

const CISPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/cis');
        setData(res.data);
      } catch { toast.error('Failed to load CIS'); }
      finally { setLoading(false); }
    })();
  }, []);

  const printCIS = () => {
    if (!data) return;
    const d = data;
    const html = buildPrintHTML(d);
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin text-swiss-text-muted" /></div>;
  if (!data) return null;

  const { bank, client, relationship: rel, signatories, accounts, services } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Customer Information Sheet
          </h1>
          <p className="text-swiss-text-secondary mt-1">Combined UBS & BB BIOTECH AG — CIS Document</p>
        </div>
        <Button onClick={printCIS} className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm">
          <Printer className="w-4 h-4 mr-2" />Print CIS
        </Button>
      </div>

      {/* Dual Header: UBS + BB BIOTECH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UBS Bank Card */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm overflow-hidden">
          <div className="h-1.5 bg-swiss-red" />
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Banking Institution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-heading font-black text-2xl text-swiss-red">UBS</p>
              <p className="text-slate-900 font-bold text-sm">{bank.name}</p>
            </div>
            <Row icon={Globe} label="SWIFT / BIC" value={`${bank.swift} / ${bank.bic}`} />
            <Row icon={MapPin} label="Address" value={bank.address} />
            <Row icon={Phone} label="Telephone" value={bank.phone} />
            <Row icon={Globe} label="Website" value={bank.website} />
            <Row icon={Shield} label="Regulator" value={bank.regulator} />
            <Row icon={FileText} label="License" value={bank.bank_license} />
          </CardContent>
        </Card>

        {/* BB BIOTECH Card */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm overflow-hidden">
          <div className="h-1.5 bg-slate-900" />
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Client Entity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-heading font-black text-2xl text-slate-900">BB BIOTECH</p>
              <p className="text-swiss-text-secondary text-sm">{client.legal_form}</p>
            </div>
            <Row icon={Hash} label="Company ID" value={client.id_number} />
            <Row icon={MapPin} label="Address" value={client.address} />
            <Row icon={FileText} label="Incorporated" value={client.date_of_incorporation} />
            <Row icon={Briefcase} label="Purpose" value={client.purpose} />
            <Row icon={Globe} label="Listed Exchange" value={client.listed_exchange} />
            <Row icon={Hash} label="LEI" value={client.lei} />
          </CardContent>
        </Card>
      </div>

      {/* Relationship & Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Relationship Manager */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Relationship Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-swiss-bg-subtle p-4 rounded-sm">
              <p className="text-slate-900 font-bold text-sm">{rel.relationship_manager}</p>
              <p className="text-swiss-text-secondary text-xs">{rel.rm_title}</p>
              <p className="text-swiss-text-muted text-xs">{rel.rm_department}</p>
            </div>
            <Row icon={Hash} label="Officer ID" value={rel.rm_id} />
            <Row icon={Phone} label="Direct Line" value={rel.rm_phone} />
            <Row icon={Mail} label="Email" value={rel.rm_email} />
            <Row icon={FileText} label="Account Opened" value={rel.account_opened} />
            <Row icon={Briefcase} label="Client Segment" value={rel.client_segment} />
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Compliance & KYC Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="Risk Rating" value={rel.risk_rating} status="good" />
            <StatusRow label="KYC Status" value={rel.kyc_status} status="good" />
            <StatusRow label="AML Status" value={rel.aml_status} status="good" />
            <StatusRow label="FATCA Status" value={rel.fatca_status} status="good" />
            <StatusRow label="CRS Status" value={rel.crs_status} status="good" />
            <StatusRow label="PEP Status" value={rel.pep_status} status="good" />
            <div className="h-px bg-slate-100" />
            <Row icon={FileText} label="Last KYC Review" value={rel.kyc_last_review} />
            <Row icon={FileText} label="Next KYC Review" value={rel.kyc_next_review} />
          </CardContent>
        </Card>
      </div>

      {/* Accounts */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
            Registered Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-swiss-bg-subtle border-b border-slate-200">
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Currency</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Account Number</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">IBAN</th>
                <th className="text-right py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.currency} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4"><Badge className="bg-swiss-red/10 text-swiss-red rounded-sm text-xs">{a.currency}</Badge></td>
                  <td className="py-3 px-4 font-mono text-sm text-swiss-text-secondary">{a.account_number}</td>
                  <td className="py-3 px-4 font-mono text-xs text-swiss-text-muted">{a.iban}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-slate-900 font-bold">{fmtCur(a.balance, a.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Signatories */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
            Authorised Signatories
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-swiss-bg-subtle border-b border-slate-200">
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Title</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Passport / ID</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Nationality</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Authority</th>
              </tr>
            </thead>
            <tbody>
              {signatories.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-900 text-sm font-medium">{s.name}</td>
                  <td className="py-3 px-4 text-xs text-swiss-text-secondary">{s.title}</td>
                  <td className="py-3 px-4 font-mono text-sm text-swiss-text-secondary">{s.passport_number || '—'}</td>
                  <td className="py-3 px-4 text-sm text-swiss-text-secondary">{s.nationality}</td>
                  <td className="py-3 px-4 text-xs text-swiss-text-secondary">{s.signing_authority || 'Full authority'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Passport Documents */}
      {signatories.some(s => s.passport_image) && (
        <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              Passport Document(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {signatories.filter(s => s.passport_image).map((s, i) => (
                <div key={i} className="border border-slate-200 rounded-sm overflow-hidden">
                  <div className="bg-swiss-bg-subtle px-4 py-2 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-swiss-red" />
                      <span className="text-sm text-slate-900 font-bold">{s.name}</span>
                      <Badge className="bg-swiss-red/10 text-swiss-red rounded-sm text-[10px]">Passport N° {s.passport_number}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-swiss-text-muted">
                      <span>Issued: {s.date_of_issue}</span>
                      <span>Expires: {s.date_of_expiry}</span>
                    </div>
                  </div>
                  <div className="p-4 flex justify-center bg-slate-50">
                    <img
                      src={s.passport_image}
                      alt={`Passport - ${s.name}`}
                      className="max-w-full max-h-[500px] rounded-sm border border-slate-200 shadow-sm"
                    />
                  </div>
                  {s.mrz && (
                    <div className="bg-slate-900 px-4 py-2">
                      <p className="font-mono text-[10px] text-green-400 tracking-wider">{s.mrz}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
            Banking Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {services.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <CheckCircle className="w-4 h-4 text-swiss-status-success flex-shrink-0" />
                <span className="text-sm text-slate-900">{s}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-xs text-swiss-text-muted">
            <div className="flex items-center gap-4">
              <span className="font-heading font-black text-swiss-red text-sm">UBS</span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="font-bold text-slate-900">BB BIOTECH AG</span>
              <span className="h-3 w-px bg-slate-200" />
              <span>CIS Reference: {data.reference}</span>
            </div>
            <span>Generated: {fmtDate(data.date)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-swiss-text-muted mt-0.5 flex-shrink-0" strokeWidth={1.5} />
    <div>
      <p className="text-[10px] text-swiss-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-slate-900 text-sm">{value}</p>
    </div>
  </div>
);

const StatusRow = ({ label, value, status }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-swiss-text-secondary text-sm">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-slate-900 text-sm font-medium">{value}</span>
      <CheckCircle className={`w-4 h-4 ${status === 'good' ? 'text-swiss-status-success' : 'text-swiss-status-warning'}`} />
    </div>
  </div>
);

export default CISPage;

function buildPrintHTML(d) {
  const { bank, client, relationship: rel, signatories, accounts, services } = d;
  return `<html><head><title>CIS - UBS & BB BIOTECH AG</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;padding:35px;font-size:10px;color:#000;line-height:1.5}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #DC2626;padding-bottom:15px;margin-bottom:20px}
    .logo{font-size:28px;font-weight:bold;color:#DC2626}
    .title{text-align:center;font-size:16px;font-weight:bold;letter-spacing:3px;margin:15px 0;text-transform:uppercase}
    .sub{text-align:center;font-size:9px;color:#666;letter-spacing:1px;margin-bottom:15px}
    .dual{display:flex;gap:20px;margin:15px 0}
    .dual>div{flex:1;border:1px solid #ddd;padding:12px}
    .section{margin:18px 0}
    .section-title{font-size:10px;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #333;padding-bottom:4px;margin-bottom:10px;color:#666}
    .row{display:flex;margin:4px 0}
    .row .lbl{width:170px;text-transform:uppercase;color:#666;font-size:9px;letter-spacing:1px}
    .row .val{flex:1;font-size:10px}
    .row .val.bold{font-weight:bold}
    table{width:100%;border-collapse:collapse;margin:10px 0}
    th{background:#f5f5f5;padding:6px 10px;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:1px;border:1px solid #ccc}
    td{padding:6px 10px;border:1px solid #ddd;font-size:10px}
    .status{display:inline-block;background:#dcfce7;color:#166534;padding:1px 8px;border-radius:2px;font-size:8px;margin-left:5px}
    .services{column-count:2;column-gap:20px;margin:10px 0}
    .svc{margin:3px 0;font-size:10px}
    .svc:before{content:"\\2713 ";color:#16a34a}
    .sig{border-top:2px solid #000;margin-top:50px;padding-top:8px;max-width:250px}
    .stamp{border:2px solid #DC2626;padding:10px 20px;display:inline-block;text-align:center;color:#DC2626;margin-top:20px}
    .footer{margin-top:25px;border-top:1px solid #ccc;padding-top:12px;font-size:8px;color:#666}
    .barcode{text-align:center;font-size:24px;letter-spacing:2px;margin-top:10px}
    @media print{body{padding:20px}}
  </style></head><body>
    <div class="hdr">
      <div><div class="logo">UBS</div><div style="font-size:10px">Union Bank of Switzerland AG</div><div style="font-size:9px;color:#666">${bank.address}</div><div style="font-size:9px;color:#666">SWIFT: ${bank.swift}</div></div>
      <div style="text-align:right"><div style="font-size:11px;font-weight:bold">BB BIOTECH AG</div><div style="font-size:9px;color:#666">${client.id_number}</div><div style="font-size:9px;color:#666">${client.address}</div><div style="font-size:9px;margin-top:5px">Date: ${fmtDate(d.date)}</div><div style="font-size:9px">Ref: ${d.reference}</div></div>
    </div>
    <div class="title">Customer Information Sheet (CIS)</div>
    <div class="sub">COMBINED BANK & CLIENT RECORD — CONFIDENTIAL</div>

    <div class="dual">
      <div>
        <div class="section-title">Banking Institution</div>
        <div class="row"><span class="lbl">Bank Name:</span><span class="val bold">${bank.name}</span></div>
        <div class="row"><span class="lbl">SWIFT / BIC:</span><span class="val">${bank.swift} / ${bank.bic}</span></div>
        <div class="row"><span class="lbl">Address:</span><span class="val">${bank.address}</span></div>
        <div class="row"><span class="lbl">Telephone:</span><span class="val">${bank.phone}</span></div>
        <div class="row"><span class="lbl">Website:</span><span class="val">${bank.website}</span></div>
        <div class="row"><span class="lbl">Regulator:</span><span class="val">${bank.regulator}</span></div>
        <div class="row"><span class="lbl">License:</span><span class="val">${bank.bank_license}</span></div>
      </div>
      <div>
        <div class="section-title">Client Entity</div>
        <div class="row"><span class="lbl">Company Name:</span><span class="val bold">${client.name}</span></div>
        <div class="row"><span class="lbl">Company ID:</span><span class="val">${client.id_number}</span></div>
        <div class="row"><span class="lbl">Legal Form:</span><span class="val">${client.legal_form}</span></div>
        <div class="row"><span class="lbl">Address:</span><span class="val">${client.address}</span></div>
        <div class="row"><span class="lbl">Incorporated:</span><span class="val">${client.date_of_incorporation}</span></div>
        <div class="row"><span class="lbl">Purpose:</span><span class="val">${client.purpose}</span></div>
        <div class="row"><span class="lbl">Exchange:</span><span class="val">${client.listed_exchange}</span></div>
        <div class="row"><span class="lbl">LEI:</span><span class="val">${client.lei}</span></div>
      </div>
    </div>

    <div class="dual">
      <div>
        <div class="section-title">Relationship Manager</div>
        <div class="row"><span class="lbl">Name:</span><span class="val bold">${rel.relationship_manager}</span></div>
        <div class="row"><span class="lbl">Title:</span><span class="val">${rel.rm_title}</span></div>
        <div class="row"><span class="lbl">Department:</span><span class="val">${rel.rm_department}</span></div>
        <div class="row"><span class="lbl">Officer ID:</span><span class="val">${rel.rm_id}</span></div>
        <div class="row"><span class="lbl">Telephone:</span><span class="val">${rel.rm_phone}</span></div>
        <div class="row"><span class="lbl">Email:</span><span class="val">${rel.rm_email}</span></div>
        <div class="row"><span class="lbl">Account Opened:</span><span class="val">${rel.account_opened}</span></div>
      </div>
      <div>
        <div class="section-title">Compliance & KYC</div>
        <div class="row"><span class="lbl">Risk Rating:</span><span class="val">${rel.risk_rating}<span class="status">OK</span></span></div>
        <div class="row"><span class="lbl">KYC Status:</span><span class="val">${rel.kyc_status}<span class="status">OK</span></span></div>
        <div class="row"><span class="lbl">AML Status:</span><span class="val">${rel.aml_status}<span class="status">OK</span></span></div>
        <div class="row"><span class="lbl">FATCA:</span><span class="val">${rel.fatca_status}<span class="status">OK</span></span></div>
        <div class="row"><span class="lbl">CRS:</span><span class="val">${rel.crs_status}<span class="status">OK</span></span></div>
        <div class="row"><span class="lbl">PEP:</span><span class="val">${rel.pep_status}<span class="status">OK</span></span></div>
        <div class="row"><span class="lbl">Last Review:</span><span class="val">${rel.kyc_last_review}</span></div>
        <div class="row"><span class="lbl">Next Review:</span><span class="val">${rel.kyc_next_review}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Registered Accounts</div>
      <table><thead><tr><th>Currency</th><th>Account Number</th><th>IBAN</th><th style="text-align:right">Balance</th></tr></thead><tbody>
        ${accounts.map(a => `<tr><td style="font-weight:bold">${a.currency}</td><td style="font-family:monospace">${a.account_number}</td><td style="font-family:monospace;font-size:9px">${a.iban}</td><td style="text-align:right;font-weight:bold;font-family:monospace">${fmtCur(a.balance, a.currency)}</td></tr>`).join('')}
      </tbody></table>
    </div>

    <div class="section">
      <div class="section-title">Authorised Signatories</div>
      <table><thead><tr><th>Name</th><th>Title</th><th>Passport/ID</th><th>Nationality</th><th>Authority</th></tr></thead><tbody>
        ${signatories.map(s => `<tr><td style="font-weight:bold">${s.name}</td><td>${s.title}</td><td style="font-family:monospace">${s.passport_number || '—'}</td><td>${s.nationality}</td><td>${s.signing_authority || 'Full authority'}</td></tr>`).join('')}
      </tbody></table>
    </div>

    ${signatories.filter(s => s.passport_image).map(s => `
    <div class="section" style="page-break-before:always">
      <div class="section-title">Passport Document — ${s.name}</div>
      <div style="border:1px solid #ddd;padding:10px;margin:10px 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #eee">
          <div><strong>${s.name}</strong> — Passport N° ${s.passport_number}</div>
          <div style="font-size:9px;color:#666">Issued: ${s.date_of_issue} | Expires: ${s.date_of_expiry}</div>
        </div>
        <div style="text-align:center"><img src="${s.passport_image}" style="max-width:100%;max-height:500px;border:1px solid #ddd" alt="Passport"></div>
        ${s.mrz ? `<div style="background:#000;color:#0f0;padding:6px 10px;margin-top:10px;font-family:monospace;font-size:9px;letter-spacing:1px">${s.mrz}</div>` : ''}
      </div>
    </div>
    `).join('')}

    <div class="section">
      <div class="section-title">Banking Services</div>
      <div class="services">${services.map(s => `<div class="svc">${s}</div>`).join('')}</div>
    </div>

    <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        <div style="font-size:9px;color:#666">For and on behalf of Union Bank of Switzerland AG:</div>
        <div class="sig">
          <div style="font-weight:bold">${rel.relationship_manager}</div>
          <div style="font-size:9px;color:#666">${rel.rm_title}</div>
          <div style="font-size:9px;font-family:monospace">ID: ${rel.rm_id}</div>
        </div>
      </div>
      <div class="stamp">
        <div style="font-size:7px">UNION BANK OF SWITZERLAND AG</div>
        <div style="font-size:20px;font-weight:bold">UBS</div>
        <div style="font-size:7px">CUSTOMER INFORMATION SHEET</div>
      </div>
    </div>
    <div class="footer">
      CIS REFERENCE: ${d.reference} | GENERATED: ${new Date().toISOString()}<br>
      BANK: ${bank.name} | CLIENT: ${client.name} | ID: ${client.id_number}<br><br>
      THIS DOCUMENT IS CONFIDENTIAL AND INTENDED FOR AUTHORISED PARTIES ONLY.
    </div>
    <div class="barcode">|||| |||| | ||| |||| ||||| || ||| |||| ||||</div>
  </body></html>`;
}
