"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
    MapPin, Navigation, Settings, LogOut, Wrench,
    Zap, Clock, Briefcase, CreditCard, Users,
    ChevronRight, Power, User as UserIcon, Bike, Car,
    CheckCircle2, AlertCircle, Phone, ArrowRight,
    AlertTriangle, Menu, X, ArrowUpRight, Globe, Activity, Shield
} from 'lucide-react';
import { useMagnetic } from '@/hooks/useMagnetic';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const center = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad

const menuItems = [
    { id: "feed", icon: <Wrench size={20} />, label: "Job Feed" },
    { id: "active", icon: <Navigation size={20} />, label: "Live Map" },
    { id: "earnings", icon: <CreditCard size={20} />, label: "Wallet" },
    { id: "history", icon: <Briefcase size={20} />, label: "Logbook" },
    { id: "profile", icon: <UserIcon size={20} />, label: "Identity" },
];

const mapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
];

export default function MechanicDashboard() {
    const { user, logout, updateProfile } = useAuth();
    const { socket, joinRoom } = useSocket();
    const router = useRouter();

    const [currentLocation, setCurrentLocation] = useState(center);
    const [isOnline, setIsOnline] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeRequest, setActiveRequest] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("feed");
    const [showNewJobModal, setShowNewJobModal] = useState<any>(null);

    const [stats, setStats] = useState({ balance: 0, jobs: 0, rating: 4.9 });
    const [editMode, setEditMode] = useState(false);
    const [expertise, setExpertise] = useState<string[]>(user?.expertise || []);
    const [vehicleTypes, setVehicleTypes] = useState<string[]>(user?.vehicleTypes || []);
    const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
    const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
    const [newName, setNewName] = useState(user?.name || "");
    const [addressLabel, setAddressLabel] = useState("Base");
    const [addressText, setAddressText] = useState("");
    const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(user?.gender || 'male');
    const [isLocating, setIsLocating] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Tactical Vanguard Hooks
    const magneticOnline = useMagnetic(0.3);
    const magneticProfile = useMagnetic(0.4);

    // Performance-Optimized Mouse Tracker for 3D Tilt
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isThrottled, setIsThrottled] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isThrottled) return;
        setIsThrottled(true);
        
        requestAnimationFrame(() => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            setMousePos({ x: (clientX / innerWidth - 0.5) * 20, y: (clientY / innerHeight - 0.5) * 20 });
            setIsThrottled(false);
        });
    };

    const expertiseOptions = ['PUNCTURE', 'BATTERY', 'ENGINE', 'FUEL'];
    const vehicleOptions = ['2-WHEELER', '4-WHEELER'];

    useEffect(() => {
        if (user) {
            setExpertise(user.expertise || []);
            setVehicleTypes(user.vehicleTypes || []);
            setNewName(user.name || "");
            setSelectedGender(user.gender || 'male');
            setIsOnline(user.isOnline || false);
        }
    }, [user]);

    const handleUpdateName = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            await updateProfile({ name: newName, gender: selectedGender });
            toast.success("Profile updated!");
            setIsEditNameModalOpen(false);
        } catch (error) { toast.error("Failed to update"); } finally { setLoading(false); }
    };

    const handleAddAddress = async (manualData?: any) => {
        setLoading(true);
        try {
            const newAddress = manualData || { label: addressLabel, address: addressText, coordinates: selectedCoords || undefined };
            const updatedAddresses = [...(user?.addresses || []), newAddress];
            await updateProfile({ addresses: updatedAddresses });
            toast.success("Base Point Registered!");
            setIsAddAddressModalOpen(false);
            setAddressText(""); setSuggestions([]); setShowSuggestions(false); setSelectedCoords(null);
        } catch (error) { toast.error("Failed to save"); } finally { setLoading(false); }
    };

    useEffect(() => {
        if (addressText.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(addressText)}&limit=5&lat=23.0225&lon=72.5714`);
                const data = await response.json();
                if (data.features) {
                    const results = data.features.map((f: any) => ({
                        name: f.properties.name,
                        fullAddress: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(", "),
                        coords: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }
                    }));
                    setSuggestions(results); setShowSuggestions(true);
                }
            } catch (error) {}
        }, 500);
        return () => clearTimeout(timer);
    }, [addressText]);

    const fetchGPSLocation = () => {
        if (!navigator.geolocation) return toast.error("Not supported");
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const gpsPoint = { label: "Current base", address: "GPS Vector Point", coordinates: { lat: latitude, lng: longitude } };
                setAddressText("GPS Vector (Locked)"); setIsLocating(false);
            },
            () => { toast.error("GPS lost"); setIsLocating(false); }
        );
    };

    const handleUpdateCapabilities = async () => {
        setLoading(true);
        try {
            await updateProfile({ expertise, vehicleTypes });
            toast.success('Sync Successful!'); setEditMode(false);
        } catch (error) { toast.error('Sync failed'); } finally { setLoading(false); }
    };

    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '' });

    const fetchRequests = useCallback(async () => {
        try {
            const { data } = await api.get('/requests');
            if (data.success) setRequests(data.data);
        } catch (error) {}
    }, []);

    const fetchMechanicStats = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) setStats({ balance: data.data.pricing || 0, jobs: data.data.totalJobs || 0, rating: data.data.rating || 4.9 });
        } catch (error) {}
    }, []);

    useEffect(() => { fetchMechanicStats(); fetchRequests(); }, [fetchMechanicStats, fetchRequests]);
    useEffect(() => {
        if (isOnline) { const interval = setInterval(fetchRequests, 10000); return () => clearInterval(interval); }
    }, [isOnline, fetchRequests]);

    useEffect(() => {
        if (socket && user?._id) {
            socket.emit('join-room', user._id);
        }
    }, [socket, user?._id]);

    useEffect(() => {
        if (!socket || !isOnline) return;
        socket.on('request-received', (data: any) => {
            // Simplified: Backend now only sends this to the correct specialists
            setShowNewJobModal(data.request);
            setTimeout(() => setShowNewJobModal(null), 30000);
        });
        return () => { socket.off('request-received'); };
    }, [socket, isOnline]);

    useEffect(() => {
        if (!socket || !activeRequest || !isOnline) return;
        const locInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCurrentLocation(newPos);
                socket.emit('mechanic-location', { requestId: activeRequest._id, location: newPos });
            });
        }, 5000);
        return () => clearInterval(locInterval);
    }, [socket, activeRequest, isOnline]);

    const handleAcceptRequest = async (id: string) => {
        setLoading(true);
        try {
            const { data } = await api.put(`/requests/${id}`, { status: 'accepted', mechanicId: user?._id });
            if (data.success) {
                toast.success('Task Accepted!'); setActiveRequest(data.data); joinRoom(id);
                if (socket) socket.emit('accept-request', { requestId: id, mechanicId: user?._id, mechanicName: user?.name });
                setActiveTab("active");
            }
        } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to accept'); } finally { setLoading(false); }
    };

    const handleCompleteRequest = async () => {
        if (!activeRequest) return;
        setLoading(true);
        try {
            const { data } = await api.put(`/requests/${activeRequest._id}`, { status: 'completed' });
            if (data.success) {
                toast.success('Job marked as completed!', { icon: '💰' });
                setActiveRequest(null); setActiveTab("feed"); fetchMechanicStats();
            }
        } catch (error) { toast.error('Failed to complete'); } finally { setLoading(false); }
    };

    const handleToggleOnline = async () => {
        if (!user?.isVerified) return toast.error("Verification pending node clearance.");
        try {
            const newStatus = !isOnline;
            const { data } = await api.put('/auth/profile', { isOnline: newStatus });
            if (data.success) { setIsOnline(newStatus); toast.success(newStatus ? "Grid Active!" : "Grid Inactive."); }
        } catch (error) { toast.error("Failed to sync pulse status"); }
    };

    if (!isLoaded) return <div className="min-h-screen bg-white/70 backdrop-blur-3xl flex items-center justify-center text-gray-400 vanguard-grid noise-bg font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] italic px-6 text-center">Initializing Responder HUB...</div>;

    return (
        <div onMouseMove={handleMouseMove} className="min-h-screen bg-background text-gray-900 font-sans selection:bg-primary/30 antialiased w-full max-w-full overflow-x-hidden relative noise-bg vanguard-grid">
            {/* Tactical Atmosphere Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="neo-orb w-[600px] h-[600px] bg-primary/20 -top-40 -left-40" />
                <motion.div animate={{ x: [0, -80, 0], y: [0, 120, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="neo-orb w-[500px] h-[500px] bg-gray-300/30 bottom-0 -right-20" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="neo-orb w-[400px] h-[400px] bg-yellow-200/10 top-1/2 left-1/3" />
                
                {/* Parallax Brand Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
                    <h1 className="text-[30vw] font-black tracking-tighter leading-none transform -rotate-12">GNOW</h1>
                </div>
            </div>
            {/* Desktop Sidebar */}
            {/* Premium Top Header - Khatarnak Pivot */}
            <header className="fixed top-0 left-0 right-0 h-20 sm:h-24 bg-white/70 backdrop-blur-3xl border-b border-gray-100 z-50 transition-all duration-500 data-stream signal-scan">
                <div className="w-full max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-4 2xl:px-12 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 group cursor-pointer min-w-0" onClick={() => setActiveTab("feed")}>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shrink-0">
                            <Zap size={18} className="text-primary fill-primary sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm sm:text-base lg:text-sm xl:text-2xl font-black tracking-tighter block leading-none text-gray-900 uppercase truncate">Responders</span>
                            <span className="text-[7px] md:text-[9px] font-black tracking-[0.3em] md:tracking-[0.4em] text-primary uppercase leading-none mt-1 truncate">Operational Node</span>
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 p-1 bg-gray-100/50 rounded-[2rem] border border-gray-200/50 overflow-x-auto scrollbar-hide max-w-[600px] xl:max-w-none">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-2 xl:gap-3 px-4 xl:px-8 py-2.5 xl:py-3 rounded-[1.6rem] font-black transition-all duration-500 relative group overflow-hidden shrink-0 ${activeTab === item.id 
                                    ? "bg-white text-gray-900 shadow-premium" 
                                    : "text-gray-400 hover:text-gray-700 hover:bg-white/50"}`}
                            >
                                <div className={`relative z-10 transition-colors ${activeTab === item.id ? "text-primary scale-110" : "group-hover:text-primary"}`}>
                                    {item.icon}
                                </div>
                                <span className="relative z-10 text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="hidden xl:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Grid Sync</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter leading-none vanguard-glitch">Active Pulse</span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                        </div>

                        <motion.div ref={magneticOnline.ref} animate={{ x: magneticOnline.x, y: magneticOnline.y }} onMouseLeave={magneticOnline.handleMouseLeave}>
                            <button 
                                onClick={handleToggleOnline} 
                                disabled={!user?.isVerified}
                                className={`hidden md:flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-500 border ${isOnline ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.2)]" : "bg-gray-100 border-gray-200 text-gray-400 opacity-60"}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest">{isOnline ? "Connected" : "Offline"}</span>
                            </button>
                        </motion.div>

                        <motion.div ref={magneticProfile.ref} animate={{ x: magneticProfile.x, y: magneticProfile.y }} onMouseLeave={magneticProfile.handleMouseLeave} className="shrink-0">
                            <button onClick={() => setActiveTab("profile")} className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-primary/20 p-0.5 overflow-hidden shadow-premium group hover:border-primary transition-all duration-500">
                                <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[10px] sm:rounded-[14px] w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </button>
                        </motion.div>
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden w-8 h-8 sm:w-12 sm:h-12 bg-zinc-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shrink-0"><Menu size={18} className="sm:w-6 sm:h-6" /></button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Hub */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-[200] bg-white flex flex-col px-4 pt-10 pb-8 overflow-y-auto scrollbar-hide"
                        style={{ width: '100%', maxWidth: '100vw' }}
                    >
                        <div className="flex justify-between items-center mb-10 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg shrink-0"><Zap size={18} className="text-primary fill-primary" /></div>
                                <span className="text-lg font-black tracking-tighter text-gray-900 uppercase truncate">Responders</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-900 shrink-0"><X size={18} /></button>
                        </div>
                        <nav className="flex flex-col gap-3 flex-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all text-left w-full ${activeTab === item.id ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-gray-50 text-gray-500 border border-gray-100"}`}
                                >
                                    <div className="shrink-0">{item.icon}</div>
                                    <span className="text-[11px] uppercase tracking-[0.2em] truncate">{item.label}</span>
                                </button>
                            ))}
                            <div className="h-[1px] bg-gray-100 my-4" />
                            
                            {/* Mobile Connection Hub */}
                            <div className="flex flex-col gap-3">
                                <button onClick={handleToggleOnline} className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all w-full ${isOnline ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 opacity-60"}`}>
                                    <Power size={18} className="shrink-0" />
                                    <span className="text-[11px] uppercase tracking-[0.2em] truncate">{isOnline ? "Operational" : "Offline Node"}</span>
                                </button>
                                
                                {requests.filter(r => r.status === 'pending').length > 0 && (
                                    <div className="flex items-center justify-between px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">N</div>
                                            <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider truncate">{requests.filter(r => r.status === 'pending').length} Active Issue</span>
                                        </div>
                                        <button onClick={() => { setActiveTab("feed"); setIsMobileMenuOpen(false); }} className="w-8 h-8 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center shrink-0"><ArrowRight size={16} /></button>
                                    </div>
                                )}
                                
                                <button onClick={logout} className="flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all border border-red-50 w-full">
                                    <LogOut size={18} className="shrink-0" />
                                    <span className="text-[11px] uppercase tracking-[0.2em] truncate">Terminate Access</span>
                                </button>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="pt-28 sm:pt-32 pb-16 px-4 sm:px-6 md:px-8 lg:px-10 w-full max-w-full min-h-screen flex flex-col relative z-10">
                <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="h-[2px] w-8 md:w-12 bg-primary" />
                            <span className="text-primary font-black text-[9px] md:text-[11px] uppercase tracking-[0.4em] md:tracking-[0.6em]">Responder Protocol Active</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-tight md:leading-[0.85] text-gray-900 break-words max-w-4xl">
                            {menuItems.find(i => i.id === activeTab)?.label} Hub
                        </h1>
                    </div>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row gap-10">
                    <div className="flex-[4] flex flex-col gap-8">
                        <AnimatePresence mode="wait">
                            {activeTab === "active" && activeRequest ? (
                                <motion.div key="active-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-8 h-full">
                                    <motion.div 
                                        style={{ rotateX: mousePos.y / 4, rotateY: -mousePos.x / 4 }}
                                        className="bg-white/70 backdrop-blur-3xl p-6 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] md:rounded-[4rem] border border-white/50 shadow-premium relative overflow-hidden group min-w-0"
                                    >
                                        {/* Tactical HUD Brackets */}
                                        <div className="tactical-bracket bracket-tl" />
                                        <div className="tactical-bracket bracket-tr" />
                                        <div className="tactical-bracket bracket-bl" />
                                        <div className="tactical-bracket bracket-br" />

                                        <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10">
                                             <Zap className="text-primary w-24 h-24 sm:w-32 sm:h-32" />
                                        </div>

                                        <div className="flex items-center gap-4 sm:gap-8 mb-8 sm:mb-12 relative z-10">
                                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-zinc-900 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center text-primary shadow-2xl animate-pulse shrink-0">
                                                <Navigation size={32} className="fill-primary sm:w-10 sm:h-10" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-primary text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 sm:mb-2 block">Live Vector Active</span>
                                                <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter leading-tight break-words truncate sm:whitespace-normal">
                                                    {Array.isArray(activeRequest.issueType) ? activeRequest.issueType.join(' + ') : activeRequest.issueType}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12 relative z-10 w-full">
                                            <div className="p-6 sm:p-8 bg-gray-50/50 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 flex items-center justify-between group/cell hover:bg-zinc-900 transition-all duration-500 min-w-0">
                                                <div className="min-w-0">
                                                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover/cell:text-gray-500">Target Identity</p>
                                                    <p className="font-black text-lg sm:text-2xl text-gray-900 uppercase group-hover/cell:text-white transition-colors truncate">{activeRequest.user?.name || 'Authorized Client'}</p>
                                                </div>
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 shadow-sm group-hover/cell:bg-primary group-hover/cell:text-black transition-all shrink-0">
                                                    <Users size={20} className="sm:w-6 sm:h-6" />
                                                </div>
                                            </div>
                                            <div className="p-6 sm:p-8 bg-gray-50/50 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 flex items-center justify-between group/cell hover:bg-zinc-900 transition-all duration-500 min-w-0">
                                                <div className="min-w-0">
                                                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover/cell:text-gray-500">Node Distance</p>
                                                    <p className="font-black text-lg sm:text-2xl text-emerald-600 transition-colors truncate">2.4 KM Vector</p>
                                                </div>
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 shadow-sm group-hover/cell:bg-primary group-hover/cell:text-black transition-all shrink-0">
                                                    <MapPin size={20} className="sm:w-6 sm:h-6" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full">
                                                <button onClick={() => toast(`Establishing Link with ${activeRequest.user?.name}...`, { icon: '📞' })} className="w-full sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-gray-400 hover:bg-zinc-900 hover:text-white transition-all duration-500 shadow-sm shrink-0">
                                                <Phone size={24} className="sm:w-8 sm:h-8" />
                                            </button>
                                            <button onClick={handleCompleteRequest} disabled={loading} className="w-full primary-button text-[10px] sm:text-xs md:text-base lg:text-lg h-16 sm:h-20 md:h-24 !rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all text-center uppercase tracking-widest font-black flex-1 min-w-0">
                                                {loading ? 'Syncing Result...' : 'Close Deployment Protocol'}
                                            </button>
                                        </div>
                                    </motion.div>
                                    
                                    <div className="flex-1 bg-white/70 backdrop-blur-3xl rounded-[4rem] border border-white/50 shadow-premium overflow-hidden min-h-[400px] relative">
                                        <GoogleMap mapContainerStyle={mapContainerStyle} center={currentLocation} zoom={16} options={{ disableDefaultUI: true, styles: mapStyles }}>
                                            <Marker position={currentLocation} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', scaledSize: new google.maps.Size(40, 40) }} />
                                            <Marker position={{ lat: activeRequest.location.coordinates[1], lng: activeRequest.location.coordinates[0] }} />
                                        </GoogleMap>
                                        <div className="absolute bottom-8 left-8 bg-zinc-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3 text-white">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Real-time Telemetry Active</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === "feed" ? (
                                <motion.div key="feed-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
                                    {isOnline ? (
                                        requests.filter(r => r.status === 'pending').length > 0 ? requests.filter(r => r.status === 'pending').map((req, i) => (
                                            <motion.div 
                                                key={i} 
                                                initial={{ y: 30, opacity: 0 }} 
                                                animate={{ y: 0, opacity: 1 }} 
                                                transition={{ delay: i * 0.1 }}
                                                style={{ rotateX: mousePos.y / 8, rotateY: -mousePos.x / 8 }}
                                                className="bg-white/70 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/50 shadow-premium flex flex-col md:flex-row items-center gap-6 md:gap-10 group hover:bg-zinc-900 transition-all duration-700 relative overflow-hidden w-full"
                                            >
                                                {/* Tactical HUD Brackets */}
                                                <div className="tactical-bracket bracket-tl scale-75 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="tactical-bracket bracket-br scale-75 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gray-50/50 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:rotate-6 shrink-0">
                                                    {req.vehicleType === '2-wheel' ? <Bike size={36} className="sm:w-12 sm:h-12" /> : <Car size={36} className="sm:w-12 sm:h-12" />}
                                                </div>
                                                <div className="flex-1 text-center md:text-left min-w-0">
                                                    <span className="text-primary text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-2 sm:mb-3 block opacity-0 group-hover:opacity-100 transition-opacity">Emergency Signal Detected</span>
                                                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 group-hover:text-white uppercase tracking-tighter mb-2 transition-colors leading-tight truncate sm:whitespace-normal">
                                                        {Array.isArray(req.issueType) ? req.issueType.join(' + ') : req.issueType}
                                                    </h3>
                                                    <p className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 group-hover:text-gray-500 transition-colors">
                                                        <MapPin size={16} className="text-primary shrink-0" /> <span className="truncate">{req.address}</span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col md:items-end gap-4 min-w-[200px] w-full md:w-auto">
                                                    <div className="flex flex-col items-center md:items-end w-full">
                                                        <span className="text-gray-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-gray-600">Offered Bounty</span>
                                                        <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tighter group-hover:text-emerald-500 transition-colors leading-none">₹{req.price || 850}</span>
                                                    </div>
                                                    <button onClick={() => handleAcceptRequest(req._id)} className="w-full primary-button h-16 sm:h-18 text-[9px] sm:text-[10px] !rounded-[1.2rem] sm:rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-center uppercase tracking-widest font-black flex items-center justify-center gap-2">Accept Job Protocol <ArrowRight size={18} className="shrink-0" /></button>
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 relative overflow-hidden bg-white/30 backdrop-blur-xl rounded-[4rem] border border-dashed border-gray-200">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-24 h-24 border-4 border-dashed border-primary/40 rounded-[2rem] mb-8" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-500">Scanning Grid Frequencies...</p>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
                                                    <h1 className="text-[20rem] font-black tracking-tighter">SCAN</h1>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="py-40 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-xl border border-dashed border-gray-200 rounded-[4rem] opacity-40">
                                            <AlertCircle size={80} className="text-gray-200 mb-8" />
                                            <p className="text-xs font-black uppercase tracking-[0.5em] text-gray-500 italic">Responder Node is Currently Inactive</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : activeTab === "earnings" ? (
                                <motion.div key="earnings-view" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="bg-white/70 backdrop-blur-3xl p-6 md:p-12 rounded-[3.5rem] md:rounded-[4rem] border border-white/50 shadow-premium flex flex-col items-center text-center relative overflow-hidden group hover:bg-zinc-900 transition-all duration-700">
                                        {/* Tactical HUD Brackets */}
                                        <div className="tactical-bracket bracket-tl scale-75 opacity-20 group-hover:opacity-100 transition-opacity" />
                                        <div className="tactical-bracket bracket-br scale-75 opacity-20 group-hover:opacity-100 transition-opacity" />

                                        <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-8 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"><CreditCard size={36} /></div>
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-3 group-hover:text-gray-500 transition-colors">Available Quantum</h3>
                                        <p className="text-6xl md:text-7xl font-black text-gray-900 tracking-tighter mb-10 group-hover:text-white transition-colors">₹{stats.balance.toLocaleString()}</p>
                                        <button className="cta-button w-full h-20 text-[11px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Initiate Credit Withdrawal</button>
                                    </div>
                                    <div className="bg-zinc-900 p-6 md:p-12 rounded-[3.5rem] md:rounded-[4rem] shadow-premium flex flex-col items-center text-center text-white relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 p-10 opacity-5">
                                             <Briefcase className="w-40 h-40" />
                                         </div>
                                        <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center text-black mb-8 shadow-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500"><CheckCircle2 size={36} /></div>
                                        <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] mb-3">Total Deployments</h3>
                                        <p className="text-6xl md:text-7xl font-black tracking-tighter mb-10 text-white leading-none">{stats.jobs} <span className="text-primary">Jobs</span></p>
                                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.6em] animate-pulse">Certified Responder Level 4</p>
                                    </div>

                                    <div className="md:col-span-2 mt-12">
                                        <div className="flex items-center gap-4 mb-12">
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em]">Deployment Registry</h3>
                                            <div className="h-px flex-1 bg-gray-100" />
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {requests.filter(r => r.status === 'completed').length > 0 ? (
                                                requests.filter(r => r.status === 'completed').map((req, i) => (
                                                    <div key={i} className="bg-white/70 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/50 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:bg-zinc-900 transition-all duration-500 relative overflow-hidden">
                                                        {/* Tactical HUD Brackets */}
                                                        <div className="tactical-bracket bracket-tl scale-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        
                                                        <div className="flex items-center gap-6 w-full md:w-auto">
                                                            <div className="w-16 h-16 shrink-0 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-primary group-hover:text-black transition-all duration-500"><CheckCircle2 size={24} /></div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-gray-600 transition-colors">{req.updatedAt && !isNaN(new Date(req.updatedAt).getTime()) ? new Date(req.updatedAt).toLocaleDateString() : 'Protocol Static'}</p>
                                                                <h3 className="text-2xl font-black text-gray-900 group-hover:text-white uppercase tracking-tighter transition-colors leading-none break-words">
                                                                    {Array.isArray(req.issueType) ? req.issueType.join(' + ') : req.issueType}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="flex w-full md:w-auto justify-end md:justify-center">
                                                            <p className="text-4xl font-black text-emerald-600 group-hover:text-emerald-500 transition-colors tracking-tighter">₹{req.price || 850}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-24 bg-white/30 backdrop-blur-xl rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-40">
                                                    <Briefcase size={48} className="text-gray-300 mb-6" />
                                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 italic">No Successful Deployments Logged</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === "history" ? (
                                <motion.div key="history-view" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 w-full">
                                    <div className="flex items-center gap-4 mb-4">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Logbook Registry</h3>
                                        <div className="h-px flex-1 bg-gray-100" />
                                    </div>
                                    <div className="w-full overflow-x-auto scrollbar-hide">
                                        <div className="flex flex-col gap-6 min-w-0">
                                            {requests.filter(r => r.status === 'completed').length > 0 ? (
                                                requests.filter(r => r.status === 'completed').map((req, i) => (
                                                    <div key={i} className="bg-white/70 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-white/50 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 group hover:bg-zinc-900 transition-all duration-700 relative overflow-hidden min-w-0">
                                                        <div className="tactical-bracket bracket-tl scale-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="flex items-start md:items-center gap-4 sm:gap-6 w-full md:w-auto min-w-0">
                                                            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-gray-50 rounded-[1.2rem] sm:rounded-[2rem] flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-inner">
                                                                <CheckCircle2 size={24} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-2 group-hover:text-gray-600 transition-colors">
                                                                    {req.updatedAt && !isNaN(new Date(req.updatedAt).getTime()) ? new Date(req.updatedAt).toLocaleDateString() : 'Protocol Static'}
                                                                </p>
                                                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 group-hover:text-white uppercase tracking-tighter transition-colors leading-none mb-2 break-words">
                                                                    {Array.isArray(req.issueType) ? req.issueType.join(' + ') : req.issueType}
                                                                </h3>
                                                                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-gray-500 transition-colors flex items-center gap-2 truncate">
                                                                    <MapPin size={14} className="text-primary shrink-0" /> {req.address}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex w-full md:w-auto justify-end md:justify-center shrink-0">
                                                            <p className="text-3xl sm:text-4xl font-black text-emerald-600 group-hover:text-emerald-500 transition-colors tracking-tighter shrink-0">₹{req.price || 850}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-24 bg-white/30 backdrop-blur-xl rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-40 w-full">
                                                    <Briefcase size={64} className="text-gray-200 mb-6" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic">No Successful Deployments Logged</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === "profile" ? (
                                <motion.div key="profile-view" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 w-full">
                                    <div className="flex flex-col gap-8 md:gap-10">
                                        <div className="bg-white/70 backdrop-blur-3xl p-6 sm:p-10 md:p-12 rounded-[3.5rem] md:rounded-[4rem] border border-white/50 shadow-premium flex flex-col items-center text-center relative overflow-hidden group">
                                            <div className="tactical-bracket bracket-tl scale-75 md:scale-100" />
                                            <div className="tactical-bracket bracket-tr scale-75 md:scale-100" />
                                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] sm:rounded-[3rem] border-4 border-white p-1 mb-8 sm:mb-10 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-700">
                                                <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[2.3rem] sm:rounded-[2.8rem] w-full h-full object-cover" alt="profile" />
                                            </div>
                                            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 uppercase tracking-tighter mb-2 leading-none break-words max-w-full">{user?.name}</h2>
                                            <p className="text-primary text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-8 sm:mb-10 italic">Certified Operator Signal</p>
                                            <button onClick={() => setIsEditNameModalOpen(true)} className="primary-button w-full h-16 sm:h-20 text-[10px] sm:text-[11px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Update Identity Credentials</button>
                                        </div>

                                        <div className="bg-white/70 backdrop-blur-3xl p-6 sm:p-10 rounded-[3.5rem] md:rounded-[4rem] border border-white/50 shadow-premium relative">
                                            <div className="tactical-bracket bracket-bl scale-75 md:scale-100" />
                                            <div className="tactical-bracket bracket-br scale-75 md:scale-100" />
                                            <h3 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] mb-8 sm:mb-12">Operational Hub Bases</h3>
                                            <div className="flex flex-col gap-4 sm:gap-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                                {user?.addresses?.map((addr: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-4 sm:gap-6 p-6 sm:p-8 bg-gray-50/50 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 group hover:bg-zinc-900 transition-all duration-700 relative overflow-hidden min-w-0">
                                                        <div className="tactical-bracket bracket-tl scale-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-sm shrink-0"><MapPin size={24} /></div>
                                                        <div className="flex-1 overflow-hidden relative z-10 min-w-0">
                                                            <span className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 block truncate">Vector Label: {addr.label}</span>
                                                            <p className="text-gray-900 text-lg sm:text-xl font-black uppercase truncate group-hover:text-white transition-colors leading-none">{addr.address}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => setIsAddAddressModalOpen(true)} className="mt-8 sm:mt-12 w-full border-2 border-dashed border-gray-200 p-6 sm:p-10 rounded-[2.5rem] text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] hover:bg-gray-50 hover:text-gray-600 hover:border-primary/40 transition-all duration-500">Register New Deployment Matrix</button>
                                        </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur-3xl p-6 sm:p-10 md:p-12 rounded-[3.5rem] md:rounded-[4rem] border border-white/50 shadow-premium relative h-fit">
                                        <div className="tactical-bracket bracket-tl scale-75 md:scale-100" />
                                        <div className="tactical-bracket bracket-br scale-75 md:scale-100" />
                                        <div className="flex justify-between items-center mb-10 sm:mb-12 flex-row gap-4">
                                            <h3 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.5em]">Service Grid</h3>
                                            <button onClick={() => setEditMode(!editMode)} className="text-primary text-[10px] sm:text-[11px] font-black uppercase tracking-widest underline decoration-2 underline-offset-8 hover:opacity-70 transition-opacity">{editMode ? 'Cancel Sync' : 'Re-calibrate'}</button>
                                        </div>
                                        {editMode ? (
                                            <div className="flex flex-col gap-8">
                                                <div className="space-y-4">
                                                    <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Class Vector</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {vehicleOptions.map(opt => (
                                                            <button key={opt} onClick={() => vehicleTypes.includes(opt) ? setVehicleTypes(vehicleTypes.filter(v=>v!==opt)) : setVehicleTypes([...vehicleTypes, opt])} className={`p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center gap-3 ${vehicleTypes.includes(opt) ? "bg-zinc-900 text-white ring-4 ring-primary/20 shadow-2xl" : "bg-gray-50/50 border-gray-100 text-gray-400 hover:bg-gray-100"}`}>
                                                                <div className={`${vehicleTypes.includes(opt) ? "text-primary scale-110" : ""} transition-all duration-500 shrink-0`}>
                                                                    {opt === '2-WHEELER' ? <Bike size={32} /> : <Car size={32} />}
                                                                </div>
                                                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none text-center">[{opt.split('-')[0]}] Unit</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Functional Expertise</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {expertiseOptions.map(opt => (
                                                            <button key={opt} onClick={() => expertise.includes(opt) ? setExpertise(expertise.filter(e=>e!==opt)) : setExpertise([...expertise, opt])} className={`py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[1.8rem] border text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${expertise.includes(opt) ? "bg-zinc-900 text-primary ring-4 ring-primary/20 shadow-xl" : "bg-gray-50/50 border-gray-100 text-gray-400 hover:bg-gray-100"}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button onClick={handleUpdateCapabilities} disabled={loading} className="cta-button w-full h-16 sm:h-20 text-[10px] sm:text-[11px] tracking-widest shadow-2xl hover:scale-105 transition-all mt-4">{loading ? 'Syncing...' : 'Commit Protocol Sync'}</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                <div className="space-y-6">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Authorized Class</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {user?.vehicleTypes?.map((v: string) => (
                                                            <div key={v} className="p-6 sm:p-10 bg-zinc-900 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center gap-4 text-white shadow-premium group/v hover:scale-[1.02] transition-transform min-w-0">
                                                                <div className="text-primary group-hover/v:scale-110 transition-transform duration-500 shrink-0">{v === '2-WHEELER' ? <Bike size={32} /> : <Car size={32} />}</div>
                                                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary text-center truncate w-full">{v} Protocol</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Specialized Frequencies</p>
                                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                                        {user?.expertise?.map((ex: string) => (
                                                            <div key={ex} className="px-5 py-3 bg-zinc-900 text-primary border border-primary/20 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">{ex} Sector</div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="pt-8 border-t border-gray-100 flex flex-col items-center text-center opacity-30">
                                                     <Zap size={24} className="text-gray-300 mb-3" />
                                                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-400">Node Compliance: Alpha-9</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <div className="hidden xl:flex flex-[2] bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[600px]">
                        <GoogleMap mapContainerStyle={mapContainerStyle} center={currentLocation} zoom={15} options={{ disableDefaultUI: true, styles: mapStyles }}>
                            <Marker position={currentLocation} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/1042/1042339.png', scaledSize: new google.maps.Size(40, 40) }} />
                            {requests.map((req, i) => (
                                <Marker key={i} position={{ lat: req.location.coordinates[1], lng: req.location.coordinates[0] }} />
                            ))}
                        </GoogleMap>
                        <div className="absolute bottom-8 left-8 right-8">
                             <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-2xl flex items-center justify-between">
                                 <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Hub Location</p><p className="font-black text-gray-900 uppercase truncate">Ahmedabad Grid Sector</p></div>
                                 <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg ml-4 shrink-0"><MapPin size={24} className="text-black" /></div>
                             </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {isEditNameModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-lg bg-white/90 backdrop-blur-3xl p-6 md:p-12 rounded-[3.5rem] md:rounded-[4rem] border border-white/50 shadow-2xl relative overflow-hidden">
                            {/* Tactical HUD Brackets */}
                            <div className="tactical-bracket bracket-tl" />
                            <div className="tactical-bracket bracket-br" />
                            
                            <h3 className="text-4xl font-black tracking-tighter uppercase mb-2 text-gray-900 leading-none">Sync Identity</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10">Updating Operator Credentials</p>
                            
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4 p-1.5 bg-gray-100/50 rounded-[2rem] border border-gray-200/50">
                                    {['male', 'female'].map(g => (
                                        <button key={g} onClick={() => setSelectedGender(g as 'male' | 'female')} className={`py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${selectedGender === g ? 'bg-white text-gray-900 shadow-premium' : 'text-gray-400 hover:text-gray-600'}`}>{g}</button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-[2rem] px-8 py-6 focus:bg-white focus:border-primary focus:outline-none transition-all duration-500 text-2xl font-black uppercase tracking-tighter text-gray-900" placeholder="Identity Handle" />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setIsEditNameModalOpen(false)} className="flex-1 h-20 bg-gray-50 rounded-[2rem] font-black text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-all">Cancel Sync</button>
                                    <button onClick={handleUpdateName} disabled={loading} className="flex-[2] cta-button h-20 text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Commit Updates</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isAddAddressModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-2xl bg-white/90 backdrop-blur-3xl p-6 md:p-12 rounded-[3.5rem] md:rounded-[4rem] border border-white/50 shadow-2xl relative overflow-hidden group">
                            {/* Tactical HUD Brackets */}
                            <div className="tactical-bracket bracket-tr" />
                            <div className="tactical-bracket bracket-bl" />

                            <h3 className="text-4xl font-black tracking-tighter uppercase mb-2 text-gray-900 leading-none">Map Hub Base</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10">Registering Operational Vector</p>
                            
                            <div className="space-y-8">
                                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100/50 rounded-[2rem] border border-gray-200/50">
                                    {['Base', 'Shop', 'Mobile Unit'].map(l => (
                                        <button key={l} onClick={() => setAddressLabel(l)} className={`py-4 rounded-[1.6rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${addressLabel === l ? 'bg-white text-gray-900 shadow-premium' : 'text-gray-400 hover:text-gray-600'}`}>{l}</button>
                                    ))}
                                </div>
                                <button onClick={fetchGPSLocation} disabled={isLocating} className="w-full h-14 md:h-16 bg-primary/10 text-primary border-2 border-primary/20 rounded-[2rem] font-black text-[10px] tracking-widest flex items-center justify-center gap-4 hover:bg-primary/20 transition-all group/gps">
                                    <Navigation size={18} className={isLocating ? "animate-spin" : "group-hover:rotate-12 transition-transform"} />
                                    {isLocating ? 'Acquiring Node Center...' : 'Acquire GPS Point'}
                                </button>
                                <div className="relative">
                                    <input value={addressText} onChange={(e) => { setAddressText(e.target.value); setShowSuggestions(true); }} className="w-full bg-gray-50 border-2 border-gray-100 rounded-[2rem] px-12 py-5 focus:bg-white focus:border-primary focus:outline-none transition-all duration-500 text-xs md:text-sm font-black uppercase tracking-widest text-gray-900" placeholder="Manual address entry..." />
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-6 bg-white/90 backdrop-blur-3xl border border-gray-100 rounded-[3rem] shadow-premium z-[110] overflow-hidden">
                                            {suggestions.map((s, i) => (
                                                <button key={i} onClick={() => { setAddressText(s.fullAddress); setSelectedCoords(s.coords); setShowSuggestions(false); }} className="w-full text-left p-8 hover:bg-gray-50 border-b border-gray-100 last:border-0 group/s">
                                                    <p className="text-gray-900 text-base font-black uppercase tracking-widest truncate group-hover/s:text-primary transition-colors">{s.name}</p>
                                                    <p className="text-gray-400 text-[10px] font-bold truncate mt-1">{s.fullAddress}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setIsAddAddressModalOpen(false)} className="h-14 md:h-16 bg-gray-50 rounded-[2rem] font-black text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-all uppercase">Cancel</button>
                                    <button onClick={() => handleAddAddress()} disabled={loading || !addressText} className="cta-button h-14 md:h-16 text-[10px] tracking-widest shadow-xl uppercase">Register Node</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                
                {showNewJobModal && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-2xl">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }} className="w-full max-w-xl bg-white p-6 md:p-12 rounded-[3.5rem] md:rounded-[5rem] border-[6px] border-primary text-center relative overflow-hidden shadow-premium">
                             <div className="absolute top-0 left-0 w-full h-3 bg-zinc-900 animate-pulse opacity-5" />
                             <div className="w-28 h-28 bg-zinc-900 rounded-[3rem] flex items-center justify-center text-primary mx-auto mb-10 shadow-2xl animate-bounce">
                                 <AlertCircle size={56} />
                             </div>
                             <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase text-gray-900 mb-4 leading-none">Emergency <span className="text-primary italic">Dispatch</span></h2>
                             <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.5em] mb-12">Incoming High-Priority Breakdown Signal</p>
                             
                             <div className="p-10 bg-gray-50/50 rounded-[3.5rem] border border-gray-100 text-left flex items-center gap-8 mb-12 relative overflow-hidden group">
                                 <div className="tactical-bracket bracket-tl scale-50 opacity-10 group-hover:opacity-100 transition-opacity" />
                                 <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center text-primary shadow-2xl relative z-10">
                                     {showNewJobModal.vehicleType === '2-wheel' ? <Bike size={44} /> : <Car size={44} />}
                                 </div>
                                 <div className="flex-1 overflow-hidden relative z-10">
                                     <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Reported Anomaly</p>
                                     <p className="text-3xl font-black text-gray-900 uppercase tracking-tight truncate leading-none mb-1">{showNewJobModal.issueType?.join(' + ')}</p>
                                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Sector: Ahmedabad Grid</p>
                                 </div>
                             </div>
                             
                             <div className="flex gap-4">
                                 <button onClick={() => setShowNewJobModal(null)} className="flex-1 py-8 rounded-[2.5rem] bg-gray-50 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-all">Decline Link</button>
                                 <button onClick={() => { handleAcceptRequest(showNewJobModal._id); setShowNewJobModal(null); }} className="flex-[2] cta-button py-8 text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all">Accept Dispatch Protocol</button>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
