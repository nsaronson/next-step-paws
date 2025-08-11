import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import GroupClasses from './components/GroupClasses';
import PrivateLessons from './components/PrivateLessons';
import OwnerDashboard from './components/OwnerDashboard';
import Login from './components/Login';
import ContactUs from './components/ContactUs';
import TimeWindowPicker from './components/TimeWindowPicker';
import WaiverAndPolicies from './components/WaiverAndPolicies';
import DogIntakeForm from './components/DogIntakeForm';
import LessonNotes from './components/LessonNotes';
import { User, AvailableSlot } from './types/auth';

type View = 'classes' | 'private' | 'dashboard' | 'contact' | 'availability' | 'notes';

function App() {
  const [currentView, setCurrentView] = useState<View>('classes');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('classes');
  };

  const handleOnboardingComplete = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleSaveTimeWindows = (windows: any[]) => {
    // Convert time windows to available slots
    const availableSlots: AvailableSlot[] = windows.map(window => ({
      id: window.id,
      date: window.date,
      time: window.startTime,
      duration: window.duration,
      isBooked: false
    }));

    // Save to localStorage
    const existingSlots = JSON.parse(localStorage.getItem('availableSlots') || '[]');
    const updatedSlots = [...existingSlots, ...availableSlots];
    localStorage.setItem('availableSlots', JSON.stringify(updatedSlots));
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Customer onboarding flow
  if (user.role === 'customer') {
    if (!user.waiverSigned || !user.policiesAccepted) {
      return <WaiverAndPolicies user={user} onComplete={handleOnboardingComplete} />;
    }
    if (!user.intakeFormCompleted) {
      return <DogIntakeForm user={user} onComplete={handleOnboardingComplete} />;
    }
  }

  return (
    <div className="App">
      <Header />
      <div className="user-header">
        <div className="user-info">
          <span>Welcome, {user.name}! ({user.role})</span>
          {user.dogName && <span>🐩 {user.dogName}</span>}
        </div>
        <button onClick={handleLogout} className="btn logout-btn">
          Logout
        </button>
      </div>

      <nav className="main-nav">
        <button 
          className={`nav-btn ${currentView === 'classes' ? 'active' : ''}`}
          onClick={() => setCurrentView('classes')}
        >
          🐕 Group Classes
        </button>
        <button 
          className={`nav-btn ${currentView === 'private' ? 'active' : ''}`}
          onClick={() => setCurrentView('private')}
        >
          📅 Private Lessons
        </button>
        <button 
          className={`nav-btn ${currentView === 'contact' ? 'active' : ''}`}
          onClick={() => setCurrentView('contact')}
        >
          📞 Contact Us
        </button>
        {user.role === 'owner' && (
          <>
            <button 
              className={`nav-btn ${currentView === 'availability' ? 'active' : ''}`}
              onClick={() => setCurrentView('availability')}
            >
              ⏰ Set Availability
            </button>
            <button 
              className={`nav-btn ${currentView === 'notes' ? 'active' : ''}`}
              onClick={() => setCurrentView('notes')}
            >
              📝 Lesson Notes
            </button>
            <button 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              📊 Dashboard
            </button>
          </>
        )}
      </nav>
      
      <main className="main-content">
        {currentView === 'classes' && <GroupClasses />}
        {currentView === 'private' && <PrivateLessons user={user} />}
        {currentView === 'contact' && <ContactUs />}
        {currentView === 'availability' && user.role === 'owner' && (
          <TimeWindowPicker onSaveTimeWindows={handleSaveTimeWindows} />
        )}
        {currentView === 'notes' && user.role === 'owner' && <LessonNotes user={user} />}
        {currentView === 'dashboard' && user.role === 'owner' && <OwnerDashboard />}
      </main>
    </div>
  );
}

export default App;
