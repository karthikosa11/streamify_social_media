# Render Deployment Guide for Streamify

## Critical Environment Variables for Production

### Backend Environment Variables (Required for Password Reset)

Set these in your Render dashboard under Environment Variables:

```env
# Database (CRITICAL - Required for password reset)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamify

# JWT Secret (CRITICAL - Required for authentication)
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long-and-random

# Server Configuration
PORT=5001
NODE_ENV=production

# Frontend URL (for CORS and email links)
FRONTEND_URL=https://streamify-social-media-web.onrender.com

# Email Configuration (Required for password reset emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Stream API Keys (Required for chat features)
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret

# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=your-openai-api-key

# Gemini API Key (Required for AI features)
GEMINI_API_KEY=your-gemini-api-key
```

## Step-by-Step Render Deployment

### 1. Backend Service Setup

1. **Create a new Web Service** in Render
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name**: `streamify-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### 2. Environment Variables Setup

**CRITICAL**: Add these environment variables in your Render dashboard:

1. Go to your backend service in Render
2. Click on "Environment" tab
3. Add each variable from the list above

**Most Important for Password Reset:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string
- `EMAIL_USER` - Gmail address
- `EMAIL_PASS` - Gmail app password

### 3. MongoDB Setup

1. **Create MongoDB Atlas cluster** (free tier available)
2. **Get connection string** from MongoDB Atlas
3. **Replace placeholders** in connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/streamify
   ```

### 4. Email Setup (Gmail)

1. **Enable 2-factor authentication** on your Gmail
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use the app password** as `EMAIL_PASS`

### 5. Frontend Service Setup

1. **Create another Web Service** for frontend
2. **Configure:**
   - **Name**: `streamify-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Environment**: `Node`

### 6. Frontend Environment Variables

```env
VITE_BACKEND_URL=https://your-backend-service.onrender.com
VITE_NODE_ENV=production
```

## Troubleshooting Password Reset Issues

### Common Issues and Solutions

#### 1. 500 Internal Server Error
**Cause**: Missing environment variables
**Solution**: Check all required environment variables are set in Render

#### 2. Database Connection Error
**Cause**: Invalid MONGODB_URI
**Solution**: 
- Verify MongoDB Atlas connection string
- Check network access (IP whitelist)
- Ensure database exists

#### 3. Email Sending Failed
**Cause**: Invalid email credentials
**Solution**:
- Use Gmail app password (not regular password)
- Enable "Less secure app access" or use app passwords
- Check EMAIL_USER and EMAIL_PASS are correct

#### 4. JWT Token Issues
**Cause**: Missing or weak JWT_SECRET
**Solution**: Generate a strong random string for JWT_SECRET

### Debugging Steps

1. **Check Render Logs**:
   - Go to your backend service
   - Click "Logs" tab
   - Look for error messages

2. **Test Environment Variables**:
   - Add this endpoint to test:
   ```javascript
   app.get('/api/test-env', (req, res) => {
     res.json({
       hasMongoUri: !!process.env.MONGODB_URI,
       hasJwtSecret: !!process.env.JWT_SECRET,
       hasEmailUser: !!process.env.EMAIL_USER,
       hasEmailPass: !!process.env.EMAIL_PASS,
       nodeEnv: process.env.NODE_ENV
     });
   });
   ```

3. **Test Database Connection**:
   - Check if MongoDB is accessible
   - Verify connection string format

## Security Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] MongoDB Atlas with proper authentication
- [ ] Gmail app password (not regular password)
- [ ] HTTPS enabled (automatic on Render)
- [ ] Environment variables set (not in code)
- [ ] CORS configured properly
- [ ] Rate limiting implemented

## Monitoring

1. **Set up Render alerts** for service downtime
2. **Monitor MongoDB Atlas** for database issues
3. **Check email delivery** logs
4. **Monitor API usage** and costs

## Quick Fix for Current Issue

If you're getting 500 errors on password reset:

1. **Check Render environment variables** - ensure all required variables are set
2. **Verify MongoDB connection** - test your MONGODB_URI
3. **Check email configuration** - ensure EMAIL_USER and EMAIL_PASS are correct
4. **Restart the service** after adding environment variables

## Support

If issues persist:
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Test database connection separately
4. Check email service configuration 