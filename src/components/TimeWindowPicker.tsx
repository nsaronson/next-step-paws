import React, { useState } from 'react';
import './TimeWindowPicker.css';

interface TimeWindow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // 30 or 60 minutes
  recurring?: boolean;
  recurringDays?: number[]; // Day of week (0=Sunday, 1=Monday, etc.)
}

interface TimeWindowPickerProps {
  onSaveTimeWindows: (windows: TimeWindow[]) => void;
  existingWindows?: TimeWindow[];
}

const TimeWindowPicker: React.FC<TimeWindowPickerProps> = ({ onSaveTimeWindows, existingWindows = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState<number>(60);
  const [recurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri by default
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>(existingWindows);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const generateTimeSlots = (start: string, end: string, slotDuration: number): string[] => {
    const slots: string[] = [];
    const startTime = new Date(`2000-01-01 ${start}:00`);
    const endTime = new Date(`2000-01-01 ${end}:00`);
    
    const current = new Date(startTime);
    while (current < endTime) {
      slots.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + slotDuration);
    }
    
    return slots;
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const generateRecurringWindows = (baseDate: string, days: number[], weeks: number = 4): string[] => {
    const dates: string[] = [];
    const baseDateTime = new Date(baseDate);
    
    for (let week = 0; week < weeks; week++) {
      for (const day of days) {
        const targetDate = new Date(baseDateTime);
        targetDate.setDate(baseDateTime.getDate() + (week * 7) + (day - baseDateTime.getDay()));
        
        // Only add future dates
        if (targetDate >= new Date()) {
          dates.push(targetDate.toISOString().split('T')[0]);
        }
      }
    }
    
    return dates;
  };

  const addTimeWindow = () => {
    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    const dates = recurring 
      ? generateRecurringWindows(selectedDate, selectedDays)
      : [selectedDate];

    const newWindows: TimeWindow[] = [];

    dates.forEach(date => {
      const timeSlots = generateTimeSlots(startTime, endTime, duration);
      
      timeSlots.forEach(time => {
        const windowId = `window-${date}-${time}-${duration}-${Date.now()}-${Math.random()}`;
        newWindows.push({
          id: windowId,
          date,
          startTime: time,
          endTime: time, // Individual slots don't have end times
          duration,
          recurring,
          recurringDays: recurring ? selectedDays : undefined
        });
      });
    });

    const updatedWindows = [...timeWindows, ...newWindows];
    setTimeWindows(updatedWindows);
  };

  const removeTimeWindow = (id: string) => {
    const updatedWindows = timeWindows.filter(window => window.id !== id);
    setTimeWindows(updatedWindows);
  };

  const handleSave = () => {
    onSaveTimeWindows(timeWindows);
    alert(`${timeWindows.length} time slots have been saved!`);
  };

  const clearAllWindows = () => {
    if (window.confirm('Are you sure you want to clear all time windows?')) {
      setTimeWindows([]);
    }
  };

  const groupedWindows = timeWindows.reduce((groups, window) => {
    const date = window.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(window);
    return groups;
  }, {} as Record<string, TimeWindow[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedWindows).sort();

  return (
    <div className="time-window-picker">
      <div className="card">
        <h2>⏰ Set Available Time Windows</h2>
        <p className="picker-intro">
          Define your available time slots for private lessons. You can set specific dates or recurring weekly schedules.
        </p>

        <div className="picker-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Start Date</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label htmlFor="duration">Session Duration</label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Available From</label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">Available Until</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
              />
              Repeat weekly for the next 4 weeks
            </label>
          </div>

          {recurring && (
            <div className="form-group">
              <label>Select Days of Week</label>
              <div className="days-selector">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`day-btn ${selectedDays.includes(day.value) ? 'selected' : ''}`}
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={addTimeWindow} className="btn add-btn">
              Add Time Window ⏰
            </button>
          </div>
        </div>

        {timeWindows.length > 0 && (
          <div className="windows-preview">
            <div className="preview-header">
              <h3>Generated Time Slots ({timeWindows.length} total)</h3>
              <div className="preview-actions">
                <button onClick={clearAllWindows} className="btn clear-btn">
                  Clear All
                </button>
                <button onClick={handleSave} className="btn save-btn">
                  Save All Slots 💾
                </button>
              </div>
            </div>

            <div className="windows-list">
              {sortedDates.map(date => (
                <div key={date} className="date-group">
                  <h4 className="date-header">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h4>
                  <div className="slots-grid">
                    {groupedWindows[date]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(window => (
                        <div key={window.id} className="slot-item">
                          <span className="slot-time">
                            {window.startTime} ({window.duration}min)
                          </span>
                          <button
                            onClick={() => removeTimeWindow(window.id)}
                            className="remove-btn"
                            title="Remove this slot"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeWindowPicker;
