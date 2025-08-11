import React, { useState, useEffect } from 'react';
import { Booking, GroupClass } from '../types/auth';
import './OwnerSchedule.css';

const OwnerSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = () => {
    // Load bookings
    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
      const allBookings: Booking[] = JSON.parse(savedBookings);
      setBookings(allBookings.filter(booking => booking.status === 'confirmed'));
    }

    // Load group classes
    const savedClasses = localStorage.getItem('groupClasses');
    if (savedClasses) {
      setGroupClasses(JSON.parse(savedClasses));
    }
  };

  const getScheduleForDate = (date: string) => {
    // Get private lessons for the date
    const privateLessons = bookings.filter(booking => booking.date === date);

    // Get group classes for the day of week
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[dayOfWeek];

    const todaysClasses = groupClasses.filter(cls => 
      cls.schedule.toLowerCase().includes(currentDay.toLowerCase()) && cls.enrolled.length > 0
    );

    return { privateLessons, groupClasses: todaysClasses };
  };

  const { privateLessons, groupClasses: todaysClasses } = getScheduleForDate(selectedDate);

  // Combine and sort all appointments
  const allAppointments = [
    ...privateLessons.map(booking => ({
      type: 'private' as const,
      time: booking.time,
      title: `Private Lesson - ${booking.dogName}`,
      client: booking.customerName,
      duration: booking.duration,
      notes: booking.notes,
      id: booking.id,
      data: booking
    })),
    ...todaysClasses.map(cls => {
      // Extract time from schedule string
      const timeMatch = cls.schedule.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
      const time = timeMatch ? timeMatch[1] : '12:00 PM';
      
      return {
        type: 'group' as const,
        time: time,
        title: cls.name,
        client: `${cls.enrolled.length} students`,
        duration: 60, // Default group class duration
        notes: cls.description,
        id: cls.id,
        data: cls
      };
    })
  ].sort((a, b) => {
    // Sort by time
    const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
    const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
    return timeA - timeB;
  });

  const formatDate = (date: string) => {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateCalendarExport = () => {
    const appointments = allAppointments;
    let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Next Step Paws//Schedule//EN\r\n';
    
    appointments.forEach(appointment => {
      const startDateTime = new Date(`${selectedDate}T${convertTo24Hour(appointment.time)}`);
      const endDateTime = new Date(startDateTime.getTime() + (appointment.duration * 60000));
      
      const formatICSDateTime = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      };

      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${appointment.id}@nextsteppaws.com\r\n`;
      icsContent += `DTSTART:${formatICSDateTime(startDateTime)}\r\n`;
      icsContent += `DTEND:${formatICSDateTime(endDateTime)}\r\n`;
      icsContent += `SUMMARY:${appointment.title}\r\n`;
      icsContent += `DESCRIPTION:Client: ${appointment.client}${appointment.notes ? '\\nNotes: ' + appointment.notes : ''}\r\n`;
      icsContent += `LOCATION:Next Step Paws Training Facility\r\n`;
      icsContent += 'END:VEVENT\r\n';
    });
    
    icsContent += 'END:VCALENDAR\r\n';
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule-${selectedDate}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToGoogleCalendar = () => {
    const appointments = allAppointments;
    
    if (appointments.length === 0) {
      alert('No appointments to export for this date.');
      return;
    }

    // For multiple appointments, we'll create a batch URL or open them sequentially
    if (appointments.length === 1) {
      const appointment = appointments[0];
      const googleCalendarUrl = createGoogleCalendarUrl(appointment);
      window.open(googleCalendarUrl, '_blank');
    } else {
      // For multiple appointments, offer to export them one by one
      const proceed = confirm(`You have ${appointments.length} appointments on this date. Would you like to add them all to Google Calendar? (Each will open in a new tab)`);
      if (proceed) {
        appointments.forEach((appointment, index) => {
          setTimeout(() => {
            const googleCalendarUrl = createGoogleCalendarUrl(appointment);
            window.open(googleCalendarUrl, '_blank');
          }, index * 1000); // Stagger the opening by 1 second to avoid popup blocking
        });
      }
    }
  };

  const createGoogleCalendarUrl = (appointment: any) => {
    const startDateTime = new Date(`${selectedDate}T${convertTo24Hour(appointment.time)}`);
    const endDateTime = new Date(startDateTime.getTime() + (appointment.duration * 60000));
    
    const formatGoogleDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:.]/g, '').replace(/000Z$/, 'Z');
    };

    const title = encodeURIComponent(appointment.title);
    const description = encodeURIComponent(`Client: ${appointment.client}${appointment.notes ? '\nNotes: ' + appointment.notes : ''}`);
    const location = encodeURIComponent('Next Step Paws Training Facility');
    const startTime = formatGoogleDateTime(startDateTime);
    const endTime = formatGoogleDateTime(endDateTime);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${description}&location=${location}`;
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM' || modifier === 'pm') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  const printSchedule = () => {
    window.print();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  return (
    <div className="owner-schedule">
      <div className="card">
        <div className="schedule-header">
          <h2>📅 Daily Schedule</h2>
          <div className="schedule-controls">
            <div className="date-navigator">
              <button 
                className="nav-btn"
                onClick={() => navigateDate('prev')}
                aria-label="Previous day"
              >
                ←
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
              <button 
                className="nav-btn"
                onClick={() => navigateDate('next')}
                aria-label="Next day"
              >
                →
              </button>
            </div>
            <div className="action-buttons">
              <button onClick={printSchedule} className="btn print-btn">
                🖨️ Print
              </button>
              <button onClick={generateCalendarExport} className="btn export-btn">
                📅 Export ICS
              </button>
              <button onClick={exportToGoogleCalendar} className="btn google-calendar-btn">
                📅 Add to Google Calendar
              </button>
            </div>
          </div>
        </div>

        <div className="schedule-content">
          <h3 className="schedule-date">{formatDate(selectedDate)}</h3>
          
          {allAppointments.length === 0 ? (
            <div className="no-appointments">
              <div className="no-appointments-icon">📅</div>
              <h4>No appointments scheduled</h4>
              <p>Enjoy your free day!</p>
            </div>
          ) : (
            <div className="appointments-list">
              {allAppointments.map((appointment, index) => (
                <div key={`${appointment.type}-${appointment.id}`} className={`appointment-card ${appointment.type}`}>
                  <div className="appointment-time">
                    <div className="time">{appointment.time}</div>
                    <div className="duration">{appointment.duration} min</div>
                  </div>
                  
                  <div className="appointment-details">
                    <div className="appointment-header">
                      <h4 className="appointment-title">
                        {appointment.type === 'private' ? '🐕' : '👥'} {appointment.title}
                      </h4>
                      <span className={`appointment-type ${appointment.type}`}>
                        {appointment.type === 'private' ? 'Private' : 'Group'}
                      </span>
                    </div>
                    
                    <div className="client-info">
                      <strong>Client:</strong> {appointment.client}
                    </div>
                    
                    {appointment.notes && (
                      <div className="appointment-notes">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}

                    {appointment.type === 'group' && appointment.data && (
                      <div className="class-details">
                        <div className="enrolled-count">
                          <strong>Enrolled:</strong> {(appointment.data as GroupClass).enrolled.length}/{(appointment.data as GroupClass).maxSpots}
                        </div>
                        <div className="enrolled-list">
                          {(appointment.data as GroupClass).enrolled.slice(0, 3).join(', ')}
                          {(appointment.data as GroupClass).enrolled.length > 3 && ` +${(appointment.data as GroupClass).enrolled.length - 3} more`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="schedule-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-number">{privateLessons.length}</span>
                <span className="stat-label">Private Lessons</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{todaysClasses.length}</span>
                <span className="stat-label">Group Classes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {privateLessons.reduce((total, booking) => total + booking.duration, 0) + (todaysClasses.length * 60)}
                </span>
                <span className="stat-label">Total Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSchedule;
