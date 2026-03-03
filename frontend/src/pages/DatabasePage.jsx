import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Database,
  RefreshCw,
  Table as TableIcon,
  ChevronRight,
  Loader2,
  HardDrive
} from 'lucide-react';

const DatabasePage = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionData, setCollectionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/database/collections');
      setCollections(response.data);
    } catch (error) {
      toast.error('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionData = async (collectionName) => {
    setLoadingData(true);
    setSelectedCollection(collectionName);
    try {
      const response = await api.get(`/database/${collectionName}`);
      setCollectionData(response.data);
    } catch (error) {
      toast.error('Failed to fetch collection data');
      setCollectionData([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const getCollectionIcon = (name) => {
    switch (name) {
      case 'transfers': return '💸';
      case 'transactions': return '📊';
      case 'beneficiaries': return '👥';
      case 'admin_users': return '🔐';
      case 'bill_payments': return '📄';
      default: return '📁';
    }
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return <span className="text-swiss-text-muted">null</span>;
    if (typeof value === 'boolean') return <Badge className="bg-swiss-bg-subtle text-swiss-text-secondary rounded-sm">{value.toString()}</Badge>;
    if (typeof value === 'object') return <span className="text-swiss-text-muted font-mono text-xs">{JSON.stringify(value).substring(0, 50)}...</span>;
    if (typeof value === 'string' && value.length > 50) return <span title={value}>{value.substring(0, 50)}...</span>;
    return String(value);
  };

  return (
    <div className="space-y-6" data-testid="database-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Database
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            MongoDB collection viewer
          </p>
        </div>
        <Button
          onClick={fetchCollections}
          variant="outline"
          className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm"
          data-testid="refresh-db"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Collections List */}
        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-heading text-sm text-swiss-text-secondary uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Collections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-swiss-text-muted" />
                </div>
              ) : collections.length === 0 ? (
                <div className="p-4 text-swiss-text-muted text-sm">
                  No collections found
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {collections.map((col) => (
                    <Button
                      key={col.name}
                      variant="ghost"
                      onClick={() => fetchCollectionData(col.name)}
                      className={`w-full justify-between h-auto py-3 px-3 rounded-sm ${
                        selectedCollection === col.name
                          ? 'bg-swiss-red text-white'
                          : 'text-swiss-text-secondary hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`collection-${col.name}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getCollectionIcon(col.name)}</span>
                        <span className="font-mono text-sm">{col.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`rounded-sm text-xs ${
                          selectedCollection === col.name
                            ? 'bg-white/20 text-white'
                            : 'bg-swiss-bg-subtle text-swiss-text-muted'
                        }`}>
                          {col.count}
                        </Badge>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Collection Data */}
        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg text-white flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-swiss-red" strokeWidth={1.5} />
              {selectedCollection ? (
                <>
                  <span className="font-mono">{selectedCollection}</span>
                  <Badge className="bg-swiss-bg-subtle text-swiss-text-secondary rounded-sm ml-2">
                    {collectionData.length} documents
                  </Badge>
                </>
              ) : (
                'Select a collection'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              {loadingData ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-swiss-text-muted" />
                </div>
              ) : !selectedCollection ? (
                <div className="flex flex-col items-center justify-center h-64 text-swiss-text-muted">
                  <Database className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                  <p className="text-sm">Select a collection to view documents</p>
                </div>
              ) : collectionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-swiss-text-muted">
                  <TableIcon className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                  <p className="text-sm">No documents in this collection</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      {collectionData[0] && Object.keys(collectionData[0]).slice(0, 6).map((key) => (
                        <TableHead key={key} className="text-swiss-text-muted uppercase text-xs tracking-wider">
                          {key}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionData.map((doc, index) => (
                      <TableRow key={index} className="border-white/5 hover:bg-white/5">
                        {Object.keys(doc).slice(0, 6).map((key) => (
                          <TableCell key={key} className="font-mono text-xs text-swiss-text-secondary max-w-[200px] truncate">
                            {renderValue(doc[key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
          <CardContent className="p-4">
            <p className="text-swiss-text-muted text-xs uppercase tracking-wider mb-1">Collections</p>
            <p className="font-mono text-2xl text-white">{collections.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
          <CardContent className="p-4">
            <p className="text-swiss-text-muted text-xs uppercase tracking-wider mb-1">Total Documents</p>
            <p className="font-mono text-2xl text-white">
              {collections.reduce((sum, col) => sum + col.count, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
          <CardContent className="p-4">
            <p className="text-swiss-text-muted text-xs uppercase tracking-wider mb-1">Database</p>
            <p className="font-mono text-lg text-white">MongoDB</p>
          </CardContent>
        </Card>
        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="status-dot status-operational" />
              <p className="text-swiss-text-muted text-xs uppercase tracking-wider">Status</p>
            </div>
            <p className="font-mono text-lg text-swiss-status-success mt-1">Connected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabasePage;
