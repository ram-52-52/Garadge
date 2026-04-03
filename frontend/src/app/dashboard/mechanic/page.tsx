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
    AlertTriangle
} from 'lucide-react';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const center = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad

const menuItems = [
    { id: "feed", icon: <Wrench size={20} />, label: "Job Feed" },
    { id: "active", icon: <Navigation size={20} />, label: "Live Map" },
    { id: "earnings", icon: <CreditCard size={20} />, label: "Wallet" },
    { id: "history", icon: <Briefcase size={20} />, label: "History" },
    { id: "profile", icon: <UserIcon size={20} />, label: "Identity" },
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

    // Stats State
    const [stats, setStats] = useState({
        balance: 0,
        jobs: 0,
        rating: 4.9
    });

    // Profile & Address States
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
            toast.success("Profile updated in the grid!");
            setIsEditNameModalOpen(false);
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (manualData?: any) => {
        setLoading(true);
        try {
            const newAddress = manualData || {
                label: addressLabel,
                address: addressText,
            };
            
            const updatedAddresses = [...(user?.addresses || []), newAddress];
            await updateProfile({ addresses: updatedAddresses });
            
            toast.success("Grid point saved successfully!");
            setIsAddAddressModalOpen(false);
            setAddressText("");
        } catch (error) {
            toast.error("Failed to save grid point");
        } finally {
            setLoading(false);
        }
    };

    const fetchGPSLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                let addressName = "Detecting Location...";
                
                try {
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}`);
                    const data = await response.json();
                    if (data.results && data.results.length > 0) {
                        const result = data.results[0];
                        const city = result.address_components.find((c: any) => c.types.includes("locality"))?.long_name;
                        const subLocality = result.address_components.find((c: any) => c.types.includes("sublocality"))?.long_name;
                        addressName = subLocality ? `${subLocality}, ${city || ''}` : result.formatted_address.split(',').slice(0, 2).join(',');
                    } else {
                        addressName = "Gujarat, India"; // Clean default fallback
                    }
                } catch (e) {
                    addressName = "GPS Point Captured";
                    console.error("Geocoding failed", e);
                }

                const gpsPoint = {
                    label: addressLabel || "Base",
                    address: addressName,
                    coordinates: { lat: latitude, lng: longitude }
                };
                
                setAddressText(addressName);
                setIsLocating(false);
                toast.success("Location locked to grid!");
            },
            (error) => {
                toast.error("GPS signal lost");
                setIsLocating(false);
            }
        );
    };

    const handleUpdateCapabilities = async () => {
        setLoading(true);
        try {
            await updateProfile({
                expertise,
                vehicleTypes
            });
            toast.success('Capabilities updated successfully!');
            setEditMode(false);
        } catch (error) {
            toast.error('Failed to update capabilities');
        } finally {
            setLoading(false);
        }
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    });

    const fetchRequests = useCallback(async () => {
        if (!isOnline) return;
        try {
            const { data } = await api.get('/requests');
            if (data.success) {
                setRequests(data.data.filter((r: any) => r.status === 'pending'));
            }
        } catch (error) {
            console.error('Failed to fetch requests');
        }
    }, [isOnline]);

    const fetchMechanicStats = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) {
                setStats({
                    balance: data.data.pricing || 0,
                    jobs: data.data.totalJobs || 0,
                    rating: data.data.rating || 4.9
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    }, []);

    useEffect(() => {
        fetchMechanicStats();
    }, [fetchMechanicStats]);

    useEffect(() => {
        if (isOnline) {
            const interval = setInterval(fetchRequests, 10000);
            fetchRequests();
            return () => clearInterval(interval);
        } else {
            setRequests([]);
        }
    }, [isOnline, fetchRequests]);

    useEffect(() => {
        if (!socket || !isOnline) return;
        socket.on('request-received', (data: any) => {
            const isTargeted = data.nearbyMechanics?.some((m: any) => m._id === user?._id);
            if (isTargeted) {
                setShowNewJobModal(data.request);
                setTimeout(() => setShowNewJobModal(null), 30000);
            }
        });
        return () => { socket.off('request-received'); };
    }, [socket, isOnline, user?._id]);

    useEffect(() => {
        if (!socket || !activeRequest || !isOnline) return;
        const locationInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCurrentLocation(newPos);
                socket.emit('mechanic-location', {
                    requestId: activeRequest._id,
                    location: newPos
                });
            });
        }, 5000);
        return () => clearInterval(locationInterval);
    }, [socket, activeRequest, isOnline]);

    const handleAcceptRequest = async (id: string) => {
        setLoading(true);
        try {
            const { data } = await api.put(`/requests/${id}`, {
                status: 'accepted',
                mechanicId: user?._id
            });
            if (data.success) {
                toast.success('Task Accepted!');
                setActiveRequest(data.data);
                joinRoom(id);
                if (socket) {
                    socket.emit('accept-request', {
                        requestId: id,
                        mechanicId: user?._id,
                        mechanicName: user?.name
                    });
                }
                setActiveTab("active");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to accept');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCompleteRequest = async () => {
        if (!activeRequest) return;
        setLoading(true);
        try {
            const { data } = await api.put(`/requests/${activeRequest._id}`, { status: 'completed' });
            if (data.success) {
                toast.success('Job marked as completed! Payment processed.', { icon: '💰' });
                setActiveRequest(null);
                setActiveTab("feed");
                fetchMechanicStats(); // Refresh balance
            }
        } catch (error) {
            toast.error('Failed to complete request');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="h-screen bg-[#0B0E14] flex items-center justify-center text-slate-400">Initializing Mechanic HUB...</div>;

    return (
        <div className="flex h-screen bg-[#0B0E14] text-slate-200 font-sans selection:bg-primary/30 antialiased overflow-hidden">
            
            {/* Sidebar */}
            <aside className="hidden md:flex w-80 flex-col py-10 px-8 border-r border-white/5 bg-[#0D1117] h-screen fixed left-0 z-20">
                <div className="flex items-center gap-3 mb-16">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <Wrench size={22} className="text-white" />
                    </div>
                        <span className="text-2xl font-black tracking-tighter block leading-none text-white">GarageNow</span>
                </div>

                <div className="mb-12 p-5 glass-card rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/30 p-0.5 bg-slate-900">
                           <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[14px]" alt="avatar" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                {user?.isVerified ? "Authenticated" : "Pending Verify"}
                            </p>
                            <p className="text-lg font-black tracking-tight leading-none text-white">{user?.name}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={async () => {
                           if (!user?.isVerified) {
                               toast.error("Verification pending.");
                               return;
                           }
                           try {
                               const newStatus = !isOnline;
                               const { data } = await api.put('/auth/profile', { isOnline: newStatus });
                               if (data.success) {
                                  setIsOnline(newStatus);
                                  toast.success(newStatus ? "Grid Active!" : "Grid Inactive.");
                               }
                           } catch (error) {
                               toast.error("Failed to update status");
                           }
                        }}
                        className={`w-full py-3 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all ${
                            isOnline ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                        <Power size={18} />
                        {isOnline ? 'Active' : 'Standby'}
                    </button>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group ${
                                activeTab === item.id ? "bg-primary/10 text-primary shadow-indigo-glow" : "text-slate-500 hover:text-slate-200"
                            }`}
                        >
                            <div className={activeTab === item.id ? "text-primary" : "text-slate-500 group-hover:text-slate-200"}>
                                {item.icon}
                            </div>
                            <span className="text-sm uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button onClick={logout} className="flex items-center gap-4 px-4 py-4 mt-auto text-rose-500 font-bold hover:bg-rose-500/10 rounded-2xl transition-all">
                    <LogOut size={20} />
                    <span className="text-sm">Logout</span>
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-80 overflow-hidden h-screen flex flex-col">
                <header className="p-6 md:p-10 flex items-center justify-between pt-24 md:pt-10 z-10">
                    <div className="flex flex-col">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-2 text-white">Dashboard</h1>
                        <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">
                            {isOnline ? 'Scanning for Signals' : 'Operations Suspended'}
                        </p>
                    </div>
                    <div className="glass-card p-4 px-6 rounded-2xl flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Jobs</span>
                        <span className="text-2xl font-black text-emerald-500">{stats.jobs}</span>
                    </div>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row px-6 md:px-10 pb-10 gap-10 overflow-hidden">
                    <div className="flex-[4] flex flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === "active" && activeRequest ? (
                                <motion.div 
                                    key="active-tab" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                    className="flex flex-col h-full gap-6"
                                >
                                    <div className="glass-card p-8 rounded-4xl border-2 border-emerald-500/20 bg-emerald-500/5">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-emerald-500/20">
                                                    <Navigation size={28} className="animate-pulse" />
                                                </div>
                                                <div>
                                                    <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-widest">Active Navigation</span>
                                                    <h3 className="text-2xl font-black tracking-tight text-white mt-1 uppercase">{activeRequest.issueType.join(', ')} Dispatch</h3>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => toast(`Calling ${activeRequest.user?.name || 'Customer'}...`, { icon: '📞' })}
                                                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white"
                                            >
                                                <Phone size={24} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 bg-white/5 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Customer</p>
                                                <p className="font-bold text-white">{activeRequest.user?.name || 'Loading...'}</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Distance</p>
                                                <p className="font-bold text-emerald-500">2.4 KM</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleCompleteRequest}
                                            disabled={loading}
                                            className="cta-button !bg-emerald-500 hover:!bg-emerald-600 w-full h-16 font-black !rounded-3xl uppercase tracking-widest active:scale-95 transition-transform"
                                        >
                                            {loading ? 'Processing...' : 'Mark as Completed'}
                                        </button>
                                    </div>
                                    <div className="flex-1 rounded-4xl overflow-hidden glass-card relative border border-white/5">
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={currentLocation} zoom={15}
                                            options={{ disableDefaultUI: true, styles: mapStyles }}
                                        >
                                            <Marker position={currentLocation} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', scaledSize: new google.maps.Size(35, 35) }} />
                                            <Marker position={{ lat: activeRequest.location.coordinates[1], lng: activeRequest.location.coordinates[0] }} />
                                        </GoogleMap>
                                    </div>
                                </motion.div>
                            ) : activeTab === "feed" ? (
                                <motion.div 
                                    key="feed-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col h-full gap-6 overflow-hidden"
                                >
                                    <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide flex flex-col gap-4">
                                        {isOnline ? (
                                            requests.length > 0 ? requests.map((req, i) => (
                                                <motion.div 
                                                    key={req._id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                                    className="p-8 glass-card rounded-4xl border border-white/5 group hover:border-primary/30 hover:bg-white/[0.02] flex flex-col md:flex-row items-center gap-8"
                                                >
                                                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-primary border border-white/5 group-hover:scale-110 transition-all">
                                                        {req.vehicleType === '2-wheel' ? <Bike size={32} /> : <Car size={32} />}
                                                    </div>
                                                    <div className="flex-1 text-center md:text-left">
                                                        <div className="flex gap-2 mb-2 justify-center md:justify-start">
                                                            <span className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-widest">Breakdown Signal</span>
                                                        </div>
                                                        <h3 className="text-xl font-black text-white uppercase mb-1">{req.issueType.join(', ')} Support</h3>
                                                        <p className="text-slate-500 text-xs font-bold flex items-center justify-center md:justify-start gap-2 uppercase">
                                                            <MapPin size={14} className="text-primary" /> {req.address || "Fetching address..."}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                                                        <span className="text-2xl font-black text-emerald-500">₹850.00</span>
                                                        <button 
                                                            disabled={loading} onClick={() => handleAcceptRequest(req._id)}
                                                            className="cta-button h-12 !rounded-xl !px-6 w-full text-[10px] uppercase font-black"
                                                        >
                                                            Accept <ArrowRight size={16} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4 opacity-50">
                                                    <div className="w-16 h-16 border-4 border-dashed border-slate-700 rounded-full animate-spin-slow" />
                                                    <p className="font-black tracking-widest uppercase text-[10px]">Scanning Grid for Signals...</p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-card rounded-4xl border-dashed border-white/5 opacity-50">
                                                <AlertCircle size={48} className="text-slate-800 mb-6" />
                                                <h3 className="text-lg font-black text-slate-500 uppercase tracking-tight mb-2">Network Offline</h3>
                                                <p className="text-xs font-bold text-slate-600 max-w-xs">You are currently invisible to breakdown signals. Go online to start receiving tasks.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : activeTab === "earnings" ? (
                                <motion.div 
                                    key="earnings-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col h-full gap-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="glass-card p-10 rounded-4xl flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center text-primary mb-6"><CreditCard size={32} /></div>
                                            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-2">Wallet Balance</h3>
                                            <p className="text-5xl font-black text-white tracking-tighter mb-6">₹{stats.balance.toLocaleString()}</p>
                                            <button 
                                                onClick={() => toast("Withdrawal request sent to admin.", { icon: "🏛️" })}
                                                className="cta-button w-full h-16 text-[10px] uppercase font-black"
                                            >
                                                Request Payout
                                            </button>
                                        </div>
                                        <div className="glass-card p-10 rounded-4xl flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-500 mb-6"><CheckCircle2 size={32} /></div>
                                            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-2">Total Services</h3>
                                            <p className="text-5xl font-black text-white tracking-tighter mb-6">{stats.jobs}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operations: Ahmedabad Region</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === "history" ? (
                                <motion.div 
                                    key="history-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col h-full gap-4 overflow-y-auto pr-2 scrollbar-hide"
                                >
                                    {[
                                        { id: 1, date: "24 Mar, 2024", user: "Rahul Sharma", issue: "Flat Tyre", revenue: 850 },
                                        { id: 2, date: "22 Mar, 2024", user: "Priya Singh", issue: "Jumpstart", revenue: 600 },
                                    ].map((job) => (
                                        <div key={job.id} className="p-6 glass-card rounded-4xl border border-white/5 flex items-center gap-6 group hover:bg-white/[0.02]">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><CheckCircle2 size={24} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{job.date}</p>
                                                <h3 className="text-lg font-black text-white uppercase">{job.issue} Support</h3>
                                                <p className="text-slate-400 text-xs font-bold">Client: {job.user}</p>
                                            </div>
                                            <p className="text-xl font-black text-emerald-500">₹{job.revenue}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : activeTab === "profile" ? (
                                <motion.div 
                                    key="profile-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto pr-2 scrollbar-hide h-full"
                                >
                                    <div className="flex flex-col gap-6">
                                        <div className="glass-card p-10 rounded-4xl border border-white/5 flex flex-col items-center text-center relative overflow-hidden group">
                                             <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30" />
                                             <div className="w-28 h-28 rounded-3xl border-2 border-emerald-500/30 p-1.5 mb-8 bg-slate-900">
                                                <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[20px]" alt="mechanic" />
                                             </div>
                                             <div className="mb-8">
                                                <h2 className="text-2xl font-black tracking-tighter uppercase text-white leading-none mb-2">{user?.name}</h2>
                                                <p className="text-emerald-500 font-black uppercase text-[10px] tracking-[0.4em] mb-4">Certified Specialist</p>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {user?.expertise?.map((tag: string) => (
                                                        <span key={tag} className="text-[9px] font-black bg-emerald-500/10 px-2 py-1 rounded-lg uppercase text-emerald-400">{tag}</span>
                                                    ))}
                                                </div>
                                             </div>
                                             <button 
                                                onClick={() => { setIsEditNameModalOpen(true); }}
                                                className="cta-button !bg-emerald-500 w-full h-12 !rounded-xl text-[10px] uppercase font-black tracking-widest shadow-emerald-500/20"
                                             >
                                                Update Credentials
                                             </button>
                                        </div>

                                        <div className="glass-card p-8 rounded-4xl border border-white/5 flex flex-col">
                                            <div className="flex justify-between items-center mb-8">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Operations Grid</h3>
                                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{user?.addresses?.length || 0} Registered</span>
                                            </div>
                                            <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                                                {user?.addresses?.map((addr: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><MapPin size={18} /></div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">{addr.label}</p>
                                                            <p className="text-slate-500 text-xs font-bold truncate">{addr.address}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => setIsAddAddressModalOpen(true)}
                                                className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-2 border-dashed border-white/10 p-4 rounded-xl hover:border-emerald-500/30 hover:text-emerald-500 transition-all"
                                            >
                                                <Zap size={14} /> Add Base Point
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                         <div className="glass-card p-10 rounded-4xl border border-white/5">
                                             <div className="flex justify-between items-center mb-8">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Capabilities</h3>
                                                <button onClick={() => setEditMode(!editMode)} className="text-[10px] font-black text-emerald-500 uppercase underline">
                                                    {editMode ? 'Cancel' : 'Modify'}
                                                </button>
                                             </div>
                                             <AnimatePresence mode="wait">
                                                {editMode ? (
                                                    <motion.div key="edit-cap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-8">
                                                        <div className="space-y-4">
                                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Vehicle Range</p>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {vehicleOptions.map(option => (
                                                                    <button
                                                                        key={option}
                                                                        onClick={() => {
                                                                            if (vehicleTypes.includes(option)) setVehicleTypes(vehicleTypes.filter(v => v !== option));
                                                                            else setVehicleTypes([...vehicleTypes, option]);
                                                                        }}
                                                                        className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl font-black text-[10px] uppercase border transition-all ${vehicleTypes.includes(option) ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald" : "bg-white/5 border-white/10 text-slate-500"}`}
                                                                    >
                                                                        {option === '2-WHEELER' ? <Bike size={18} /> : <Car size={18} />}
                                                                        {option.split('-')[0]} WHEEL
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Service Expertise</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {expertiseOptions.map(option => (
                                                                    <button
                                                                        key={option}
                                                                        onClick={() => {
                                                                            if (expertise.includes(option)) setExpertise(expertise.filter(e => e !== option));
                                                                            else setExpertise([...expertise, option]);
                                                                        }}
                                                                        className={`px-4 py-3 rounded-xl font-black text-[9px] uppercase border transition-all ${expertise.includes(option) ? "bg-emerald-500 border-emerald-400 text-white" : "bg-white/5 border-white/10 text-slate-500"}`}
                                                                    >
                                                                        {option}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        <button onClick={handleUpdateCapabilities} disabled={loading} className="cta-button !bg-primary w-full h-14 !rounded-2xl text-[10px] font-black uppercase shadow-indigo-glow">
                                                            {loading ? 'Processing...' : 'Sync Capabilities'}
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div key="view-cap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                                            <p className="text-[9px] font-black text-slate-600 uppercase mb-3 tracking-widest">Authorized Vehicles</p>
                                                            <div className="flex gap-4">
                                                                {user?.vehicleTypes?.map((v: string) => (
                                                                    <div key={v} className="flex items-center gap-2 text-white">
                                                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                                                            {v === '2-WHEELER' ? <Bike size={16} /> : <Car size={16} />}
                                                                        </div>
                                                                        <span className="text-[10px] font-black uppercase tracking-tighter">{v}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                                            <p className="text-[9px] font-black text-slate-600 uppercase mb-3 tracking-widest">Service Expertise</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {user?.expertise?.map((ex: string) => (
                                                                    <span key={ex} className="px-3 py-1 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest">{ex}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                             </AnimatePresence>
                                         </div>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <div className="hidden xl:flex flex-[2] flex-col gap-8">
                        <div className="flex-1 rounded-4xl overflow-hidden glass-card relative border border-white/5">
                            <GoogleMap mapContainerStyle={mapContainerStyle} center={currentLocation} zoom={13} options={{ disableDefaultUI: true, styles: mapStyles }}>
                                <Marker position={currentLocation} icon={{ url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', scaledSize: new google.maps.Size(35, 35) }} />
                                {requests.map(req => (
                                    <Marker key={req._id} position={{ lat: req.location.coordinates[1], lng: req.location.coordinates[0] }} />
                                ))}
                            </GoogleMap>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals Section */}
            <AnimatePresence>
                {isEditNameModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md glass-card p-10 rounded-[3rem] border border-emerald-500/20">
                            <h3 className="text-2xl font-black tracking-tighter uppercase text-white mb-6">Update HUB Identity</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 p-1 bg-slate-900 rounded-2xl border border-white/5">
                                    <button onClick={() => setSelectedGender('male')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedGender === 'male' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>Male</button>
                                    <button onClick={() => setSelectedGender('female')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedGender === 'female' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>Female</button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Profile Name</label>
                                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className="premium-input w-full" placeholder="Full Name" />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setIsEditNameModalOpen(false)} className="flex-1 h-12 bg-white/5 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                                    <button onClick={handleUpdateName} disabled={loading} className="flex-[2] primary-button !bg-emerald-500 h-12 !rounded-xl text-[10px] uppercase font-black">{loading ? 'Saving...' : 'Safe Credentials'}</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAddAddressModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md glass-card p-10 rounded-[3rem] border border-emerald-500/20">
                            <h3 className="text-2xl font-black tracking-tighter uppercase text-white mb-6">Register Grid Base</h3>
                            <div className="space-y-6">
                                <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-white/5 mb-6">
                                    {['Base', 'Shop', 'Mobile'].map(l => (
                                        <button key={l} onClick={() => setAddressLabel(l)} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${addressLabel === l ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>{l}</button>
                                    ))}
                                </div>
                                <button onClick={fetchGPSLocation} disabled={isLocating} className="w-full h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 font-black uppercase text-[10px] flex items-center justify-center gap-3">
                                    {isLocating ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} />} Scan GPS Grid
                                </button>
                                <input value={addressText} onChange={(e) => setAddressText(e.target.value)} className="premium-input w-full" placeholder="Base Address Location" />
                                <div className="flex gap-4">
                                    <button onClick={() => setIsAddAddressModalOpen(false)} className="flex-1 h-12 bg-white/5 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                                    <button onClick={() => handleAddAddress()} disabled={loading || !addressText} className="flex-[2] primary-button !bg-emerald-500 h-12 !rounded-xl text-[10px] uppercase font-black">Register Point</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showNewJobModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-lg glass-card p-10 rounded-[48px] border-2 border-primary/30 text-center relative overflow-hidden">
                             <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 animate-pulse shadow-indigo-glow"><AlertTriangle size={48} /></div>
                             <h2 className="text-4xl font-black tracking-tighter uppercase text-white mb-4">Emergency <span className="text-primary">Incoming!</span></h2>
                             <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] mb-10">Breakdown signal detected in the grid</p>
                             <div className="flex flex-col gap-4 mb-10">
                                 <div className="p-6 bg-white/5 rounded-3xl text-left flex items-center gap-6">
                                     <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-primary">{showNewJobModal.vehicleType === '2-wheel' ? <Bike size={28} /> : <Car size={28} />}</div>
                                     <div><p className="text-[10px] font-black text-slate-500 uppercase mb-1">Issue</p><p className="text-xl font-bold text-white uppercase">{showNewJobModal.issueType?.join(' + ')}</p></div>
                                 </div>
                             </div>
                             <div className="flex gap-4">
                                 <button onClick={() => setShowNewJobModal(null)} className="flex-1 py-5 rounded-3xl bg-white/5 font-black uppercase text-xs">Decline</button>
                                 <button onClick={() => { handleAcceptRequest(showNewJobModal._id); setShowNewJobModal(null); }} className="flex-[2] py-5 rounded-3xl bg-primary text-white font-black uppercase text-xs shadow-indigo-glow">Accept Dispatch</button>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const mapStyles = [
    { "elementType": "geometry", "stylers": [{ "color": "#0B0E14" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1C212A" }] }
];
