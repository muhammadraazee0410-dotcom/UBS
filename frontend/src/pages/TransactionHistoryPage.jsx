import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  History,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download
} from 'lucide-react';

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?transaction_type=${filter}` : '';
      const response = await api.get(`/transactions${params}`);
      setTransactions(response.data);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Math.abs(amount));
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.reference?.toLowerCase().includes(searchLower) ||
      tx.counterparty?.toLowerCase().includes(searchLower)
    );
  });

  const getTypeColor = (type) => {
    if (type.includes('INTL')) return 'bg-blue-500/20 text-blue-400';
    if (type === 'DOMESTIC') return 'bg-emerald-500/20 text-emerald-400';
    if (type === 'BILL_PAYMENT') return 'bg-amber-500/20 text-amber-400';
    return 'bg-swiss-bg-subtle text-swiss-text-secondary';
  };

  return (
    <div className="space-y-6" data-testid="transaction-history-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Transaction History
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            Complete record of all transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm"
            data-testid="export-transactions"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={fetchTransactions}
            variant="outline"
            className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm"
            data-testid="refresh-transactions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-swiss-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-10"
                placeholder="Search transactions..."
                data-testid="search-transactions"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px] bg-swiss-bg-subtle border-white/10 text-white rounded-sm h-10" data-testid="filter-type">
                <Filter className="w-4 h-4 mr-2 text-swiss-text-muted" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-swiss-bg-paper border-white/10">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="INTL_MT103">International MT103</SelectItem>
                <SelectItem value="INTL_PACS008">International PACS.008</SelectItem>
                <SelectItem value="INTL_PACS009">International PACS.009</SelectItem>
                <SelectItem value="INTL_GPI">SWIFT GPI</SelectItem>
                <SelectItem value="DOMESTIC">Domestic</SelectItem>
                <SelectItem value="BILL_PAYMENT">Bill Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-white flex items-center justify-between">
            <span>Transactions</span>
            <Badge className="bg-swiss-bg-subtle text-swiss-text-secondary rounded-sm">
              {filteredTransactions.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-swiss-text-muted" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-swiss-text-muted">
                <History className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                <p className="text-sm">No transactions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Date</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Type</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Description</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Reference</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Counterparty</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider text-right">Amount</TableHead>
                    <TableHead className="text-swiss-text-muted uppercase text-xs tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-xs text-swiss-text-secondary">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTypeColor(tx.transaction_type)} rounded-sm text-xs`}>
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-sm max-w-[200px] truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-swiss-text-muted">
                        {tx.reference}
                      </TableCell>
                      <TableCell className="text-swiss-text-secondary text-sm">
                        {tx.counterparty}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.amount < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className={`font-mono text-sm ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formatCurrency(tx.amount, tx.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs">
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistoryPage;
