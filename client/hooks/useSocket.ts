import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type Role = 'tracker' | 'tracked' | null;

interface RoomState {
    roomId: string;
    role: Role;
    isConnected: boolean;
    isRoomFull: boolean;
    isWaiting: boolean;
}

export const useSocket = (serverUrl: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [state, setState] = useState<RoomState>({
        roomId: '',
        role: null,
        isConnected: false,
        isRoomFull: false,
        isWaiting: false,
    });

    const [mapSyncData, setMapSyncData] = useState<any>(null);

    useEffect(() => {
        socketRef.current = io(serverUrl);
        const socket = socketRef.current;

        socket.on('connect', () => {
            setState(s => ({ ...s, isConnected: true }));
        });

        socket.on('disconnect', () => {
            setState(s => ({ ...s, isConnected: false, role: null }));
        });

        socket.on('role_assigned', (role: 'tracker' | 'tracked') => {
            setState(s => ({ ...s, role, isRoomFull: false, isWaiting: role === 'tracker' }));
        });

        socket.on('room_full', () => {
            setState(s => ({ ...s, isRoomFull: true }));
        });

        socket.on('map_sync', (data) => {
            setMapSyncData(data);
        });

        socket.on('user_disconnected', (reason: string) => {
            if (reason === 'tracker_left_promoted') {
                // Tracked -> Tracker promote happened
                setState(s => ({ ...s, role: 'tracker', isWaiting: true }));
            } else if (reason === 'tracked_left') {
                // Tracked left, wait for another
                setState(s => ({ ...s, isWaiting: true }));
            }
        });

        // Assume user joined when this user isn't waiting
        // Wait, the hook needs a way to detect the other user join?
        // The server doesn't explicitly send "user_joined". We can add that, but "tracked" role doesn't have an event.
        // If we are tracker, we need to know if someone joined. We can just broadcast 'participant_joined'. 
        socket.on('participant_joined', () => {
            setState(s => ({ ...s, isWaiting: false }));
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('role_assigned');
            socket.off('room_full');
            socket.off('map_sync');
            socket.off('user_disconnected');
            socket.off('participant_joined');
            socket.disconnect();
        };
    }, [serverUrl]);

    const joinRoom = (roomId: string) => {
        if (socketRef.current && socketRef.current.connected) {
            setState(s => ({ ...s, roomId, isRoomFull: false, role: null }));
            socketRef.current.emit('join_room', roomId);
        }
    };

    const emitMapUpdate = (data: { roomId: string; center: any; zoom: number; tilt: number; timestamp: number }) => {
        if (socketRef.current && socketRef.current.connected && state.role === 'tracker') {
            socketRef.current.emit('map_update', data);
        }
    };

    return { socket: socketRef.current, state, mapSyncData, joinRoom, emitMapUpdate };
};
