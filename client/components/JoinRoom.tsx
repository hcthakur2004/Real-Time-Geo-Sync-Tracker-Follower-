"use client";

import { useState } from 'react';

export default function JoinRoom({ onJoin }: { onJoin: (roomId: string) => void }) {
    const [roomId, setRoomId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomId.trim()) {
            onJoin(roomId.trim());
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white font-sans">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">GeoSync Live</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="roomId" className="block text-sm font-medium text-gray-400 mb-2">Room ID</label>
                        <input
                            id="roomId"
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                            placeholder="e.g. session-123"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        Join / Create Room
                    </button>
                </form>
            </div>
        </div>
    );
}
