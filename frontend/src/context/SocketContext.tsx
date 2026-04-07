"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinRoom: (requestId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://garadge-2-0.onrender.com', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('⚡ Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token]);

    const joinRoom = (requestId: string) => {
        if (socket) {
            socket.emit('join-room', requestId);
        }
    };

    return (
        <SocketContext value={{ socket, isConnected, joinRoom }}>
            {children}
        </SocketContext>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
