# Job Application Tracker - Deployment Guide

## Overview

The Job Application Tracker is a Next.js 14 application with SQLite database running locally. This guide covers deploying to Vercel.

## Prerequisites

- Vercel account
- GitHub repository with the code
- Environment variables configured

## Environment Variables

Create a `.env.production` file with:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://yourdomain.vercel.app"
```

For production, generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Database Persistence

SQLite database file is stored in `prisma/dev.db`. For Vercel deployment:

1. **Option 1: Commit database to repo** (for development/demo)
   - Include `prisma/dev.db` in git
   - Database persists across deployments

2. **Option 2: Environment variable** (for production)
   - Store database file path in `.env.production`
   - Use Vercel's persistent storage if needed

## Deployment Steps

### 1. Prepare the Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for production deployment"

# Push to GitHub
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/import
2. Select your GitHub repository
3. Configure environment variables:
   - `DATABASE_URL="file:./prisma/dev.db"`
   - `NEXTAUTH_SECRET` (generate a new one)
   - `NEXTAUTH_URL` (your Vercel domain)

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test at your Vercel domain

## Post-Deployment

### Database Management

If using a fresh deployment without the `prisma/dev.db` file:

```bash
# Run migrations
npx prisma migrate deploy

# Seed test data (optional)
npx prisma db seed
```

### Monitoring

- Check Vercel analytics dashboard
- Monitor database size (if using file storage)
- Set up alerts for build failures

## Troubleshooting

### Build Failures

1. Check environment variables are set correctly
2. Verify database file exists
3. Check Vercel build logs

### Runtime Issues

1. Check application logs in Vercel dashboard
2. Verify session authentication is working
3. Test API endpoints manually

## Performance Optimization

- Enable Next.js Image Optimization
- Use Vercel Analytics to monitor performance
- Consider CDN for static assets
- Cache API responses where appropriate

## Security Checklist

- ✅ NEXTAUTH_SECRET is random and secure
- ✅ Database URL is not exposed in client code
- ✅ API routes validate authentication
- ✅ Password hashing with bcryptjs
- ✅ Session tokens in httpOnly cookies
- ✅ CORS headers configured
- ✅ No credentials in git history

## Rollback

If deployment fails:

1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"

## Scaling Considerations

For production use:

1. **Database**: Consider migrating from SQLite to PostgreSQL on Vercel Postgres
2. **Authentication**: Evaluate next-auth.js configuration
3. **Storage**: Use Vercel Blob for file uploads
4. **Monitoring**: Set up Sentry for error tracking
5. **Analytics**: Use Vercel Analytics or custom logging

## Cost Optimization

- Use Vercel Pro ($20/month) for custom domains
- Monitor usage and optimize bundle size
- Consider edge functions for performance
- Use incremental static regeneration (ISR)

## Maintenance

Regular tasks:

1. Update dependencies monthly
2. Review security advisories
3. Monitor error logs
4. Backup database (for file-based SQLite)
5. Test disaster recovery procedures

---

For more info, see: https://vercel.com/docs/frameworks/nextjs
