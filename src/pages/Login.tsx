import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { Pill, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useApp();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const match = savedUsers.find((u: any) => u.email === email && u.password === password);
    if (!match) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }
    const { password: _pw, ...user } = match;
    localStorage.setItem('currentUser', JSON.stringify(user));
    setUser(user);
    navigate('/');
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { token, user } = await api.auth.login({
        email: 'test@example.com',
        password: 'password123'
      });
      localStorage.setItem('token', token);
      setUser(user);
      navigate('/');
    } catch (err: any) {
      setError('Demo account not available. Please register a new account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-sky-100">
            <Pill size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your medications</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 border border-gray-200"
          >
            Try Demo Account
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-600 font-bold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
