# Email Functionality Setup

The Elite Canine Academy app includes email functionality that allows business owners to send emails directly to customers from the owner dashboard.

## Features

- **Email Templates**: Pre-built templates for common scenarios:
  - Booking confirmation
  - Lesson reminders  
  - Post-lesson follow-up
  - Custom messages

- **Customer Integration**: Automatically populates customer and booking information

- **Professional Formatting**: Well-designed email templates with business branding

## Setup Instructions

### 1. Create EmailJS Account

1. Go to [EmailJS.com](https://emailjs.com) and create a free account
2. Create a new email service (Gmail, Outlook, etc.)
3. Create an email template with the following variables:
   - `{{to_email}}` - Customer email
   - `{{to_name}}` - Customer name
   - `{{from_name}}` - Your business name
   - `{{subject}}` - Email subject
   - `{{message}}` - Email body
   - `{{reply_to}}` - Your business email

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```
   REACT_APP_EMAILJS_SERVICE_ID=your_actual_service_id
   REACT_APP_EMAILJS_TEMPLATE_ID=your_actual_template_id  
   REACT_APP_EMAILJS_PUBLIC_KEY=your_actual_public_key
   ```

### 3. EmailJS Template Setup

Create a template in EmailJS with this structure:

**Subject**: `{{subject}}`

**Body**:
```
{{message}}
```

**To**: `{{to_email}}`
**From Name**: `{{from_name}}`
**Reply To**: `{{reply_to}}`

## How to Use

### For Business Owners:

1. **Log in as Owner**: Use owner credentials to access the dashboard
2. **View Bookings**: Navigate to the "Bookings" tab
3. **Send Email**: Click the "📧 Send Email" button next to any booking
4. **Choose Template**: Select from pre-made templates or create custom message
5. **Customize**: Add specific details for follow-up emails (progress notes, homework, etc.)
6. **Send**: Click "Send Email" to deliver the message

### Available Email Templates:

1. **Booking Confirmation** - Automatically sent details, location, what to bring
2. **Lesson Reminder** - Friendly reminder for upcoming sessions
3. **Post-Lesson Follow-up** - Progress notes, homework, next steps
4. **Custom Message** - Blank template for any communication

## Demo Mode

If EmailJS is not configured, the app runs in demo mode:
- Email content is shown in a preview popup
- No actual emails are sent
- Perfect for testing and development

## Troubleshooting

**Emails not sending?**
- Check your EmailJS service is active
- Verify environment variables are correct
- Check browser console for error messages
- Ensure EmailJS template variables match exactly

**Template not formatting correctly?**
- Make sure all template variables are properly set in EmailJS
- Check that the template ID matches your configuration
- Verify the service ID and public key are correct

## Security Notes

- Environment variables keep your EmailJS credentials secure
- Never commit actual credentials to version control
- The reply-to address should be your business email
- EmailJS handles email delivery securely through their service

## Cost

EmailJS offers:
- **Free tier**: 200 emails/month
- **Paid plans**: Higher limits and additional features
- Perfect for small to medium dog training businesses
