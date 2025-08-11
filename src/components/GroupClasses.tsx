import React, { useState, useEffect } from 'react';
import './GroupClasses.css';
import { apiService, GroupClass } from '../services/apiService';

const GroupClasses: React.FC = () => {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedClasses = await apiService.getClasses();
      setClasses(fetchedClasses);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId: string) => {
    if (!clientName || !clientEmail) {
      alert('Please enter your name and email to enroll!');
      return;
    }

    try {
      setEnrolling(classId);
      const response = await apiService.enrollInClass(classId);
      
      alert(response.message);
      
      // Refresh classes to get updated enrollment data
      await fetchClasses();
      
      setClientName('');
      setClientEmail('');
    } catch (err) {
      console.error('Failed to enroll in class:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to enroll in class';
      alert(`Error: ${errorMessage}`);
    } finally {
      setEnrolling(null);
    }
  };



  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#4caf50';
      case 'Intermediate': return '#ff9800';
      case 'Advanced': return '#f44336';
      default: return '#e91e63';
    }
  };

  if (loading) {
    return (
      <div className="group-classes">
        <div className="card">
          <h2>🐩 Group Training Classes 🐩</h2>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading classes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group-classes">
        <div className="card">
          <h2>🐩 Group Training Classes 🐩</h2>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#f44336' }}>Error: {error}</p>
            <button 
              className="btn" 
              onClick={fetchClasses}
              style={{ marginTop: '1rem' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group-classes">
      <div className="card">
        <h2>🐩 Group Training Classes 🐩</h2>
        
        <div className="enrollment-form">
          <h3>Client Information</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Your Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your Email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="classes-grid">
          {classes.map(cls => (
            <div key={cls.id} className="class-card">
              <div className="class-header">
                <h3>{cls.name}</h3>
                <span 
                  className="level-badge" 
                  style={{ backgroundColor: getLevelColor(cls.level) }}
                >
                  {cls.level}
                </span>
              </div>
              
              <p className="class-description">{cls.description}</p>
              
              <div className="class-details">
                <div className="detail-item">
                  <strong>📅 Schedule:</strong> {cls.schedule}
                </div>
                <div className="detail-item">
                  <strong>💰 Price:</strong> ${cls.price} (4 weeks)
                </div>
                <div className="detail-item">
                  <strong>👥 Spots Available:</strong> 
                  <span className={cls.maxSpots - cls.enrolledStudents.length === 0 ? 'full' : 'available'}>
                    {cls.maxSpots - cls.enrolledStudents.length} / {cls.maxSpots}
                  </span>
                </div>
              </div>

              <button 
                className="btn enroll-btn"
                onClick={() => handleEnroll(cls.id)}
                disabled={!clientName || !clientEmail || enrolling === cls.id}
              >
                {enrolling === cls.id 
                  ? 'Enrolling...' 
                  : cls.maxSpots - cls.enrolledStudents.length === 0 
                    ? 'Join Waitlist 📝' 
                    : 'Enroll Now! 💖'
                }
              </button>

              {cls.enrolledStudents && cls.enrolledStudents.length > 0 && (
                <div className="enrolled-list">
                  <strong>Enrolled Students ({cls.enrolledStudents.length}):</strong>
                  <ul>
                    {cls.enrolledStudents.map((studentId, index) => (
                      <li key={index}>
                        Student ID: {studentId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {cls.waitlist && cls.waitlist.length > 0 && (
                <div className="waitlist">
                  <strong>Waitlist ({cls.waitlist.length} students):</strong>
                  <ul>
                    {cls.waitlist.map((studentId, index) => (
                      <li key={index}>
                        {index + 1}. Student ID: {studentId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupClasses;
