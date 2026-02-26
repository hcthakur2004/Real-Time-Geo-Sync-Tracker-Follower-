# GeoSync Live

Full-stack real-time web application to synchronize map views between two users in real-time.

## Features
- **Role-based session system**: "Tracker" can pan/zoom/tilt, "Tracked" follows along real-time.
- **Throttling**: Reduced WebSocket events (14 updates/sec).
- **Graceful Disconnects**: If tracker disconnects, tracked gets promoted.

## Setup Instructions

### Environment Variables
1. **Server (`/server`)**:
   Create a `.env` file in the `/server` folder and add:
   ```env
   PORT=5000
   ```

2. **Client (`/client`)**:
   Create a `.env.local` file in the `/client` folder and add your Google Maps API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

### Running Locally

1. **Start the Backend Server**:
   ```bash
   cd server
   npm install
   node index.js
   ```

2. **Start the Frontend App**:
   ```bash
   cd client
   npm install   # If not already installed during creation
   npm run dev
   ```

The client will start at `http://localhost:3000`. And the server at `http://localhost:5000`.

## Clean Architecture
- Custom socket logic in `useSocket` hook.
- Component cleanup handles memory leaks.
- TailwindCSS for styling and HUDs.
