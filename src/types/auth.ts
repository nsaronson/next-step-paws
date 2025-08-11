export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'customer';
  dogName?: string; // For customers
  waiverSigned?: boolean;
  policiesAccepted?: boolean;
  intakeFormCompleted?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  duration: number; // 30 or 60 minutes
  isBooked: boolean;
  bookedBy?: string;
  customerEmail?: string;
  customerName?: string;
  dogName?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  customerEmail: string;
  customerName: string;
  dogName: string;
  date: string;
  time: string;
  duration: number; // 30 or 60 minutes
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  lessonNotes?: string;
  progress?: string;
  behaviorNotes?: string;
}

export interface DogIntake {
  id: string;
  dogName: string;
  ownerEmail: string;
  ownerName: string;
  breed: string;
  age: number;
  weight: number;
  sex: 'male' | 'female';
  spayedNeutered: boolean;
  vaccinationUpToDate: boolean;
  medicalConditions?: string;
  currentMedications?: string;
  behaviorConcerns?: string;
  trainingGoals?: string;
  previousTraining?: string;
  energyLevel: 'low' | 'medium' | 'high';
  socialization: 'excellent' | 'good' | 'fair' | 'poor';
  emergencyContact: string;
  emergencyPhone: string;
  vetInfo?: string;
  specialInstructions?: string;
  createdAt: string;
}

export interface GroupClass {
  id: string;
  name: string;
  description: string;
  schedule: string;
  spots: number;
  maxSpots: number;
  price: number;
  level: 'Introductory skills' | 'Puppy' | 'Ongoing skills';
  enrolled: string[];
  waitlist?: string[]; // Array of "Name (email)" strings for waitlist
}

export interface LessonNote {
  id: string;
  dogName: string;
  ownerEmail: string;
  date: string;
  lessonType: 'private' | 'group';
  classId?: string;
  bookingId?: string;
  notes: string;
  progress: string;
  homework?: string;
  nextSteps?: string;
  behaviorObservations?: string;
  createdAt: string;
  updatedAt: string;
}
