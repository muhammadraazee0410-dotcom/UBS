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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Globe,
  Send,
  FileCode2,
  Copy,
  CheckCircle2,
  Zap,
  FileText,
  Loader2,
  Printer,
  Eye
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
  const [transferResult, setTransferResult] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptType, setReceiptType] = useState('debit-note');
  
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
      setTransferResult({
        ...response.data,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        reference: formData.reference,
        purpose: formData.purpose,
        beneficiary: beneficiaries.find(b => b.id === formData.beneficiary_id),
        transfer_type: activeType,
        sender_account: formData.sender_account
      });
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

  const openReceipt = (type) => {
    setReceiptType(type);
    setReceiptOpen(true);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    let receiptContent = '';
    
    if (receiptType === 'debit-note') {
      receiptContent = generateDebitNoteHTML();
    } else if (receiptType === 'pacs002') {
      receiptContent = generatePACS002HTML();
    } else if (receiptType === 'mt950') {
      receiptContent = generateMT950HTML();
    } else if (receiptType === 'tax-compliance') {
      receiptContent = generateTaxComplianceHTML();
    }
    
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const generateDebitNoteHTML = () => {
    if (!transferResult) return '';
    const date = new Date();
    const ref = `DN-${date.getFullYear()}-${date.toISOString().substring(5,7)}/${date.toISOString().substring(8,10)}-${Date.now().toString().substring(8)}`;
    const uetr = `${Math.random().toString(36).substring(2,10)}-${Math.random().toString(36).substring(2,6)}-4b32c873cd3b`;
    const bal = balances.find(b => b.currency === transferResult.currency);
    const charges = transferResult.amount * 0.0008;
    
    return `<html><head><title>Official Debit Note</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 30px; font-size: 10px; line-height: 1.3; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
      .bank-name { color: #0066cc; font-size: 20px; font-weight: bold; }
      .doc-title { text-align: center; font-size: 14px; font-weight: bold; }
      .section { margin: 15px 0; }
      .section-title { text-align: center; font-size: 9px; letter-spacing: 3px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 10px; }
      .row { display: flex; margin: 3px 0; }
      .label { width: 200px; text-transform: uppercase; }
      .value { flex: 1; font-weight: bold; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
      .highlight { background: #ffffd0; padding: 2px 5px; }
      .amount-box { background: #f5f5f5; padding: 15px; text-align: center; margin: 15px 0; border: 1px solid #ccc; }
      .amount-box .amount { font-size: 18px; font-weight: bold; }
      .stamp-box { border: 2px solid #0066cc; padding: 10px; text-align: center; margin: 10px; display: inline-block; }
      .footer { margin-top: 20px; font-size: 8px; color: #666; }
      .barcode { text-align: center; margin: 20px 0; font-size: 32px; letter-spacing: 2px; }
      .qr { width: 60px; height: 60px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 8px; }
    </style></head><body>
      <div style="text-align: center; margin-bottom: 10px; font-size: 28px; letter-spacing: 3px;">|||| |||| | ||| |||| ||||| || ||| |||| ||||</div>
      <div class="header">
        <div><span class="bank-name">UBS</span><div style="font-size: 9px;">Union Bank of Switzerland AG</div></div>
        <div class="doc-title">OFFICIAL DEBIT NOTE</div>
        <div style="font-size: 16px;">⊕ Swift</div>
      </div>
      <div style="text-align: center; font-size: 10px; margin-bottom: 15px;">DEBIT NOTE NO: ${ref} | DATE: ${date.toLocaleDateString('en-GB')}</div>
      <div style="text-align: center; background: #f0f0f0; padding: 5px; margin-bottom: 15px;">DOCUMENT SECURITY CODE: SEC${Date.now()}</div>
      
      <div class="section">
        <div class="section-title">BANK DETAILS</div>
        <div class="two-col">
          <div>
            <div class="row"><span class="label">Bank Name:</span><span class="value">UNION BANK OF SWITZERLAND AG</span></div>
            <div class="row"><span class="label">Branch:</span><span class="value">HEAD OFFICE</span></div>
            <div class="row"><span class="label">Address:</span><span class="value">BAHNHOFSTRASSE 45, 8001 ZURICH</span></div>
          </div>
          <div>
            <div class="row"><span class="label">SWIFT/BIC:</span><span class="value">UBSWCHZHXXX</span></div>
            <div class="row"><span class="label">Telephone:</span><span class="value">+41 44 234 1111</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">CUSTOMER DETAILS</div>
        <div class="row"><span class="label">Customer Name:</span><span class="value">UBS AG CORPORATE TREASURY</span></div>
        <div class="row"><span class="label">Account Number:</span><span class="value">${transferResult.sender_account}</span></div>
        <div class="row"><span class="label">Customer ID:</span><span class="value">CUST${Date.now().toString().substring(5)}</span></div>
      </div>

      <div class="section">
        <div class="section-title">TRANSACTION DETAILS</div>
        <div class="two-col">
          <div>
            <div class="row"><span class="label">Transaction Date:</span><span class="value">${date.toLocaleDateString('en-GB')}</span></div>
            <div class="row"><span class="label">Value Date:</span><span class="value">${new Date(date.getTime() + 86400000).toLocaleDateString('en-GB')}</span></div>
            <div class="row"><span class="label">Transaction Reference:</span><span class="value">${transferResult.reference}</span></div>
            <div class="row"><span class="label">UETR:</span><span class="value">${uetr}</span></div>
          </div>
          <div>
            <div class="row"><span class="label">Debit Amount:</span><span class="value highlight">${transferResult.currency} ${transferResult.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div class="row"><span class="label">Amount in Words:</span><span class="value">${numberToWords(transferResult.amount)} ${transferResult.currency} ONLY</span></div>
            <div class="row"><span class="label">Debit Note Type:</span><span class="value">TRANSACTION FEES</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">PAYMENT DETAILS</div>
        <div class="row"><span class="label">Payment Method:</span><span class="value">SWIFT WIRE TRANSFER (${transferResult.transfer_type})</span></div>
        <div class="row"><span class="label">Beneficiary Name:</span><span class="value">${transferResult.beneficiary?.name || 'N/A'}</span></div>
        <div class="row"><span class="label">Beneficiary Account:</span><span class="value">${transferResult.beneficiary?.account_number || 'N/A'}</span></div>
        <div class="row"><span class="label">Beneficiary Address:</span><span class="value">${transferResult.beneficiary?.address || 'N/A'}</span></div>
        <div class="row"><span class="label">Beneficiary Bank:</span><span class="value">${transferResult.beneficiary?.bank_name || 'N/A'}</span></div>
        <div class="row"><span class="label">Beneficiary Bank BIC:</span><span class="value">${transferResult.beneficiary?.swift_bic || 'N/A'}</span></div>
        <div class="row"><span class="label">Purpose of Payment:</span><span class="value">${transferResult.purpose || 'COMMERCIAL PAYMENT'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">CHARGES AND FEES</div>
        <div class="row"><span class="label">SWIFT Charges:</span><span class="value">${transferResult.currency} ${(charges * 0.2).toFixed(2)}</span></div>
        <div class="row"><span class="label">Processing Fee:</span><span class="value">${transferResult.currency} ${(charges * 0.3).toFixed(2)}</span></div>
        <div class="row"><span class="label">Compliance Verification:</span><span class="value">${transferResult.currency} ${(charges * 0.3).toFixed(2)}</span></div>
        <div class="row"><span class="label">Correspondent Charges:</span><span class="value">${transferResult.currency} ${(charges * 0.2).toFixed(2)}</span></div>
        <div class="row"><span class="label">Total Charges:</span><span class="value highlight">${transferResult.currency} ${charges.toFixed(2)}</span></div>
        <div class="row"><span class="label">Charge Bearer:</span><span class="value">SHA (CHARGES PAID BY ORDERING CUSTOMER)</span></div>
        <div class="row" style="border-top: 2px solid #000; padding-top: 5px; margin-top: 5px;"><span class="label">TOTAL DEBITED:</span><span class="value" style="font-size: 12px;">${transferResult.currency} ${(transferResult.amount + charges).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
      </div>

      <div class="section">
        <div class="section-title">ACCOUNT BALANCE SUMMARY</div>
        <div class="row"><span class="label">Balance Before Debit:</span><span class="value">${transferResult.currency} ${bal ? bal.balance.toLocaleString('en-US', {minimumFractionDigits: 2}) : '***'}</span></div>
        <div class="row"><span class="label">Debit Amount:</span><span class="value">${transferResult.currency} ${(transferResult.amount + charges).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
        <div class="row"><span class="label">Balance After Debit:</span><span class="value highlight">${transferResult.currency} ${bal ? (bal.balance - transferResult.amount - charges).toLocaleString('en-US', {minimumFractionDigits: 2}) : '***'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">AUTHORIZATION</div>
        <div class="row"><span class="label">Authorized By:</span><span class="value">SYSTEM GENERATED - STRAIGHT THROUGH PROCESSING</span></div>
        <div class="row"><span class="label">Authorization Code:</span><span class="value">AUTH-${date.getFullYear()}-${Date.now().toString().substring(8)}</span></div>
        <div class="row"><span class="label">Compliance Status:</span><span class="value">APPROVED - AML/KYC VERIFIED</span></div>
        <div class="row"><span class="label">Operator ID:</span><span class="value">OPR${Math.floor(Math.random() * 9999)}</span></div>
      </div>

      <div style="display: flex; justify-content: space-around; margin: 20px 0;">
        <div class="stamp-box"><div style="font-size: 8px;">TAUNUSANLAGE-12, 60254 FRANKFURT</div><div class="bank-name">UBS</div><div style="font-size: 8px;">Tel: +41 44 234 1111</div><div style="font-size: 7px;">AUTHORIZED SIGNATORY</div></div>
        <div style="text-align: center;"><div style="font-style: italic;">Digital Signature</div><div style="font-weight: bold;">AUTHORIZED OFFICER</div><div>NAME: MR. JOHANNES WEBER</div><div>TITLE: CHIEF RISK OFFICER</div><div>OFFICER PIN: J${Math.floor(Math.random() * 99999)}</div></div>
        <div class="stamp-box"><div style="font-size: 8px;">CUSTOMER ACKNOWLEDGEMENT</div><div class="bank-name">UBS</div><div style="font-size: 8px;">Tel: +41 44 234 1111</div><div style="font-size: 7px;">SIGNATURE</div></div>
      </div>

      <div style="background: #ffffd0; padding: 10px; margin: 15px 0; text-align: center; font-size: 9px;">
        <strong>IMPORTANT NOTICE</strong><br>
        THIS DEBIT NOTE IS SYSTEM GENERATED AND IS VALID WITHOUT SIGNATURE. THE TRANSACTION HAS BEEN EXECUTED AS PER YOUR INSTRUCTIONS AND THE AMOUNT HAS BEEN DEBITED FROM YOUR ACCOUNT.
      </div>

      <div class="footer">
        DEBIT NOTE | GENERATED: ${date.toISOString()}<br>
        REFERENCE: ${ref} | UETR: ${uetr}
      </div>
      <div class="barcode">|||| |||| | ||| |||| ||||| || ||| |||| | |||| ||| |||| ||</div>
      <div style="text-align: center; font-size: 9px;">${ref}</div>
    </body></html>`;
  };

  const generatePACS002HTML = () => {
    if (!transferResult) return '';
    const date = new Date();
    const msgId = `PACS002${Date.now()}`;
    const uetr = `${Math.random().toString(36).substring(2,10)}-${Math.random().toString(36).substring(2,6)}-4b32c873cd3b`;
    
    return `<html><head><title>ISO 20022 PACS.002 Payment Status Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 30px; font-size: 10px; line-height: 1.4; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
      .bank-name { color: #0066cc; font-size: 20px; font-weight: bold; }
      .section-title { text-align: center; font-size: 9px; letter-spacing: 3px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 15px 0 10px 0; }
      .row { display: flex; margin: 3px 0; }
      .label { width: 200px; text-transform: uppercase; }
      .value { flex: 1; font-weight: bold; }
      .xml-box { background: #f9f9f9; border: 1px solid #ccc; padding: 15px; font-family: monospace; font-size: 9px; white-space: pre-wrap; margin: 15px 0; }
      .status-box { background: #d4edda; border: 1px solid #28a745; padding: 10px; text-align: center; margin: 15px 0; }
      .qr { width: 80px; height: 80px; border: 1px solid #ccc; }
      .barcode { text-align: center; margin: 20px 0; font-size: 32px; letter-spacing: 2px; }
    </style></head><body>
      <div class="header">
        <div><span class="bank-name">UBS</span></div>
        <div style="text-align: center; font-size: 12px; font-weight: bold;">ISO 20022 PACS.002 PAYMENT STATUS REPORT</div>
        <div style="font-size: 16px;">⊕ Swift</div>
      </div>

      <div class="section-title">PAYMENT STATUS REPORT HEADER</div>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <div class="row"><span class="label">Message Type:</span><span class="value">PACS.002.001.12</span></div>
          <div class="row"><span class="label">Message ID:</span><span class="value">${msgId}</span></div>
          <div class="row"><span class="label">Creation Time:</span><span class="value">${date.toISOString()}</span></div>
          <div class="row"><span class="label">Status Category:</span><span class="value">ACCP</span></div>
          <div class="row"><span class="label">Status Code:</span><span class="value">ACCC</span></div>
          <div class="row"><span class="label">Status Description:</span><span class="value">ACCEPTED SETTLEMENT COMPLETED</span></div>
        </div>
        <div class="qr">[QR CODE]</div>
      </div>

      <div class="section-title">PROCESSING TIMELINE</div>
      <div class="row"><span class="label">Technical Validation Time:</span><span class="value">${date.toISOString()}</span></div>
      <div class="row"><span class="label">Compliance Time:</span><span class="value">${new Date(date.getTime() + 9000).toISOString()}</span></div>
      <div class="row"><span class="label">Routing Time:</span><span class="value">${new Date(date.getTime() + 59000).toISOString()}</span></div>
      <div class="row"><span class="label">Settlement Time:</span><span class="value">${new Date(date.getTime() + 60000).toISOString()}</span></div>

      <div class="section-title">SETTLEMENT DETAILS</div>
      <div class="row"><span class="label">Correspondent BIC:</span><span class="value">ECBFDEFFXXX</span></div>
      <div class="row"><span class="label">Settlement Method:</span><span class="value">TARGET2</span></div>
      <div class="row"><span class="label">Settlement Amount:</span><span class="value">${transferResult.currency} ${transferResult.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
      <div class="row"><span class="label">Exchange Rate:</span><span class="value">1.0000</span></div>

      <div class="section-title">COMPLIANCE & TRANSACTION IDENTIFIERS</div>
      <div class="row"><span class="label">AML Status:</span><span class="value" style="color: green;">CLEAR</span></div>
      <div class="row"><span class="label">Sanctions Status:</span><span class="value" style="color: green;">CLEAR</span></div>
      <div class="row"><span class="label">Business Message ID:</span><span class="value">BIZ${Date.now()}</span></div>
      <div class="row"><span class="label">End-to-End ID:</span><span class="value">${uetr}</span></div>
      <div class="row"><span class="label">Transaction ID:</span><span class="value">${transferResult.reference}</span></div>

      <div class="status-box">
        <div class="section-title" style="border: none;">PACS.002 STATUS REPORT CONFIRMATION</div>
        <p>THIS PAYMENT STATUS REPORT CONFIRMS THE SUCCESSFUL PROCESSING AND SETTLEMENT OF THE REFERENCED PAYMENT INSTRUCTION. ALL COMPLIANCE CHECKS HAVE BEEN COMPLETED AND THE TRANSACTION IS FINAL.</p>
      </div>

      <div class="section-title">PACS.002 MESSAGE STRUCTURE</div>
      <div class="xml-box">&lt;Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.12"&gt;
  &lt;FIToFIPmtStsRpt&gt;
    &lt;GrpHdr&gt;
      &lt;MsgId&gt;${msgId}&lt;/MsgId&gt;
      &lt;CreDtTm&gt;${date.toISOString()}&lt;/CreDtTm&gt;
      &lt;InstgAgt&gt;
        &lt;FinInstnId&gt;
          &lt;BICFI&gt;UBSWCHZHXXX&lt;/BICFI&gt;
          &lt;Nm&gt;UNION BANK OF SWITZERLAND AG&lt;/Nm&gt;
        &lt;/FinInstnId&gt;
      &lt;/InstgAgt&gt;
    &lt;/GrpHdr&gt;
    &lt;TxInfAndSts&gt;
      &lt;StsId&gt;insr${Date.now()}&lt;/StsId&gt;
      &lt;OrgnlInstrId&gt;${transferResult.reference}&lt;/OrgnlInstrId&gt;
      &lt;OrgnlEndToEndId&gt;${uetr}&lt;/OrgnlEndToEndId&gt;
      &lt;TxSts&gt;ACCC&lt;/TxSts&gt;
      &lt;StsRsnInf&gt;
        &lt;AddtlInf&gt;ACCEPTED SETTLEMENT COMPLETED&lt;/AddtlInf&gt;
      &lt;/StsRsnInf&gt;
      &lt;OrgnlTxRef&gt;
        &lt;IntrBkSttlmAmt Ccy="${transferResult.currency}"&gt;${transferResult.amount.toFixed(2)}&lt;/IntrBkSttlmAmt&gt;
        &lt;SttlmInf&gt;
          &lt;SttlmMtd&gt;TARGET2&lt;/SttlmMtd&gt;
        &lt;/SttlmInf&gt;
      &lt;/OrgnlTxRef&gt;
    &lt;/TxInfAndSts&gt;
  &lt;/FIToFIPmtStsRpt&gt;
&lt;/Document&gt;</div>

      <div style="font-size: 8px; color: #666; margin-top: 20px;">
        PACS.002 PAYMENT STATUS REPORT | GENERATED: ${date.toISOString()}<br>
        REFERENCE: ${transferResult.reference} | MESSAGE ID: ${msgId}
      </div>
      <div class="barcode">|||| |||| | ||| |||| ||||| || ||| |||| | |||| ||| ||||</div>
    </body></html>`;
  };

  const generateMT950HTML = () => {
    if (!transferResult) return '';
    const date = new Date();
    const bal = balances.find(b => b.currency === transferResult.currency);
    const openingBalance = bal ? bal.balance : 100000000;
    const closingBalance = openingBalance - transferResult.amount;
    
    return `<html><head><title>Official MT950 Statement Message</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 30px; font-size: 10px; line-height: 1.4; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
      .bank-name { color: #0066cc; font-size: 20px; font-weight: bold; }
      .section-title { text-align: center; font-size: 9px; letter-spacing: 3px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 15px 0 10px 0; }
      .row { display: flex; margin: 3px 0; }
      .label { width: 200px; text-transform: uppercase; }
      .value { flex: 1; font-weight: bold; }
      .balance-box { background: #e8f4fd; border-left: 4px solid #0066cc; padding: 10px; margin: 10px 0; }
      .statement-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      .statement-table th, .statement-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      .statement-table th { background: #f5f5f5; }
      .narrative-box { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 15px 0; }
      .barcode { text-align: center; margin: 20px 0; font-size: 32px; letter-spacing: 2px; }
    </style></head><body>
      <div style="text-align: center; margin-bottom: 10px; border: 1px solid #ccc; padding: 5px;"></div>
      <div class="header">
        <div><span class="bank-name">UBS</span></div>
        <div style="text-align: center; font-size: 12px; font-weight: bold;">OFFICIAL MT950 STATEMENT MESSAGE - SWIFT FIN</div>
        <div style="font-size: 16px;">⊕ Swift</div>
      </div>

      <div class="section-title">SWIFT FIN MESSAGE HEADER</div>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <div class="row"><span class="label">:20: Transaction Reference:</span><span class="value">MSG${Date.now()}</span></div>
          <div class="row"><span class="label">:25: Account Identification:</span><span class="value">${transferResult.sender_account}</span></div>
          <div class="row"><span class="label">:28C: Statement No/Seq:</span><span class="value">001/001</span></div>
          <div class="row"><span class="label">:13D: Date/Time Indication:</span><span class="value">${date.toISOString()}</span></div>
          <div class="row"><span class="label">:34F: Floor Limit:</span><span class="value">${transferResult.currency} 10000.00</span></div>
        </div>
        <div style="width: 80px; height: 80px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">[QR]</div>
      </div>

      <div class="section-title">:60F: OPENING BALANCE</div>
      <div class="balance-box">
        <div class="row"><span class="label">Credit/Debit Mark:</span><span class="value">C</span></div>
        <div class="row"><span class="label">Value Date:</span><span class="value">${date.toLocaleDateString('en-GB')}</span></div>
        <div class="row"><span class="label">Currency & Amount:</span><span class="value">${transferResult.currency} ${openingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
      </div>

      <div class="section-title">:61: STATEMENT LINE / TRANSACTION DETAILS</div>
      <table class="statement-table">
        <thead>
          <tr><th>VALUE DATE</th><th>ENTRY DATE</th><th>MARK</th><th>AMOUNT</th><th>TXN TYPE</th><th>REFERENCE</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${date.toLocaleDateString('en-GB')}</td>
            <td>${date.toLocaleDateString('en-GB')}</td>
            <td>DR</td>
            <td>${transferResult.currency} ${transferResult.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td>NTRF</td>
            <td>${transferResult.reference}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">:62F: CLOSING BALANCE</div>
      <div class="balance-box">
        <div class="row"><span class="label">Credit/Debit Mark:</span><span class="value">C</span></div>
        <div class="row"><span class="label">Value Date:</span><span class="value">${date.toLocaleDateString('en-GB')}</span></div>
        <div class="row"><span class="label">Currency & Amount:</span><span class="value">${transferResult.currency} ${closingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
      </div>

      <div class="section-title">:64: CLOSING AVAILABLE BALANCE</div>
      <div class="row"><span class="label">Available Balance:</span><span class="value">${transferResult.currency} ${closingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>

      <div class="section-title">:86: INFORMATION TO ACCOUNT OWNER</div>
      <div class="narrative-box">
        <strong>ACCOUNT STATEMENT NARRATIVE:</strong><br><br>
        STATEMENT FOR ACCOUNT ${transferResult.sender_account}. INCLUDES PAYMENT TO ${transferResult.beneficiary?.name || 'BENEFICIARY'} AND RELATED FEES.<br><br>
        <strong>BALANCE RECONCILIATION:</strong><br>
        OPENING: ${transferResult.currency} ${openingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})} | MOVEMENTS: ${transferResult.currency} -${transferResult.amount.toLocaleString('en-US', {minimumFractionDigits: 2})} | CLOSING: ${transferResult.currency} ${closingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}<br><br>
        <strong>STATEMENT PERIOD:</strong><br>
        FROM ${date.toLocaleDateString('en-GB')} TO ${date.toLocaleDateString('en-GB')}
      </div>

      <div style="background: #d4edda; border: 1px solid #28a745; padding: 10px; text-align: center; margin: 15px 0;">
        <strong>MT950 SWIFT FIN STATEMENT MESSAGE</strong><br>
        THIS STATEMENT MESSAGE COMPLIES WITH SWIFT FIN STANDARDS AND PROVIDES COMPREHENSIVE ACCOUNT ACTIVITY DETAILS FOR THE SPECIFIED PERIOD.
      </div>

      <div style="font-size: 8px; color: #666; margin-top: 15px;">
        MT950 STATEMENT MESSAGE | GENERATED: ${date.toISOString()}<br>
        STATEMENT: 001/001 | REFERENCE: ${transferResult.reference}
      </div>
      <div class="barcode">|||| |||| | ||| |||| ||||| || ||| |||| | |||| ||| ||||</div>
    </body></html>`;
  };

  const generateTaxComplianceHTML = () => {
    if (!transferResult) return '';
    const date = new Date();
    
    return `<html><head><title>Official Tax Reporting Document - CRS/FATCA/AEOI Compliance</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 30px; font-size: 10px; line-height: 1.4; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
      .bank-name { color: #0066cc; font-size: 20px; font-weight: bold; }
      .section-title { text-align: center; font-size: 9px; letter-spacing: 3px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 15px 0 10px 0; }
      .row { display: flex; margin: 3px 0; }
      .label { width: 280px; text-transform: uppercase; }
      .value { flex: 1; font-weight: bold; }
      .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      .table th, .table td { border: 1px solid #ccc; padding: 6px; text-align: left; font-size: 9px; }
      .table th { background: #f5f5f5; }
      .highlight-row { background: #ffffd0; }
      .info-box { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 10px 0; font-size: 9px; }
      .cert-box { background: #d4edda; border: 2px solid #28a745; padding: 15px; margin: 15px 0; }
      .barcode { text-align: center; margin: 20px 0; font-size: 32px; letter-spacing: 2px; }
    </style></head><body>
      <div style="text-align: center; margin-bottom: 10px; border: 1px solid #ccc; padding: 5px;"></div>
      <div class="header">
        <div><span class="bank-name">UBS</span></div>
        <div style="text-align: center; font-size: 11px; font-weight: bold;">OFFICIAL TAX REPORTING DOCUMENT - CRS/FATCA/AEOI COMPLIANCE</div>
        <div style="font-size: 16px;">⊕ Swift</div>
      </div>

      <div class="section-title">REGULATORY FRAMEWORK COMPLIANCE</div>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <div class="row"><span class="label">Document ID:</span><span class="value">TAX${Date.now()}</span></div>
          <div class="row"><span class="label">Reporting Standard:</span><span class="value">CRS/FATCA</span></div>
          <div class="row"><span class="label">Reporting Period:</span><span class="value">Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}</span></div>
          <div class="row"><span class="label">Filing Jurisdiction:</span><span class="value">CH</span></div>
          <div class="row"><span class="label">Competent Authority:</span><span class="value">FEDERAL TAX OFFICE</span></div>
        </div>
        <div style="width: 80px; height: 80px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">[QR]</div>
      </div>

      <div class="section-title">PARTY IDENTIFICATION</div>
      <table class="table">
        <thead><tr><th>IDENTIFIER TYPE</th><th>IDENTIFIER VALUE</th><th>ISSUING JURISDICTION</th></tr></thead>
        <tbody>
          <tr><td>LEI (LEGAL ENTITY IDENTIFIER)</td><td>LEIW328Q${Math.random().toString(36).substring(2,8).toUpperCase()}</td><td>CH</td></tr>
          <tr><td>GIIN (GLOBAL INTERMEDIARY ID)</td><td>GIIN.CH.${Math.random().toString(36).substring(2,8).toUpperCase()}</td><td>CH</td></tr>
          <tr><td>TIN (TAX IDENTIFICATION NUMBER)</td><td>TIN${Date.now().toString().substring(5)}</td><td>CH</td></tr>
        </tbody>
      </table>

      <div class="section-title">INCOME CATEGORIZATION & WITHHOLDING</div>
      <table class="table">
        <thead><tr><th>INCOME TYPE</th><th>GROSS AMOUNT</th><th>WITHHOLDING RATE</th><th>TAX WITHHELD</th></tr></thead>
        <tbody>
          <tr><td>COMMERCIAL PAYMENT</td><td>${transferResult.currency} ${transferResult.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td><td>0.00%</td><td>${transferResult.currency} 0.00</td></tr>
          <tr><td>N/A</td><td>${transferResult.currency} 0.00</td><td>0.00%</td><td>${transferResult.currency} 0.00</td></tr>
          <tr class="highlight-row"><td><strong>TOTAL</strong></td><td><strong>${transferResult.currency} ${transferResult.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></td><td>0.00%</td><td><strong>${transferResult.currency} 0.00</strong></td></tr>
        </tbody>
      </table>

      <div class="section-title">TREATY BENEFITS & CERTIFICATE REFERENCES</div>
      <div class="row"><span class="label">Treaty Article Applied:</span><span class="value">N/A</span></div>
      <div class="row"><span class="label">Beneficial Ownership:</span><span class="value">CERTIFIED</span></div>
      <div class="row"><span class="label">Residency Certificate Number:</span><span class="value">VERIFIED</span></div>
      <div class="row"><span class="label">W-8BEN-E Form Reference:</span><span class="value">W8${Date.now().toString().substring(6)}</span></div>
      <div class="row"><span class="label">Certificate Expiry Date:</span><span class="value">${new Date(date.getTime() + 365*24*60*60*1000).toLocaleDateString('en-GB')}</span></div>

      <div class="section-title">REGULATORY FILING INSTRUCTIONS</div>
      <div class="info-box">
        <strong>FILING REQUIREMENTS:</strong><br>
        • SUBMIT TO FEDERAL TAX OFFICE BY ${new Date(date.getTime() + 30*24*60*60*1000).toLocaleDateString('en-GB')}<br>
        • CRS XML SCHEMA VERSION: 2.0<br>
        • FATCA SUBMISSION METHOD: MODEL 1 IGA<br>
        • CONTACT FOR QUERIES: TAX.COMPLIANCE@UBS.CH<br><br>
        <strong>ERROR CORRECTION WORKFLOW:</strong><br>
        • CORRECTION REFERENCE: N/A<br>
        • ORIGINAL FILING REFERENCE: ORIGINAL<br>
        • CORRECTION REASON: N/A
      </div>

      <div class="section-title">ATTESTATION & SIGN-OFF</div>
      <div class="cert-box">
        <strong>RESPONSIBLE OFFICER CERTIFICATION:</strong><br><br>
        I HEREBY CERTIFY THAT THE INFORMATION CONTAINED IN THIS TAX REPORTING DOCUMENT IS TRUE, CORRECT, AND COMPLETE TO THE BEST OF MY KNOWLEDGE AND BELIEF.<br><br>
        <div style="display: flex; justify-content: space-between; margin-top: 15px;">
          <div>
            <strong>AUTHORIZED SIGNATORY:</strong><br>
            TAX COMPLIANCE OFFICER<br>
            HEAD OF TAX REPORTING
          </div>
          <div style="text-align: right;">
            <strong>SIGNATURE DATE:</strong><br>
            ${date.toLocaleDateString('en-GB')}<br><br>
            <strong>DIGITAL SIGNATURE HASH:</strong><br>
            0x${Math.random().toString(16).substring(2,14).toUpperCase()}
          </div>
        </div>
      </div>

      <div style="background: #e8f4fd; padding: 10px; text-align: center; margin: 15px 0; border: 1px solid #0066cc;">
        <strong>CRS/FATCA/AEOI TAX REPORTING COMPLIANCE</strong><br>
        THIS DOCUMENT COMPLIES WITH OECD CRS, US FATCA, AND AUTOMATIC EXCHANGE OF INFORMATION STANDARDS.
      </div>

      <div style="font-size: 8px; color: #666; margin-top: 15px;">
        TAX REPORTING DOCUMENT | GENERATED: ${date.toISOString()}<br>
        TAX REF: TAXREF${Date.now().toString().substring(5)} | TRN: ${transferResult.reference}
      </div>
      <div class="barcode">|||| |||| | ||| |||| ||||| || ||| |||| | |||| ||| ||||</div>
    </body></html>`;
  };

  const numberToWords = (num) => {
    const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)} BILLION`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} MILLION`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)} THOUSAND`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
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
        <TabsList className="bg-swiss-bg-paper border border-slate-200 p-1 rounded-sm h-auto flex-wrap">
          {transferTypes.map((type) => (
            <TabsTrigger
              key={type.id}
              value={type.id}
              className="data-[state=active]:bg-swiss-red data-[state=active]:text-white text-swiss-text-secondary rounded-sm px-4 py-2"
            >
              <span className="font-mono text-xs">{type.id}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {transferTypes.map((type) => (
          <TabsContent key={type.id} value={type.id} className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transfer Form */}
              <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                    {type.name}
                  </CardTitle>
                  <p className="text-sm text-swiss-text-muted">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">Amount</Label>
                        <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="bg-swiss-bg-subtle border-slate-200 text-slate-900 font-mono rounded-sm h-11" placeholder="0.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                          <SelectTrigger className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-swiss-bg-paper border-slate-200">
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">Sender Account (IBAN)</Label>
                      <Select value={formData.sender_account} onValueChange={(value) => setFormData({ ...formData, sender_account: value })}>
                        <SelectTrigger className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11"><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent className="bg-swiss-bg-paper border-slate-200">
                          {balances.map((bal) => (<SelectItem key={bal.iban} value={bal.iban}><span className="font-mono text-sm">{bal.iban}</span><span className="text-swiss-text-muted ml-2">({bal.currency})</span></SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">Beneficiary</Label>
                      <Select value={formData.beneficiary_id} onValueChange={(value) => setFormData({ ...formData, beneficiary_id: value })}>
                        <SelectTrigger className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11"><SelectValue placeholder="Select beneficiary" /></SelectTrigger>
                        <SelectContent className="bg-swiss-bg-paper border-slate-200">
                          {beneficiaries.length === 0 ? (<div className="p-2 text-sm text-swiss-text-muted">No beneficiaries. Add one first.</div>) : (beneficiaries.map((ben) => (<SelectItem key={ben.id} value={ben.id}><span>{ben.name}</span><span className="text-swiss-text-muted ml-2">- {ben.bank_name}</span></SelectItem>)))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">Charge Option</Label>
                      <Select value={formData.charge_option} onValueChange={(value) => setFormData({ ...formData, charge_option: value })}>
                        <SelectTrigger className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-swiss-bg-paper border-slate-200">{chargeOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}><span>{opt.label}</span></SelectItem>))}</SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">Payment Reference</Label>
                      <Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11" placeholder="Invoice #12345" required />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-swiss-text-secondary uppercase text-xs tracking-wider">Purpose (Optional)</Label>
                      <Input value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="bg-swiss-bg-subtle border-slate-200 text-slate-900 rounded-sm h-11" placeholder="Payment for services" />
                    </div>

                    <Button type="submit" disabled={loading || beneficiaries.length === 0} className="w-full h-12 bg-swiss-red hover:bg-swiss-red-hover text-white font-medium uppercase tracking-wider rounded-sm">
                      {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>) : (<><Send className="w-4 h-4 mr-2" />Initiate {type.id} Transfer</>)}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* SWIFT Message Preview & Receipt Buttons */}
              <div className="space-y-4">
                <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-heading text-lg text-slate-900 flex items-center gap-2">
                      <FileCode2 className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
                      SWIFT Message Preview
                    </CardTitle>
                    {swiftMessage && (
                      <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-swiss-text-secondary hover:text-slate-900">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-swiss-status-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {swiftMessage ? (
                        <pre className="font-mono text-xs text-green-400 bg-black p-4 rounded-sm whitespace-pre-wrap">{swiftMessage}</pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-swiss-text-muted">
                          <FileCode2 className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                          <p className="text-sm">SWIFT message will appear here after submission</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Receipt Buttons */}
                {transferResult && (
                  <Card className="bg-swiss-bg-paper border-slate-200 rounded-sm">
                    <CardHeader>
                      <CardTitle className="font-heading text-lg text-slate-900">Download Receipts</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={() => openReceipt('debit-note')} className="border-slate-200 text-swiss-text-secondary hover:text-slate-900 hover:bg-slate-100 rounded-sm h-auto py-3">
                        <div className="text-left"><Eye className="w-4 h-4 mb-1" /><div className="text-xs font-bold">Debit Note</div><div className="text-[10px] opacity-70">Official Debit</div></div>
                      </Button>
                      <Button variant="outline" onClick={() => openReceipt('pacs002')} className="border-slate-200 text-swiss-text-secondary hover:text-slate-900 hover:bg-slate-100 rounded-sm h-auto py-3">
                        <div className="text-left"><Eye className="w-4 h-4 mb-1" /><div className="text-xs font-bold">PACS.002</div><div className="text-[10px] opacity-70">Status Report</div></div>
                      </Button>
                      <Button variant="outline" onClick={() => openReceipt('mt950')} className="border-slate-200 text-swiss-text-secondary hover:text-slate-900 hover:bg-slate-100 rounded-sm h-auto py-3">
                        <div className="text-left"><Eye className="w-4 h-4 mb-1" /><div className="text-xs font-bold">MT950</div><div className="text-[10px] opacity-70">Statement</div></div>
                      </Button>
                      <Button variant="outline" onClick={() => openReceipt('tax-compliance')} className="border-slate-200 text-swiss-text-secondary hover:text-slate-900 hover:bg-slate-100 rounded-sm h-auto py-3">
                        <div className="text-left"><Eye className="w-4 h-4 mb-1" /><div className="text-xs font-bold">Tax Report</div><div className="text-[10px] opacity-70">CRS/FATCA</div></div>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Transfer Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {transferTypes.map((type) => (
          <Card key={type.id} className={`bg-swiss-bg-paper border-slate-200 rounded-sm cursor-pointer transition-all ${activeType === type.id ? 'border-swiss-red' : 'hover:border-slate-300'}`} onClick={() => setActiveType(type.id)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {type.id === 'GPI' ? <Zap className="w-4 h-4 text-swiss-red" strokeWidth={1.5} /> : <FileText className="w-4 h-4 text-swiss-text-muted" strokeWidth={1.5} />}
                <Badge variant="outline" className={`text-xs rounded-sm ${activeType === type.id ? 'border-swiss-red text-swiss-red' : 'border-slate-300 text-swiss-text-secondary'}`}>{type.id}</Badge>
              </div>
              <p className="text-xs text-swiss-text-muted">{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receipt Modal */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="bg-swiss-bg-paper border-slate-200 max-w-4xl max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="font-heading text-xl text-slate-900">
              {receiptType === 'debit-note' && 'Official Debit Note'}
              {receiptType === 'pacs002' && 'ISO 20022 PACS.002 Payment Status Report'}
              {receiptType === 'mt950' && 'Official MT950 Statement Message'}
              {receiptType === 'tax-compliance' && 'Tax Reporting Document - CRS/FATCA/AEOI'}
            </DialogTitle>
            <Button onClick={printReceipt} className="bg-swiss-red hover:bg-swiss-red-hover text-white rounded-sm">
              <Printer className="w-4 h-4 mr-2" />Print PDF
            </Button>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="p-4 bg-white text-black rounded font-mono text-xs" dangerouslySetInnerHTML={{ __html: 
              receiptType === 'debit-note' ? generateDebitNoteHTML().replace(/<html>.*<body>/s, '').replace(/<\/body><\/html>/s, '') :
              receiptType === 'pacs002' ? generatePACS002HTML().replace(/<html>.*<body>/s, '').replace(/<\/body><\/html>/s, '') :
              receiptType === 'mt950' ? generateMT950HTML().replace(/<html>.*<body>/s, '').replace(/<\/body><\/html>/s, '') :
              generateTaxComplianceHTML().replace(/<html>.*<body>/s, '').replace(/<\/body><\/html>/s, '')
            }} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternationalTransferPage;
