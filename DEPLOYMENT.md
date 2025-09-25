# Family 100 - Deployment Guide for Vercel

## 🔐 Authentication System

This project now includes ID/password authentication with the following accounts:

### User Accounts
- **Admin**: `admin` / `admin123` (Full access)
- **Host**: `host` / `host123` (Host panel access)
- **Player 1**: `player1` / `player123` (Player access)
- **Player 2**: `player2` / `player123` (Player access)
- **Player 3**: `player3` / `player123` (Player access)
- **Player 4**: `player4` / `player123` (Player access)

## 🚀 Deploy to Vercel

### Step 1: Prepare Your Project
1. Make sure all files are committed to Git
2. Push your project to GitHub

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the Node.js project

### Step 3: Configure Environment Variables
In your Vercel dashboard, go to Settings → Environment Variables and add:

```
SESSION_SECRET=your-super-secret-session-key-here
ADMIN_PASSWORD=your-admin-password
HOST_PASSWORD=your-host-password
PLAYER1_PASSWORD=your-player1-password
PLAYER2_PASSWORD=your-player2-password
PLAYER3_PASSWORD=your-player3-password
PLAYER4_PASSWORD=your-player4-password
```

### Step 4: Access Your Deployed App
After deployment, your app will be available at:
- `https://your-app.vercel.app/` - Redirects to login
- `https://your-app.vercel.app/login.html` - Login page
- `https://your-app.vercel.app/host` - Host interface (admin/host only)
- `https://your-app.vercel.app/player` - Player interface
- `https://your-app.vercel.app/family` - Display screen (admin/host only)

## 🔧 Local Development

### Installation
```bash
npm install
```

### Run Locally
```bash
npm start
# or use the batch file
.\start.bat
```

### Access Locally
- Login: http://localhost:3000/login.html
- Host: http://localhost:3000/host
- Player: http://localhost:3000/player
- Display: http://localhost:3000/family

## 🛡️ Security Features

1. **Session-based Authentication**: Secure login system with express-session
2. **Role-based Access Control**: Different access levels for admin, host, and players
3. **Protected Routes**: All game interfaces require authentication
4. **Environment Variables**: Passwords stored securely in environment variables
5. **Session Security**: Secure session configuration for production

## ⚠️ Important Notes

1. **WebSocket Limitations**: Vercel has limited WebSocket support. For full real-time functionality, consider using:
   - Railway
   - Render
   - Heroku

2. **State Persistence**: Game state is stored in memory and will reset on server restart. Consider adding a database for persistence.

3. **Security**: Change default passwords before deploying to production.

## 🔄 Alternative Deployment Platforms

If you need full WebSocket support, consider these alternatives:

### Railway
1. Connect your GitHub repo to Railway
2. Set environment variables
3. Deploy with one click

### Render
1. Connect your GitHub repo to Render
2. Set environment variables
3. Deploy as a Web Service

## 📱 Mobile Access

The login system works on mobile devices. Players can join using their phones by:
1. Going to your deployed URL
2. Logging in with their player credentials
3. Accessing the player interface

## 🎮 Game Features

- Islamic Fiqh/Thaharah questions
- Real-time multiplayer gameplay
- Team-based scoring system
- Buzzer system for players
- Sound effects
- Mobile-responsive design