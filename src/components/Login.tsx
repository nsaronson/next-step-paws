import React, { useState } from 'react';
import { User } from '../types/auth';
import { apiService } from '../services/apiService';
import './Login.css';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginType, setLoginType] = useState<'customer' | 'owner'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dogName, setDogName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (loginType === 'owner') {
        // Owner login via API
        if (!email || !password) {
          alert('Please enter your email and password!');
          return;
        }
        
        const response = await apiService.login(email, password);
        
        if (response.user.role !== 'owner') {
          alert('This account is not an owner account. Please use customer login.');
          return;
        }
        
        onLogin({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          dogName: response.user.dogName,
          password: password // Keep for legacy compatibility
        });
      } else {
        // Customer login/signup via API
        if (isSignUp) {
          if (!name || !email || !dogName || !password) {
            alert('Please fill in all fields for signup!');
            return;
          }

          if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
          }
          
          const response = await apiService.register({
            email,
            password,
            name,
            dogName
          });
          
          onLogin({
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            dogName: response.user.dogName,
            password: password // Keep for legacy compatibility
          });
        } else {
          // Customer login via API
          if (!email || !password) {
            alert('Please enter your email and password!');
            return;
          }
          
          const response = await apiService.login(email, password);
          
          onLogin({
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            dogName: response.user.dogName,
            password: password // Keep for legacy compatibility
          });
        }
      }
    } catch (error) {
      console.error('Login/signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      if (errorMessage.includes('User already exists')) {
        alert('An account with this email already exists. Please sign in instead.');
        setIsSignUp(false);
      } else if (errorMessage.includes('Invalid credentials')) {
        alert('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('User not found') || errorMessage.includes('Unauthorized')) {
        alert('Account not found. Please sign up first!');
        setIsSignUp(true);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome to Next Step Paws</h2>
          <p>Please sign in to access your account</p>
        </div>

        <div className="login-type-selector">
          <button
            type="button"
            className={`type-btn ${loginType === 'customer' ? 'active' : ''}`}
            onClick={() => setLoginType('customer')}
          >
            Customer Login
          </button>
          <button
            type="button"
            className={`type-btn ${loginType === 'owner' ? 'active' : ''}`}
            onClick={() => setLoginType('owner')}
          >
            Owner Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {loginType === 'customer' && isSignUp && (
            <>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Your Dog's Name"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                required
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn login-btn">
            {loginType === 'owner' 
              ? 'Sign In as Owner' 
              : isSignUp 
                ? 'Create Account' 
                : 'Sign In'
            }
          </button>

          {loginType === 'customer' && (
            <div className="signup-toggle">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setIsSignUp(false)} className="link-btn">
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New customer?{' '}
                  <button type="button" onClick={() => setIsSignUp(true)} className="link-btn">
                    Create Account
                  </button>
                </>
              )}
            </div>
          )}

          {loginType === 'owner' && (
            <div className="owner-demo-info">
              <small>Demo credentials: owner@nextsteppaws.com / paws123</small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
