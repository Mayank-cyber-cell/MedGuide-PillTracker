# MedGuide Vercel Deployment Guide
 
## Quick Start

### Step 1: Commit Local Changes
```bash
cd c:\Users\MAYNK KUMAR\Desktop\medguide
git add .
git commit -m "🚀 Optimize performance for Vercel deployment

- Add Vite build optimization with code splitting
- Implement API response caching (1-hour TTL)
- Optimize OpenFDA endpoint (reduce API calls)
- Add cache headers for static assets and HTML
- Increase Vercel function memory to 1024MB
- Add performance monitoring utilities
- Create deployment optimization configs"
```

### Step 2: Push to GitHub
```bash
git push origin main
```

### Step 3: Verify Environment Variables in Vercel

Go to **Vercel Dashboard** → **Settings** → **Environment Variables**

Add these variables:
```
VITE_SUPABASE_URL = your-supabase-url
VITE_SUPABASE_ANON_KEY = your-anon-key
OPENFDA_API_KEY = your-openfda-key
GEMINI_API_KEY = your-gemini-key
VITE_API_URL = https://your-app-name.vercel.app/api
JWT_SECRET = your-secure-jwt-secret
ALLOWED_ORIGINS = https://your-app-name.vercel.app
NODE_ENV = production
```

### Step 4: Trigger Deployment

The deployment should start automatically. Monitor it in:
- **Vercel Dashboard** → **Deployments** tab

---

## Verification After Deployment

### 1. Test API Caching
```bash
# First request (cache miss)
curl -i https://your-app.vercel.app/api/drug-safety/aspirin
# Look for: X-Cache: MISS

# Second request (cache hit)
curl -i https://your-app.vercel.app/api/drug-safety/aspirin
# Look for: X-Cache: HIT
```

### 2. Check Health Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "environment": "production",
  "database": "connected",
  "openfdaApiKey": "configured",
  "cacheSize": 0
}
```

### 3. Test Performance with Lighthouse

1. Open your app in Chrome
2. Press F12 → Lighthouse tab
3. Click "Analyze page load"
4. Target scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

### 4. Monitor Vercel Analytics

In Vercel Dashboard:
- Check "Functions" tab for execution time
- Look for "Edge Network" response times
- Review deployment size

---

## Performance Metrics to Track

After deployment, you should see:

| Metric | Target | How to Check |
|--------|--------|------------|
| Initial Bundle Size | < 150KB | Build logs in Vercel |
| TTFB | < 800ms | Chrome DevTools Network tab |
| LCP | < 2.5s | Chrome DevTools Lighthouse |
| API Response (cached) | < 100ms | curl with X-Cache header |
| API Response (fresh) | < 3s | curl first request |

---

## Troubleshooting

### Issue: Deployment Failed
**Solution**: 
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify Supabase connection string is correct

### Issue: 503 Error (Database not configured)
**Solution**:
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Supabase project is active
- Redeploy after fixing variables

### Issue: OpenFDA returning errors
**Solution**:
- Verify `OPENFDA_API_KEY` is set in Vercel
- Test with `/api/debug/openfda` endpoint
- Check API key is still valid

### Issue: Still slow after deployment
**Solution**:
- Run Lighthouse test to identify bottleneck
- Check Vercel function execution time in logs
- Verify cache headers are being sent (check Network tab)
- Review database query performance

---

## Rollback (if needed)

If you need to revert to previous version:

```bash
git revert HEAD
git push origin main
```

Vercel will automatically redeploy the previous commit.

---

## Further Optimizations

After initial deployment, consider:

1. **Database Connection Pooling** - Use PgBouncer or Supabase connection pooling
2. **Redis Cache** - Replace in-memory cache with Redis for persistence
3. **CDN Configuration** - Configure custom CDN settings in Vercel
4. **Image Optimization** - Serve images in WebP format with Vercel Image Optimization
5. **Edge Functions** - Migrate some API routes to Vercel Edge Functions

---

## Monitoring & Alerts

Set up monitoring:

1. **Vercel Analytics** - Track real user metrics
2. **Sentry** - Error tracking and performance monitoring
3. **Datadog** - Full observability platform
4. **New Relic** - Application performance monitoring

---

## Success Criteria

✅ Deployment complete when:
- All environment variables are set
- App loads without 503 errors
- Drug lookup returns results < 2s
- Lighthouse score > 80
- No console errors in browser DevTools
- Cache headers visible in Network tab

---

## Support

If you encounter issues:

1. Check Vercel logs: `vercel logs`
2. Review browser console: F12 → Console tab
3. Test locally: `npm run dev`
4. Check environment variables are correctly spelled
5. Verify all API keys are active

---

**Last Updated**: May 3, 2026
**Version**: 1.0
