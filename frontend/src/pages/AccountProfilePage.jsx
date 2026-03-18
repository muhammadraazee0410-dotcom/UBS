import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Building,
  Printer,
  Shield,
  User,
  MapPin,
  FileText,
  Hash,
  Globe,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';

const AccountProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/account-profile');
      setProfile(res.data);
    } catch {
      toast.error('Failed to load account profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const printProfile = () => {
    if (!profile) return;
    const p = profile;
    const sigRows = p.signatories.map(s => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ccc;font-weight:bold;">${s.name}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;">${s.passport_number}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;">${s.country_of_issue}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;">${s.date_of_issue}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;">${s.date_of_expiry}</td>
      </tr>
    `).join('');

    const html = `<html><head><title>Account Profile - ${p.company.name}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; padding:40px; font-size:11px; color:#000; line-height:1.5; }
      .hdr { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #DC2626; padding-bottom:20px; margin-bottom:25px; }
      .logo { font-size:32px; font-weight:bold; color:#DC2626; }
      .title { text-align:center; font-size:18px; font-weight:bold; letter-spacing:3px; margin:20px 0; text-transform:uppercase; }
      .section { margin:25px 0; }
      .section-title { font-size:11px; text-transform:uppercase; letter-spacing:3px; border-bottom:2px solid #333; padding-bottom:5px; margin-bottom:15px; color:#666; }
      .info-row { display:flex; margin:6px 0; }
      .info-label { width:220px; text-transform:uppercase; color:#666; font-size:10px; letter-spacing:1px; }
      .info-value { flex:1; font-weight:bold; font-size:11px; }
      table { width:100%; border-collapse:collapse; margin:15px 0; }
      th { background:#f5f5f5; padding:8px 12px; text-align:left; font-size:9px; text-transform:uppercase; letter-spacing:1px; border:1px solid #ccc; }
      .declaration { background:#ffffd0; border:1px solid #e6c200; padding:20px; margin:25px 0; font-style:italic; text-align:justify; }
      .sig-block { display:flex; justify-content:space-around; margin:40px 0 20px; }
      .sig-box { text-align:center; width:280px; }
      .sig-line { border-top:2px solid #000; margin-top:60px; padding-top:8px; }
      .stamp { border:2px solid #DC2626; padding:12px 25px; display:inline-block; text-align:center; color:#DC2626; margin-top:25px; }
      .footer { margin-top:30px; border-top:1px solid #ccc; padding-top:15px; font-size:8px; color:#666; }
      .barcode { text-align:center; margin:20px 0; font-size:28px; letter-spacing:2px; }
      @media print { body { padding:20px; } }
    </style></head><body>
      <div class="hdr">
        <div><div class="logo">UBS</div><div style="font-size:10px;">Union Bank of Switzerland AG</div><div style="font-size:9px;color:#666;">BAHNHOFSTRASSE 45, 8001 ZURICH, SWITZERLAND</div><div style="font-size:9px;color:#666;">SWIFT: UBSWCHZHXXX</div></div>
        <div style="text-align:right;"><div style="font-size:9px;color:#666;">CONFIDENTIAL</div><div style="font-size:9px;color:#666;">Date: ${new Date().toLocaleDateString('en-GB')}</div><div style="font-size:9px;color:#666;">Ref: UBS/ACCT/${Date.now().toString().substring(5)}</div></div>
      </div>

      <div class="title">Account Holder Profile & Authorisation Record</div>

      <div class="section">
        <div class="section-title">Company Information</div>
        <div class="info-row"><span class="info-label">Company Name:</span><span class="info-value">${p.company.name}</span></div>
        <div class="info-row"><span class="info-label">Company ID N\u00b0:</span><span class="info-value">${p.company.id_number}</span></div>
        <div class="info-row"><span class="info-label">Business Address:</span><span class="info-value">${p.company.address}, ${p.company.postal_code} ${p.company.city}, ${p.company.region}, ${p.company.country}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Authorised Signatories</div>
        ${p.signatories.map((s, i) => `
          <div style="margin-bottom:20px;padding:15px;border:1px solid #ddd;background:#fafafa;">
            <div class="info-row"><span class="info-label">Authorised By:</span><span class="info-value">${s.name}</span></div>
            <div class="info-row"><span class="info-label">Title:</span><span class="info-value">${s.title}</span></div>
            <div class="info-row"><span class="info-label">Passport N\u00b0:</span><span class="info-value">${s.passport_number}</span></div>
            <div class="info-row"><span class="info-label">Country of Issue:</span><span class="info-value">${s.country_of_issue}</span></div>
            <div class="info-row"><span class="info-label">Date of Issue:</span><span class="info-value">${s.date_of_issue}</span></div>
            <div class="info-row"><span class="info-label">Date of Expiry:</span><span class="info-value">${s.date_of_expiry}</span></div>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <div class="section-title">Signatory Verification Table</div>
        <table>
          <thead><tr><th>Authorised By</th><th>Passport No.</th><th>Place of Issue</th><th>Date of Issue</th><th>Date of Expire</th></tr></thead>
          <tbody>${sigRows}</tbody>
        </table>
      </div>

      <div class="declaration">
        <strong>SWORN DECLARATION:</strong><br><br>
        ${p.declaration}<br><br>
        For and on behalf of<br>
        <strong>${p.company.name}</strong>
      </div>

      <div class="sig-block">
        ${p.signatories.map(s => `
          <div class="sig-box">
            <div class="sig-line">
              <div style="font-weight:bold;">${s.name}</div>
              <div style="font-size:9px;color:#666;">${s.title}</div>
              <div style="font-size:9px;">Passport: ${s.passport_number}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align:center;">
        <div class="stamp">
          <div style="font-size:8px;">UNION BANK OF SWITZERLAND AG</div>
          <div style="font-size:22px;font-weight:bold;">UBS</div>
          <div style="font-size:8px;">VERIFIED & RECORDED</div>
        </div>
      </div>

      <div class="footer">
        ACCOUNT HOLDER PROFILE | GENERATED: ${new Date().toISOString()}<br>
        COMPANY: ${p.company.name} | ID: ${p.company.id_number}<br><br>
        THIS DOCUMENT IS CONFIDENTIAL AND INTENDED SOLELY FOR THE USE OF THE ACCOUNT HOLDER AND AUTHORISED SIGNATORIES.
      </div>
      <div class="barcode">|||| |||| | ||| |||| ||||| || ||| |||| ||||</div>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-swiss-text-muted" />
      </div>
    );
  }

  if (!profile) return null;

  const { company, signatories, declaration } = profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Building className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Account Profile
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            Account holder information & authorised signatories
          </p>
        </div>
        <Button
          onClick={printProfile}
          className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Profile
        </Button>
      </div>

      {/* Company Info Card */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm overflow-hidden">
        <div className="h-1 bg-swiss-red" />
        <CardHeader>
          <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <InfoRow icon={FileText} label="Company Name" value={company.name} testId="company-name" />
            <InfoRow icon={Hash} label="Company ID N\u00b0" value={company.id_number} testId="company-id" />
            <InfoRow
              icon={MapPin}
              label="Business Address"
              value={`${company.address}, ${company.postal_code} ${company.city}, ${company.region}, ${company.country}`}
              testId="company-address"
              className="md:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Signatories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {signatories.map((sig, idx) => (
          <Card key={idx} className="bg-swiss-bg-paper border-slate-200 rounded-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-swiss-red to-swiss-red/50" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                  {sig.name}
                </CardTitle>
                <Badge className="bg-swiss-red/10 text-swiss-red border border-swiss-red/30 rounded-sm text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Authorised
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={FileText} label="Title" value={sig.title} />
              {sig.signing_authority && (
                <InfoRow icon={Shield} label="Signing Authority" value={sig.signing_authority} />
              )}
              <div className="h-px bg-slate-50" />
              <div className="bg-swiss-bg-subtle p-4 rounded-sm space-y-3">
                {sig.passport_number ? (
                  <>
                    <p className="text-[10px] text-swiss-text-muted uppercase tracking-widest mb-2">Passport Details</p>
                    <InfoRow icon={Hash} label="Passport N\u00b0" value={sig.passport_number} />
                    <InfoRow icon={Globe} label="Country of Issue" value={sig.country_of_issue} />
                    {sig.date_of_birth && <InfoRow icon={CalendarDays} label="Date of Birth" value={sig.date_of_birth} />}
                    {sig.sex && <InfoRow icon={User} label="Sex" value={sig.sex} />}
                    {sig.height && <InfoRow icon={FileText} label="Height" value={sig.height} />}
                    {sig.place_of_origin && <InfoRow icon={MapPin} label="Place of Origin" value={sig.place_of_origin} />}
                    <InfoRow icon={CalendarDays} label="Date of Issue" value={sig.date_of_issue} />
                    <InfoRow icon={CalendarDays} label="Date of Expiry" value={sig.date_of_expiry} />
                    {sig.issuing_authority && <InfoRow icon={Shield} label="Authority" value={sig.issuing_authority} />}
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-swiss-text-muted uppercase tracking-widest mb-2">Personal Details</p>
                    {sig.origin && <InfoRow icon={MapPin} label="Origin" value={sig.origin} />}
                    {sig.residence && <InfoRow icon={MapPin} label="Residence" value={sig.residence} />}
                    <InfoRow icon={Globe} label="Country" value={sig.country_of_issue} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Table */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
            Signatory Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-swiss-bg-subtle border-b border-slate-200">
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Authorised By</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Passport / ID</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Place of Issue / Origin</th>
                <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Signing Authority</th>
              </tr>
            </thead>
            <tbody>
              {signatories.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-900 text-sm font-medium">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-sm text-swiss-text-secondary">{s.passport_number || '—'}</td>
                  <td className="py-3 px-4 text-sm text-swiss-text-secondary">{s.origin || s.country_of_issue}</td>
                  <td className="py-3 px-4 text-xs text-swiss-text-secondary">{s.signing_authority || 'Full signatory authority'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Declaration */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm overflow-hidden">
        <div className="h-1 bg-amber-500/50" />
        <CardHeader>
          <CardTitle className="font-heading text-lg text-slate-900">
            Sworn Declaration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-sm">
            <p className="text-slate-900 text-sm leading-relaxed italic">
              {declaration}
            </p>
            <p className="text-swiss-text-secondary text-sm mt-4">
              For and on behalf of
            </p>
            <p className="text-slate-900 font-bold text-sm mt-1">
              {company.name}
            </p>
          </div>

          {/* Signature Blocks */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            {signatories.map((s, i) => (
              <div key={i} className="text-center">
                <div className="h-16 border-b-2 border-slate-300 mb-3" />
                <p className="text-slate-900 font-bold text-sm">{s.name}</p>
                <p className="text-swiss-text-muted text-xs">{s.title}</p>
                <p className="text-swiss-text-muted text-xs font-mono mt-1">
                  {s.passport_number ? `Passport: ${s.passport_number}` : `Origin: ${s.origin}`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bank Verification Stamp */}
      <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
        <CardContent className="py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="border-2 border-swiss-red px-5 py-3 text-center rounded-sm">
              <p className="text-[8px] text-swiss-red uppercase tracking-widest">Union Bank of Switzerland AG</p>
              <p className="text-swiss-red font-bold text-xl font-heading">UBS</p>
              <p className="text-[8px] text-swiss-red uppercase tracking-widest">Verified & Recorded</p>
            </div>
            <div>
              <p className="text-slate-900 text-sm font-medium">Account Verified</p>
              <p className="text-swiss-text-muted text-xs">This account profile has been verified and recorded by Union Bank of Switzerland AG</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-swiss-text-muted text-xs">Document Reference</p>
            <p className="font-mono text-xs text-swiss-text-secondary">UBS/ACCT/{Date.now().toString().substring(5)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, testId, className = '' }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <Icon className="w-4 h-4 text-swiss-text-muted mt-0.5 flex-shrink-0" strokeWidth={1.5} />
    <div>
      <p className="text-[10px] text-swiss-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-slate-900 text-sm font-medium mt-0.5">{value}</p>
    </div>
  </div>
);

export default AccountProfilePage;
