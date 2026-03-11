# Deployment Guide

## Problem Summary

Your application has a **backend API** (Express server in `server.ts`) that handles authentication, medication tracking, and database operations. In development, this backend runs alongside your frontend. However, in production, if you only deploy the frontend static files, the backend API routes won't be available, causing the "Unexpected token" JSON error.

## Root Cause

- **Development**: Express server handles both frontend (via Vite middleware) and backend API routes at `/api/*`
- **Production**: Only static HTML/JS files are deployed; no Express server running
- **Result**: API calls to `/api/login` or `/api/register` hit the static hosting server, which returns HTML 404 pages instead of JSON

## Solution Options

### Option 1: Deploy Backend Separately (Recommended)

Deploy your Express backend to a Node.js hosting platform and configure the frontend to point to it.

#### Backend Deployment Options:

1. **Heroku**
   ```bash
   # Install Heroku CLI, then:
   heroku create medguide-backend
   git push heroku main
   heroku config:set VITE_SUPABASE_URL=your_url
   heroku config:set VITE_SUPABASE_ANON_KEY=your_key
   heroku config:set JWT_SECRET=your_secret
   ```

2. **Railway**
   - Connect your GitHub repo
   - Railway auto-detects Node.js
   - Add environment variables in dashboard

3. **Render**
   - Create new Web Service
   - Connect repository
   - Build command: `npm install`
   - Start command: `npm run dev`
   - Add environment variables

4. **DigitalOcean App Platform**
   - Create app from GitHub
   - Set build/run commands
   - Configure environment variables

#### Frontend Configuration:

After deploying your backend, update your frontend environment:

```env
# .env or .env.production
VITE_API_URL=https://your-backend-url.herokuapp.com/api
```

Or set this as an environment variable in your frontend hosting platform (Vercel, Netlify, etc.)

### Option 2: Migrate to Supabase Edge Functions (Serverless)

Since you're already using Supabase for the database, you can migrate your backend API to Supabase Edge Functions:

#### Benefits:
- No separate server to manage
- Automatic scaling
- Same Supabase project
- Built-in environment variables

#### Migration Steps:

1. Convert each Express route to an Edge Function
2. Deploy using the Supabase CLI or MCP tools
3. Update frontend to call Edge Function URLs

Example Edge Function structure:
```
supabase/functions/
  ├── login/index.ts
  ├── register/index.ts
  ├── medicines/index.ts
  └── adherence/index.ts
```

### Option 3: Deploy as Full-Stack App

Some platforms support deploying both frontend and backend together:

1. **Vercel** (with serverless functions)
2. **Netlify** (with Netlify Functions)
3. **AWS Amplify**

## Quick Fix for Testing

If you need to test immediately, you can run your backend on a simple Node hosting service:

1. Create a separate repository with just `server.ts`, `package.json`, and database config
2. Deploy to Render's free tier or Railway
3. Set `VITE_API_URL` environment variable in your frontend deployment
4. Rebuild and redeploy frontend

## Environment Variables Checklist

### Backend (server.ts):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `JWT_SECRET` - Secret for JWT token signing
- `OPENFDA_API_KEY` - Optional FDA API key
- `NODE_ENV` - Set to "production"

### Frontend:
- `VITE_API_URL` - Full URL to your deployed backend (e.g., `https://api.medguide.com/api`)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Testing Your Deployment

1. Check backend health:
   ```bash
   curl https://your-backend.com/api/user
   # Should return 401 Unauthorized (JSON), not HTML
   ```

2. Test login from browser console:
   ```javascript
   fetch('https://your-backend.com/api/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'test@example.com', password: 'test' })
   }).then(r => r.json()).then(console.log)
   ```

3. Verify CORS if frontend and backend are on different domains:
   ```javascript
   // Add to server.ts before routes
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
     if (req.method === 'OPTIONS') {
       return res.sendStatus(200);
     }
     next();
   });
   ```

## Troubleshooting

### Error: "Backend API not available"
- Backend is not deployed or not running
- `VITE_API_URL` not set or incorrect
- Backend crashed due to missing environment variables

### Error: "Expected JSON response but received HTML"
- API URL points to frontend hosting, not backend
- Backend route not found (404 HTML page returned)
- CORS preflight failing

### Error: "Failed to fetch"
- CORS not configured on backend
- Backend URL incorrect (typo, http vs https)
- Backend SSL certificate issue

## Recommended Architecture

```
Frontend (Static)          Backend (Node.js)         Database
┌─────────────────┐       ┌──────────────────┐     ┌──────────────┐
│   Vercel/       │       │   Railway/       │     │   Supabase   │
│   Netlify       │──────▶│   Heroku         │────▶│   Postgres   │
│                 │       │   (server.ts)    │     │              │
│   HTML/JS/CSS   │       │   /api/* routes  │     │   Tables     │
└─────────────────┘       └──────────────────┘     └──────────────┘
```

## Need Help?

If you're still seeing the JSON parsing error:

1. Open browser DevTools → Network tab
2. Try to login/register
3. Click the failed request
4. Check the "Response" tab
5. If you see HTML instead of JSON, your backend is not deployed correctly

The response should look like:
```json
{ "error": "Invalid credentials" }
```

NOT like:
```html
<!DOCTYPE html>
<html>
  <head><title>404 Not Found</title></head>
  ...
```
