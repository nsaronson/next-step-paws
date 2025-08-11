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
      if (email === 'owner@nextsteppaws.com' && password === 'paws123') {
        onLogin({
          id: 'owner-1',
          email: email,
          name: 'Next Step Paws Owner',
          role: 'owner',
          password: password
        });
      } else {
        alert('Invalid owner credentials. Use: owner@nextsteppaws.com / paws123');
      }
    } else {
      // Customer login/signup
      if (isSignUp) {
        if (!name || !email || !dogName || !password) {
          alert('Please fill in all fields for signup!');
          return;
        }

        if (password.length < 6) {
          alert('Password must be at least 6 characters long!');
          return;
        }
        
        // Check if customer already exists
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const existingCustomer = customers.find((c: User) => c.email === email);
        if (existingCustomer) {
          alert('An account with this email already exists. Please sign in instead.');
          return;
        }
        
        // Create new customer account
        const newUser: User = {
          id: `customer-${Date.now()}`,
          email,
          name,
          role: 'customer',
          dogName,
          password
        };
        
        // Save to localStorage (in real app, this would be a proper backend)
        customers.push(newUser);
        localStorage.setItem('customers', JSON.stringify(customers));
        
        onLogin(newUser);
      } else {
        // Customer login
        if (!email || !password) {
          alert('Please enter your email and password!');
          return;
        }
        
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find((c: User) => c.email === email);
        
        if (customer) {
          if (customer.password === password) {
            onLogin(customer);
          } else {
            alert('Incorrect password. Please try again.');
          }
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
