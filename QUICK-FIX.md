# Quick Fix for "Unexpected token" JSON Error

## The Problem
Your backend API is not deployed in production, so the frontend receives HTML error pages instead of JSON responses.

## The Solution (3 Steps)

### Step 1: Deploy Your Backend
Choose one of these options:

#### Railway (Easiest)
1. Go to [railway.app](https://railway.app)
2. Sign up and click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway auto-detects Node.js and uses `npm run dev`
6. Add environment variables in the "Variables" tab:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   JWT_SECRET=generate_a_random_string
   NODE_ENV=production
   ```
7. Copy your deployment URL (e.g., `https://medguide-production.up.railway.app`)

#### Render
1. Go to [render.com](https://render.com)
2. New > Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run dev`
5. Add environment variables (same as above)
6. Deploy and copy your URL

#### Heroku
```bash
heroku create medguide-backend
git push heroku main
heroku config:set VITE_SUPABASE_URL=your_url
heroku config:set VITE_SUPABASE_ANON_KEY=your_key
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production
```

### Step 2: Configure Your Frontend
Add the backend URL to your frontend environment:

**For Vercel:**
1. Go to your project settings
2. Environment Variables
3. Add: `VITE_API_URL` = `https://your-backend-url.railway.app/api`

**For Netlify:**
1. Site settings > Environment variables
2. Add: `VITE_API_URL` = `https://your-backend-url.railway.app/api`

**Local .env file (for testing):**
```env
VITE_API_URL=https://your-backend-url.railway.app/api
```

### Step 3: Redeploy Frontend
After setting the environment variable:
- Vercel: Trigger a new deployment
- Netlify: Trigger redeploy
- Or push a new commit to trigger auto-deployment

## Verify It's Working

### Test Backend Directly
```bash
curl https://your-backend-url.railway.app/api/user
```
Should return: `401` (JSON) not `404` (HTML)

### Check Browser Console
1. Open your deployed site
2. Open DevTools (F12) > Network tab
3. Try to login
4. Click the `/api/login` request
5. Check "Response" tab - should show JSON, not HTML

## Alternative: Serverless (No Backend Hosting Needed)

If you don't want to manage a backend server, migrate to Supabase Edge Functions. This requires converting your Express routes to individual Edge Functions. See `DEPLOYMENT.md` for details.

## Still Having Issues?

1. Check backend logs for errors
2. Verify all environment variables are set
3. Ensure CORS is configured (already done in the code)
4. Make sure `VITE_API_URL` includes `/api` at the end
5. Check that your backend URL uses `https://` not `http://`

## Summary Checklist

- [ ] Backend deployed to Railway/Render/Heroku
- [ ] Backend environment variables configured
- [ ] Backend URL noted (e.g., `https://xyz.railway.app`)
- [ ] Frontend `VITE_API_URL` environment variable set to `https://xyz.railway.app/api`
- [ ] Frontend redeployed with new environment variable
- [ ] Login/Register tested and working

---

**Need more help?** See `DEPLOYMENT.md` for comprehensive deployment guide with troubleshooting steps.
