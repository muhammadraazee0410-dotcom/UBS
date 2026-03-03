import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const UBSLogo = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1540 558" className={className}>
    <g fillRule="evenodd">
      <path fill="#e60000" d="M900.5 335.8c0 115.5-63 129.3-126 129.3-108.4 0-131.4-55.4-131.4-134.7V106.8h-40V85.2h151.4v21.6h-43v217.1c0 76.6 19.9 114.7 74.9 114.7 56.1 0 83.4-27.7 83.4-107.4V106.8h-40.4V85.2H937v21.6h-36.5zm105.9 103.5V106.7h-42.1V85.2h167.9c71.4 0 106.8 40.4 106.8 87.7 0 50.5-45.7 78.9-86.5 87.4 79.2 7.3 100.7 58.1 100.7 95.5 0 76.2-64.9 105.1-128.7 105.1H961.6v-21.6zm164.1-262.1c0-35-18-70.5-57.6-70.5h-43.6v144.4h39c41.9 0 62.2-35.4 62.2-73.9m13.5 178.6c0-50.1-21.5-83.6-71.9-83.6h-42.8v167.1h34.8c53.4 0 79.9-31.6 79.9-83.5m236.7-254.1c-39.6 0-65 23.5-65 64.3 0 37 40 54.7 78.8 67.8 23 8.1 52.2 18.8 72.2 38.1 21.9 20.8 33.8 48.5 33.1 83.5-1.6 65.4-47.3 109.7-128 110.1-30.3 0-77.6-6.9-106-23.5l-3.1-98.5h23.8c1.9 66.2 33.1 100.8 87.6 100.8 43.8 0 68-29.2 68-73.9 0-38.5-31.9-55-80.3-71.2-15.7-5.4-46.8-16.9-68.7-38.5-19.6-19.6-28.9-44.3-28.9-70.4 0-76.6 54.6-109.7 122.2-109.7 26.9 0 67.3 9.6 90.7 23.1l2.3 85.4h-23.8c-5-60.8-31.5-87.4-74.9-87.4"/>
      <path fill="currentColor" d="m414 161.2-10 8.4 10.6 34.6-31.7-17.3-10.6 8.3 35.1 19-37.3 30.1-10-13.4 13.3-10.6-10-11.7-13.3 10.6-10-12.8 13.3-10.6-10-12.8-68.4 56.8 65.1 52.4 11.6-14.5c8.4.6 14.5 6.7 17.8 14.5l-11.6 14.5 7.2 5.6c16.1-14.5 37.3-24 59-24 45.6 0 81.2 37.4 81.2 83.1 0 15-3.9 31.2-12.3 44.5l12.3 9.5c-.6 8.9-8.9 18.4-17.3 20.6l-11.7-9.4c-16.1 15.6-37.2 23.9-59.5 23.9-45.6 0-81.2-36.2-81.2-82.4 0-15.1 4.5-30.7 11.1-43.5l-6.6-6.2-11.7 15.6c-8.4-1.1-15.6-6.7-17.8-15.6l11.7-13.9-55.1-45.7v72.4l18.3.6c2.3 2.8 3.9 6.7 3.9 11.2 0 3.9-1.6 8.3-3.3 11.7h-18.9v8.9c40 6.7 73.4 40.7 73.4 81.9 0 42.9-32.8 76.9-73.4 83.6v14.5c-3.9 2.2-8.9 3.9-13.4 3.9-5 0-10.5-1.7-15-3.9v-14.5c-40.6-6.7-72.3-40.7-72.3-83.6 0-41.2 31.7-75.2 72.3-81.4v-9.4h-18.9c-2.2-3.4-3.3-7.8-3.3-11.7q0-6.7 3.3-11.8h18.9v-72.4l-55.6 45.7 12.2 13.9c-2.8 8.9-10 14.5-18.3 15.6l-11.7-15.6-7.3 6.2c7.8 12.8 11.7 28.4 11.7 43.5 0 46.2-35.6 82.4-81.2 82.4-21.7 0-43.4-8.3-59-23.9L17.4 446C9.6 443.8 1.3 434.3.2 425.4l11.6-9.5C4.6 402.6.2 386.4.2 371.4c0-45.7 35.6-83.1 81.2-83.1 22.2 0 43.4 9.5 59.5 24l6.7-5-11.7-15.1c2.8-7.8 10-13.4 18.4-14.5l11.6 14.5 65.1-52.4-68.4-56.8-10 12.8 13.3 10.6-10 12.8-13.3-10.6-10 11.7 12.8 10.6-10.1 13.4-36.7-30.1 34.5-19-10-8.3-31.7 17.3 10.6-34.6-10-8.4-11.7 37.9L43 169l10-12.2 12.8 10.6 10.6-12.3L63 143.4l10-11.7 13.4 10 9.4-11.7-28.9-22.8c2.8-9.5 8.9-17.3 17.8-22.9l154.1 126v-84.2h-15.6v16.2h-15.5v-16.2h-16.2v16.2h-16.1V94.9l36.7 15.6V97.1l-33.9-13.9 33.9-13.4V57l-36.7 14.5V23.6h16.1v17.2h16.2V23.6h15.5v17.2h15.6V3c4.5-1.7 9.5-2.8 14.5-2.8 4.4 0 9.4 1.1 13.9 2.8v207.3l154.1-126c8.3 5.6 14.4 13.4 17.8 22.9L409.6 130l10 11.7 13.4-10 10 11.7-13.4 11.7 10 12.3 13.4-10.6 10 12.2-37.3 30.1zm-314.8 228c0 13.4 10 21.7 21.7 22.8l-19.5 15.1c-13.4-5-25.6-21.2-25.6-35.1 0-4.5 1.1-7.3 2.2-10.6-1.6 0-2.8.6-3.9.6-17.8 0-32.8-16.8-36.1-34l20-15.7c-.6 2.3-.6 3.9-.6 5.6 0 11.2 10.6 21.2 21.7 21.2 11.7 0 22.8-10 22.8-21.8 0-14.4-11.1-23.9-25-23.9-27.2 0-53.9 26.2-53.9 60.8 0 10 2.2 19.5 6.6 27.8l12.3-9.5c8.3 3.9 15 12.3 17.2 21.8l-12.2 9.4C58.6 433.8 73 438.2 88 438.2c31.2 0 56.2-25 56.2-47.3 0-12.8-8.9-24-22.2-24-12.3 0-22.8 9.5-22.8 22.3m165.2 47.9c0 12.3 10 22.3 21.7 22.3 8.3 0 11.7-3.3 17.8-8.3v25c-6.1 3.4-12.3 5.1-18.9 5.1-13.4 0-24.5-4-31.7-15.7-7.8 11.7-19 15.7-32.3 15.7-6.1 0-12.8-1.7-18.9-5.1v-25c5.5 5.5 10 8.3 17.8 8.3 12.2 0 21.7-10 21.7-22.3 0-11.7-7.8-22.3-20.6-22.3-22.8 0-32.3 21.8-32.3 41.8 0 29.6 21.7 54.6 50.1 59.7v-15.1c4.4-2.2 9.4-2.8 13.9-2.8 5 0 10 .6 14.5 2.8v15.1c26.1-3.9 50-31.8 50-59.7 0-20.6-8.3-41.8-32.2-41.8-12.3 0-20.6 10.6-20.6 22.3m138.5-99.8c0 11.2 11.7 21.8 23.4 21.8 11.1 0 21.7-10 21.7-21.2 0-1.7-.6-3.3-.6-5.6l19.5 15.7c-3.4 18.9-20.1 35.6-39.5 33.4 1.1 3.3 1.6 6.1 1.6 10.6 0 13.9-12.2 30.1-25.5 35.1L384 412c12.2-1.1 22.2-9.4 22.2-22.8 0-12.8-11.1-22.3-23.3-22.3-12.8 0-22.3 11.2-22.3 24.5 0 16.2 19.5 46.8 56.8 46.8 15 0 29.4-4.4 40.6-14.5l-12.3-9.4c2.8-9.5 8.4-17.9 17.3-21.8l12.2 9.5c4.5-8.3 7.2-17.8 7.2-27.8 0-26.8-20.5-60.8-53.4-60.8-13.9 0-26.1 9.5-26.1 23.9"/>
    </g>
  </svg>
);

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
            <UBSLogo className="h-12 w-auto text-white" />
            <div>
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
            <UBSLogo className="h-10 w-auto text-white" />
            <div>
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
