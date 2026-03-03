import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Building2,
  Receipt,
  Users,
  Activity,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatLargeNumber = (num) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toFixed(2);
};

const DashboardPage = () => {
  const [balances, setBalances] = useState([]);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, statsRes, txRes] = await Promise.all([
        api.get('/balances'),
        api.get('/dashboard/stats'),
        api.get('/transactions?limit=10')
      ]);
      setBalances(balanceRes.data);
      setStats(statsRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currencyFlags = {
    EUR: '🇪🇺',
    USD: '🇺🇸',
    CHF: '🇨🇭'
  };

  const quickActions = [
    { label: 'International Transfer', icon: Globe, path: '/international-transfer', color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Domestic Transfer', icon: Building2, path: '/domestic-transfer', color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Bill Payment', icon: Receipt, path: '/bill-payment', color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Add Beneficiary', icon: Users, path: '/beneficiaries', color: 'bg-purple-500/10 text-purple-400' },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight">
            Dashboard
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            Union Bank of Switzerland AG - Administrative Overview
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm"
          data-testid="refresh-dashboard"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((balance) => (
          <Card
            key={balance.currency}
            className="bg-swiss-bg-paper border-white/10 rounded-sm swiss-card overflow-hidden"
            data-testid={`balance-card-${balance.currency}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currencyFlags[balance.currency]}</span>
                  <span className="font-heading font-bold text-lg text-white">
                    {balance.currency}
                  </span>
                </div>
                <Badge variant="outline" className="border-swiss-status-success/30 text-swiss-status-success text-xs rounded-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="font-mono text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {formatLargeNumber(balance.balance)}
                </p>
                <p className="font-mono text-sm text-swiss-text-muted">
                  {formatCurrency(balance.balance, balance.currency)}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                <p className="text-xs text-swiss-text-muted uppercase tracking-wider">Account</p>
                <p className="font-mono text-sm text-swiss-text-secondary">{balance.account_number}</p>
                <p className="font-mono text-xs text-swiss-text-muted">{balance.iban}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats and Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Stats Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Activity className="w-5 h-5 text-swiss-text-muted" strokeWidth={1.5} />
                <TrendingUp className="w-4 h-4 text-swiss-status-success" />
              </div>
              <p className="font-mono text-2xl font-bold text-white mt-2">
                {stats?.total_transactions || 0}
              </p>
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mt-1">
                Transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Globe className="w-5 h-5 text-swiss-text-muted" strokeWidth={1.5} />
                <TrendingUp className="w-4 h-4 text-swiss-status-success" />
              </div>
              <p className="font-mono text-2xl font-bold text-white mt-2">
                {stats?.total_transfers || 0}
              </p>
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mt-1">
                Transfers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-swiss-text-muted" strokeWidth={1.5} />
                <Badge className="bg-swiss-bg-subtle text-swiss-text-secondary text-xs rounded-sm px-1">
                  +2
                </Badge>
              </div>
              <p className="font-mono text-2xl font-bold text-white mt-2">
                {stats?.total_beneficiaries || 0}
              </p>
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mt-1">
                Beneficiaries
              </p>
            </CardContent>
          </Card>

          <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <RefreshCw className="w-5 h-5 text-swiss-text-muted" strokeWidth={1.5} />
                <span className="status-dot status-operational" />
              </div>
              <p className="font-mono text-2xl font-bold text-white mt-2">
                {stats?.pending_transfers || 0}
              </p>
              <p className="text-xs text-swiss-text-muted uppercase tracking-wider mt-1">
                Pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4">
          <Card className="bg-swiss-bg-paper border-white/10 rounded-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-sm text-swiss-text-secondary uppercase tracking-wider">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-10 hover:bg-white/5 rounded-sm group"
                    data-testid={`quick-action-${action.path.slice(1)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${action.color}`}>
                        <action.icon className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm text-swiss-text-secondary group-hover:text-white transition-colors">
                        {action.label}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-swiss-text-muted group-hover:text-white transition-colors" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg text-white">
            Recent Transactions
          </CardTitle>
          <Link to="/transactions">
            <Button variant="ghost" size="sm" className="text-swiss-text-secondary hover:text-white text-xs uppercase tracking-wider">
              View All
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-swiss-text-muted">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, index) => (
                  <div
                    key={tx.id || index}
                    className="flex items-center justify-between p-3 bg-swiss-bg-subtle/50 rounded-sm border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                        tx.amount < 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'
                      }`}>
                        {tx.amount < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white">{tx.description}</p>
                        <p className="text-xs text-swiss-text-muted font-mono">{tx.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-medium ${
                        tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount), tx.currency)}
                      </p>
                      <p className="text-xs text-swiss-text-muted">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="status-dot status-operational" />
                <span className="text-sm text-swiss-text-secondary">All Systems Operational</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-xs text-swiss-text-muted font-mono">
                SWIFT Gateway: Connected
              </span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-xs text-swiss-text-muted font-mono">
                Database: Online
              </span>
            </div>
            <span className="text-xs text-swiss-text-muted">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
