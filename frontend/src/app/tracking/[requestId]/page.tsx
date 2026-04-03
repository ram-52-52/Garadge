"use client";

import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Phone, MessageCircle, MapPin, Clock, ShieldCheck, Home, Zap } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import ReviewModal from '@/components/ReviewModal';

const mapContainerStyle = {
    width: '100%',
    height: '100vh',
};

export default function TrackingPage() {
    const params = useParams();
    const router = useRouter();
    const { requestId } = params;
    const { socket, joinRoom } = useSocket();
    const { user } = useAuth();

    const [request, setRequest] = useState<any>(null);
    const [mechanicLocation, setMechanicLocation] = useState<any>(null);
    const [status, setStatus] = useState('accepted');
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showReview, setShowReview] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    });

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const { data } = await api.get(`/requests/${requestId}`);
                if (data.success) {
                    setRequest(data.data);
                    setStatus(data.data.status);
                    joinRoom(requestId as string);
                }
            } catch (error) {
                toast.error('Failed to load tracking data');
            }
        };

        fetchRequest();
    }, [requestId, joinRoom]);

    useEffect(() => {
        if (!socket) return;

        socket.on('location-update', (data: any) => {
            setMechanicLocation(data.location);
        });

        socket.on('status-changed', (data: any) => {
            setStatus(data.status);
            if (data.status === 'completed') {
                setShowPayment(true);
            }
        });

        return () => {
            socket.off('location-update');
            socket.off('status-changed');
        };
    }, [socket, router]);

    if (!isLoaded || !request) return <div className="h-screen flex items-center justify-center bg-dark text-white">Loading Tracker...</div>;

    const userPos = { lat: request.location.coordinates[1], lng: request.location.coordinates[0] };

    return (
        <div className="relative h-screen overflow-hidden">
            {/* Map */}
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mechanicLocation || userPos}
                zoom={15}
                onLoad={setMap}
                options={{
                    disableDefaultUI: true,
                    styles: [
                        /* Same dark styles as before for consistency */
                        { "elementType": "geometry", "stylers": [{ "color": "#121826" }] },
                        { "elementType": "labels.text.fill", "stylers": [{ "color": "#7a8a9e" }] },
                        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] }
                    ]
                }}
            >
                {/* User Pin */}
                <Marker position={userPos} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', scaledSize: new google.maps.Size(30, 30) }} />

                {/* Mechanic Pin - showing real-time movement */}
                {mechanicLocation && (
                    <Marker
                        position={mechanicLocation}
                        icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', scaledSize: new google.maps.Size(40, 40) }}
                    />
                )}
            </GoogleMap>

            {/* Tracking Overlay */}
            <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-4">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-card p-4 rounded-2xl flex items-center justify-between backdrop-blur-xl border border-white/5 shadow-2xl"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Live Status</p>
                            <h3 className="text-white font-bold text-label-md uppercase tracking-tighter shrink-0 truncate">Mechanic is {status.replace('-', ' ')}</h3>
                        </div>
                    </div>
                    <div className="bg-emerald-500/10 px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-widest border border-emerald-500/20">
                        <Clock size={12} /> 8-12m
                    </div>
                </motion.div>
            </div>

            {/* Mechanic Profile Footer */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="absolute bottom-6 left-6 right-6 z-20 glass-card p-6 md:p-8 rounded-[40px] border border-white/10 backdrop-blur-2xl bg-black/40 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5 mb-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-indigo-glow">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.mechanic?.name || 'mechanic'}`} alt="avatar" className="w-12 h-12 rounded-2xl" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-black text-h2 uppercase tracking-tighter leading-none">{request.mechanic?.name || 'Your Mechanic'}</h4>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">Verified</span>
                            </div>
                            <p className="text-slate-400 text-[10px] font-bold flex items-center gap-2 uppercase tracking-[0.2em]">
                                <span className="text-emerald-500 font-extrabold flex items-center gap-1"><Zap size={12} fill="currentColor" /> 4.9</span>
                                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                <span>Expertise: {Array.isArray(request.issueType) ? request.issueType.join(', ') : request.issueType}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all group">
                            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button className="flex-1 md:w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-all shadow-luxurious group">
                            <Phone size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex-1 cta-button !bg-white/5 !text-slate-400 !border-white/5 h-14 px-6 text-[10px] uppercase font-black tracking-widest hover:!bg-white/10"
                    >
                        <Home size={16} className="mr-2" /> Back to Dashboard
                    </button>
                    <button className="flex-1 cta-button !bg-rose-500/10 !text-rose-500 !border-rose-500/20 h-14 px-6 text-[10px] uppercase font-black tracking-widest hover:!bg-rose-500/20">
                        Cancel Request
                    </button>
                </div>
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {showPayment && (
                    <PaymentModal
                        requestId={requestId as string}
                        amount={request.price || 500}
                        onSuccess={() => {
                            setShowPayment(false);
                            setShowReview(true);
                        }}
                    />
                )}
                {showReview && (
                    <ReviewModal
                        requestId={requestId as string}
                        onSuccess={() => {
                            setShowReview(false);
                            router.push('/dashboard');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
