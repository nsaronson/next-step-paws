# Elite Canine Academy 🐕

A professional dog training business management web application built with React and TypeScript.

## Features

### For Business Owners
- **Dashboard Management**: View bookings, manage availability, track revenue
- **Calendar-Based Scheduling**: Visual calendar interface for setting available time slots
- **Group Class Management**: Create, edit, and delete training classes with pricing
- **Booking Overview**: Monitor all customer bookings and cancellations

### For Customers
- **Account Registration**: Sign up with name, email, and dog information
- **Group Class Enrollment**: Browse and enroll in available training classes
- **Private Lesson Booking**: Book one-on-one sessions from available time slots
- **Booking Management**: View and cancel upcoming appointments

### General Features
- **Professional Design**: Subtle lilac theme with responsive layout
- **About Page**: Business information, services, and contact details
- **Persistent Data**: All data saves locally (localStorage)
- **Mobile Friendly**: Works on all devices

## Demo Credentials

**Owner Login:**
- Email: `owner@poodletraining.com`
- Password: `poodle123`

**Customer Login:**
- Create a new account or use any existing customer email

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Storage**: Browser localStorage (no backend required)
- **Build Tool**: Create React App
- **Deployment**: AWS Amplify / S3 + CloudFront

## Local Development

```bash
cd poodle-training
npm install
npm start
```

The app will open at `http://localhost:3000`

## AWS Free Tier Deployment ($0 Cost)

This app is designed to run completely free on AWS Free Tier.

### Option 1: AWS Amplify (Recommended - Easiest)

1. **Quick Deploy**:
   - Push code to GitHub
   - Connect GitHub to AWS Amplify
   - Automatic build and deployment
   - See detailed instructions in `deploy-aws.md`

2. **Free Tier Limits**:
   - 5 GB storage (you'll use ~1 MB)
   - 15 GB data transfer/month
   - 1000 build minutes/month

### Option 2: CloudFormation + S3 + CloudFront

1. **Automated Deployment**:
   ```bash
   ./deploy-scripts.sh deploy
   ```

2. **Update Deployment**:
   ```bash
   ./deploy-scripts.sh update
   ```

3. **Clean Up**:
   ```bash
   ./deploy-scripts.sh destroy
   ```

## Project Structure

```
poodle-training/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── Header.tsx      # App header
│   │   ├── Login.tsx       # Authentication
│   │   ├── GroupClasses.tsx # Class enrollment
│   │   ├── PrivateLessons.tsx # Lesson booking
│   │   ├── OwnerDashboard.tsx # Admin interface
│   │   └── AboutPage.tsx   # Business info
│   ├── types/             # TypeScript interfaces
│   └── App.tsx            # Main app component
├── amplify.yml            # AWS Amplify build config
└── cloudformation-template.yaml # AWS infrastructure
```

## Key Components

### Authentication System
- Role-based access (Owner vs Customer)
- Simple email/password for owners
- Customer registration with dog information

### Booking System
- Real-time availability checking
- Conflict prevention (no double-booking)
- Automatic slot management

### Data Management
- localStorage for persistence
- JSON-based data structure
- Automatic data migration between sessions

## Business Logic

### Group Classes
```typescript
interface GroupClass {
  id: string;
  name: string;
  description: string;
  schedule: string;
  spots: number;        // Remaining spots
  maxSpots: number;     // Total capacity
  price: number;        // Per 4-week session
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  enrolled: string[];   // Customer emails
}
```

### Private Lessons
```typescript
interface AvailableSlot {
  id: string;
  date: string;         // YYYY-MM-DD format
  time: string;         // "10:00 AM" format
  isBooked: boolean;
  customerEmail?: string;
  customerName?: string;
  dogName?: string;
  notes?: string;
}
```

## Customization

### Theming
- Colors defined in CSS custom properties
- Consistent lilac palette throughout
- Easy to modify in `src/App.css`

### Business Information
- Update contact details in `AboutPage.tsx`
- Modify business name in `Header.tsx`
- Adjust pricing in `GroupClasses.tsx`

### Features
- Add new training class types
- Extend booking time slots
- Add customer communication features

## Production Considerations

### Current State (MVP)
- Client-side only (no backend)
- localStorage for data persistence
- Perfect for small business testing

### Future Enhancements
- **Backend**: AWS Lambda + DynamoDB
- **Authentication**: AWS Cognito
- **Payments**: Stripe integration
- **Email**: AWS SES for notifications
- **Analytics**: Customer behavior tracking

## Cost Monitoring

### AWS Free Tier Usage
- **Amplify**: 5GB storage, 15GB transfer
- **S3**: 5GB storage, 20,000 GET requests
- **CloudFront**: 1TB transfer, 10M requests
- **Lambda**: 1M requests, 400,000 GB-seconds

### Staying Free
- Monitor usage in AWS console
- Set billing alerts at $1
- Your app usage will be well under limits

## Support

### Common Issues
- **Build Errors**: Check Node.js version (16+)
- **Deployment Issues**: Verify AWS credentials
- **Data Loss**: Check browser localStorage limits

### Development
- Use React DevTools for debugging
- Check browser console for errors
- Test on multiple devices/browsers

## License

MIT License - Feel free to use for your dog training business!

---

**Built with ❤️ for dog trainers everywhere**
