# Spec 10 — Production Deployment

## Preconditions
- All specs 01–09 complete
- GitHub repository created with `main` branch protected

## Goal
Deploy the application to Vercel with a production Supabase project. Configure
environment variables, security headers, database migrations in CI, and monitoring.

## Critical Files to Create

- `vercel.json`
- `.github/workflows/deploy.yml`
- `scripts/smoke-test.sh`

## vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": {
      "required": true
    },
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
      "required": true
    }
  }
}
```

## Environment Variables Setup

### Vercel Dashboard Configuration

Set these in Vercel project settings → Environment Variables:

| Variable | Environment | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | ✓ |
| `SUPABASE_PROJECT_ID` | Production only | ✓ |
| `SUPABASE_ACCESS_TOKEN` | Production only | ✓ |

**Rules:**
- Never commit any of these to the repository
- Use separate Supabase projects for production and preview deployments
- Rotate tokens every 90 days

## GitHub Actions Deploy Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Install Supabase CLI
        run: npm install -g supabase
      
      - name: Run database migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase db push \
            --project-id ${{ secrets.SUPABASE_PROJECT_ID }} \
            --remote \
            --linked
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  post-deploy-check:
    needs: deploy
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Smoke tests
        run: |
          PROD_URL=$(cat vercel.json | jq -r '.name')
          bash scripts/smoke-test.sh https://$PROD_URL
```

## Smoke Test Script

```bash
#!/bin/bash
# scripts/smoke-test.sh
set -e

PROD_URL=${1:-"https://your-app.vercel.app"}

echo "Running smoke tests on $PROD_URL..."

# Test 1: Homepage loads
echo -n "1. Homepage loads... "
if curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" | grep -q "200"; then
  echo "✓"
else
  echo "✗ FAILED"
  exit 1
fi

# Test 2: Login page accessible
echo -n "2. Login page accessible... "
if curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/login" | grep -q "200"; then
  echo "✓"
else
  echo "✗ FAILED"
  exit 1
fi

# Test 3: Board redirects to login when unauthenticated
echo -n "3. Board redirects when not authenticated... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$PROD_URL/board")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
  echo "✓"
else
  echo "✗ FAILED (got $STATUS)"
  exit 1
fi

# Test 4: API returns 401 without auth
echo -n "4. API returns 401 without auth... "
if curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/analytics" | grep -q "401"; then
  echo "✓"
else
  echo "✗ FAILED"
  exit 1
fi

# Test 5: Check for console errors (optional)
echo -n "5. No obvious errors in production... "
if curl -s "$PROD_URL" | grep -q "Error\|error\|ERR_"; then
  echo "⚠ (warnings detected, check manually)"
else
  echo "✓"
fi

echo ""
echo "✅ All smoke tests passed!"
```

## Lighthouse Audit Targets

After deployment, verify via Vercel Analytics or https://pagespeed.web.dev/:

| Category | Target | How to Verify |
|---|---|---|
| Performance | ≥ 80 | Vercel Analytics or PageSpeed Insights |
| Accessibility | ≥ 95 | axe DevTools or PageSpeed Insights |
| Best Practices | ≥ 95 | PageSpeed Insights |
| SEO | ≥ 90 | PageSpeed Insights |

## Rollback Procedure

If production deploy fails or needs rollback:

```bash
# 1. Revert Vercel deployment (no build needed)
# Go to: Vercel Dashboard → Deployments → Select previous deploy → "Promote to Production"

# 2. Revert database migration (if migrations were the issue)
supabase migration repair \
  --project-id $SUPABASE_PROJECT_ID \
  --status reverted

# 3. Verify rollback succeeded
npm run dev  # Test locally
# Confirm previous version is live at production URL

# 4. Notify team
# Post to team Slack channel explaining the incident and rollback
```

## Monitoring Setup

### Vercel Analytics
- Enable in Vercel dashboard → Analytics tab
- Monitor: Performance, Web Vitals, Traffic patterns

### Error Boundaries
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[Production Error]', error);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
```

### Sentry Integration (Optional Stretch Goal)
```typescript
// sentry.server.config.ts (if adding Sentry)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

## Post-Deployment Checklist

After first production deploy, manually verify:

- [ ] Homepage loads without errors
- [ ] Sign-up flow works end-to-end (creates user in Supabase)
- [ ] Sign-in with test account works
- [ ] Can create new job application
- [ ] Can drag application between columns (persists to DB)
- [ ] Detail panel opens and notes can be added
- [ ] Dashboard loads with stats
- [ ] Search and filters work
- [ ] Logout works and redirects to login
- [ ] Network tab shows all requests to correct endpoints
- [ ] No 404s for static assets
- [ ] No console errors or warnings
- [ ] Mobile layout responsive (test on iPhone 12)
- [ ] Lighthouse scores meet targets

## Security Headers Verification

Verify via curl or https://securityheaders.com/:

```bash
curl -I https://your-app.vercel.app | grep -E "X-Frame-Options|X-Content-Type-Options|Referrer-Policy"
```

Expected:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## GitHub Secrets Required for Deploy

Configure in GitHub repository → Settings → Secrets and variables → Actions:

```
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=your-access-token
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Acceptance Tests
- ✅ Vercel deployment succeeds
- ✅ Smoke test script passes
- ✅ Production URL is live
- ✅ Sign-up → create app → drag to Interview works
- ✅ Lighthouse scores meet all targets
- ✅ No env vars committed to repository
- ✅ No 404s for static assets
- ✅ No console errors in browser

## Definition of Done
- [ ] `vercel.json` committed
- [ ] Deploy workflow in `.github/workflows/deploy.yml`
- [ ] Smoke test script exists at `scripts/smoke-test.sh`
- [ ] All GitHub secrets configured
- [ ] Production URL live and working
- [ ] Database migrations applied via CI
- [ ] Lighthouse audit passed on all categories
- [ ] Rollback procedure documented and tested
- [ ] Team notified of production URL
- [ ] Monitoring configured (Vercel Analytics enabled)
