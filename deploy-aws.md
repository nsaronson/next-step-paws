# Deploy Elite Canine Academy to AWS Free Tier ($0 Cost)

This guide will help you deploy the Elite Canine Academy app to AWS Amplify for free.

## Prerequisites

1. **AWS Account** (free to create)
2. **GitHub Account** (free)
3. **Git installed** on your computer

## Step 1: Push Code to GitHub

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `elite-canine-academy`
   - Make it public (required for free tier)
   - Don't initialize with README

2. Push your code to GitHub:
   ```bash
   cd poodle-training
   git init
   git add .
   git commit -m "Initial commit - Elite Canine Academy"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/elite-canine-academy.git
   git push -u origin main
   ```

## Step 2: Deploy with AWS Amplify

1. **Sign in to AWS Console**:
   - Go to https://console.aws.amazon.com/
   - Sign in or create a free AWS account

2. **Open AWS Amplify**:
   - Search for "Amplify" in the AWS Console
   - Click on "AWS Amplify"

3. **Create New App**:
   - Click "New app" → "Host web app"
   - Select "GitHub" as your Git provider
   - Click "Continue"

4. **Connect Repository**:
   - Authorize AWS Amplify to access your GitHub
   - Select your `elite-canine-academy` repository
   - Select the `main` branch
   - Click "Next"

5. **Configure Build Settings**:
   - App name: `elite-canine-academy`
   - The build settings should auto-detect (amplify.yml is already configured)
   - Click "Next"

6. **Review and Deploy**:
   - Review the settings
   - Click "Save and deploy"

## Step 3: Wait for Deployment

- The deployment process takes 3-5 minutes
- You'll see progress through: Provision → Build → Deploy → Verify
- Once complete, you'll get a live URL like: `https://main.d1234567890.amplifyapp.com`

## Step 4: Test Your App

1. Visit the provided URL
2. Test the functionality:
   - **Customer signup**: Create a test account
   - **Owner login**: Use `owner@poodletraining.com` / `poodle123`
   - **Group classes**: Enroll in classes
   - **Private lessons**: Test booking system
   - **About page**: Verify content loads

## Free Tier Limits (You Won't Exceed These)

- **Storage**: 5 GB (your app is ~1 MB)
- **Data Transfer**: 15 GB/month (generous for personal use)
- **Build minutes**: 1000 minutes/month (plenty for updates)

## Custom Domain (Optional)

If you want a custom domain:

1. **In Amplify Console**:
   - Go to "Domain management"
   - Click "Add domain"

2. **Free Options**:
   - Use a free domain from Freenom (freenom.com)
   - Or use AWS Route 53 ($0.50/month for hosted zone)

## Automatic Updates

Every time you push to your GitHub `main` branch:
- AWS Amplify automatically rebuilds and deploys
- No manual intervention needed
- Perfect for ongoing development

## Cost Monitoring

- Go to AWS Billing Dashboard
- Set up a billing alert for $1 (you shouldn't hit this)
- Monitor usage in Amplify console

## Environment Variables (If Needed Later)

If you add backend features later:
1. In Amplify Console → Environment variables
2. Add any API keys or configuration

## Alternative: S3 + CloudFront (Manual Setup)

If you prefer more control, here's the S3 approach:

### Create S3 Bucket
```bash
aws s3 mb s3://elite-canine-academy-website --region us-east-1
```

### Build and Upload
```bash
npm run build
aws s3 sync build/ s3://elite-canine-academy-website --delete
```

### Enable Static Website Hosting
```bash
aws s3 website s3://elite-canine-academy-website --index-document index.html --error-document index.html
```

## Troubleshooting

**Build Failed?**
- Check the build logs in Amplify console
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**404 Errors?**
- Single Page Apps need all routes to serve index.html
- Amplify handles this automatically with our configuration

**Performance Issues?**
- Enable CloudFront distribution in Amplify settings
- This is included in free tier

## Security Notes

- The app uses localStorage (client-side only)
- No sensitive data is transmitted
- HTTPS is automatically enabled by Amplify
- Consider adding authentication for production use

## Next Steps for Production

1. **Custom Domain**: Point your domain to Amplify
2. **Analytics**: Enable web analytics in Amplify
3. **Backend**: Add AWS Lambda functions if needed
4. **Database**: Use DynamoDB for persistent data
5. **Authentication**: Implement AWS Cognito for user management

Your app will be live at a URL like: `https://main.d1234567890.amplifyapp.com`

**Total Monthly Cost: $0.00** (within AWS Free Tier limits)
