import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@ubs.ch');
  const [password, setPassword] = useState('UBS@2024');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-swiss-bg flex">
      {/* Left side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1618035212548-5ce1cd822564?w=1920)',
            filter: 'brightness(0.3)'
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-swiss-red rounded-sm flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-heading font-black text-2xl text-white tracking-tight">
                UNION BANK OF SWITZERLAND
              </h1>
              <p className="text-swiss-text-muted text-sm uppercase tracking-widest">
                Administration Portal
              </p>
            </div>
          </div>
          
          <div>
            <h2 className="font-heading font-light text-5xl text-white leading-tight mb-6">
              SECURE<br />
              <span className="font-black">BANKING</span><br />
              ADMINISTRATION
            </h2>
            <div className="flex gap-8">
              <div>
                <p className="font-mono text-3xl text-swiss-red font-bold">150T+</p>
                <p className="text-swiss-text-muted text-sm">EUR Balance</p>
              </div>
              <div>
                <p className="font-mono text-3xl text-swiss-red font-bold">15T+</p>
                <p className="text-swiss-text-muted text-sm">USD Balance</p>
              </div>
              <div>
                <p className="font-mono text-3xl text-swiss-red font-bold">790B+</p>
                <p className="text-swiss-text-muted text-sm">CHF Balance</p>
              </div>
            </div>
          </div>

          <p className="text-swiss-text-muted text-xs">
            © 2024 Union Bank of Switzerland AG. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-swiss-red rounded-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-heading font-black text-lg text-white">UBS AG</h1>
              <p className="text-swiss-text-muted text-xs uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-heading font-black text-3xl text-white mb-2">
              ADMINISTRATOR LOGIN
            </h2>
            <p className="text-swiss-text-secondary">
              Enter your credentials to access the admin portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-swiss-text-muted" strokeWidth={1.5} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-swiss-bg-paper border-white/10 text-white placeholder:text-swiss-text-muted focus:border-swiss-red focus:ring-swiss-red/20 rounded-sm"
                  placeholder="admin@ubs.ch"
                  data-testid="login-email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-swiss-text-secondary uppercase text-xs tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-swiss-text-muted" strokeWidth={1.5} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 bg-swiss-bg-paper border-white/10 text-white placeholder:text-swiss-text-muted focus:border-swiss-red focus:ring-swiss-red/20 rounded-sm"
                  placeholder="••••••••"
                  data-testid="login-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-swiss-red hover:bg-swiss-red-hover text-white font-body font-medium uppercase tracking-wider rounded-sm transition-all"
              data-testid="login-submit"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-swiss-bg-paper border border-white/10 rounded-sm">
            <p className="text-swiss-text-muted text-xs font-mono">
              Default credentials:<br />
              Email: admin@ubs.ch<br />
              Password: UBS@2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
