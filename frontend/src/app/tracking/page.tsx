"use client";

import { useState, useEffect, Suspense } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Phone, MessageCircle, MapPin, Clock, ShieldCheck, Home, Zap, Star } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import ReviewModal from '@/components/ReviewModal';

const mapContainerStyle = {
    width: '100%',
    height: '100vh',
};

const sunlightMapStyles = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
];

function TrackingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const requestId = searchParams.get('id');
    
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
        if (!requestId) return;

        const fetchRequest = async () => {
            try {
                const { data } = await api.get(`/requests/${requestId}`);
                if (data.success) {
                    setRequest(data.data);
                    setStatus(data.data.status);
                    joinRoom(requestId);
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
    }, [socket]);

    if (!requestId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-gray-900 gap-6 noise-bg">
                <div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-4">
                    <MapPin size={40} className="text-primary fill-primary" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Null Coordinates</h2>
                <button onClick={() => router.push('/dashboard')} className="cta-button h-16 px-10 text-[10px] uppercase tracking-widest shadow-xl">Return to Hub</button>
            </div>
        );
    }

    if (!isLoaded || !request) return <div className="min-h-screen flex items-center justify-center bg-background text-gray-400 font-black uppercase tracking-[0.4em] animate-pulse noise-bg">Synchronizing Pulse...</div>;

    const userPos = { lat: request.location.coordinates[1], lng: request.location.coordinates[0] };

    return (
        <div className="relative min-h-screen bg-background">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mechanicLocation || userPos}
                zoom={14}
                onLoad={setMap}
                options={{
                    disableDefaultUI: true,
                    styles: sunlightMapStyles
                }}
            >
                <Marker position={userPos} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', scaledSize: new google.maps.Size(40, 40) }} />
                {mechanicLocation && (
                    <Marker
                        position={mechanicLocation}
                        icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', scaledSize: new google.maps.Size(50, 50) }}
                    />
                )}
            </GoogleMap>

            <div className="absolute top-8 left-8 right-8 z-10">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-[800px] mx-auto bg-white/70 backdrop-blur-3xl p-6 rounded-[2.5rem] flex items-center justify-between border border-white/60 shadow-premium relative overflow-hidden"
                >
                    <div className="tactical-bracket bracket-tl scale-75" />
                    <div className="tactical-bracket bracket-tr scale-75" />
                    
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Live Deployment Protocol</p>
                            <h3 className="text-gray-900 font-black text-2xl uppercase tracking-tighter shrink-0 truncate">Responder is {status.replace('-', ' ')}</h3>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-8 left-8 right-8 z-20 max-w-[1200px] mx-auto bg-white/80 backdrop-blur-3xl p-8 rounded-[4rem] border border-white/60 shadow-premium relative overflow-hidden"
            >
                <div className="absolute -right-20 -bottom-20 opacity-[0.03] select-none pointer-events-none">
                     <h1 className="text-[15rem] font-black -rotate-12 tracking-tighter">GNOW</h1>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-gray-100 mb-8 relative z-10">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="relative">
                            <div className="w-20 h-20 bg-primary/20 rounded-[2.5rem] flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-lg p-1 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.mechanic?.name || 'mechanic'}`} alt="avatar" className="w-full h-full rounded-[2rem] object-cover" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-white">
                                <ShieldCheck size={10} strokeWidth={4} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-gray-900 font-black text-4xl uppercase tracking-tighter leading-none shrink-0">{request.mechanic?.name || 'Assigned Expert'}</h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-yellow-400 text-black px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                    <Star size={12} fill="currentColor" /> 4.9
                                </div>
                                <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Expertise: {Array.isArray(request.issueType) ? request.issueType.join(' + ') : request.issueType}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button className="flex-1 md:w-20 h-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-zinc-900 hover:text-white transition-all duration-500 group shadow-sm">
                            <MessageCircle size={28} className="group-hover:scale-110 transition-transform duration-500" />
                        </button>
                        <button className="flex-1 md:w-20 h-20 rounded-[2rem] bg-zinc-900 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all duration-500 shadow-2xl group">
                            <Phone size={28} className="group-hover:scale-110 transition-transform duration-500 fill-current" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 relative z-10">
                    <div className="flex-1 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm"><MapPin size={24} /></div>
                             <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Target Address</p>
                                 <p className="text-xs font-bold text-gray-900 uppercase truncate max-w-[200px] md:max-w-md">{request.address}</p>
                             </div>
                         </div>
                    </div>
                </div>
            </motion.div>

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

export default function TrackingPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background text-gray-900 uppercase font-black tracking-[0.4em] noise-bg animate-pulse">Establishing Uplink Hub...</div>}>
            <TrackingContent />
        </Suspense>
    );
}
