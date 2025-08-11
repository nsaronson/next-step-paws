import React, { useState, useEffect } from 'react';
import { Booking, User } from '../types/auth';
import { EmailService, emailTemplates, EmailTemplate } from '../services/emailService';
import './EmailComposer.css';

interface EmailComposerProps {
  booking: Booking;
  customer: User;
  onClose: () => void;
  onEmailSent: () => void;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ booking, customer, onClose, onEmailSent }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('booking_confirmation');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<boolean>(false);

  // Update email content when template changes
  useEffect(() => {
    const template = emailTemplates.find(t => t.id === selectedTemplate);
    if (template && selectedTemplate !== 'custom') {
      const { subject: newSubject, body: newBody } = EmailService.createEmailFromBooking(
        booking, 
        customer, 
        selectedTemplate, 
        customData
      );
      setSubject(newSubject);
      setMessage(newBody);
    } else if (selectedTemplate === 'custom') {
      setSubject('');
      setMessage(`Hi ${customer.name},\n\n\n\nBest regards,\nThe Elite Canine Academy Team`);
    }
  }, [selectedTemplate, booking, customer, customData]);

  const handleCustomDataChange = (key: string, value: string) => {
    setCustomData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const emailData = {
        to_email: customer.email,
        to_name: customer.name,
        from_name: 'Elite Canine Academy',
        subject,
        message,
        reply_to: 'info@elitecanineacademy.com'
      };

      const result = await EmailService.sendEmail(emailData);
      
      if (result.success) {
        alert('✅ ' + result.message);
        onEmailSent();
        onClose();
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      alert('❌ Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const currentTemplate = emailTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="email-composer-overlay">
      <div className="email-composer">
        <div className="email-composer-header">
          <h3>📧 Send Email to {customer.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="email-composer-content">
          {/* Recipient Info */}
          <div className="recipient-info">
            <div className="booking-summary">
              <h4>Booking Details</h4>
              <p><strong>Customer:</strong> {customer.name} ({customer.email})</p>
              <p><strong>Dog:</strong> {booking.dogName}</p>
              <p><strong>Date:</strong> {new Date(booking.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Time:</strong> {booking.time}</p>
              <p><strong>Duration:</strong> {booking.duration} minutes</p>
              {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
            </div>
          </div>

          {/* Template Selection */}
          <div className="template-section">
            <label htmlFor="template-select">
              <strong>📝 Email Template:</strong>
            </label>
            <select 
              id="template-select"
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="template-select"
            >
              {emailTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Data Fields for Templates */}
          {currentTemplate && currentTemplate.id === 'follow_up' && (
            <div className="custom-data-section">
              <h4>📚 Lesson Details</h4>
              <div className="form-group">
                <label htmlFor="progress-notes">Progress Notes:</label>
                <textarea
                  id="progress-notes"
                  value={customData.progressNotes || ''}
                  onChange={(e) => handleCustomDataChange('progressNotes', e.target.value)}
                  placeholder="What did the dog learn today?"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="homework">Homework:</label>
                <textarea
                  id="homework"
                  value={customData.homework || ''}
                  onChange={(e) => handleCustomDataChange('homework', e.target.value)}
                  placeholder="Practice exercises for the dog"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="next-steps">Next Steps:</label>
                <textarea
                  id="next-steps"
                  value={customData.nextSteps || ''}
                  onChange={(e) => handleCustomDataChange('nextSteps', e.target.value)}
                  placeholder="Recommended next actions"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Subject Line */}
          <div className="form-group">
            <label htmlFor="email-subject">
              <strong>📨 Subject:</strong>
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="subject-input"
              placeholder="Email subject"
            />
          </div>

          {/* Message Body */}
          <div className="form-group">
            <label htmlFor="email-message">
              <strong>💬 Message:</strong>
            </label>
            <textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="message-textarea"
              rows={15}
              placeholder="Your email message..."
            />
          </div>

          {/* Actions */}
          <div className="email-composer-actions">
            <button 
              className="btn cancel-btn" 
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button 
              className="btn send-btn" 
              onClick={handleSendEmail}
              disabled={sending || !subject.trim() || !message.trim()}
            >
              {sending ? '📤 Sending...' : '📧 Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;
