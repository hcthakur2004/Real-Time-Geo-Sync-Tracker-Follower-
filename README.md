# GeoSync Live 🌍

A full-stack real-time web application that synchronizes map movements between two different user roles (Tracker and Tracked) down to the exact coordinates and zoom level. Built to demonstrate high-performance WebSockets handling and React map integrations.

## ✨ Features
- **Role-based Session System**: The first user to join a room becomes the "Tracker" (Broadcasting). The second becomes the "Tracked" (Syncing). Limited to 2 users per room.
- **Real-Time Map Synchronization**: When the Tracker pans, tilts, or zooms, the Tracked user's map instantly updates to match.
- **Performance Optimized**: Implemented `throttle-debounce` to throttle Socket.io emissions to ~14 updates/sec (70ms), successfully preventing WebSocket flooding while maintaining <100ms latency.
- **Graceful Disconnects**: If the Tracker drops off or disconnects mid-session, the Tracked user is instantly and seamlessly promoted to Tracker. 
- **Interactive UI**: Includes a custom Dark Mode map style, a persistent floating HUD (Lat, Lng, Zoom, Connection Status), and a "Re-sync to Tracker" feature for the Tracked user.

## 🛠️ Tech Stack
*   **Frontend**: Next.js (App Router), React, TailwindCSS v4
*   **Backend**: Node.js, Express
*   **Real-time engine**: Socket.io (`socket.io` & `socket.io-client`)
*   **Map Integration**: Google Maps API (`@react-google-maps/api`)

---

## 🚀 Setup & Installation Instructions

This project is separated into two environments: the `client` (Next.js frontend) and the `server` (Express backend).

### 1. Environment Variables Setup
You must define API keys and ports for both environments. I have included `.env.example` files in both directories.

**Backend (`/server`)**:
1. Navigate to the `/server` folder.
2. Rename `server/.env.example` to `server/.env`.
3. Ensure it contains the port:
   ```env
   PORT=5000
   ```

**Frontend (`/client`)**:
1. Navigate to the `/client` folder. 
2. Rename `client/.env.example` to `client/.env.local`.
3. Add your Google Maps API key (make sure the 'Maps JavaScript API' is enabled in your Google Cloud Console):
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

### 2. Running the Backend Server
Open a terminal instance and run:
```bash
cd server
npm install
node index.js
```
*The WebSocket server will start securely on `http://localhost:5000`.*

### 3. Running the Frontend App
Open a *second* terminal instance and run:
```bash
cd client
npm install
npm run dev
```
*The Next.js App will start on `http://localhost:3000`.*

---

## 🌐 Deployment on Vercel (Full-Stack)

### Overview
- **Frontend**: Deployed on Vercel main project
- **Backend**: Deployed on separate Vercel project (or Railway for better Socket.io support)

### Why Separate Deployments?
Socket.io requires persistent WebSocket connections. Vercel Functions are serverless and stateless, so the backend runs best on:
- **Vercel** (separate project with `/server` as the root)
- **Railway** (recommended for better WebSocket support)
- **Render** or other persistent container services

---

### **Option 1: Both on Vercel (Recommended for Learning)**

#### Deploy Frontend
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"** → **"Import Git Repository"**
3. Select your **GeoSync repository**
4. Set **Root Directory** to `.` (root)
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = your_actual_key
   NEXT_PUBLIC_SERVER_URL = https://geosync-server-vercel.vercel.app
   ```
6. Click **"Deploy"** ✅

#### Deploy Backend as Separate Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"** → **"Import Git Repository"**
3. Select your **GeoSync repository** again
4. Set **Root Directory** to `/server`
5. Add Environment Variable:
   ```
   PORT = 5000
   ```
6. Click **"Deploy"** ✅
7. Copy your backend URL and update the frontend's `NEXT_PUBLIC_SERVER_URL` in Vercel settings

---

### **Option 2: Backend on Railway (Recommended for Production)**

#### Deploy Frontend on Vercel (Same as Above)

#### Deploy Backend on Railway
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your **GeoSync repository**
4. Set **Root Directory** to `/server`
5. Add Environment Variable: `PORT=5000`
6. Click **"Deploy"** ✅
7. Copy the Railway backend URL
8. Go to your Vercel project → Settings → Environment Variables
9. Update: `NEXT_PUBLIC_SERVER_URL = https://your-railway-backend.up.railway.app`

---

## 🌐 Hosted Demo Links
*   **Frontend**: [Your Vercel Frontend URL]
*   **Backend**: [Your Vercel/Railway Backend URL]

---

## 🏗️ Architecture & Considerations
- **Memory Management**: Custom `useSocket` hooks safely mount and dismount `.off()` listeners within the React lifecycle to guarantee zero memory leaks.
- **Precision**: We utilize Google's native high-precision map functions (`map.getCenter().lat()`) when emitting payload data to ensure both clients match flawlessly down to the street level.
- **Real-time Sync**: Socket.io manages room-based state for tracker/tracked role assignment and ensures <100ms latency on map updates.
