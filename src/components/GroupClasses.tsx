import React, { useState, useEffect } from 'react';
import './GroupClasses.css';
import { GroupClass } from '../types/auth';

const GroupClasses: React.FC = () => {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  useEffect(() => {
    const savedClasses = localStorage.getItem('groupClasses');
    if (savedClasses) {
      setClasses(JSON.parse(savedClasses));
    } else {
      const defaultClasses: GroupClass[] = [
        {
          id: '1',
          name: 'Foundation Skills',
          description: 'Perfect for dogs learning their first commands! Sit, stay, and building good habits.',
          schedule: 'Tuesdays & Thursdays, 10:00 AM - 11:00 AM',
          spots: 6,
          maxSpots: 8,
          price: 120,
          level: 'Introductory skills',
          enrolled: [],
          waitlist: []
        },
        {
          id: '2',
          name: 'Puppy Foundations',
          description: 'Socialization and basic training for puppies 8-16 weeks old.',
          schedule: 'Saturdays, 2:00 PM - 3:30 PM',
          spots: 4,
          maxSpots: 6,
          price: 180,
          level: 'Puppy',
          enrolled: [],
          waitlist: []
        },
        {
          id: '3',
          name: 'Advanced Training',
          description: 'Ongoing skills development for dogs ready to master complex behaviors.',
          schedule: 'Wednesdays, 6:00 PM - 7:30 PM',
          spots: 2,
          maxSpots: 4,
          price: 220,
          level: 'Ongoing skills',
          enrolled: [],
          waitlist: []
        }
      ];
      setClasses(defaultClasses);
      localStorage.setItem('groupClasses', JSON.stringify(defaultClasses));
    }
  }, []);

  const handleEnroll = (classId: string) => {
    if (!clientName || !clientEmail) {
      alert('Please enter your name and email to enroll!');
      return;
    }

    const studentInfo = `${clientName} (${clientEmail})`;
    const updatedClasses = classes.map(cls => {
      if (cls.id === classId) {
        if (cls.spots > 0) {
          const newEnrolled = [...cls.enrolled, studentInfo];
          return {
            ...cls,
            spots: cls.spots - 1,
            enrolled: newEnrolled
          };
        } else {
          const newWaitlist = [...(cls.waitlist || []), studentInfo];
          return {
            ...cls,
            waitlist: newWaitlist
          };
        }
      }
      return cls;
    });

    setClasses(updatedClasses);
    localStorage.setItem('groupClasses', JSON.stringify(updatedClasses));
    
    const targetClass = classes.find(cls => cls.id === classId);
    if (targetClass && targetClass.spots > 0) {
      alert(`Successfully enrolled ${clientName} in the class! 🐩💖`);
    } else {
      alert(`Class is full. ${clientName} has been added to the waitlist! You'll be contacted when a spot opens. 🐩⏰`);
    }
    
    setClientName('');
    setClientEmail('');
  };

  const handleCancel = (classId: string, studentInfo: string) => {
    const updatedClasses = classes.map(cls => {
      if (cls.id === classId) {
        const updatedEnrolled = cls.enrolled.filter(student => student !== studentInfo);
        let updatedWaitlist = [...(cls.waitlist || [])];
        let newSpots = cls.spots + 1;

        if (updatedWaitlist.length > 0) {
          const nextStudent = updatedWaitlist.shift();
          updatedEnrolled.push(nextStudent!);
          newSpots = cls.spots;
          alert(`${nextStudent} has been automatically enrolled from the waitlist! 🐩✨`);
        }

        return {
          ...cls,
          enrolled: updatedEnrolled,
          waitlist: updatedWaitlist,
          spots: newSpots
        };
      }
      return cls;
    });

    setClasses(updatedClasses);
    localStorage.setItem('groupClasses', JSON.stringify(updatedClasses));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#4caf50';
      case 'Intermediate': return '#ff9800';
      case 'Advanced': return '#f44336';
      default: return '#e91e63';
    }
  };

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
                  <span className={cls.spots === 0 ? 'full' : 'available'}>
                    {cls.spots} / {cls.maxSpots}
                  </span>
                </div>
              </div>

              <button 
                className="btn enroll-btn"
                onClick={() => handleEnroll(cls.id)}
                disabled={!clientName || !clientEmail}
              >
                {cls.spots === 0 ? 'Join Waitlist 📝' : 'Enroll Now! 💖'}
              </button>

              {cls.enrolled && cls.enrolled.length > 0 && (
                <div className="enrolled-list">
                  <strong>Enrolled Students:</strong>
                  <ul>
                    {cls.enrolled.map((student, index) => (
                      <li key={index}>
                        {student}
                        <button 
                          className="cancel-btn" 
                          onClick={() => handleCancel(cls.id, student)}
                          title="Cancel enrollment"
                        >
                          ❌
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {cls.waitlist && cls.waitlist.length > 0 && (
                <div className="waitlist">
                  <strong>Waitlist ({cls.waitlist.length} students):</strong>
                  <ul>
                    {cls.waitlist.map((student, index) => (
                      <li key={index}>
                        {index + 1}. {student}
                        <button 
                          className="cancel-btn" 
                          onClick={() => {
                            const updatedClasses = classes.map(c => 
                              c.id === cls.id 
                                ? { ...c, waitlist: c.waitlist?.filter(s => s !== student) }
                                : c
                            );
                            setClasses(updatedClasses);
                            localStorage.setItem('groupClasses', JSON.stringify(updatedClasses));
                          }}
                          title="Remove from waitlist"
                        >
                          ❌
                        </button>
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
