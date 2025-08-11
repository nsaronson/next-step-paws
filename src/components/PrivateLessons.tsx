import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types/auth';
import { apiService, TimeSlot, Booking } from '../services/apiService';
import './PrivateLessons.css';

interface PrivateLessonsProps {
  user: User;
}

const PrivateLessons: React.FC<PrivateLessonsProps> = ({ user }) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Get only available slots from the API
      const slots = await apiService.getSlots({ available: true });
      // Filter to only show future slots
      const futureSlots = slots.filter(slot => 
        new Date(slot.date) >= new Date()
      );
      setAvailableSlots(futureSlots);
    } catch (err) {
      console.error('Failed to load available slots:', err);
      setError('Failed to load available slots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      setError(null);
      const allBookings = await apiService.getBookings();
      // Filter to user's bookings and exclude cancelled ones
      const userBookings = allBookings.filter(booking => 
        booking.status !== 'cancelled'
      );
      setBookings(userBookings);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError('Failed to load your bookings. Please try again.');
    }
  }, []);

  useEffect(() => {
    loadAvailableSlots();
    loadBookings();
  }, [loadAvailableSlots, loadBookings]);

  // Calendar helper functions
  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getWeekDates = () => {
    const weekStart = getWeekStart(currentWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateForSlot = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getSlotForDateTime = (date: Date, time: string) => {
    const dateStr = formatDateForSlot(date);
    return availableSlots.find(slot => 
      slot.date === dateStr && slot.time === time
    );
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;

    try {
      setLoading(true);
      setError(null);

      const newBooking = await apiService.createBooking({
        slotId: selectedSlot.id,
        dogName: user.dogName || '',
        notes
      });

      // Update local state
      setBookings(prev => [...prev, newBooking]);
      setAvailableSlots(prev => prev.filter(slot => slot.id !== selectedSlot.id));
      
      // Reset form
      setSelectedSlot(null);
      setNotes('');
      setShowBookingForm(false);

      alert('Booking confirmed! We\'ll see you and your poodle soon! 🐕💖');
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        setLoading(true);
        setError(null);

        await apiService.deleteBooking(bookingId);

        // Update local state
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        
        // Refresh available slots to show the newly available slot
        await loadAvailableSlots();
        
        alert('Booking cancelled successfully.');
      } catch (err) {
        console.error('Failed to cancel booking:', err);
        setError('Failed to cancel booking. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const weekDates = getWeekDates();
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  return (
    <div className="private-lessons">
      <div className="card">
        <h2>📅 Book Private Lesson 🐕</h2>
        <p className="welcome-message">Welcome, {user.name}! Select a time slot below to book a private lesson for {user.dogName}.</p>
        
        {error && (
          <div className="error-message" style={{ 
            color: '#dc3545', 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            borderRadius: '4px', 
            padding: '10px', 
            margin: '10px 0' 
          }}>
            {error}
          </div>
        )}
        
        {loading && (
          <div className="loading-message" style={{ 
            color: '#17a2b8', 
            backgroundColor: '#d1ecf1', 
            border: '1px solid #bee5eb', 
            borderRadius: '4px', 
            padding: '10px', 
            margin: '10px 0' 
          }}>
            Loading...
          </div>
        )}
        
        {/* Beautiful Calendar Interface */}
        <div className="booking-calendar">
          {/* Calendar Header */}
          <div className="calendar-header">
            <button 
              className="calendar-nav-btn" 
              onClick={() => navigateWeek('prev')}
              aria-label="Previous week"
            >
              ← Previous Week
            </button>
            <h3>
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              className="calendar-nav-btn" 
              onClick={() => navigateWeek('next')}
              aria-label="Next week"
            >
              Next Week →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {/* Day Headers */}
            <div className="calendar-time-header">Time</div>
            {weekDates.map((date, index) => (
              <div key={index} className="calendar-day-header">
                <div className="day-name">{formatDate(date)}</div>
                <div className="day-number">{date.getDate()}</div>
              </div>
            ))}

            {/* Time Slots */}
            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="calendar-time-label">{time}</div>
                {weekDates.map((date, dateIndex) => {
                  // Skip weekends
                  if (date.getDay() === 0 || date.getDay() === 6) {
                    return (
                      <div key={`${dateIndex}-${time}`} className="calendar-slot-disabled">
                        <span>Closed</span>
                      </div>
                    );
                  }

                  // Skip past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) {
                    return (
                      <div key={`${dateIndex}-${time}`} className="calendar-slot-past">
                        <span>Past</span>
                      </div>
                    );
                  }

                  const slot = getSlotForDateTime(date, time);

                  return (
                    <div key={`${dateIndex}-${time}`} className="calendar-slot-container">
                      {slot ? (
                        <button
                          className={`calendar-slot available ${
                            selectedSlot?.id === slot.id ? 'selected' : ''
                          }`}
                          onClick={() => handleSlotClick(slot)}
                          title={`Book ${time} session on ${formatDate(date)}`}
                        >
                          <div className="slot-time">{time}</div>
                          <div className="slot-status">Available</div>
                        </button>
                      ) : (
                        <div className="calendar-slot-unavailable">
                          <span>Unavailable</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Calendar Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <div className="legend-color unavailable"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        {/* Booking Confirmation Form */}
        {showBookingForm && selectedSlot && (
          <div className="booking-form-overlay">
            <div className="booking-form">
              <h3>Confirm Your Booking</h3>
              <div className="booking-details">
                <div><strong>Date:</strong> {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
                <div><strong>Time:</strong> {selectedSlot.time}</div>
                <div><strong>Client:</strong> {user.name}</div>
                <div><strong>Dog:</strong> {user.dogName}</div>
              </div>
              
              <div className="notes-section">
                <label htmlFor="booking-notes">
                  <strong>Notes (optional):</strong>
                </label>
                <textarea
                  id="booking-notes"
                  placeholder="Tell us about your dog's training goals, behavior, or any special requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="booking-form-actions">
                <button 
                  onClick={() => {
                    setShowBookingForm(false);
                    setSelectedSlot(null);
                    setNotes('');
                  }}
                  className="btn cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmBooking}
                  className="btn confirm-btn"
                  disabled={loading}
                >
                  {loading ? 'Booking...' : 'Confirm Booking 🐕'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User's Existing Bookings */}
      {bookings.length > 0 && (
        <div className="card">
          <h3>Your Upcoming Lessons</h3>
          <div className="bookings-list">
            {bookings
              .filter(booking => {
                const bookingDate = booking.slot?.date || '';
                return bookingDate && new Date(bookingDate) >= new Date();
              })
              .sort((a, b) => {
                const dateA = a.slot?.date || '';
                const dateB = b.slot?.date || '';
                return new Date(dateA).getTime() - new Date(dateB).getTime();
              })
              .map(booking => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-header">
                    <div className="booking-date-time">
                      <strong>{booking.slot ? new Date(booking.slot.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric'
                      }) : 'Date not available'}</strong>
                      <span>{booking.slot?.time || 'Time not available'}</span>
                    </div>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div><strong>Dog:</strong> {booking.dogName}</div>
                    {booking.notes && (
                      <div><strong>Notes:</strong> {booking.notes}</div>
                    )}
                    <div><strong>Booked:</strong> {new Date(booking.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="booking-actions">
                    <button 
                      onClick={() => cancelBooking(booking.id)}
                      className="btn cancel-booking-btn"
                      disabled={loading}
                    >
                      {loading ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card booking-instructions">
        <h3>How to Book</h3>
        <ol>
          <li><strong>Browse Available Times:</strong> Use the calendar above to see all available appointment slots</li>
          <li><strong>Select Your Preferred Time:</strong> Click on any available (green) time slot</li>
          <li><strong>Add Notes:</strong> Tell us about your dog's needs and training goals</li>
          <li><strong>Confirm:</strong> Review your booking details and confirm</li>
        </ol>
        <p><strong>Need help?</strong> Contact us at info@elitecanineacademy.com or (555) 123-DOGS</p>
      </div>
    </div>
  );
};

export default PrivateLessons;
