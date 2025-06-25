# Production Deployment Guide

## Environment Variables Setup

### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamify

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Server Configuration
PORT=5001
NODE_ENV=production

# Frontend URL (your production domain)
FRONTEND_URL=https://yourdomain.com

# Stream API Keys
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration (recommended for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)
```bash
# Backend API URL
VITE_BACKEND_URL=https://api.yourdomain.com

# Stream API Key (if needed on frontend)
VITE_STREAM_API_KEY=your-stream-api-key

# Environment
VITE_NODE_ENV=production
```

## Deployment Steps

### 1. Backend Deployment
```bash
# Install dependencies
npm install

# Set environment variables
cp env.example .env
# Edit .env with your production values

# Build and start
npm start
```

### 2. Frontend Deployment
```bash
# Install dependencies
npm install

# Set environment variables
cp env.example .env
# Edit .env with your production values

# Build for production
npm run build

# Serve the dist folder
```

### 3. Database Setup
- Set up MongoDB Atlas or your preferred MongoDB provider
- Update MONGODB_URI in backend .env

### 4. Domain & SSL
- Configure your domain to point to your server
- Set up SSL certificates (Let's Encrypt recommended)
- Update FRONTEND_URL and VITE_BACKEND_URL accordingly

### 5. Reverse Proxy (Nginx example)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Checklist
- [ ] Strong JWT_SECRET
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Database secured
- [ ] API keys protected
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Error logging configured

## Monitoring
- Set up application monitoring (PM2, New Relic, etc.)
- Configure error tracking (Sentry)
- Set up uptime monitoring
- Monitor API usage and costs

## Backup Strategy
- Database backups
- File uploads backup
- Environment configuration backup 