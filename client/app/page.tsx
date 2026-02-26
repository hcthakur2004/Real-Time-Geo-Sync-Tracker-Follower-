"use client";

import { useState } from "react";
import JoinRoom from "../components/JoinRoom";
import MapSession from "../components/MapSession";
import { useSocket } from "../hooks/useSocket";

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");

  // Use local server for tests, ideally process.env.NEXT_PUBLIC_SOCKET_SERVER
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";
  const { state, mapSyncData, joinRoom, emitMapUpdate } = useSocket(serverUrl);

  const handleJoin = (id: string) => {
    setRoomId(id);
    joinRoom(id);
  };

  // Views
  if (!roomId) {
    return <JoinRoom onJoin={handleJoin} />;
  }

  if (state.isRoomFull) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="bg-red-500/20 border border-red-500/50 p-8 rounded-xl text-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Room is Full</h2>
          <p className="text-red-300/80 mb-6">Only 2 users are allowed per room.</p>
          <button
            onClick={() => setRoomId("")}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
          >
            Try Another Room
          </button>
        </div>
      </div>
    );
  }

  if (!state.role) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <p className="text-indigo-400 font-medium">Connecting to session...</p>
        </div>
      </div>
    );
  }

  return (
    <MapSession
      roomId={roomId}
      role={state.role}
      isConnected={state.isConnected}
      isWaiting={state.isWaiting}
      mapSyncData={mapSyncData}
      emitMapUpdate={emitMapUpdate}
    />
  );
}

