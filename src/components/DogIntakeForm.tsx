import React, { useState } from 'react';
import { User, DogIntake } from '../types/auth';
import './DogIntakeForm.css';

interface DogIntakeFormProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const DogIntakeForm: React.FC<DogIntakeFormProps> = ({ user, onComplete }) => {
  const [formData, setFormData] = useState<Partial<DogIntake>>({
    dogName: user.dogName || '',
    ownerEmail: user.email,
    ownerName: user.name,
    breed: '',
    age: 0,
    weight: 0,
    sex: 'male',
    spayedNeutered: false,
    vaccinationUpToDate: false,
    medicalConditions: '',
    currentMedications: '',
    behaviorConcerns: '',
    trainingGoals: '',
    previousTraining: '',
    energyLevel: 'medium',
    socialization: 'good',
    emergencyContact: '',
    emergencyPhone: '',
    vetInfo: '',
    specialInstructions: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['dogName', 'breed', 'age', 'weight', 'emergencyContact', 'emergencyPhone'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof DogIntake]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!formData.vaccinationUpToDate) {
      alert('Current vaccinations are required for training. Please update vaccinations before proceeding.');
      return;
    }

    // Save intake form
    const intakeData: DogIntake = {
      ...formData as DogIntake,
      id: `intake-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const existingIntakes = JSON.parse(localStorage.getItem('dogIntakes') || '[]');
    existingIntakes.push(intakeData);
    localStorage.setItem('dogIntakes', JSON.stringify(existingIntakes));

    // Update user
    const updatedUser = {
      ...user,
      intakeFormCompleted: true,
      dogName: formData.dogName || user.dogName
    };

    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    onComplete(updatedUser);
  };

  return (
    <div className="intake-container">
      <div className="card">
        <h2>🐕 Dog Intake Form</h2>
        <p className="intake-intro">
          Please provide detailed information about your dog to help us create the best training plan.
        </p>

        <form onSubmit={handleSubmit} className="intake-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dogName">Dog's Name *</label>
                <input
                  type="text"
                  id="dogName"
                  name="dogName"
                  value={formData.dogName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Buddy"
                />
              </div>
              <div className="form-group">
                <label htmlFor="breed">Breed *</label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Golden Retriever, Mixed"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age (years) *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="0"
                  max="30"
                  step="0.5"
                  required
                  placeholder="e.g., 2.5"
                />
              </div>
              <div className="form-group">
                <label htmlFor="weight">Weight (lbs) *</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  min="1"
                  max="300"
                  required
                  placeholder="e.g., 65"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sex">Sex</label>
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="spayedNeutered"
                  checked={formData.spayedNeutered}
                  onChange={handleInputChange}
                />
                Spayed/Neutered
              </label>
              <label className="checkbox-label required-checkbox">
                <input
                  type="checkbox"
                  name="vaccinationUpToDate"
                  checked={formData.vaccinationUpToDate}
                  onChange={handleInputChange}
                  required
                />
                Current on all vaccinations (DHPP, Rabies, Bordetella) *
              </label>
            </div>
          </div>

          {/* Health Information */}
          <div className="form-section">
            <h3>Health Information</h3>
            <div className="form-group">
              <label htmlFor="medicalConditions">Medical Conditions/Allergies</label>
              <textarea
                id="medicalConditions"
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleInputChange}
                rows={3}
                placeholder="List any medical conditions, allergies, or physical limitations..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="currentMedications">Current Medications</label>
              <textarea
                id="currentMedications"
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleInputChange}
                rows={2}
                placeholder="List any medications your dog is currently taking..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="vetInfo">Veterinarian Information</label>
              <textarea
                id="vetInfo"
                name="vetInfo"
                value={formData.vetInfo}
                onChange={handleInputChange}
                rows={2}
                placeholder="Vet name, clinic, and phone number..."
              />
            </div>
          </div>

          {/* Behavior & Training */}
          <div className="form-section">
            <h3>Behavior & Training Background</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="energyLevel">Energy Level</label>
                <select
                  id="energyLevel"
                  name="energyLevel"
                  value={formData.energyLevel}
                  onChange={handleInputChange}
                >
                  <option value="low">Low - Calm, prefers to rest</option>
                  <option value="medium">Medium - Moderate activity</option>
                  <option value="high">High - Very active, needs lots of exercise</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="socialization">Socialization Level</label>
                <select
                  id="socialization"
                  name="socialization"
                  value={formData.socialization}
                  onChange={handleInputChange}
                >
                  <option value="excellent">Excellent - Great with people and dogs</option>
                  <option value="good">Good - Generally friendly</option>
                  <option value="fair">Fair - Selective about interactions</option>
                  <option value="poor">Poor - Fearful or reactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="behaviorConcerns">Behavior Concerns</label>
              <textarea
                id="behaviorConcerns"
                name="behaviorConcerns"
                value={formData.behaviorConcerns}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe any behavior issues: jumping, pulling, barking, aggression, anxiety, etc..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="trainingGoals">Training Goals</label>
              <textarea
                id="trainingGoals"
                name="trainingGoals"
                value={formData.trainingGoals}
                onChange={handleInputChange}
                rows={3}
                placeholder="What would you like to achieve through training?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="previousTraining">Previous Training Experience</label>
              <textarea
                id="previousTraining"
                name="previousTraining"
                value={formData.previousTraining}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe any previous training, classes, or methods used..."
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="form-section">
            <h3>Emergency Contact</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact Name *</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  required
                  placeholder="Name of emergency contact"
                />
              </div>
              <div className="form-group">
                <label htmlFor="emergencyPhone">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  required
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label htmlFor="specialInstructions">Special Instructions or Notes</label>
              <textarea
                id="specialInstructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any other information that would help us provide better care for your dog..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn submit-btn">
              Complete Intake Form 📋
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DogIntakeForm;
