# BurkinaWatch - Render Deployment Guide

## Quick Setup

This application is configured for deployment on Render. Follow these steps:

### 1. Environment Variables on Render

Set the following environment variables in your Render dashboard:

#### Required:
- `DATABASE_URL` - PostgreSQL connection string (from Render PostgreSQL)
- `NODE_ENV` - Set to `production`
- `PORT` - Set to `3000` (Render's default)
- `SESSION_SECRET` - Generate with: `openssl rand -hex 32`
- `MASTER_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`
- `REFRESH_TOKEN_SALT` - Generate with: `openssl rand -hex 32`
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `JWT_REFRESH_SECRET` - Generate with: `openssl rand -hex 32`
- `BASE_URL` - Your Render application URL (e.g., `https://your-app.onrender.com`)

#### Optional (but recommended):
- `GROQ_API_KEY` - For AI chatbot fallback
- `GEMINI_API_KEY` - For AI chatbot primary
- `VITE_GOOGLE_MAPS_API_KEY` - For Google Maps integration
- `RESEND_API_KEY` - For email notifications

### 2. Build & Start Commands

The application uses these build and start commands:

**Build:**
```bash
npm run build
```

**Start:**
```bash
npm start
```

These are already configured in the `deploy_config_tool` settings.

### 3. Database Migration

On first deployment:
1. The database will be created with the Neon PostgreSQL service
2. Run migrations via: `npm run db:push` (in Render console)
3. Seeded data will be populated automatically

### 4. Build Process

The build process:
1. Runs `vite build` to compile the React frontend → `dist/public/`
2. Bundles the backend server with esbuild → `dist/index.js`
3. On start, the Express server serves both the API and static frontend

### 5. Project Structure

```
project/
├── client/              # React frontend
│   └── src/
│       └── index.html   # Entry point
├── server/              # Express backend
│   └── index.ts         # Server entry point
├── shared/              # Shared TypeScript types
├── dist/                # Build output (created during build)
│   ├── index.js         # Compiled server
│   └── public/          # Compiled frontend
├── package.json         # Dependencies & scripts
└── drizzle.config.ts    # Database configuration
```

### 6. Important Notes

- **Port:** The server listens on `process.env.PORT` (default 3000 for Render)
- **Static Files:** Frontend is served from `dist/public/`
- **Database:** Uses Neon PostgreSQL (serverless)
- **Security:** CORS is configured for your BASE_URL
- **Development:** Use `npm run dev` locally
- **Production:** Use `npm start` (automatic on Render)

### 7. Monitoring & Logs

Monitor your application in Render Dashboard:
- View logs: Dashboard → Logs
- Check deployment status: Dashboard → Deployments
- Restart application: Dashboard → Manual Deploy → Deploy Latest Commit

### 8. Troubleshooting

**Build fails:**
- Check that all required environment variables are set
- Ensure `DATABASE_URL` is valid and accessible
- Review build logs in Render dashboard

**App crashes after deploy:**
- Check logs for missing environment variables
- Verify database migrations ran successfully
- Ensure `dist/public/` was built correctly

**API errors:**
- Check CORS configuration in `server/securityHardening.ts`
- Verify BASE_URL matches your Render domain
- Check database connection in logs

---

For more information, see `.env.example` for all configuration options.
