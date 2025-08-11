import React, { useState } from 'react';
import './ContactUs.css';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dogName: '',
    subject: '',
    message: '',
    serviceType: 'general'
  });

  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage for now (in production, this would go to a backend)
    const contactSubmissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    const newSubmission = {
      ...formData,
      id: `contact-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
    contactSubmissions.push(newSubmission);
    localStorage.setItem('contactSubmissions', JSON.stringify(contactSubmissions));

    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        dogName: '',
        subject: '',
        message: '',
        serviceType: 'general'
      });
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="contact-success">
        <div className="card">
          <h2>Thank You! 🐾</h2>
          <div className="success-message">
            <p>Your message has been received successfully!</p>
            <p>We'll get back to you within 24 hours.</p>
            <div className="success-icon">✅</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-us">
      <div className="card">
        <h2>📞 Contact Us</h2>
        <p className="contact-intro">
          Have questions about our training services? Want to discuss your dog's specific needs? 
          We'd love to hear from you!
        </p>

        <div className="contact-info">
          <div className="contact-item">
            <span className="contact-icon">📧</span>
            <div>
              <strong>Email:</strong>
              <p>info@nextsteppaws.com</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">📱</span>
            <div>
              <strong>Phone:</strong>
              <p>(555) PAW-STEP</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">📍</span>
            <div>
              <strong>Location:</strong>
              <p>Serving the Greater Metro Area</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">⏰</span>
            <div>
              <strong>Hours:</strong>
              <p>Mon-Fri: 9AM-6PM<br/>Sat: 9AM-4PM<br/>Sun: By appointment</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Your Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="John Smith"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dogName">Dog's Name</label>
              <input
                type="text"
                id="dogName"
                name="dogName"
                value={formData.dogName}
                onChange={handleInputChange}
                placeholder="Buddy"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="serviceType">Service Interest</label>
            <select
              id="serviceType"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleInputChange}
            >
              <option value="general">General Inquiry</option>
              <option value="private">Private Lessons</option>
              <option value="group">Group Classes</option>
              <option value="behavior">Behavior Consultation</option>
              <option value="pricing">Pricing Information</option>
              <option value="scheduling">Scheduling Question</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="What can we help you with?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={5}
              placeholder="Tell us about your dog's training needs, behavioral concerns, or any questions you have..."
            />
          </div>

          <button type="submit" className="btn submit-btn">
            Send Message 🐾
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
