import React, { useState } from 'react';
import { User } from '../types/auth';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginType === 'owner') {
      // Simple owner authentication (in real app, this would be secure)
      if (email === 'owner@poodletraining.com' && password === 'poodle123') {
        onLogin({
          id: 'owner-1',
          email: email,
          name: 'Poodle Perfect Owner',
          role: 'owner'
        });
      } else {
        alert('Invalid owner credentials. Use: owner@poodletraining.com / poodle123');
      }
    } else {
      // Customer login/signup
      if (isSignUp) {
        if (!name || !email || !dogName) {
          alert('Please fill in all fields for signup!');
          return;
        }
        
        // Create new customer account
        const newUser: User = {
          id: `customer-${Date.now()}`,
          email,
          name,
          role: 'customer',
          dogName
        };
        
        // Save to localStorage (in real app, this would be a proper backend)
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        customers.push(newUser);
        localStorage.setItem('customers', JSON.stringify(customers));
        
        onLogin(newUser);
      } else {
        // Customer login
        if (!email) {
          alert('Please enter your email!');
          return;
        }
        
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find((c: User) => c.email === email);
        
        if (customer) {
          onLogin(customer);
        } else {
          alert('Customer not found. Please sign up first!');
          setIsSignUp(true);
        }
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>🐕 Welcome to Next Step Paws! 🐕</h2>
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
          
          {loginType === 'owner' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

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
              <small>Demo credentials: owner@poodletraining.com / poodle123</small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
