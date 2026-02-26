import type { VercelRequest, VercelResponse } from "@vercel/functions";

// This is a placeholder. For Socket.io to work properly on Vercel,
// the backend must run on a persistent server (Railway, Render, etc.)
// This file ensures the /api route exists for the deployment

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: "GeoSync Backend API",
    status: "Backend is configured on a separate server for real-time Socket.io",
  });
}
