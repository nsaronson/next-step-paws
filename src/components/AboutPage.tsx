import React from 'react';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="card">
        <h2>About Next Step Paws</h2>
        
        <div className="about-content">
          <div className="about-section">
            <h3>Our Mission</h3>
            <p>
              At Next Step Paws, we believe every dog deserves the highest quality training 
              with personalized care. Our mission is to strengthen the bond between dogs and their 
              families through positive reinforcement training methods that are both effective and enjoyable.
            </p>
          </div>

          <div className="about-section">
            <h3>Our Expertise</h3>
            <p>
              With over 15 years of experience in canine behavior and training, I specialize in:
            </p>
            <ul>
              <li>Basic obedience training for puppies and adult dogs</li>
              <li>Advanced behavioral modification</li>
              <li>Agility training and sports conditioning</li>
              <li>Therapy dog preparation</li>
              <li>Specialized training for rescue dogs</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Training Philosophy</h3>
            <p>
              We use science-based, positive reinforcement training methods that focus on building 
              trust and communication. Our approach is tailored to each dog's unique personality, 
              learning style, and specific needs. We believe training should be fun for both dogs 
              and their humans!
            </p>
          </div>

          <div className="about-section">
            <h3>Certifications & Education</h3>
            <ul>
              <li>Certified Professional Dog Trainer (CPDT-KA)</li>
              <li>Certified Canine Behavior Consultant (CCBC)</li>
              <li>Advanced Agility Training Certification</li>
              <li>Pet First Aid & CPR Certified</li>
              <li>Ongoing education through the International Association of Canine Professionals</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Our Training Facility</h3>
            <p>
              Our modern, fully-equipped training facility features:
            </p>
            <ul>
              <li>Indoor and outdoor training areas</li>
              <li>Complete agility course with adjustable equipment</li>
              <li>Climate-controlled environment for year-round comfort</li>
              <li>Separate areas for group classes and private lessons</li>
              <li>Sanitized and safe space for all training activities</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Why Choose Next Step Paws?</h3>
            <ul>
              <li><strong>Personalized Approach:</strong> Every training plan is customized to your dog's specific needs</li>
              <li><strong>Flexible Scheduling:</strong> We offer both group classes and private lessons to fit your schedule</li>
              <li><strong>Ongoing Support:</strong> Training doesn't end when class does - we provide continued guidance</li>
              <li><strong>Family-Friendly:</strong> We train the whole family to ensure consistent reinforcement at home</li>
              <li><strong>Results-Driven:</strong> Our proven methods deliver lasting behavioral changes</li>
            </ul>
          </div>

          <div className="contact-section">
            <h3>Get in Touch</h3>
            <div className="contact-info">
              <div className="contact-item">
                <strong>📍 Location:</strong>
                <p>123 Training Lane<br />Canine City, CC 12345</p>
              </div>
              <div className="contact-item">
                <strong>📞 Phone:</strong>
                <p>(555) 123-DOGS</p>
              </div>
              <div className="contact-item">
                <strong>✉️ Email:</strong>
                <p>info@elitecanineacademy.com</p>
              </div>
              <div className="contact-item">
                <strong>🕒 Hours:</strong>
                <p>
                  Monday - Friday: 9:00 AM - 7:00 PM<br />
                  Saturday: 9:00 AM - 5:00 PM<br />
                  Sunday: 12:00 PM - 5:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
