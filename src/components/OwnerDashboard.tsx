import React, { useState, useEffect } from 'react';
import { AvailableSlot, Booking, User } from '../types/auth';
import EmailComposer from './EmailComposer';
import './OwnerDashboard.css';

const OwnerDashboard: React.FC = () => {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'slots' | 'bookings' | 'classes' | 'manage-classes'>('slots');
  const [showEmailComposer, setShowEmailComposer] = useState<boolean>(false);
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<Booking | null>(null);
  const [customers, setCustomers] = useState<User[]>([]);

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedSlots = localStorage.getItem('availableSlots');
    if (savedSlots) {
      setAvailableSlots(JSON.parse(savedSlots));
    }

    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }

    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.includes(formatDate(date));
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;

    const dateStr = formatDate(date);
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleTimeChange = (time: string) => {
    setSelectedTimes(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const addSelectedSlots = () => {
    if (selectedDates.length === 0 || selectedTimes.length === 0) {
      alert('Please select at least one date and one time slot!');
      return;
    }

    const newSlots: AvailableSlot[] = [];
    
    selectedDates.forEach(date => {
      selectedTimes.forEach(time => {
        const slotExists = availableSlots.some(slot => 
          slot.date === date && slot.time === time
        );

        if (!slotExists) {
          newSlots.push({
            id: `slot-${Date.now()}-${Math.random()}`,
            date,
            time,
            duration: 60,
            isBooked: false
          });
        }
      });
    });

    if (newSlots.length === 0) {
      alert('All selected combinations already exist!');
      return;
    }

    const updatedSlots = [...availableSlots, ...newSlots];
    setAvailableSlots(updatedSlots);
    localStorage.setItem('availableSlots', JSON.stringify(updatedSlots));

    setSelectedDates([]);
    setSelectedTimes([]);
    alert(`${newSlots.length} available slots added successfully! 🐕`);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const removeSlot = (slotId: string) => {
    if (window.confirm('Are you sure you want to remove this slot?')) {
      const updatedSlots = availableSlots.filter(slot => slot.id !== slotId);
      setAvailableSlots(updatedSlots);
      localStorage.setItem('availableSlots', JSON.stringify(updatedSlots));
    }
  };

  const cancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        // Mark slot as available again
        const updatedSlots = availableSlots.map(slot => 
          slot.id === booking.slotId 
            ? { ...slot, isBooked: false, bookedBy: undefined, customerEmail: undefined, customerName: undefined, dogName: undefined, notes: undefined }
            : slot
        );
        setAvailableSlots(updatedSlots);
        localStorage.setItem('availableSlots', JSON.stringify(updatedSlots));

        // Remove booking
        const updatedBookings = bookings.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
        );
        setBookings(updatedBookings);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      }
    }
  };

  const getGroupClasses = () => {
    const savedClasses = localStorage.getItem('groupClasses');
    return savedClasses ? JSON.parse(savedClasses) : [];
  };

  const handleSendEmail = (booking: Booking) => {
    setSelectedBookingForEmail(booking);
    setShowEmailComposer(true);
  };

  const handleEmailSent = () => {
    // Refresh data if needed
    loadData();
  };

  const handleCloseEmailComposer = () => {
    setShowEmailComposer(false);
    setSelectedBookingForEmail(null);
  };

  const getCustomerByEmail = (email: string): User | null => {
    return customers.find(customer => customer.email === email) || null;
  };

  const groupClasses = getGroupClasses();
  const upcomingSlots = availableSlots
    .filter(slot => new Date(slot.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingBookings = bookings
    .filter(booking => booking.status !== 'cancelled' && new Date(booking.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <h2>🐕 Owner Dashboard 🐕</h2>
        <p>Manage your canine training business</p>
      </div>

      <nav className="dashboard-nav">
        <button 
          className={`nav-btn ${currentView === 'slots' ? 'active' : ''}`}
          onClick={() => setCurrentView('slots')}
        >
          📅 Available Slots
        </button>
        <button 
          className={`nav-btn ${currentView === 'bookings' ? 'active' : ''}`}
          onClick={() => setCurrentView('bookings')}
        >
          📝 Bookings ({upcomingBookings.length})
        </button>
        <button 
          className={`nav-btn ${currentView === 'classes' ? 'active' : ''}`}
          onClick={() => setCurrentView('classes')}
        >
          🐕 Group Classes
        </button>
        <button 
          className={`nav-btn ${currentView === 'manage-classes' ? 'active' : ''}`}
          onClick={() => setCurrentView('manage-classes')}
        >
          ✏️ Manage Classes
        </button>
      </nav>

      {currentView === 'slots' && (
        <div className="dashboard-section">
          <div className="card">
            <h3>Add Available Time Slots</h3>
            
            <div className="slot-creator">
              <div className="calendar-section">
                <h4>Select Dates</h4>
                <div className="calendar">
                  <div className="calendar-header">
                    <button type="button" onClick={prevMonth} className="nav-btn small">
                      ←
                    </button>
                    <h5>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h5>
                    <button type="button" onClick={nextMonth} className="nav-btn small">
                      →
                    </button>
                  </div>
                  
                  <div className="calendar-grid">
                    {dayNames.map(day => (
                      <div key={day} className="day-header">{day}</div>
                    ))}
                    
                    {getDaysInMonth(currentDate).map((date, index) => (
                      <div key={index} className="calendar-cell">
                        {date && (
                          <button
                            type="button"
                            className={`date-btn ${isDateSelected(date) ? 'selected' : ''} ${isPastDate(date) ? 'past' : ''}`}
                            onClick={() => handleDateClick(date)}
                            disabled={isPastDate(date)}
                          >
                            {date.getDate()}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDates.length > 0 && (
                  <div className="selected-dates">
                    <strong>Selected Dates ({selectedDates.length}):</strong>
                    <div className="date-tags">
                      {selectedDates.map(date => (
                        <span key={date} className="date-tag">
                          {new Date(date + 'T12:00:00').toLocaleDateString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="time-section">
                <h4>Select Time Slots</h4>
                <div className="time-grid">
                  {timeSlots.map(time => (
                    <label key={time} className="time-option">
                      <input
                        type="checkbox"
                        checked={selectedTimes.includes(time)}
                        onChange={() => handleTimeChange(time)}
                      />
                      <span className="time-label">{time}</span>
                    </label>
                  ))}
                </div>

                {selectedTimes.length > 0 && (
                  <div className="selected-times">
                    <strong>Selected Times ({selectedTimes.length}):</strong>
                    <div className="time-tags">
                      {selectedTimes.map(time => (
                        <span key={time} className="time-tag">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="add-slots-action">
                <button 
                  onClick={addSelectedSlots}
                  className="btn add-slots-btn"
                  disabled={selectedDates.length === 0 || selectedTimes.length === 0}
                >
                  Add {selectedDates.length * selectedTimes.length} Time Slots
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Available Slots ({upcomingSlots.length})</h3>
            <div className="slots-grid">
              {upcomingSlots.length === 0 ? (
                <p className="no-items">No available slots. Add some above!</p>
              ) : (
                upcomingSlots.map(slot => (
                  <div key={slot.id} className={`slot-card ${slot.isBooked ? 'booked' : 'available'}`}>
                    <div className="slot-date">
                      {new Date(slot.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="slot-time">{slot.time}</div>
                    <div className="slot-status">
                      {slot.isBooked ? (
                        <div className="booking-info">
                          <strong>Booked by:</strong><br />
                          {slot.customerName}<br />
                          <em>{slot.dogName}</em>
                        </div>
                      ) : (
                        <span className="available-badge">Available</span>
                      )}
                    </div>
                    <button 
                      onClick={() => removeSlot(slot.id)}
                      className="btn remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === 'bookings' && (
        <div className="dashboard-section">
          <div className="card">
            <h3>Upcoming Bookings ({upcomingBookings.length})</h3>
            <div className="bookings-list">
              {upcomingBookings.length === 0 ? (
                <p className="no-items">No upcoming bookings.</p>
              ) : (
                upcomingBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <div className="booking-date-time">
                        <strong>{new Date(booking.date + 'T12:00:00').toLocaleDateString()}</strong>
                        <span>{booking.time}</span>
                      </div>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="booking-details">
                      <div><strong>Client:</strong> {booking.customerName}</div>
                      <div><strong>Email:</strong> {booking.customerEmail}</div>
                      <div><strong>Poodle:</strong> {booking.dogName}</div>
                      {booking.notes && (
                        <div><strong>Notes:</strong> {booking.notes}</div>
                      )}
                    </div>
                    <div className="booking-actions">
                      <button 
                        onClick={() => handleSendEmail(booking)}
                        className="btn email-btn"
                        title="Send email to customer"
                      >
                        📧 Send Email
                      </button>
                      <button 
                        onClick={() => cancelBooking(booking.id)}
                        className="btn cancel-btn"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === 'classes' && (
        <div className="dashboard-section">
          <div className="card">
            <h3>Group Classes Overview</h3>
            <div className="classes-summary">
              {groupClasses.map((cls: any) => (
                <div key={cls.id} className="class-summary-card">
                  <h4>{cls.name}</h4>
                  <div className="class-stats">
                    <div><strong>Enrolled:</strong> {cls.maxSpots - cls.spots} / {cls.maxSpots}</div>
                    <div><strong>Revenue:</strong> ${(cls.maxSpots - cls.spots) * cls.price}</div>
                    <div><strong>Level:</strong> {cls.level}</div>
                  </div>
                  {cls.enrolled.length > 0 && (
                    <div className="enrolled-students">
                      <strong>Students:</strong>
                      <ul>
                        {cls.enrolled.map((student: string, index: number) => (
                          <li key={index}>{student}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentView === 'manage-classes' && (
        <div className="dashboard-section">
          <div className="card">
            <h3>Manage Group Classes</h3>
            <div className="class-management">
              <div className="add-class-form">
                <h4>Add New Class</h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const newClass = {
                    id: `class-${Date.now()}`,
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    schedule: formData.get('schedule') as string,
                    maxSpots: parseInt(formData.get('maxSpots') as string),
                    spots: parseInt(formData.get('maxSpots') as string),
                    price: parseInt(formData.get('price') as string),
                    level: formData.get('level') as 'Introductory skills' | 'Puppy' | 'Ongoing skills',
                    enrolled: []
                  };
                  
                  const existingClasses = JSON.parse(localStorage.getItem('groupClasses') || '[]');
                  const updatedClasses = [...existingClasses, newClass];
                  localStorage.setItem('groupClasses', JSON.stringify(updatedClasses));
                  alert('New class added successfully! 🐕');
                  (e.target as HTMLFormElement).reset();
                }}>
                  <div className="form-row">
                    <input name="name" placeholder="Class Name" required />
                    <select name="level" required>
                      <option value="">Select Level</option>
                      <option value="Introductory skills">Introductory skills</option>
                      <option value="Puppy">Puppy</option>
                      <option value="Ongoing skills">Ongoing skills</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <input name="schedule" placeholder="Schedule (e.g. Tuesdays 10:00 AM)" required />
                    <input name="maxSpots" type="number" placeholder="Max Students" min="1" max="20" required />
                    <input name="price" type="number" placeholder="Price ($)" min="0" required />
                  </div>
                  <textarea name="description" placeholder="Class Description" rows={3} required></textarea>
                  <button type="submit" className="btn">Add Class</button>
                </form>
              </div>

              <div className="existing-classes">
                <h4>Current Classes</h4>
                {groupClasses.length === 0 ? (
                  <p className="no-items">No classes available. Add some above!</p>
                ) : (
                  <div className="classes-list">
                    {groupClasses.map((cls: any) => (
                      <div key={cls.id} className="manage-class-card">
                        <div className="class-info">
                          <h5>{cls.name}</h5>
                          <p><strong>Level:</strong> {cls.level}</p>
                          <p><strong>Schedule:</strong> {cls.schedule}</p>
                          <p><strong>Price:</strong> ${cls.price} (4 weeks)</p>
                          <p><strong>Enrollment:</strong> {cls.maxSpots - cls.spots} / {cls.maxSpots}</p>
                          <p><strong>Revenue:</strong> ${(cls.maxSpots - cls.spots) * cls.price}</p>
                        </div>
                        <div className="class-actions">
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this class? This cannot be undone.')) {
                                const updatedClasses = groupClasses.filter((c: any) => c.id !== cls.id);
                                localStorage.setItem('groupClasses', JSON.stringify(updatedClasses));
                                alert('Class deleted successfully.');
                                window.location.reload();
                              }
                            }}
                            className="btn delete-btn"
                          >
                            Delete Class
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && selectedBookingForEmail && (
        <EmailComposer
          booking={selectedBookingForEmail}
          customer={getCustomerByEmail(selectedBookingForEmail.customerEmail) || {
            id: 'unknown',
            email: selectedBookingForEmail.customerEmail,
            name: selectedBookingForEmail.customerName,
            role: 'customer',
            dogName: selectedBookingForEmail.dogName
          }}
          onClose={handleCloseEmailComposer}
          onEmailSent={handleEmailSent}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
