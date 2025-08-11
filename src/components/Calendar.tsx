import React, { useState } from 'react';
import './Calendar.css';

interface CalendarSlot {
  id: string;
  date: string;
  time: string;
  duration: number; // 30 or 60 minutes
  isBooked: boolean;
}

interface CalendarProps {
  onSlotSelect: (slot: CalendarSlot) => void;
  selectedSlot?: CalendarSlot | null;
  availableSlots: CalendarSlot[];
}

const Calendar: React.FC<CalendarProps> = ({ onSlotSelect, selectedSlot, availableSlots }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Get the start of the current week (Monday)
  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Generate week dates
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

  // Time slots for the day
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const weekDates = getWeekDates();

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

  const getSlotForDateTime = (date: Date, time: string, duration: number) => {
    const dateStr = formatDateForSlot(date);
    return availableSlots.find(slot => 
      slot.date === dateStr && 
      slot.time === time && 
      slot.duration === duration
    );
  };

  const isSlotSelected = (slot: CalendarSlot) => {
    return selectedSlot?.id === slot.id;
  };

  const handleSlotClick = (date: Date, time: string, duration: number) => {
    const slot = getSlotForDateTime(date, time, duration);
    if (slot && !slot.isBooked) {
      onSlotSelect(slot);
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn" 
          onClick={() => navigateWeek('prev')}
          aria-label="Previous week"
        >
          ←
        </button>
        <h3>
          {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button 
          className="calendar-nav-btn" 
          onClick={() => navigateWeek('next')}
          aria-label="Next week"
        >
          →
        </button>
      </div>

      <div className="calendar-grid">
        {/* Day headers */}
        <div className="calendar-time-header"></div>
        {weekDates.map((date, index) => (
          <div key={index} className="calendar-day-header">
            {formatDate(date)}
          </div>
        ))}

        {/* Time slots */}
        {timeSlots.map(time => (
          <React.Fragment key={time}>
            <div className="calendar-time-label">{time}</div>
            {weekDates.map((date, dateIndex) => {
              // Skip weekends
              if (date.getDay() === 0 || date.getDay() === 6) {
                return <div key={`${dateIndex}-${time}`} className="calendar-slot-disabled"></div>;
              }

              const slot30 = getSlotForDateTime(date, time, 30);
              const slot60 = getSlotForDateTime(date, time, 60);

              return (
                <div key={`${dateIndex}-${time}`} className="calendar-slot-container">
                  {/* 30 minute slot */}
                  {slot30 && (
                    <button
                      className={`calendar-slot duration-30 ${
                        slot30.isBooked ? 'booked' : ''
                      } ${isSlotSelected(slot30) ? 'selected' : ''}`}
                      onClick={() => handleSlotClick(date, time, 30)}
                      disabled={slot30.isBooked}
                      title={`${time} - 30 minutes${slot30.isBooked ? ' (Booked)' : ''}`}
                    >
                      30m
                    </button>
                  )}

                  {/* 60 minute slot */}
                  {slot60 && (
                    <button
                      className={`calendar-slot duration-60 ${
                        slot60.isBooked ? 'booked' : ''
                      } ${isSlotSelected(slot60) ? 'selected' : ''}`}
                      onClick={() => handleSlotClick(date, time, 60)}
                      disabled={slot60.isBooked}
                      title={`${time} - 60 minutes${slot60.isBooked ? ' (Booked)' : ''}`}
                    >
                      60m
                    </button>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

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
          <div className="legend-color booked"></div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
