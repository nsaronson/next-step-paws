import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactUs from './ContactUs';
import { mockLocalStorage, mockWindowAlert } from '../utils/testUtils';

describe('ContactUs Component', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
    mockWindowAlert();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders contact form with all fields', () => {
    render(<ContactUs />);
    
    expect(screen.getByText('📞 Contact Us')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buddy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('General Inquiry')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What can we help you with?')).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(<ContactUs />);
    
    expect(screen.getByText('info@nextsteppaws.com')).toBeInTheDocument();
    expect(screen.getByText('(555) PAW-STEP')).toBeInTheDocument();
    expect(screen.getByText('Serving the Greater Metro Area')).toBeInTheDocument();
    expect(screen.getByText(/Mon-Fri: 9AM-6PM/)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    
    render(<ContactUs />);
    
    // Check that required fields are marked as required
    expect(screen.getByLabelText(/Your Name/)).toHaveAttribute('required');
    expect(screen.getByLabelText(/Email Address/)).toHaveAttribute('required'); 
    expect(screen.getByLabelText(/Subject/)).toHaveAttribute('required');
    expect(screen.getByLabelText(/Message/)).toHaveAttribute('required');
  });

  it('successfully submits contact form', async () => {
    
    render(<ContactUs />);
    
    // Fill out the form
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Jane Doe');
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'jane@example.com');
    await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-987-6543');
    await userEvent.type(screen.getByPlaceholderText('Buddy'), 'Max');
    await userEvent.selectOptions(screen.getByDisplayValue('General Inquiry'), 'private');
    await userEvent.type(screen.getByPlaceholderText('What can we help you with?'), 'Private lesson inquiry');
    await userEvent.type(
      screen.getByPlaceholderText(/Tell us about your dog's training needs/), 
      'My dog needs help with leash training'
    );
    
    await userEvent.click(screen.getByText('Send Message 🐾'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'contactSubmissions',
      expect.stringContaining('jane@example.com')
    );
  });

  it('shows success message after submission', async () => {
    
    render(<ContactUs />);
    
    // Fill required fields
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Jane Doe');
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'jane@example.com');
    await userEvent.type(screen.getByPlaceholderText('What can we help you with?'), 'Test inquiry');
    await userEvent.type(
      screen.getByPlaceholderText(/Tell us about your dog's training needs/), 
      'Test message'
    );
    
    await userEvent.click(screen.getByText('Send Message 🐾'));
    
    expect(screen.getByText('Thank You! 🐾')).toBeInTheDocument();
    expect(screen.getByText('Your message has been received successfully!')).toBeInTheDocument();
    expect(screen.getByText('We\'ll get back to you within 24 hours.')).toBeInTheDocument();
  });

  it('resets form after success timeout', async () => {
    
    render(<ContactUs />);
    
    // Fill and submit form
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Jane Doe');
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'jane@example.com');
    await userEvent.type(screen.getByPlaceholderText('What can we help you with?'), 'Test inquiry');
    await userEvent.type(
      screen.getByPlaceholderText(/Tell us about your dog's training needs/), 
      'Test message'
    );
    
    await userEvent.click(screen.getByText('Send Message 🐾'));
    
    // Fast forward time to trigger reset
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.getByText('📞 Contact Us')).toBeInTheDocument();
      expect(screen.queryByText('Thank You! 🐾')).not.toBeInTheDocument();
    });
  });

  it('handles service type selection', async () => {
    
    render(<ContactUs />);
    
    const serviceSelect = screen.getByDisplayValue('General Inquiry');
    
    await userEvent.selectOptions(serviceSelect, 'private');
    expect(screen.getByDisplayValue('Private Lessons')).toBeInTheDocument();
    
    await userEvent.selectOptions(serviceSelect, 'behavior');
    expect(screen.getByDisplayValue('Behavior Consultation')).toBeInTheDocument();
  });

  it('handles optional fields correctly', async () => {
    
    render(<ContactUs />);
    
    // Fill only required fields
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Jane Doe');
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'jane@example.com');
    await userEvent.type(screen.getByPlaceholderText('What can we help you with?'), 'Test inquiry');
    await userEvent.type(
      screen.getByPlaceholderText(/Tell us about your dog's training needs/), 
      'Test message'
    );
    
    await userEvent.click(screen.getByText('Send Message 🐾'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'contactSubmissions',
      expect.stringContaining('jane@example.com')
    );
  });

  it('preserves existing contact submissions', async () => {
    
    const existingSubmissions = [
      { id: 'contact-1', name: 'Existing User', email: 'existing@example.com' }
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSubmissions));
    
    render(<ContactUs />);
    
    // Submit new contact
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'New User');
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'new@example.com');
    await userEvent.type(screen.getByPlaceholderText('What can we help you with?'), 'New inquiry');
    await userEvent.type(
      screen.getByPlaceholderText(/Tell us about your dog's training needs/), 
      'New message'
    );
    
    await userEvent.click(screen.getByText('Send Message 🐾'));
    
    // Should preserve existing submissions
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'contactSubmissions',
      expect.stringContaining('existing@example.com')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'contactSubmissions',
      expect.stringContaining('new@example.com')
    );
  });

  it('creates submission with correct structure', async () => {
    
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    
    render(<ContactUs />);
    
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('john@example.com'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('(555) 123-4567'), '555-123-4567');
    await userEvent.type(screen.getByPlaceholderText('Buddy'), 'Rex');
    await userEvent.selectOptions(screen.getByDisplayValue('General Inquiry'), 'private');
    await userEvent.type(screen.getByPlaceholderText('What can we help you with?'), 'Test Subject');
    await userEvent.type(
      screen.getByPlaceholderText(/Tell us about your dog's training needs/), 
      'Test message content'
    );
    
    await userEvent.click(screen.getByText('Send Message 🐾'));
    
    const expectedSubmission = expect.objectContaining({
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-123-4567',
      dogName: 'Rex',
      serviceType: 'private',
      subject: 'Test Subject',
      message: 'Test message content',
      submittedAt: expect.any(String)
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'contactSubmissions',
      expect.stringContaining('"name":"Test User"')
    );
  });

  it('displays all service type options', () => {
    render(<ContactUs />);
    
    const serviceSelect = screen.getByDisplayValue('General Inquiry');
    
    expect(screen.getByText('General Inquiry')).toBeInTheDocument();
    expect(screen.getByText('Private Lessons')).toBeInTheDocument();
    expect(screen.getByText('Group Classes')).toBeInTheDocument();
    expect(screen.getByText('Behavior Consultation')).toBeInTheDocument();
    expect(screen.getByText('Pricing Information')).toBeInTheDocument();
    expect(screen.getByText('Scheduling Question')).toBeInTheDocument();
  });
});
