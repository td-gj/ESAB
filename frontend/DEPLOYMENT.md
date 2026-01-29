# LegacyVault Miniapp - Deployment Guide

## 🚀 Deploy to Vercel (Recommended for Base App)

### Step 1: Prepare Repository
```bash
cd frontend
```

### Step 2: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 3: Login to Vercel
```bash
vercel login
```

### Step 4: Deploy
```bash
vercel
```

Follow the prompts:
- Project name: `legacy-vault-frontend`
- Framework: `Next.js`
- Root directory: `./frontend`

### Step 5: Configure Environment Variables (if needed)
In Vercel dashboard:
- Go to Settings → Environment Variables
- Add any required env vars

## 📱 Build for Base Mini App

### If deploying as iframe/embedded:

1. Build production version:
```bash
npm run build
npm start
```

2. Expose at: `https://your-domain.com`

3. Configure Base app to embed at:
```
iframe src="https://your-domain.com"
```

## 🔗 Contract Configuration

The contract is hardcoded in: `frontend/config/contract.ts`

**Current Configuration:**
- Network: Base Mainnet (8453)
- Contract: `0xa29bc0e8aFE852D725055B05A12378888b9dEbe5`

To update contract address after redeployment, edit `config/contract.ts`.

## 📦 Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Build and Run
```bash
docker build -t legacy-vault-frontend .
docker run -p 3000:3000 legacy-vault-frontend
```

## 🌐 Alternative: Deploy on Base App Directly

### Option 1: Vercel
- Best for Next.js
- Automatic HTTPS
- Free tier available
- [https://vercel.com](https://vercel.com)

### Option 2: Netlify
```bash
npm run build
# Deploy .next folder to Netlify
```

### Option 3: Self-hosted (AWS/GCP/Azure)
```bash
npm run build
npm start
```

## 🧪 Test Locally
```bash
npm run dev
```

Open: `http://localhost:3000`

Connect MetaMask → Use as miniapp!

## ✅ Deployment Checklist

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Contract address correct in `config/contract.ts`
- [ ] MetaMask connection works
- [ ] Owner dashboard loads
- [ ] Heir dashboard loads
- [ ] Web3 functions work (deposit, claim, etc.)
- [ ] Mobile responsive on iOS/Android

## 🔐 Security Notes

- Never commit `.env` with private keys
- Use environment variables for sensitive data
- Contract is read-only from frontend
- All transactions signed by user's MetaMask
- No backend API needed

## 📊 Performance Optimization

Build includes:
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ CSS minification
- ✅ JavaScript compression

## 🎯 Next Steps

1. Deploy to Vercel
2. Share URL: `https://your-app.vercel.app`
3. Users connect MetaMask
4. Test all features
5. Submit to Base app ecosystem (if applicable)

---

**Need help?** Check the [Next.js deployment docs](https://nextjs.org/docs/deployment)
