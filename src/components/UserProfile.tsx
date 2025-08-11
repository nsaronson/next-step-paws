import React, { useState } from 'react';
import { User } from '../types/auth';
import './UserProfile.css';

interface UserProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    dogName: user.dogName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password change if requested
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        alert('Please enter your current password to make changes.');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        alert('New passwords do not match.');
        return;
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
      }

      // Verify current password (in a real app, this would be handled by backend)
      if (user.password && user.password !== formData.currentPassword) {
        alert('Current password is incorrect.');
        return;
      }
    }

    // Create updated user object
    const updatedUser: User = {
      ...user,
      name: formData.name,
      dogName: user.role === 'customer' ? formData.dogName : user.dogName,
      password: formData.newPassword || user.password
    };

    // Update localStorage for customers
    if (user.role === 'customer') {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const updatedCustomers = customers.map((customer: User) => 
        customer.id === user.id ? updatedUser : customer
      );
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    }

    // Update current user session
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    onUpdate(updatedUser);
    setIsEditing(false);
    setShowPasswordFields(false);
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      dogName: user.dogName || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
    setShowPasswordFields(false);
  };

  return (
    <div className="user-profile">
      <div className="card">
        <h2>Profile Settings</h2>
        
        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-info">
              <div className="info-item">
                <label>Name:</label>
                <span>{user.name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>Role:</label>
                <span className={`role-badge ${user.role}`}>
                  {user.role === 'owner' ? 'Training Owner' : 'Customer'}
                </span>
              </div>
              {user.role === 'customer' && user.dogName && (
                <div className="info-item">
                  <label>Dog's Name:</label>
                  <span>{user.dogName}</span>
                </div>
              )}
            </div>
            
            <div className="profile-actions">
              <button 
                onClick={() => setIsEditing(true)}
                className="btn edit-btn"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Your full name"
              />
            </div>

            {user.role === 'customer' && (
              <div className="form-group">
                <label htmlFor="dogName">Dog's Name</label>
                <input
                  type="text"
                  id="dogName"
                  name="dogName"
                  value={formData.dogName}
                  onChange={handleInputChange}
                  placeholder="Your dog's name"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email (cannot be changed)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="disabled-input"
              />
            </div>

            <div className="password-section">
              <div className="password-header">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPasswordFields}
                    onChange={(e) => setShowPasswordFields(e.target.checked)}
                  />
                  Change Password
                </label>
              </div>

              {showPasswordFields && (
                <div className="password-fields">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password *</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      required={showPasswordFields}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password *</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required={showPasswordFields}
                      placeholder="Enter new password (min 6 characters)"
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={showPasswordFields}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn cancel-btn">
                Cancel
              </button>
              <button type="submit" className="btn save-btn">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
