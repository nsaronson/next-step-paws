import emailjs from '@emailjs/browser';
import { Booking, User } from '../types/auth';

// EmailJS configuration - these would normally be environment variables
// For demo purposes, we'll use placeholder values that need to be configured
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'your_service_id';
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'your_template_id';
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'your_public_key';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: 'Your Private Lesson is Confirmed! 🐕',
    body: `Hi {{customerName}},

Great news! Your private lesson booking has been confirmed.

📅 **Lesson Details:**
• Date: {{date}}
• Time: {{time}}
• Duration: {{duration}} minutes
• Dog: {{dogName}}

📍 **Location:** Elite Canine Academy
123 Training Lane, Dogtown, CA 90210

💡 **What to Bring:**
• Your dog's favorite treats
• A water bowl
• Any specific training concerns or goals

🎯 **Training Notes:**
{{notes}}

If you need to reschedule or have any questions, please don't hesitate to reach out!

Best regards,
The Elite Canine Academy Team
📞 (555) 123-DOGS
📧 info@elitecanineacademy.com`,
    variables: ['customerName', 'date', 'time', 'duration', 'dogName', 'notes']
  },
  {
    id: 'lesson_reminder',
    name: 'Lesson Reminder',
    subject: 'Reminder: Your Private Lesson Tomorrow 🐾',
    body: `Hi {{customerName}},

Just a friendly reminder about your upcoming private lesson!

📅 **Tomorrow's Lesson:**
• Date: {{date}}
• Time: {{time}}
• Duration: {{duration}} minutes
• Dog: {{dogName}}

📍 **Location:** Elite Canine Academy
123 Training Lane, Dogtown, CA 90210

Please arrive 5-10 minutes early to get {{dogName}} settled.

Looking forward to seeing you both!

Best regards,
The Elite Canine Academy Team`,
    variables: ['customerName', 'date', 'time', 'duration', 'dogName']
  },
  {
    id: 'follow_up',
    name: 'Post-Lesson Follow-up',
    subject: 'Thank you for training with us! 🎉',
    body: `Hi {{customerName}},

Thank you for bringing {{dogName}} to Elite Canine Academy! We had a wonderful time working together.

🎯 **Today's Progress:**
{{progressNotes}}

📚 **Homework for {{dogName}}:**
{{homework}}

📅 **Next Steps:**
{{nextSteps}}

Feel free to reach out if you have any questions about {{dogName}}'s training progress, or if you'd like to schedule another session.

We're here to help you and {{dogName}} succeed!

Best regards,
The Elite Canine Academy Team
📞 (555) 123-DOGS`,
    variables: ['customerName', 'dogName', 'progressNotes', 'homework', 'nextSteps']
  },
  {
    id: 'custom',
    name: 'Custom Message',
    subject: '',
    body: '',
    variables: ['customerName', 'dogName']
  }
];

export interface EmailData {
  to_email: string;
  to_name: string;
  from_name: string;
  subject: string;
  message: string;
  reply_to: string;
}

export class EmailService {
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      // Check if EmailJS is properly configured
      if (EMAILJS_SERVICE_ID === 'your_service_id' || 
          EMAILJS_TEMPLATE_ID === 'your_template_id' || 
          EMAILJS_PUBLIC_KEY === 'your_public_key') {
        
        console.log('📧 Email would be sent:', emailData);
        
        // For demo purposes, show the email content in an alert
        const emailPreview = `
TO: ${emailData.to_email}
FROM: ${emailData.from_name}
SUBJECT: ${emailData.subject}

${emailData.message}
        `;
        
        alert(`📧 Email Preview (Demo Mode):\n\n${emailPreview}\n\nTo enable actual email sending, configure EmailJS with your credentials.`);
        
        return {
          success: true,
          message: 'Email sent successfully (Demo Mode)'
        };
      }

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        emailData as unknown as Record<string, unknown>
      );

      if (result.status === 200) {
        return {
          success: true,
          message: 'Email sent successfully!'
        };
      } else {
        throw new Error(`EmailJS returned status: ${result.status}`);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static fillTemplate(template: EmailTemplate, data: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    // Replace variables in both subject and body
    template.variables.forEach(variable => {
      const value = data[variable] || `{{${variable}}}`;
      const regex = new RegExp(`{{${variable}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return { subject, body };
  }

  static createEmailFromBooking(
    booking: Booking, 
    customer: User, 
    templateId: string,
    customData?: Record<string, string>
  ): { subject: string; body: string } {
    const template = emailTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const data = {
      customerName: customer.name,
      dogName: booking.dogName,
      date: new Date(booking.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: booking.time,
      duration: booking.duration.toString(),
      notes: booking.notes || 'Looking forward to working with your pup!',
      ...customData
    };

    return this.fillTemplate(template, data);
  }

  static async sendBookingEmail(
    booking: Booking,
    customer: User,
    templateId: string,
    customData?: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { subject, body } = this.createEmailFromBooking(booking, customer, templateId, customData);

      const emailData: EmailData = {
        to_email: customer.email,
        to_name: customer.name,
        from_name: 'Elite Canine Academy',
        subject,
        message: body,
        reply_to: 'info@elitecanineacademy.com'
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      return {
        success: false,
        message: `Failed to send booking email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
