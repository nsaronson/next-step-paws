import React, { useState } from 'react';
import { User } from '../types/auth';
import './WaiverAndPolicies.css';

interface WaiverAndPoliciesProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const WaiverAndPolicies: React.FC<WaiverAndPoliciesProps> = ({ user, onComplete }) => {
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!waiverAccepted || !policiesAccepted || !signature) {
      alert('Please complete all required fields and accept all agreements.');
      return;
    }

    // Save waiver information
    const waiverData = {
      userId: user.id,
      signature,
      date,
      waiverAccepted,
      policiesAccepted,
      signedAt: new Date().toISOString()
    };

    const existingWaivers = JSON.parse(localStorage.getItem('waivers') || '[]');
    existingWaivers.push(waiverData);
    localStorage.setItem('waivers', JSON.stringify(existingWaivers));

    // Update user
    const updatedUser = {
      ...user,
      waiverSigned: true,
      policiesAccepted: true
    };

    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    onComplete(updatedUser);
  };

  return (
    <div className="waiver-container">
      <div className="card">
        <h2>📝 Required Agreements</h2>
        <p className="waiver-intro">
          Before we begin training, please review and accept our waiver and policies below.
        </p>

        <form onSubmit={handleSubmit} className="waiver-form">
          {/* Liability Waiver */}
          <div className="document-section">
            <h3>LIABILITY WAIVER AND RELEASE</h3>
            <div className="document-content">
              <p><strong>PLEASE READ CAREFULLY BEFORE SIGNING</strong></p>
              
              <p>I, {user.name}, acknowledge that dog training involves inherent risks including but not limited to:</p>
              <ul>
                <li>Dog bites or scratches from my dog or other dogs</li>
                <li>Slips, falls, or other physical injuries</li>
                <li>Property damage caused by dogs</li>
                <li>Unforeseen reactions from dogs under stress or excitement</li>
              </ul>

              <p><strong>ASSUMPTION OF RISK:</strong> I voluntarily assume all risks associated with dog training activities and understand that Next Step Paws cannot guarantee my dog's behavior or eliminate all risks.</p>

              <p><strong>RELEASE AND INDEMNIFICATION:</strong> I hereby release, waive, discharge, and covenant not to sue Next Step Paws, its owners, employees, contractors, and agents from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury that may be sustained while participating in dog training activities.</p>

              <p><strong>MEDICAL EMERGENCY:</strong> I authorize Next Step Paws to seek emergency veterinary care for my dog if needed, and I agree to be responsible for all associated costs.</p>

              <p><strong>VACCINATION REQUIREMENT:</strong> I certify that my dog is current on all required vaccinations and is in good health for training activities.</p>
            </div>

            <label className="checkbox-label waiver-checkbox">
              <input
                type="checkbox"
                checked={waiverAccepted}
                onChange={(e) => setWaiverAccepted(e.target.checked)}
                required
              />
              <span>I have read, understood, and agree to the liability waiver above</span>
            </label>
          </div>

          {/* Training Policies */}
          <div className="document-section">
            <h3>TRAINING POLICIES</h3>
            <div className="document-content">
              <h4>Cancellation Policy</h4>
              <ul>
                <li>24-hour notice required for cancellations</li>
                <li>Same-day cancellations will be charged 50% of session fee</li>
                <li>No-shows will be charged the full session fee</li>
                <li>Emergency situations will be considered on a case-by-case basis</li>
              </ul>

              <h4>Payment Policy</h4>
              <ul>
                <li>Payment is due at the time of service</li>
                <li>Group classes must be paid in full before the first session</li>
                <li>Private lessons can be paid per session or in packages</li>
                <li>Late payment fees may apply after 30 days</li>
              </ul>

              <h4>Training Guidelines</h4>
              <ul>
                <li>Dogs must be current on vaccinations (DHPP, Rabies, Bordetella)</li>
                <li>Aggressive dogs may require individual assessment</li>
                <li>Owners must provide their own training treats and supplies</li>
                <li>Consistent homework practice is essential for success</li>
                <li>Training methods are based on positive reinforcement</li>
              </ul>

              <h4>Facility Rules</h4>
              <ul>
                <li>Dogs must be on leash at all times except during designated exercises</li>
                <li>Clean up after your dog immediately</li>
                <li>Arrive 5 minutes early for sessions</li>
                <li>Children must be supervised at all times</li>
                <li>Cell phones should be on silent during training</li>
              </ul>
            </div>

            <label className="checkbox-label waiver-checkbox">
              <input
                type="checkbox"
                checked={policiesAccepted}
                onChange={(e) => setPoliciesAccepted(e.target.checked)}
                required
              />
              <span>I have read, understood, and agree to abide by all training policies</span>
            </label>
          </div>

          {/* Signature Section */}
          <div className="signature-section">
            <h3>Electronic Signature</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signature">Full Legal Name (Electronic Signature) *</label>
                <input
                  type="text"
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full legal name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <p className="signature-disclaimer">
              By typing my name above, I acknowledge this constitutes a legal electronic signature 
              with the same force and effect as a handwritten signature.
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn submit-btn">
              Complete Agreements ✍️
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WaiverAndPolicies;
