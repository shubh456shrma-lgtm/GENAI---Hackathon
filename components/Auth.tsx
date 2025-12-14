import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { sendWelcomeEmail } from '../services/emailService';
import { Button } from './Button';
import { User } from '../types';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Captured for the Welcome Email
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for the Welcome Email Simulation Modal
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{subject: string, body: string, simulated: boolean} | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Bypass check for demo purposes if not configured
    if (!isSupabaseConfigured) {
      console.log("Supabase not configured, using demo mode.");
      setTimeout(async () => {
        const demoUser: User = { 
          id: 'demo-user-123', 
          email: email, 
          name: name || 'Demo Student' 
        };
        
        // Trigger Email Service
        if (isSignUp) {
            const emailResult = await sendWelcomeEmail(email, name || 'Demo Student');
            setWelcomeData({ 
                subject: emailResult.subject, 
                body: emailResult.body,
                simulated: emailResult.simulated 
            });
            setPendingUser(demoUser);
            setShowWelcome(true);
        } else {
            onLogin(demoUser);
        }
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      if (isSignUp) {
        // 1. Sign up via Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        // 2. If successful, trigger our custom welcome email
        if (data.user) {
          const registeredEmail = data.user.email || email;
          const registeredName = name || 'Student';

          const emailResult = await sendWelcomeEmail(registeredEmail, registeredName);
          
          setWelcomeData({ 
              subject: emailResult.subject, 
              body: emailResult.body,
              simulated: emailResult.simulated 
          });
          setPendingUser({ 
            id: data.user.id, 
            email: registeredEmail, 
            name: registeredName 
          });
          setShowWelcome(true); 
        } else {
          // Edge case: User already exists but no error thrown (sometimes Supabase behavior)
          setError("User created, but unexpected response. Please try signing in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onLogin({ 
            id: data.user.id, 
            email: data.user.email!,
            name: data.user.user_metadata.full_name
          });
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      if (!isSignUp) setLoading(false); // Keep loading true for sign up until modal interaction
    }
  };

  const handleContinue = () => {
    if (pendingUser) {
        onLogin(pendingUser);
    }
  };

  if (showWelcome && welcomeData) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 animate-fade-in z-50 fixed inset-0">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
                <div className={`${welcomeData.simulated ? 'bg-indigo-600' : 'bg-green-600'} p-6 text-white flex items-center justify-between`}>
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-full">
                            {welcomeData.simulated ? <Mail className="w-6 h-6 text-white" /> : <CheckCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{welcomeData.simulated ? 'New Message Received' : 'Welcome Email Sent!'}</h2>
                            <p className="text-white/80 text-xs">{welcomeData.simulated ? 'Just now • Inbox Preview' : `Sent to ${email}`}</p>
                        </div>
                    </div>
                    {welcomeData.simulated && (
                        <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            Simulation
                        </span>
                    )}
                </div>
                <div className="p-8 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{welcomeData.subject}</h3>
                        <p className="text-sm text-slate-500">To: <span className="font-medium text-slate-700">{email}</span></p>
                    </div>
                    
                    {welcomeData.simulated ? (
                        <>
                            <div className="prose prose-sm prose-slate text-slate-600 whitespace-pre-wrap font-medium bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                                {welcomeData.body}
                            </div>
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                <strong>Note:</strong> Set EmailJS keys in <code>services/emailService.ts</code> to send real emails.
                            </p>
                        </>
                    ) : (
                        <div className="text-center py-6 text-slate-600">
                             <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6" />
                             </div>
                             <p className="mb-2 text-lg font-medium text-slate-800">Check your inbox!</p>
                             <p className="text-sm text-slate-500">We've sent a welcome guide to <strong>{email}</strong>.</p>
                             <p className="text-xs text-slate-400 mt-2">(Don't forget to check your spam folder)</p>
                        </div>
                    )}
                    
                    <div className="pt-6 border-t border-slate-100">
                        <Button onClick={handleContinue} className="w-full flex items-center justify-center space-x-2" size="lg">
                            <span>Continue to Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Revise<span className="text-indigo-600">Right</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isSignUp ? 'Create an account to start revising' : 'Welcome back, please sign in'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs border border-amber-200">
            <strong>Demo Mode:</strong> Supabase API keys are missing. Authentication will be simulated.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Jane Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
        
        {isSignUp && (
          <div className="text-xs text-center text-slate-400 mt-4">
            By signing up, you will receive a welcome email immediately.
          </div>
        )}
      </div>
    </div>
  );
};