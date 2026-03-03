import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import {
  Terminal,
  Play,
  RefreshCw,
  Trash2,
  ChevronRight
} from 'lucide-react';

const ServerConsolePage = () => {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [executing, setExecuting] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/server/logs');
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch server logs');
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim();
    setHistory(prev => [...prev, { type: 'input', text: cmd }]);
    setCommand('');
    setHistoryIndex(-1);
    
    if (cmd.toLowerCase() === 'clear') {
      setHistory([]);
      return;
    }

    setExecuting(true);
    try {
      const response = await api.post('/server/command', { command: cmd });
      
      if (response.data.output === 'CLEAR') {
        setHistory([]);
      } else {
        setHistory(prev => [...prev, { type: 'output', text: response.data.output }]);
      }
    } catch (error) {
      setHistory(prev => [...prev, { type: 'error', text: 'Command execution failed' }]);
    } finally {
      setExecuting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    const inputHistory = history.filter(h => h.type === 'input').map(h => h.text);
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < inputHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(inputHistory[inputHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(inputHistory[inputHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'WARN': return 'text-amber-400';
      case 'ERROR': return 'text-red-400';
      case 'DEBUG': return 'text-swiss-text-muted';
      default: return 'text-swiss-text-secondary';
    }
  };

  return (
    <div className="space-y-6" data-testid="server-console-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-tight flex items-center gap-3">
            <Terminal className="w-8 h-8 text-swiss-red" strokeWidth={1.5} />
            Server Console
          </h1>
          <p className="text-swiss-text-secondary mt-1">
            System terminal and server logs
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          variant="outline"
          className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm"
          data-testid="refresh-logs"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terminal */}
        <Card className="bg-black border-white/10 rounded-sm">
          <CardHeader className="border-b border-white/10 py-3">
            <CardTitle className="font-mono text-sm text-green-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              UBS-ADMIN-TERMINAL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              className="h-[500px] overflow-y-auto p-4 font-mono text-sm"
            >
              {/* Welcome message */}
              <div className="text-green-400 mb-4">
                <p>Union Bank of Switzerland AG - Server Terminal v2.4.1</p>
                <p className="text-swiss-text-muted">Type 'help' for available commands</p>
                <p className="text-swiss-text-muted">-------------------------------------------</p>
              </div>

              {/* Command history */}
              {history.map((item, index) => (
                <div key={index} className="mb-2">
                  {item.type === 'input' ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <ChevronRight className="w-4 h-4" />
                      <span>{item.text}</span>
                    </div>
                  ) : item.type === 'error' ? (
                    <div className="text-red-400 pl-6 whitespace-pre-wrap">{item.text}</div>
                  ) : (
                    <div className="text-white pl-6 whitespace-pre-wrap">{item.text}</div>
                  )}
                </div>
              ))}

              {/* Input line */}
              <form onSubmit={executeCommand} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-green-400 flex-shrink-0" />
                <Input
                  ref={inputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none text-green-400 font-mono text-sm focus:ring-0 focus-visible:ring-0 h-6 p-0"
                  placeholder={executing ? 'Executing...' : ''}
                  disabled={executing}
                  data-testid="terminal-input"
                  autoComplete="off"
                />
                <span className="text-green-400 cursor-blink">▌</span>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Server Logs */}
        <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg text-white">
              Server Logs
            </CardTitle>
            <Badge className="bg-swiss-status-success/20 text-swiss-status-success rounded-sm text-xs">
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 bg-swiss-bg-subtle/50 rounded-sm border border-white/5 font-mono text-xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`rounded-sm text-[10px] px-1.5 ${
                          log.level === 'INFO' ? 'bg-blue-500/20 text-blue-400' :
                          log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400' :
                          log.level === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                          'bg-swiss-bg-subtle text-swiss-text-muted'
                        }`}>
                          {log.level}
                        </Badge>
                        <span className="text-swiss-text-muted">{log.service}</span>
                      </div>
                      <span className="text-swiss-text-muted text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-swiss-text-secondary mt-2">{log.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Commands */}
      <Card className="bg-swiss-bg-paper border-white/10 rounded-sm">
        <CardHeader>
          <CardTitle className="font-heading text-sm text-swiss-text-secondary uppercase tracking-wider">
            Quick Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['status', 'balance', 'swift-status', 'db-status', 'time', 'version', 'help'].map((cmd) => (
              <Button
                key={cmd}
                variant="outline"
                size="sm"
                onClick={() => {
                  setCommand(cmd);
                  inputRef.current?.focus();
                }}
                className="border-white/10 text-swiss-text-secondary hover:text-white hover:bg-white/5 rounded-sm font-mono text-xs"
                data-testid={`quick-cmd-${cmd}`}
              >
                {cmd}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerConsolePage;
