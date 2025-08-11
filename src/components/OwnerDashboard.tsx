import React, { useState, useEffect } from 'react';
import { apiService, TimeSlot, Booking, User, GroupClass } from '../services/apiService';
import EmailComposer from './EmailComposer';
import './OwnerDashboard.css';

const OwnerDashboard: React.FC = () => {
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [currentView, setCurrentView] = useState<'slots' | 'bookings' | 'classes' | 'manage-classes'>('slots');
    const [showEmailComposer, setShowEmailComposer] = useState<boolean>(false);
    const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<Booking | null>(null);
    const [customers, setCustomers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const timeSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load all data in parallel
            const [slotsData, bookingsData, classesData, customersData] = await Promise.all([
                apiService.getSlots(),
                apiService.getBookings(),
                apiService.getClasses(),
                apiService.getUsers('customer')
            ]);

            setAvailableSlots(slotsData);
            setBookings(bookingsData);
            setGroupClasses(classesData);
            setCustomers(customersData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load data');
        } finally {
            setLoading(false);
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

    const addSelectedSlots = async () => {
        if (selectedDates.length === 0 || selectedTimes.length === 0) {
            alert('Please select at least one date and one time slot!');
            return;
        }

        try {
            setLoading(true);
            const newSlots: TimeSlot[] = [];

            for (const date of selectedDates) {
                for (const time of selectedTimes) {
                    const slotExists = availableSlots.some(slot =>
                        slot.date === date && slot.time === time
                    );

                    if (!slotExists) {
                        try {
                            const newSlot = await apiService.createSlot({
                                date,
                                time,
                                duration: 60
                            });
                            newSlots.push(newSlot);
                        } catch (error) {
                            console.error(`Error creating slot for ${date} ${time}:`, error);
                        }
                    }
                }
            }

            if (newSlots.length === 0) {
                alert('All selected combinations already exist!');
                return;
            }

            // Refresh slots data
            const updatedSlots = await apiService.getSlots();
            setAvailableSlots(updatedSlots);

            setSelectedDates([]);
            setSelectedTimes([]);
            alert(`${newSlots.length} available slots added successfully! 🐕`);
        } catch (error) {
            console.error('Error adding slots:', error);
            alert('Failed to add slots. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const removeSlot = async (slotId: string) => {
        if (window.confirm('Are you sure you want to remove this slot?')) {
            try {
                await apiService.deleteSlot(slotId);
                // Refresh slots data
                const updatedSlots = await apiService.getSlots();
                setAvailableSlots(updatedSlots);
            } catch (error) {
                console.error('Error removing slot:', error);
                alert('Failed to remove slot. Please try again.');
            }
        }
    };

    const cancelBooking = async (bookingId: string) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await apiService.updateBooking(bookingId, { status: 'cancelled' });
                // Refresh bookings and slots data
                const [updatedBookings, updatedSlots] = await Promise.all([
                    apiService.getBookings(),
                    apiService.getSlots()
                ]);
                setBookings(updatedBookings);
                setAvailableSlots(updatedSlots);
            } catch (error) {
                console.error('Error cancelling booking:', error);
                alert('Failed to cancel booking. Please try again.');
            }
        }
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

    // Convert API booking to the format expected by EmailComposer
    const convertBookingForEmailComposer = (booking: Booking): any => {
        const customer = customers.find(c => c.id === booking.userId);
        return {
            ...booking,
            customerEmail: customer?.email || 'unknown@email.com',
            customerName: customer?.name || 'Unknown Customer',
            date: booking.slot?.date || '',
            time: booking.slot?.time || '',
            duration: booking.slot?.duration || 60
        };
    };
    const upcomingSlots = availableSlots
        .filter(slot => new Date(slot.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const upcomingBookings = bookings
        .filter(booking => booking.status !== 'cancelled' && booking.slot && new Date(booking.slot.date) >= new Date())
        .sort((a, b) => new Date(a.slot!.date).getTime() - new Date(b.slot!.date).getTime());

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) {
        return (
            <div className="owner-dashboard">
                <div className="dashboard-header">
                    <h2>🐕 Owner Dashboard 🐕</h2>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="owner-dashboard">
                <div className="dashboard-header">
                    <h2>🐕 Owner Dashboard 🐕</h2>
                    <p style={{ color: 'red' }}>Error: {error}</p>
                    <button onClick={loadData} className="btn">Retry</button>
                </div>
            </div>
        );
    }

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
                                upcomingSlots.map(slot => {
                                    const booking = bookings.find(b => b.slotId === slot.id && b.status !== 'cancelled');
                                    const isBooked = slot.isBooked || !!booking;

                                    return (
                                        <div key={slot.id} className={`slot-card ${isBooked ? 'booked' : 'available'}`}>
                                            <div className="slot-date">
                                                {new Date(slot.date + 'T12:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            <div className="slot-time">{slot.time}</div>
                                            <div className="slot-status">
                                                {isBooked && booking ? (
                                                    <div className="booking-info">
                                                        <strong>Booked by:</strong><br />
                                                        {customers.find(c => c.id === booking.userId)?.name || 'Unknown'}<br />
                                                        <em>{booking.dogName}</em>
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
                                    );
                                })
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
                                upcomingBookings.map(booking => {
                                    const customer = customers.find(c => c.id === booking.userId);
                                    return (
                                        <div key={booking.id} className="booking-card">
                                            <div className="booking-header">
                                                <div className="booking-date-time">
                                                    <strong>{booking.slot ? new Date(booking.slot.date + 'T12:00:00').toLocaleDateString() : 'Unknown date'}</strong>
                                                    <span>{booking.slot?.time || 'Unknown time'}</span>
                                                </div>
                                                <span className={`status-badge ${booking.status}`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <div className="booking-details">
                                                <div><strong>Client:</strong> {customer?.name || 'Unknown'}</div>
                                                <div><strong>Email:</strong> {customer?.email || 'Unknown'}</div>
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
                                    );
                                })
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
                            {groupClasses.map((cls) => (
                                <div key={cls.id} className="class-summary-card">
                                    <h4>{cls.name}</h4>
                                    <div className="class-stats">
                                        <div><strong>Enrolled:</strong> {cls.maxSpots - cls.spots} / {cls.maxSpots}</div>
                                        <div><strong>Revenue:</strong> ${(cls.maxSpots - cls.spots) * cls.price}</div>
                                        <div><strong>Level:</strong> {cls.level}</div>
                                    </div>
                                    {cls.enrolledStudents.length > 0 && (
                                        <div className="enrolled-students">
                                            <strong>Students:</strong>
                                            <ul>
                                                {cls.enrolledStudents.map((studentId: string, index: number) => {
                                                    const student = customers.find(c => c.id === studentId);
                                                    return (
                                                        <li key={index}>{student?.name || 'Unknown'}</li>
                                                    );
                                                })}
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
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target as HTMLFormElement);

                                    try {
                                        await apiService.createClass({
                                            name: formData.get('name') as string,
                                            description: formData.get('description') as string,
                                            schedule: formData.get('schedule') as string,
                                            maxSpots: parseInt(formData.get('maxSpots') as string),
                                            price: parseInt(formData.get('price') as string),
                                            level: formData.get('level') as 'Beginner' | 'Intermediate' | 'Advanced'
                                        });

                                        // Refresh classes data
                                        const updatedClasses = await apiService.getClasses();
                                        setGroupClasses(updatedClasses);

                                        alert('New class added successfully! 🐕');
                                        (e.target as HTMLFormElement).reset();
                                    } catch (error) {
                                        console.error('Error creating class:', error);
                                        alert('Failed to create class. Please try again.');
                                    }
                                }}>
                                    <div className="form-row">
                                        <input name="name" placeholder="Class Name" required />
                                        <select name="level" required>
                                            <option value="">Select Level</option>
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
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
                                        {groupClasses.map((cls) => (
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
                                                        onClick={async () => {
                                                            if (window.confirm('Are you sure you want to delete this class? This cannot be undone.')) {
                                                                try {
                                                                    // Note: We need to add a delete method to the API service
                                                                    // For now, we'll use updateClass to mark it as inactive or similar
                                                                    console.warn('Delete class API not implemented yet');
                                                                    alert('Delete functionality will be implemented when the API supports it.');
                                                                } catch (error) {
                                                                    console.error('Error deleting class:', error);
                                                                    alert('Failed to delete class. Please try again.');
                                                                }
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
                    booking={convertBookingForEmailComposer(selectedBookingForEmail)}
                    customer={customers.find(c => c.id === selectedBookingForEmail.userId) || {
                        id: selectedBookingForEmail.userId,
                        email: 'unknown@email.com',
                        name: 'Unknown Customer',
                        role: 'customer',
                        dogName: selectedBookingForEmail.dogName,
                        createdAt: '',
                        updatedAt: ''
                    }}
                    onClose={handleCloseEmailComposer}
                    onEmailSent={handleEmailSent}
                />
            )}
        </div>
    );
};

export default OwnerDashboard;
