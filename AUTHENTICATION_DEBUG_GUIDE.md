# Authentication & Onboarding Debug Guide

## Current Issues
- 401 Unauthorized errors on `/api/auth/me`
- 404 Not Found errors on `/api/users/profile`
- Onboarding page submission failing

## Root Causes Identified

### 1. Missing Profile Routes
**Issue**: The `/api/users/profile` endpoint was not defined in the user routes.
**Fix**: ✅ Added profile routes to `backend/src/routes/user.route.js`

### 2. Authentication Token Issues
**Issue**: JWT tokens might not be properly set or validated.
**Fix**: ✅ Enhanced authentication middleware with better debugging

### 3. Missing File Upload Configuration
**Issue**: Profile picture uploads were not properly configured.
**Fix**: ✅ Added multer configuration for file uploads

## Debugging Steps

### Step 1: Test Authentication Endpoints

#### Test 1: Environment Variables
```bash
curl https://your-backend-url.onrender.com/api/auth/test-env
```

**Expected Response:**
```json
{
  "hasMongoUri": true,
  "hasJwtSecret": true,
  "hasEmailUser": true,
  "hasEmailPass": true,
  "nodeEnv": "production",
  "frontendUrl": "https://streamify-social-media-web.onrender.com",
  "port": "5001",
  "message": "Environment check completed"
}
```

#### Test 2: Authentication Status
```bash
curl https://your-backend-url.onrender.com/api/auth/me
```

**Expected Response (if authenticated):**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "fullName": "User Name",
    "isOnboarded": false
  }
}
```

**Expected Response (if not authenticated):**
```json
{
  "message": "Unauthorized - No token provided"
}
```

### Step 2: Check Frontend Authentication

#### Check if user is logged in:
1. Open browser developer tools
2. Go to Application/Storage tab
3. Check if JWT cookie exists
4. Check if token is stored in localStorage

#### Test login flow:
1. Try logging out and logging back in
2. Check if JWT token is properly set
3. Verify the token is being sent with requests

### Step 3: Test Profile Endpoints

#### Test Profile GET:
```bash
curl https://your-backend-url.onrender.com/api/users/profile
```

#### Test Profile UPDATE:
```bash
curl -X PUT https://your-backend-url.onrender.com/api/users/profile \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "bio": "Test bio",
    "nativeLanguage": "English",
    "learningLanguage": "Spanish",
    "location": "Test Location"
  }'
```

## Common Issues and Solutions

### Issue 1: 401 Unauthorized
**Symptoms**: Getting 401 errors on protected routes
**Causes**:
- JWT token not set during login
- JWT_SECRET not configured
- Token expired
- Token malformed

**Solutions**:
1. Check if JWT_SECRET is set in environment variables
2. Verify login is setting the token properly
3. Check if token is being sent with requests
4. Ensure token format is correct

### Issue 2: 404 Not Found
**Symptoms**: Getting 404 errors on API endpoints
**Causes**:
- Routes not properly defined
- Wrong URL path
- Backend service not running

**Solutions**:
1. Verify routes are properly defined
2. Check if backend service is running
3. Ensure correct API base URL

### Issue 3: Onboarding Submission Fails
**Symptoms**: Form submission returns errors
**Causes**:
- Missing required fields
- File upload issues
- Authentication problems

**Solutions**:
1. Check all required fields are filled
2. Verify file upload configuration
3. Ensure user is authenticated

## Enhanced Logging

The backend now includes comprehensive logging for debugging:

### Authentication Logs
- Token presence and format
- JWT secret availability
- User lookup results
- Authentication success/failure

### Profile Update Logs
- Request data received
- File upload status
- Database update results
- Response sent

## Testing Checklist

- [ ] Backend service is running
- [ ] Environment variables are set
- [ ] Database connection is working
- [ ] JWT_SECRET is configured
- [ ] Login sets authentication token
- [ ] Protected routes are accessible
- [ ] Profile endpoints are working
- [ ] File uploads are configured
- [ ] Onboarding form submission works

## Quick Fix Commands

### Restart Backend Service
If using Render, restart the service after making changes.

### Clear Browser Data
Clear cookies and localStorage to reset authentication state.

### Test Authentication Flow
1. Logout completely
2. Login again
3. Check if token is set
4. Test protected endpoints

## Next Steps

1. **Deploy the updated backend** with the fixes
2. **Test the authentication flow** from login to onboarding
3. **Verify all endpoints** are working
4. **Check the logs** for any remaining issues
5. **Test the complete user flow** from signup to profile completion

## Support

If issues persist:
1. Check the enhanced logs for specific error messages
2. Verify all environment variables are set correctly
3. Test endpoints manually using curl or Postman
4. Check if the backend service is properly deployed 