import React, { useState, useEffect, useCallback } from 'react';
import { AvailableSlot, Booking, User } from '../types/auth';
import Calendar from './Calendar';
import './PrivateLessons.css';

interface PrivateLessonsProps {
  user: User;
}

const PrivateLessons: React.FC<PrivateLessonsProps> = ({ user }) => {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadAvailableSlots = useCallback(() => {
    const savedSlots = localStorage.getItem('availableSlots');
    if (savedSlots) {
      const slots: AvailableSlot[] = JSON.parse(savedSlots);
      // Only show future slots that aren't booked
      const availableSlots = slots.filter(slot => 
        !slot.isBooked && new Date(slot.date) >= new Date()
      );
      setAvailableSlots(availableSlots);
    }
  }, []);

  const loadBookings = useCallback(() => {
    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
      const allBookings: Booking[] = JSON.parse(savedBookings);
      const userBookings = allBookings.filter(booking => 
        booking.customerEmail === user.email && booking.status !== 'cancelled'
      );
      setBookings(userBookings);
    }
  }, [user.email]);

  useEffect(() => {
    loadAvailableSlots();
    loadBookings();
  }, [loadAvailableSlots, loadBookings]);

  const handleBookSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  const confirmBooking = () => {
    if (!selectedSlot) return;

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      slotId: selectedSlot.id,
      customerEmail: user.email,
      customerName: user.name,
      dogName: user.dogName || '',
      date: selectedSlot.date,
      time: selectedSlot.time,
      duration: selectedSlot.duration || 60,
      notes,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Update the slot to mark it as booked
    const savedSlots = localStorage.getItem('availableSlots');
    if (savedSlots) {
      const slots: AvailableSlot[] = JSON.parse(savedSlots);
      const updatedSlots = slots.map(slot => 
        slot.id === selectedSlot.id 
          ? { 
              ...slot, 
              isBooked: true, 
              bookedBy: user.id,
              customerEmail: user.email,
              customerName: user.name,
              dogName: user.dogName,
              notes 
            }
          : slot
      );
      localStorage.setItem('availableSlots', JSON.stringify(updatedSlots));
    }

    // Save the booking
    const savedBookings = localStorage.getItem('bookings');
    const existingBookings: Booking[] = savedBookings ? JSON.parse(savedBookings) : [];
    const updatedBookings = [...existingBookings, newBooking];
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));

    // Update local state
    setBookings(prev => [...prev, newBooking]);
    setAvailableSlots(prev => prev.filter(slot => slot.id !== selectedSlot.id));
    
    // Reset form
    setSelectedSlot(null);
    setNotes('');

    alert('Booking confirmed! We\'ll see you and your dog soon! 🐕💖');
  };

  const cancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        // Mark slot as available again
        const savedSlots = localStorage.getItem('availableSlots');
        if (savedSlots) {
          const slots: AvailableSlot[] = JSON.parse(savedSlots);
          const updatedSlots = slots.map(slot => 
            slot.id === booking.slotId 
              ? { ...slot, isBooked: false, bookedBy: undefined, customerEmail: undefined, customerName: undefined, dogName: undefined, notes: undefined }
              : slot
          );
          localStorage.setItem('availableSlots', JSON.stringify(updatedSlots));
        }

        // Update booking status
        const savedBookings = localStorage.getItem('bookings');
        if (savedBookings) {
          const allBookings: Booking[] = JSON.parse(savedBookings);
          const updatedBookings = allBookings.map(b => 
            b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
          );
          localStorage.setItem('bookings', JSON.stringify(updatedBookings));
        }

        // Update local state
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        loadAvailableSlots(); // Refresh available slots
      }
    }
  };



  return (
    <div className="private-lessons">
      <div className="card">
        <h2>📅 Book Private Lesson 🐩</h2>
        <p className="welcome-message">Welcome, {user.name}! Book a private lesson for {user.dogName} below.</p>
        
        <div className="form-section">
          <h3>Available Time Slots</h3>
          <Calendar 
            availableSlots={availableSlots.map(slot => ({
              id: slot.id,
              date: slot.date,
              time: slot.time,
              duration: slot.duration || 60,
              isBooked: slot.isBooked
            }))}
            onSlotSelect={(slot) => {
              const fullSlot = availableSlots.find(s => s.id === slot.id);
              if (fullSlot) {
                handleBookSlot(fullSlot);
              }
            }}
            selectedSlot={selectedSlot ? {
              id: selectedSlot.id,
              date: selectedSlot.date,
              time: selectedSlot.time,
              duration: selectedSlot.duration || 60,
              isBooked: selectedSlot.isBooked
            } : null}
          />
        </div>

        {selectedSlot && (
          <div className="form-section booking-confirmation">
            <h3>Confirm Booking</h3>
            <div className="booking-details">
              <div className="booking-info">
                <strong>Date:</strong> {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString()}
              </div>
              <div className="booking-info">
                <strong>Time:</strong> {selectedSlot.time} ({selectedSlot.duration || 60} minutes)
              </div>
              <div className="booking-info">
                <strong>Client:</strong> {user.name}
              </div>
              <div className="booking-info">
                <strong>Dog:</strong> {user.dogName}
              </div>
            </div>
            
            <div className="notes-section">
              <label htmlFor="notes">
                <strong>Notes (optional):</strong>
              </label>
              <textarea
                id="notes"
                placeholder="Tell us about your dog's training goals, behavior, or any special requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="booking-actions">
              <button 
                onClick={() => setSelectedSlot(null)}
                className="btn cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBooking}
                className="btn confirm-btn"
              >
                Confirm Booking 💖
              </button>
            </div>
          </div>
        )}
      </div>

      {bookings.length > 0 && (
        <div className="card">
          <h3>Your Bookings</h3>
          <div className="bookings-list">
            {bookings
              .filter(booking => new Date(booking.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(booking => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-header">
                    <div className="booking-date-time">
                      <strong>{new Date(booking.date + 'T12:00:00').toLocaleDateString()}</strong>
                      <span>{booking.time} ({booking.duration || 60} min)</span>
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
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateLessons;
