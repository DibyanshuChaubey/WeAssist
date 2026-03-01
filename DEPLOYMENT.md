# Deployment Guide

## Overview

- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Flask + PostgreSQL)

---

## Backend Deployment (Render)

### 1. Push to GitHub

Your code is already committed. Push it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/WeAssist.git
git push -u origin main
```

### 2. Create Render Account

Go to [render.com](https://render.com) and sign up with GitHub.

### 3. Create PostgreSQL Database

1. Click **New +** → **PostgreSQL**
2. Name: `weassist-db`
3. Database: `weassist`
4. User: `weassist_user`
5. Region: Choose closest to you
6. Plan: **Free** (for testing)
7. Click **Create Database**
8. Copy the **Internal Database URL** (starts with `postgres://`)

### 4. Create Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `weassist-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn run:app`
   - **Plan**: Free

### 5. Add Environment Variables

In the Render dashboard, go to **Environment** and add:

```
FLASK_ENV=production
JWT_SECRET_KEY=<click-generate-to-create-secure-key>
DATABASE_URL=<paste-internal-database-url-from-step-3>
CORS_ORIGINS=https://your-frontend.vercel.app
```

*Note: You'll update `CORS_ORIGINS` after deploying frontend*

### 6. Initialize Database

After deployment, use Render Shell:

1. Go to your web service dashboard
2. Click **Shell** tab
3. Run:
```bash
flask init-db
```

Your backend is live at: `https://weassist-backend.onrender.com`

---

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Update API URL

Before deploying, you need your Render backend URL. Once you have it:

Create `.env.production` in project root:

```
VITE_API_URL=https://weassist-backend.onrender.com/api
```

### 3. Deploy to Vercel

**Option A: Via Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: `https://weassist-backend.onrender.com/api`
7. Click **Deploy**

**Option B: Via CLI**

```bash
vercel
# Follow prompts, accept defaults
```

Your frontend is live at: `https://weassist-xxx.vercel.app`

### 4. Update Backend CORS

Go back to Render dashboard and update `CORS_ORIGINS`:

```
CORS_ORIGINS=https://weassist-xxx.vercel.app
```

Click **Save** (this will redeploy backend).

---

## Post-Deployment Steps

### 1. Create Admin Account

Use Render Shell:

```bash
flask shell
>>> from app.models import User
>>> from werkzeug.security import generate_password_hash
>>> import uuid
>>> 
>>> admin = User(
...     id=str(uuid.uuid4()),
...     name="Admin",
...     email="admin@yourdomain.com",
...     password_hash=generate_password_hash("SecurePassword123!"),
...     role="admin",
...     hostel="A",
...     status="verified"
... )
>>> db.session.add(admin)
>>> db.session.commit()
>>> exit()
```

### 2. Test the Application

1. Open your Vercel URL
2. Register a new student account
3. Login as admin (created above)
4. Verify the new student
5. Login as student and create an issue
6. Check AI priority suggestion works

---

## Troubleshooting

### Backend Issues

**Database connection errors:**
- Verify `DATABASE_URL` is set correctly
- Ensure database is in same region as web service
- Check if database is active (not sleeping)

**CORS errors:**
- Update `CORS_ORIGINS` with exact Vercel URL (no trailing slash)
- Redeploy backend after updating env vars

**Import errors:**
- Check all dependencies in `requirements.txt`
- Verify Python version in `runtime.txt`

### Frontend Issues

**API connection failed:**
- Verify `VITE_API_URL` is set correctly
- Check backend is running (visit backend URL)
- Open browser DevTools → Network to see actual error

**Build failures:**
- Check Node version (16+)
- Clear cache: `npm clean-cache --force`
- Delete `node_modules` and reinstall: `npm install`

---

## Environment Variables Summary

### Backend (Render)
```
FLASK_ENV=production
JWT_SECRET_KEY=<generated-secure-key>
DATABASE_URL=<render-database-url>
CORS_ORIGINS=https://your-app.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Custom Domains (Optional)

### Vercel Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Render Custom Domain

1. Go to Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed

---

## Free Tier Limitations

**Render Free Tier:**
- Web service spins down after 15 mins of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month computing time
- Database: 90 days retention

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

**Upgrade when needed:**
- Render: $7/month (always-on)
- Vercel: $20/month (pro features)

---

## Monitoring

### Render
- View logs in **Logs** tab
- Check metrics in **Metrics** tab
- Set up email alerts

### Vercel
- View deployments in dashboard
- Check analytics
- Review function logs

---

## Continuous Deployment

Both platforms auto-deploy on git push:

1. Make changes locally
2. Commit: `git commit -am "Update feature"`
3. Push: `git push origin main`
4. Render & Vercel auto-deploy

---

## Security Checklist

- [x] JWT_SECRET_KEY is strong and unique
- [x] CORS origins are specific (not `*`)
- [x] Database credentials are secure
- [x] .env files are in .gitignore
- [x] HTTPS is enforced (automatic on both platforms)
- [ ] Change default admin password after first login
- [ ] Enable 2FA on Render/Vercel accounts
- [ ] Review database backup strategy

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Flask Deployment: https://flask.palletsprojects.com/en/latest/deploying/

Good luck with your deployment! 🚀
