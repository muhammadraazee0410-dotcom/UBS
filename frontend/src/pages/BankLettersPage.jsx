import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Mail,
  Printer,
  Shield,
  User,
  Landmark,
  FileCheck,
  RefreshCw,
  Lock,
} from 'lucide-react';

const formatCurrency = (amount, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

const letterTabs = [
  { id: 'auth-balance', label: 'Authorised Balance', icon: Shield },
  { id: 'relationship', label: 'Account Relationship', icon: Landmark },
  { id: 'officer', label: 'Bank Officer', icon: User },
  { id: 'reference', label: 'Bank Reference', icon: FileCheck },
  { id: 'asset-control', label: 'Asset Control', icon: Lock },
];

const BankLettersPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('auth-balance');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/bank-letters');
        setData(res.data);
      } catch { toast.error('Failed to load bank letters'); }
      finally { setLoading(false); }
    })();
  }, []);

  const printLetter = () => {
    if (!data) return;
    const html = activeTab === 'auth-balance' ? buildAuthBalanceHTML(data)
      : activeTab === 'relationship' ? buildRelationshipHTML(data)
      : activeTab === 'officer' ? buildOfficerHTML(data)
      : activeTab === 'reference' ? buildReferenceHTML(data)
      : buildAssetControlHTML(data);
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin text-swiss-text-muted" /></div>;
  if (!data) return null;

  const { profile: p, officer: o, balances, references: refs, signatories: sigs } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Bank Letters
          </h1>
          <p className="text-swiss-text-secondary mt-1">Official UBS confirmation letters and references</p>
        </div>
        <Button onClick={printLetter} className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm">
          <Printer className="w-4 h-4 mr-2" />Print Letter
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-swiss-bg-paper border border-slate-200 p-1 rounded-sm h-auto flex-wrap gap-1">
          {letterTabs.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="data-[state=active]:bg-swiss-red data-[state=active]:text-white text-swiss-text-secondary rounded-sm px-4 py-2 text-xs">
              <t.icon className="w-3.5 h-3.5 mr-1.5" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== AUTHORISED BALANCE CONFIRMATION ===== */}
        <TabsContent value="auth-balance">
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
            <CardContent className="p-0">
              <ScrollArea className="h-[650px]">
                <div className="p-8 space-y-6">
                  <LetterHead date={data.date} refNum={refs.auth_balance_ref} />
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-lg text-slate-900 uppercase tracking-wider">Authorised Bank Balance Confirmation</h2>
                    <p className="text-swiss-text-muted text-xs mt-1">STRICTLY CONFIDENTIAL — AUTHORISED SIGNATORIES</p>
                  </div>
                  <LetterTo />
                  <div className="space-y-4 text-sm text-swiss-text-secondary leading-relaxed">
                    <p>We, <span className="text-slate-900 font-bold">Union Bank of Switzerland AG (UBS)</span>, SWIFT: UBSWCHZHXXX, Bahnhofstrasse 45, 8001 Zurich, Switzerland, hereby issue this official bank balance confirmation letter at the request and authorisation of the duly appointed signatories of <span className="text-slate-900 font-bold">{p.company_name}</span> (Company ID N° {p.company_id}).</p>

                    {/* Authorised Signatories Section */}
                    <div className="bg-swiss-bg-subtle border border-slate-200 p-5 rounded-sm">
                      <p className="text-[10px] text-swiss-red uppercase tracking-widest mb-4 font-bold">Authorised Signatories</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sigs && sigs.map((s, i) => (
                          <div key={i} className="bg-swiss-bg-paper border border-slate-100 p-4 rounded-sm">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-slate-900 font-bold text-sm">{s.name}</p>
                              <Badge className="bg-swiss-red/10 text-swiss-red border border-swiss-red/30 rounded-sm text-[10px]">
                                <Shield className="w-3 h-3 mr-1" />Authorised
                              </Badge>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Title:</span><span className="text-swiss-text-secondary text-xs">{s.title}</span></div>
                              {s.passport_number && (
                                <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Passport N°:</span><span className="text-slate-900 text-xs font-mono">{s.passport_number}</span></div>
                              )}
                              <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Country:</span><span className="text-swiss-text-secondary text-xs">{s.country_of_issue}</span></div>
                              {s.origin && (
                                <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Origin:</span><span className="text-swiss-text-secondary text-xs">{s.origin}</span></div>
                              )}
                              {s.residence && (
                                <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Residence:</span><span className="text-swiss-text-secondary text-xs">{s.residence}</span></div>
                              )}
                              {s.date_of_issue && (
                                <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Issued:</span><span className="text-swiss-text-secondary text-xs font-mono">{s.date_of_issue}</span></div>
                              )}
                              {s.date_of_expiry && (
                                <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Expires:</span><span className="text-swiss-text-secondary text-xs font-mono">{s.date_of_expiry}</span></div>
                              )}
                              {s.signing_authority && (
                                <div className="flex"><span className="w-28 text-swiss-text-muted text-[10px] uppercase">Authority:</span><span className="text-swiss-red text-xs font-medium">{s.signing_authority}</span></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p>Acting in their capacity as duly authorised POA Holders and Signatories, the above-named individuals have authorised the bank to confirm the following account balances held with Union Bank of Switzerland AG:</p>

                    {/* Balance Confirmation Table */}
                    <div className="border border-slate-200 rounded-sm overflow-hidden">
                      <div className="bg-swiss-red/10 px-4 py-2">
                        <p className="text-swiss-red text-[10px] uppercase tracking-widest font-bold">Confirmed Account Balances</p>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-swiss-bg-subtle border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Currency</th>
                            <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Account Number</th>
                            <th className="text-left py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">IBAN</th>
                            <th className="text-right py-3 px-4 text-swiss-text-muted uppercase text-[10px] tracking-wider">Confirmed Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {balances.map((b, i) => (
                            <tr key={b.currency} className="border-b border-slate-100">
                              <td className="py-3 px-4"><Badge className="bg-swiss-red/10 text-swiss-red rounded-sm text-xs">{b.currency}</Badge></td>
                              <td className="py-3 px-4 font-mono text-xs text-swiss-text-secondary">{b.account_number}</td>
                              <td className="py-3 px-4 font-mono text-xs text-swiss-text-muted">{b.iban}</td>
                              <td className="py-3 px-4 text-right font-mono text-sm text-slate-900 font-bold">{formatCurrency(b.balance, b.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p>The bank hereby confirms that:</p>
                    <div className="space-y-3">
                      <ConfirmItem num="1" title="Authenticity of Balances" text="The above balances are authentic, accurate, and verified as of the date of this letter. They represent the true and correct funds held in the respective accounts." />
                      <ConfirmItem num="2" title="Signatory Authority" text={`The balances are confirmed under the joint authorisation of ${sigs ? sigs.map(s => s.name).join(' and ') : ''}, who hold valid Power of Attorney over the accounts of ${p.company_name}.`} />
                      <ConfirmItem num="3" title="Funds Availability" text="The confirmed balances are available, unencumbered, and not subject to any liens, holds, pledges, or restrictions. The funds may be utilised or transferred upon proper instruction from the authorised signatories." />
                      <ConfirmItem num="4" title="Regulatory Compliance" text="All funds have been verified in compliance with Swiss FINMA regulations, Anti-Money Laundering (AML) directives, and Know Your Customer (KYC) requirements." />
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-sm mt-4">
                      <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">Declaration</p>
                      <p className="text-swiss-text-secondary text-xs italic">This balance confirmation is issued at the express request and authorisation of the account signatories named herein. It is valid as of the date of issuance and is intended solely for the use of the addressee. Union Bank of Switzerland AG shall bear no liability for any reliance placed upon this confirmation by third parties.</p>
                    </div>
                  </div>

                  {/* Signatory Block */}
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <p className="text-xs text-swiss-text-muted mb-6">Authorised and confirmed by:</p>
                    <div className="grid grid-cols-3 gap-6">
                      {sigs && sigs.map((s, i) => (
                        <div key={i} className="text-center">
                          <div className="h-14 border-b-2 border-slate-300 mb-3" />
                          <p className="text-slate-900 font-bold text-sm">{s.name}</p>
                          <p className="text-swiss-text-muted text-xs">{s.title}</p>
                          <p className="text-swiss-text-muted text-xs font-mono mt-1">
                            {s.passport_number ? `Passport: ${s.passport_number}` : `Origin: ${s.origin}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bank Officer Countersign */}
                  <div className="border-t border-slate-200 pt-6">
                    <p className="text-xs text-swiss-text-muted mb-1">Countersigned and verified by the Bank:</p>
                    <div className="mt-8 border-t-2 border-slate-300 pt-3 max-w-xs">
                      <p className="text-slate-900 font-bold text-sm">{o.name}</p>
                      <p className="text-swiss-text-muted text-xs">{o.title}</p>
                      <p className="text-swiss-text-muted text-xs">{o.department}</p>
                      <p className="text-swiss-text-muted text-xs font-mono mt-1">Officer ID: {o.officer_id}</p>
                    </div>
                  </div>

                  <LetterStamp refNum={refs.auth_balance_ref} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RELATIONSHIP LETTER ===== */}
        <TabsContent value="relationship">
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
            <CardContent className="p-0">
              <ScrollArea className="h-[650px]">
                <div className="p-8 space-y-6">
                  <LetterHead date={data.date} refNum={refs.relationship_ref} />
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-lg text-slate-900 uppercase tracking-wider">Confirmation of Account Relationship</h2>
                    <p className="text-swiss-text-muted text-xs mt-1">CONFIDENTIAL — FOR ADDRESSEE ONLY</p>
                  </div>
                  <LetterTo />
                  <div className="space-y-4 text-sm text-swiss-text-secondary leading-relaxed">
                    <p>We, Union Bank of Switzerland AG (UBS), SWIFT: UBSWCHZHXXX, hereby confirm that <span className="text-slate-900 font-bold">{p.company_name}</span> (Company ID: {p.company_id}), with registered address at {p.address}, has maintained a banking relationship with our institution since <span className="text-slate-900 font-bold">{data.relationship_since}</span>.</p>
                    <p>The account was opened on <span className="text-slate-900 font-bold">{data.account_opened}</span> and remains active and in good standing as of the date of this letter. The account name as held with our bank is:</p>
                    <div className="bg-swiss-bg-subtle border border-slate-200 p-4 rounded-sm text-center">
                      <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-1">Account Name as Held with UBS</p>
                      <p className="font-mono text-lg text-slate-900 font-bold">{p.company_name}</p>
                    </div>
                    <p>During the tenure of this relationship, the account has been conducted satisfactorily with no irregularities. All transactions have been in compliance with applicable Swiss and international banking regulations, including Anti-Money Laundering (AML) and Know Your Customer (KYC) requirements.</p>
                    <p>The following accounts are maintained under this relationship:</p>
                    <div className="space-y-2">
                      {balances.map(b => (
                        <div key={b.currency} className="flex items-center justify-between bg-swiss-bg-subtle p-3 rounded-sm border border-slate-100">
                          <div>
                            <Badge className="bg-swiss-red/10 text-swiss-red rounded-sm text-xs mr-2">{b.currency}</Badge>
                            <span className="font-mono text-xs text-swiss-text-muted">{b.iban}</span>
                          </div>
                          <span className="font-mono text-sm text-slate-900 font-bold">{formatCurrency(b.balance, b.currency)}</span>
                        </div>
                      ))}
                    </div>
                    <p>This letter is issued at the request of the account holder for whatever legal purpose it may serve.</p>
                  </div>
                  <OfficerSign officer={o} />
                  <LetterStamp refNum={refs.relationship_ref} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== BANK OFFICER LETTER ===== */}
        <TabsContent value="officer">
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
            <CardContent className="p-0">
              <ScrollArea className="h-[650px]">
                <div className="p-8 space-y-6">
                  <LetterHead date={data.date} refNum={refs.confirmation_ref} />
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-lg text-slate-900 uppercase tracking-wider">Confirmation of Handling Bank Officer</h2>
                  </div>
                  <LetterTo />
                  <div className="space-y-4 text-sm text-swiss-text-secondary leading-relaxed">
                    <p>We hereby confirm that the account of <span className="text-slate-900 font-bold">{p.company_name}</span> (Company ID: {p.company_id}) is managed under the supervision of the following designated bank officer:</p>
                    <div className="bg-swiss-bg-subtle border border-slate-200 p-6 rounded-sm space-y-3">
                      <InfoLine label="Officer Name" value={o.name} />
                      <InfoLine label="Title / Position" value={o.title} />
                      <InfoLine label="Department" value={o.department} />
                      <InfoLine label="Officer ID" value={o.officer_id} />
                      <InfoLine label="Direct Telephone" value={o.direct_line} />
                      <InfoLine label="Email" value={o.email} />
                    </div>
                    <p>The above-named officer is the designated point of contact for all matters relating to this account, including but not limited to: transaction authorisations, account enquiries, compliance matters, and fund verification requests.</p>
                    <p>Any correspondence or enquiry regarding the account of {p.company_name} should be directed to the officer named above. The officer is authorised to provide confirmations, references, and statements pertaining to this account on behalf of Union Bank of Switzerland AG.</p>
                    <p>This confirmation is valid for a period of twelve (12) months from the date of issue unless revoked in writing by the bank.</p>
                  </div>
                  <OfficerSign officer={o} />
                  <LetterStamp refNum={refs.confirmation_ref} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== BANK REFERENCE LETTER ===== */}
        <TabsContent value="reference">
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
            <CardContent className="p-0">
              <ScrollArea className="h-[650px]">
                <div className="p-8 space-y-6">
                  <LetterHead date={data.date} refNum={refs.statement_ref} />
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-lg text-slate-900 uppercase tracking-wider">Bank Reference Letter</h2>
                  </div>
                  <LetterTo />
                  <div className="space-y-4 text-sm text-swiss-text-secondary leading-relaxed">
                    <p>TO WHOM IT MAY CONCERN,</p>
                    <p>Union Bank of Switzerland AG (UBS) is pleased to provide this bank reference in respect of our valued client <span className="text-slate-900 font-bold">{p.company_name}</span>, Company ID N° {p.company_id}, domiciled at {p.address}.</p>
                    <p>We confirm the following:</p>
                    <div className="space-y-3">
                      <RefItem num="1" text={`${p.company_name} has maintained accounts with UBS since ${data.relationship_since} and the relationship remains active and in good standing.`} />
                      <RefItem num="2" text="All account activities have been conducted in a satisfactory manner, with no record of returned items, adverse transactions, or regulatory concerns." />
                      <RefItem num="3" text={`The account name as held with our institution is exactly: "${p.company_name}".`} />
                      <RefItem num="4" text="The client has consistently met all obligations and commitments in a timely and professional manner." />
                    </div>
                    <p className="mt-4">Current account balances as of the date of this letter:</p>
                    <table className="w-full mt-2">
                      <thead><tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-swiss-text-muted text-[10px] uppercase tracking-wider">Currency</th>
                        <th className="text-left py-2 text-swiss-text-muted text-[10px] uppercase tracking-wider">IBAN</th>
                        <th className="text-right py-2 text-swiss-text-muted text-[10px] uppercase tracking-wider">Balance</th>
                      </tr></thead>
                      <tbody>
                        {balances.map(b => (
                          <tr key={b.currency} className="border-b border-slate-100">
                            <td className="py-2 text-slate-900 text-sm">{b.currency}</td>
                            <td className="py-2 font-mono text-xs text-swiss-text-muted">{b.iban}</td>
                            <td className="py-2 text-right font-mono text-sm text-slate-900 font-bold">{formatCurrency(b.balance, b.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-4">We consider {p.company_name} to be a client of good repute and financial standing. This reference is given in strict confidence and without any responsibility on the part of the bank or its officers.</p>
                  </div>
                  <OfficerSign officer={o} />
                  <LetterStamp refNum={refs.statement_ref} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ASSET CONTROL LETTER ===== */}
        <TabsContent value="asset-control">
          <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
            <CardContent className="p-0">
              <ScrollArea className="h-[650px]">
                <div className="p-8 space-y-6">
                  <LetterHead date={data.date} refNum={refs.asset_ref} />
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-lg text-slate-900 uppercase tracking-wider">Confirmation of Funds & Asset Control</h2>
                    <p className="text-swiss-text-muted text-xs mt-1">STRICTLY PRIVATE & CONFIDENTIAL</p>
                  </div>
                  <LetterTo />
                  <div className="space-y-4 text-sm text-swiss-text-secondary leading-relaxed">
                    <p>We, Union Bank of Switzerland AG (UBS), SWIFT Code: UBSWCHZHXXX, hereby issue this official confirmation regarding the funds and assets held in the account of <span className="text-slate-900 font-bold">{p.company_name}</span> (Company ID: {p.company_id}).</p>
                    <p>We confirm that:</p>
                    <div className="space-y-3">
                      <ConfirmItem num="1" title="Account Ownership & Control" text={`The funds and assets held in the accounts of ${p.company_name} are under the full and sole control of ${p.authorized_person}, ${p.authorized_title}, Passport N° ${p.passport}. ${p.authorized_person} is duly authorised to operate, manage, and instruct on all accounts held with this institution.`} />
                      <ConfirmItem num="2" title="Clean & Clear Funds" text="The funds held in the above-referenced accounts are of legitimate origin, have been verified in accordance with Swiss banking regulations, and are confirmed to be clean, clear, and of non-criminal origin." />
                      <ConfirmItem num="3" title="Free from Encumbrances" text="The funds and assets are NOT currently subject to any lien, pledge, charge, encumbrance, seizure, freeze order, court order, or any restriction of any kind. The assets are free and unencumbered." />
                      <ConfirmItem num="4" title="Available for Monetisation" text={`The funds are readily available and permitted for monetisation, transfer, investment, or any lawful transaction as instructed by ${p.authorized_person} or any other duly authorised signatory of ${p.company_name}.`} />
                      <ConfirmItem num="5" title="No Pending Litigation" text="There are no pending or threatened legal proceedings, regulatory actions, or investigations against the account or the account holder that would affect the availability or disposition of the funds." />
                    </div>
                    <div className="bg-swiss-bg-subtle border border-slate-200 p-4 rounded-sm mt-4">
                      <p className="text-xs text-swiss-text-muted uppercase tracking-wider mb-3">Account Balances Confirmed</p>
                      {balances.map(b => (
                        <div key={b.currency} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-swiss-red/10 text-swiss-red rounded-sm text-xs">{b.currency}</Badge>
                            <span className="font-mono text-xs text-swiss-text-muted">{b.iban}</span>
                          </div>
                          <span className="font-mono text-sm text-slate-900 font-bold">{formatCurrency(b.balance, b.currency)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4">This confirmation is issued at the request of the account holder and is valid as of the date stated herein. Union Bank of Switzerland AG reserves the right to amend or revoke this confirmation should circumstances change materially.</p>
                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-sm mt-4">
                      <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">Important Notice</p>
                      <p className="text-swiss-text-secondary text-xs">This letter is issued without any liability or obligation on the part of Union Bank of Switzerland AG and is subject to the general terms and conditions governing the banking relationship. This confirmation does not constitute a guarantee of payment.</p>
                    </div>
                  </div>
                  <OfficerSign officer={o} />
                  <LetterStamp refNum={refs.asset_ref} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ====== Reusable sub-components ====== */

const LetterHead = ({ date, refNum }) => (
  <div className="flex items-start justify-between border-b-2 border-swiss-red pb-5">
    <div>
      <p className="font-heading font-black text-2xl text-swiss-red">UBS</p>
      <p className="text-xs text-swiss-text-muted">Union Bank of Switzerland AG</p>
      <p className="text-xs text-swiss-text-muted">Bahnhofstrasse 45, 8001 Zurich, Switzerland</p>
      <p className="text-xs text-swiss-text-muted">SWIFT: UBSWCHZHXXX</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-swiss-text-muted">Date: {fmtDate(date)}</p>
      <p className="text-xs text-swiss-text-muted">Ref: {refNum}</p>
      <Badge className="bg-swiss-red/10 text-swiss-red border border-swiss-red/30 rounded-sm text-[10px] mt-1">OFFICIAL</Badge>
    </div>
  </div>
);

const LetterTo = () => (
  <div className="bg-swiss-bg-subtle p-4 rounded-sm">
    <p className="text-[10px] text-swiss-text-muted uppercase tracking-wider mb-1">Addressed To</p>
    <p className="text-slate-900 text-sm">To Whom It May Concern</p>
    <p className="text-swiss-text-muted text-xs">/ All Interested Parties</p>
  </div>
);

const OfficerSign = ({ officer }) => (
  <div className="border-t border-slate-200 pt-6 mt-6">
    <p className="text-xs text-swiss-text-muted mb-1">Yours faithfully,</p>
    <p className="text-xs text-swiss-text-muted mb-1">For and on behalf of Union Bank of Switzerland AG</p>
    <div className="mt-8 border-t-2 border-slate-300 pt-3 max-w-xs">
      <p className="text-slate-900 font-bold text-sm">{officer.name}</p>
      <p className="text-swiss-text-muted text-xs">{officer.title}</p>
      <p className="text-swiss-text-muted text-xs">{officer.department}</p>
      <p className="text-swiss-text-muted text-xs font-mono mt-1">Officer ID: {officer.officer_id}</p>
      <p className="text-swiss-text-muted text-xs font-mono">Tel: {officer.direct_line}</p>
    </div>
  </div>
);

const LetterStamp = ({ refNum }) => (
  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
    <div className="border-2 border-swiss-red px-4 py-2 text-center rounded-sm">
      <p className="text-[7px] text-swiss-red uppercase tracking-widest">Union Bank of Switzerland AG</p>
      <p className="text-swiss-red font-bold text-lg font-heading">UBS</p>
      <p className="text-[7px] text-swiss-red uppercase tracking-widest">Official Correspondence</p>
    </div>
    <div className="text-right">
      <p className="font-mono text-swiss-text-muted text-[10px] tracking-widest">|||| |||| | ||| |||| ||||| || ||| ||||</p>
      <p className="font-mono text-swiss-text-muted text-[9px] mt-1">{refNum}</p>
    </div>
  </div>
);

const InfoLine = ({ label, value }) => (
  <div className="flex">
    <span className="w-44 text-swiss-text-muted text-xs uppercase tracking-wider">{label}:</span>
    <span className="text-slate-900 text-sm font-medium">{value}</span>
  </div>
);

const RefItem = ({ num, text }) => (
  <div className="flex gap-3 bg-swiss-bg-subtle p-3 rounded-sm border border-slate-100">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-swiss-red/10 text-swiss-red text-xs flex items-center justify-center font-bold">{num}</span>
    <p className="text-swiss-text-secondary text-sm">{text}</p>
  </div>
);

const ConfirmItem = ({ num, title, text }) => (
  <div className="bg-swiss-bg-subtle p-4 rounded-sm border border-slate-100">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-6 h-6 rounded-full bg-swiss-red/10 text-swiss-red text-xs flex items-center justify-center font-bold flex-shrink-0">{num}</span>
      <p className="text-slate-900 text-sm font-bold uppercase tracking-wider">{title}</p>
    </div>
    <p className="text-swiss-text-secondary text-sm ml-8">{text}</p>
  </div>
);

export default BankLettersPage;

/* ====== Print HTML Builders ====== */

function letterCSS() {
  return `* { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Courier New',monospace; padding:40px; font-size:11px; color:#000; line-height:1.6; }
    .hdr { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #DC2626; padding-bottom:15px; margin-bottom:20px; }
    .logo { font-size:28px; font-weight:bold; color:#DC2626; }
    .title { text-align:center; font-size:16px; font-weight:bold; letter-spacing:2px; margin:15px 0; text-transform:uppercase; }
    .sub { text-align:center; font-size:9px; color:#666; letter-spacing:1px; margin-bottom:15px; }
    .to-box { background:#f5f5f5; padding:10px 15px; margin:15px 0; }
    .section { margin:15px 0; }
    .info-row { display:flex; margin:5px 0; }
    .info-label { width:200px; text-transform:uppercase; color:#666; font-size:10px; }
    .info-value { flex:1; font-weight:bold; font-size:11px; }
    .acct-box { background:#ffffd0; border:1px solid #e6c200; padding:12px; text-align:center; margin:15px 0; }
    .balance-row { display:flex; justify-content:space-between; padding:8px 12px; border-bottom:1px solid #ddd; }
    .confirm-box { border:1px solid #ddd; padding:12px; margin:10px 0; }
    .confirm-title { font-weight:bold; text-transform:uppercase; margin-bottom:5px; }
    .notice { background:#fffde6; border:1px solid #e6c200; padding:12px; margin:15px 0; font-size:10px; }
    .sig { border-top:2px solid #000; margin-top:60px; padding-top:8px; max-width:300px; }
    .stamp { border:2px solid #DC2626; padding:10px 20px; display:inline-block; text-align:center; color:#DC2626; margin-top:20px; }
    .footer { margin-top:25px; border-top:1px solid #ccc; padding-top:12px; font-size:8px; color:#666; }
    .barcode { text-align:center; font-size:28px; letter-spacing:2px; margin-top:15px; }
    table { width:100%; border-collapse:collapse; margin:10px 0; }
    th { background:#f5f5f5; padding:8px; text-align:left; font-size:9px; text-transform:uppercase; border:1px solid #ccc; }
    td { padding:8px; border:1px solid #ddd; font-size:10px; }
    @media print { body { padding:20px; } }`;
}

function hdrHTML(date, ref) {
  return `<div class="hdr">
    <div><div class="logo">UBS</div><div style="font-size:10px;">Union Bank of Switzerland AG</div><div style="font-size:9px;color:#666;">Bahnhofstrasse 45, 8001 Zurich, Switzerland</div><div style="font-size:9px;color:#666;">SWIFT: UBSWCHZHXXX</div></div>
    <div style="text-align:right;"><div style="font-size:9px;">Date: ${new Date(date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</div><div style="font-size:9px;">Ref: ${ref}</div><div style="font-size:9px;color:#DC2626;margin-top:4px;border:1px solid #DC2626;display:inline-block;padding:2px 6px;">OFFICIAL</div></div>
  </div>`;
}

function sigHTML(o) {
  return `<div style="margin-top:30px;"><div style="font-size:10px;color:#666;">Yours faithfully,</div><div style="font-size:10px;color:#666;">For and on behalf of Union Bank of Switzerland AG</div>
    <div class="sig"><div style="font-weight:bold;">${o.name}</div><div style="font-size:9px;color:#666;">${o.title}</div><div style="font-size:9px;color:#666;">${o.department}</div><div style="font-size:9px;font-family:monospace;margin-top:4px;">Officer ID: ${o.officer_id} | Tel: ${o.direct_line}</div></div></div>`;
}

function stampHTML(ref) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;">
    <div class="stamp"><div style="font-size:8px;">UNION BANK OF SWITZERLAND AG</div><div style="font-size:20px;font-weight:bold;">UBS</div><div style="font-size:8px;">OFFICIAL CORRESPONDENCE</div></div>
    <div style="text-align:right;"><div class="barcode">|||| |||| | ||| |||| ||||| || ||||</div><div style="font-size:9px;font-family:monospace;color:#666;">${ref}</div></div></div>
    <div class="footer">THIS DOCUMENT IS CONFIDENTIAL. GENERATED: ${new Date().toISOString()}</div>`;
}

function balancesHTML(balances) {
  return balances.map(b => `<div class="balance-row"><div><strong>${b.currency}</strong> <span style="font-family:monospace;font-size:9px;color:#666;">${b.iban}</span></div><div style="font-weight:bold;font-family:monospace;">${new Intl.NumberFormat('en-US',{style:'currency',currency:b.currency,minimumFractionDigits:2}).format(b.balance)}</div></div>`).join('');
}

function fmtC(a, c) { return new Intl.NumberFormat('en-US',{style:'currency',currency:c,minimumFractionDigits:2}).format(a); }

function buildRelationshipHTML(d) {
  const {profile:p, officer:o, balances, references:r} = d;
  return `<html><head><title>UBS - Account Relationship Confirmation</title><style>${letterCSS()}</style></head><body>
    ${hdrHTML(d.date, r.relationship_ref)}
    <div class="title">Confirmation of Account Relationship</div>
    <div class="sub">CONFIDENTIAL — FOR ADDRESSEE ONLY</div>
    <div class="to-box">To Whom It May Concern / All Interested Parties</div>
    <div class="section">
      <p>We, Union Bank of Switzerland AG (UBS), SWIFT: UBSWCHZHXXX, hereby confirm that <strong>${p.company_name}</strong> (Company ID: ${p.company_id}), with registered address at ${p.address}, has maintained a banking relationship with our institution since <strong>${d.relationship_since}</strong>.</p>
      <p style="margin-top:10px;">The account was opened on <strong>${d.account_opened}</strong> and remains active and in good standing. The account name as held with our bank is:</p>
      <div class="acct-box"><div style="font-size:9px;color:#666;">ACCOUNT NAME AS HELD WITH UBS</div><div style="font-size:16px;font-weight:bold;font-family:monospace;">${p.company_name}</div></div>
      <p>The following accounts are maintained:</p>
      ${balancesHTML(balances)}
      <p style="margin-top:10px;">This letter is issued at the request of the account holder for whatever legal purpose it may serve.</p>
    </div>
    ${sigHTML(o)}${stampHTML(r.relationship_ref)}
  </body></html>`;
}

function buildOfficerHTML(d) {
  const {profile:p, officer:o, references:r} = d;
  return `<html><head><title>UBS - Bank Officer Confirmation</title><style>${letterCSS()}</style></head><body>
    ${hdrHTML(d.date, r.confirmation_ref)}
    <div class="title">Confirmation of Handling Bank Officer</div>
    <div class="to-box">To Whom It May Concern / All Interested Parties</div>
    <div class="section">
      <p>We hereby confirm that the account of <strong>${p.company_name}</strong> (Company ID: ${p.company_id}) is managed under the supervision of:</p>
      <div style="border:1px solid #ddd;padding:15px;margin:15px 0;background:#fafafa;">
        <div class="info-row"><span class="info-label">Officer Name:</span><span class="info-value">${o.name}</span></div>
        <div class="info-row"><span class="info-label">Title / Position:</span><span class="info-value">${o.title}</span></div>
        <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${o.department}</span></div>
        <div class="info-row"><span class="info-label">Officer ID:</span><span class="info-value">${o.officer_id}</span></div>
        <div class="info-row"><span class="info-label">Direct Telephone:</span><span class="info-value">${o.direct_line}</span></div>
        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${o.email}</span></div>
      </div>
      <p>The above-named officer is the designated point of contact for all matters relating to this account, including transaction authorisations, account enquiries, compliance matters, and fund verification requests.</p>
      <p style="margin-top:10px;">This confirmation is valid for twelve (12) months from the date of issue unless revoked in writing.</p>
    </div>
    ${sigHTML(o)}${stampHTML(r.confirmation_ref)}
  </body></html>`;
}

function buildReferenceHTML(d) {
  const {profile:p, officer:o, balances, references:r} = d;
  return `<html><head><title>UBS - Bank Reference Letter</title><style>${letterCSS()}</style></head><body>
    ${hdrHTML(d.date, r.statement_ref)}
    <div class="title">Bank Reference Letter</div>
    <div class="to-box">TO WHOM IT MAY CONCERN</div>
    <div class="section">
      <p>Union Bank of Switzerland AG (UBS) is pleased to provide this bank reference in respect of our valued client <strong>${p.company_name}</strong>, Company ID N° ${p.company_id}, domiciled at ${p.address}.</p>
      <p style="margin-top:10px;">We confirm the following:</p>
      <div class="confirm-box"><strong>1.</strong> ${p.company_name} has maintained accounts with UBS since ${d.relationship_since} and the relationship remains active and in good standing.</div>
      <div class="confirm-box"><strong>2.</strong> All account activities have been conducted in a satisfactory manner, with no record of returned items, adverse transactions, or regulatory concerns.</div>
      <div class="confirm-box"><strong>3.</strong> The account name as held with our institution is exactly: "${p.company_name}".</div>
      <div class="confirm-box"><strong>4.</strong> The client has consistently met all obligations and commitments in a timely and professional manner.</div>
      <p style="margin-top:10px;">Current account balances:</p>
      <table><thead><tr><th>Currency</th><th>IBAN</th><th style="text-align:right;">Balance</th></tr></thead><tbody>
        ${balances.map(b=>`<tr><td>${b.currency}</td><td style="font-family:monospace;">${b.iban}</td><td style="text-align:right;font-weight:bold;font-family:monospace;">${fmtC(b.balance,b.currency)}</td></tr>`).join('')}
      </tbody></table>
      <p style="margin-top:10px;">We consider ${p.company_name} to be a client of good repute and financial standing. This reference is given in strict confidence without responsibility on the part of the bank.</p>
    </div>
    ${sigHTML(o)}${stampHTML(r.statement_ref)}
  </body></html>`;
}

function buildAssetControlHTML(d) {
  const {profile:p, officer:o, balances, references:r} = d;
  return `<html><head><title>UBS - Asset Control Confirmation</title><style>${letterCSS()}</style></head><body>
    ${hdrHTML(d.date, r.asset_ref)}
    <div class="title">Confirmation of Funds & Asset Control</div>
    <div class="sub">STRICTLY PRIVATE & CONFIDENTIAL</div>
    <div class="to-box">To Whom It May Concern / All Interested Parties</div>
    <div class="section">
      <p>We, Union Bank of Switzerland AG (UBS), SWIFT: UBSWCHZHXXX, hereby issue this official confirmation regarding the funds and assets held in the account of <strong>${p.company_name}</strong> (Company ID: ${p.company_id}).</p>
      <p style="margin-top:10px;">We confirm that:</p>
      <div class="confirm-box"><div class="confirm-title">1. Account Ownership & Control</div>The funds and assets held in the accounts of ${p.company_name} are under the full and sole control of ${p.authorized_person}, ${p.authorized_title}, Passport N° ${p.passport}. ${p.authorized_person} is duly authorised to operate, manage, and instruct on all accounts held with this institution.</div>
      <div class="confirm-box"><div class="confirm-title">2. Clean & Clear Funds</div>The funds held are of legitimate origin, verified in accordance with Swiss banking regulations, and confirmed to be clean, clear, and of non-criminal origin.</div>
      <div class="confirm-box"><div class="confirm-title">3. Free from Encumbrances</div>The funds and assets are NOT currently subject to any lien, pledge, charge, encumbrance, seizure, freeze order, court order, or any restriction of any kind. The assets are free and unencumbered.</div>
      <div class="confirm-box"><div class="confirm-title">4. Available for Monetisation</div>The funds are readily available and permitted for monetisation, transfer, investment, or any lawful transaction as instructed by ${p.authorized_person} or any other duly authorised signatory of ${p.company_name}.</div>
      <div class="confirm-box"><div class="confirm-title">5. No Pending Litigation</div>There are no pending or threatened legal proceedings, regulatory actions, or investigations against the account or the account holder that would affect the availability or disposition of the funds.</div>
      <p style="margin-top:10px;">Account balances confirmed:</p>
      ${balancesHTML(balances)}
      <div class="notice"><strong>IMPORTANT NOTICE:</strong> This letter is issued without any liability or obligation on the part of Union Bank of Switzerland AG and is subject to the general terms and conditions governing the banking relationship.</div>
    </div>
    ${sigHTML(o)}${stampHTML(r.asset_ref)}
  </body></html>`;
}


function buildAuthBalanceHTML(d) {
  const {profile:p, officer:o, balances, references:r, signatories:sigs} = d;
  const sigList = sigs || [];
  return `<html><head><title>UBS - Authorised Bank Balance Confirmation</title><style>${letterCSS()}
    .sig-grid { display:flex; justify-content:space-around; margin:30px 0; }
    .sig-col { text-align:center; width:280px; }
    .sig-col .line { border-top:2px solid #000; margin-top:50px; padding-top:8px; }
    .counter-sig { border-top:2px solid #000; margin-top:40px; padding-top:8px; max-width:300px; }
  </style></head><body>
    ${hdrHTML(d.date, r.auth_balance_ref)}
    <div class="title">Authorised Bank Balance Confirmation</div>
    <div class="sub">STRICTLY CONFIDENTIAL — AUTHORISED SIGNATORIES</div>
    <div class="to-box">To Whom It May Concern / All Interested Parties</div>
    <div class="section">
      <p>We, <strong>Union Bank of Switzerland AG (UBS)</strong>, SWIFT: UBSWCHZHXXX, Bahnhofstrasse 45, 8001 Zurich, Switzerland, hereby issue this official bank balance confirmation letter at the request and authorisation of the duly appointed signatories of <strong>${p.company_name}</strong> (Company ID N\u00b0 ${p.company_id}).</p>

      <div style="margin:20px 0;border:1px solid #ccc;padding:15px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#DC2626;font-weight:bold;margin-bottom:12px;">Authorised Signatories</div>
        ${sigList.map((s,i) => `
          <div style="border:1px solid #ddd;padding:12px;margin-bottom:${i<sigList.length-1?'10':'0'}px;background:#fafafa;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <strong>${s.name}</strong>
              <span style="border:1px solid #DC2626;color:#DC2626;padding:1px 8px;font-size:9px;">AUTHORISED</span>
            </div>
            <div class="info-row"><span class="info-label">Title:</span><span class="info-value">${s.title}</span></div>
            <div class="info-row"><span class="info-label">Passport N\u00b0:</span><span class="info-value">${s.passport_number}</span></div>
            <div class="info-row"><span class="info-label">Country of Issue:</span><span class="info-value">${s.country_of_issue}</span></div>
            <div class="info-row"><span class="info-label">Date of Issue:</span><span class="info-value">${s.date_of_issue}</span></div>
            <div class="info-row"><span class="info-label">Date of Expiry:</span><span class="info-value">${s.date_of_expiry}</span></div>
          </div>
        `).join('')}
      </div>

      <p>Acting in their capacity as duly authorised POA Holders and Signatories, the above-named individuals have authorised the bank to confirm the following account balances held with Union Bank of Switzerland AG:</p>

      <div style="margin:15px 0;border:2px solid #DC2626;">
        <div style="background:#DC2626;color:#fff;padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Confirmed Account Balances</div>
        <table>
          <thead><tr><th>Currency</th><th>Account Number</th><th>IBAN</th><th style="text-align:right;">Confirmed Balance</th></tr></thead>
          <tbody>
            ${balances.map(b => `<tr>
              <td style="font-weight:bold;">${b.currency}</td>
              <td style="font-family:monospace;">${b.account_number}</td>
              <td style="font-family:monospace;font-size:9px;">${b.iban}</td>
              <td style="text-align:right;font-weight:bold;font-family:monospace;font-size:12px;">${fmtC(b.balance, b.currency)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <p>The bank hereby confirms that:</p>
      <div class="confirm-box"><div class="confirm-title">1. Authenticity of Balances</div>The above balances are authentic, accurate, and verified as of the date of this letter. They represent the true and correct funds held in the respective accounts.</div>
      <div class="confirm-box"><div class="confirm-title">2. Signatory Authority</div>The balances are confirmed under the joint authorisation of ${sigList.map(s=>s.name).join(' and ')}, who hold valid Power of Attorney over the accounts of ${p.company_name}.</div>
      <div class="confirm-box"><div class="confirm-title">3. Funds Availability</div>The confirmed balances are available, unencumbered, and not subject to any liens, holds, pledges, or restrictions. The funds may be utilised or transferred upon proper instruction from the authorised signatories.</div>
      <div class="confirm-box"><div class="confirm-title">4. Regulatory Compliance</div>All funds have been verified in compliance with Swiss FINMA regulations, Anti-Money Laundering (AML) directives, and Know Your Customer (KYC) requirements.</div>

      <div class="notice"><strong>DECLARATION:</strong> This balance confirmation is issued at the express request and authorisation of the account signatories named herein. It is valid as of the date of issuance and is intended solely for the use of the addressee. Union Bank of Switzerland AG shall bear no liability for any reliance placed upon this confirmation by third parties.</div>
    </div>

    <div style="margin-top:25px;border-top:1px solid #ccc;padding-top:15px;">
      <div style="font-size:10px;color:#666;margin-bottom:5px;">Authorised and confirmed by:</div>
      <div class="sig-grid">
        ${sigList.map(s => `
          <div class="sig-col">
            <div class="line">
              <div style="font-weight:bold;">${s.name}</div>
              <div style="font-size:9px;color:#666;">${s.title}</div>
              <div style="font-size:9px;font-family:monospace;">Passport: ${s.passport_number}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="margin-top:15px;border-top:1px solid #ccc;padding-top:10px;">
      <div style="font-size:10px;color:#666;">Countersigned and verified by the Bank:</div>
      <div class="counter-sig">
        <div style="font-weight:bold;">${o.name}</div>
        <div style="font-size:9px;color:#666;">${o.title}</div>
        <div style="font-size:9px;color:#666;">${o.department}</div>
        <div style="font-size:9px;font-family:monospace;">Officer ID: ${o.officer_id} | Tel: ${o.direct_line}</div>
      </div>
    </div>

    ${stampHTML(r.auth_balance_ref)}
  </body></html>`;
}
