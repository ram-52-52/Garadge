"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import {
  Car, Briefcase, CreditCard, MapPin,
  Users, LogOut, ChevronRight, Zap,
  Calendar, Clock, Shield, Info,
  Fuel, Settings, User as UserIcon,
  ChevronDown, Search, ArrowRight, Bike,
  Wrench, Battery, Gauge, AlertTriangle,
  CheckCircle2, Navigation, Menu, X, MoreVertical, Settings2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useMagnetic } from "@/hooks/useMagnetic";
import { Activity, Globe, TrendingUp } from "lucide-react";

const menuItems = [
  { id: "request", icon: <Wrench size={18} />, label: "Get Help", badge: "Live" },
  { id: "profile", icon: <UserIcon size={18} />, label: "Identity Hub" },
];

const vehicleTypes = [
  {
    id: '2-WHEELER',
    name: 'Two-Wheeler',
    icon: <Bike size={40} />,
    desc: 'Motorcycles & Scooters',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4-WHEELER',
    name: 'Four-Wheeler',
    icon: <Car size={40} />,
    desc: 'Standard Cars & SUVs',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400'
  },
];

const commonIssues = [
  { id: 'PUNCTURE', name: 'Flat Tyre / Puncture', icon: <AlertTriangle size={24} /> },
  { id: 'BATTERY', name: 'Battery Dead / Jumpstart', icon: <Battery size={24} /> },
  { id: 'ENGINE', name: 'Engine Smoke / Failure', icon: <Gauge size={24} /> },
  { id: 'GENERAL', name: 'Oil & General Check', icon: <Wrench size={24} /> },
  { id: 'FUEL', name: 'Empty Fuel Tank', icon: <Fuel size={24} /> },
];

const mapContainerStyle = {
  width: '100%',
  height: '250px',
};

const mapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
];

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("request");
  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [nearbyMechanics, setNearbyMechanics] = useState<any[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<'searching' | 'no-specialists' | null>(null);

  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressText, setAddressText] = useState("");
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(user?.gender || 'male');
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { updateProfile } = useAuth();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
  });

  // Tactical Vanguard Hooks
  const magneticLogout = useMagnetic(0.2);
  const magneticProfile = useMagnetic(0.3);

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

  const currentAddress = user?.addresses?.length ? user.addresses[0].address : "Satellite, Ahmedabad, Gujarat";
  const [mapCenter, setMapCenter] = useState({ lat: 23.0225, lng: 72.5714 });
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (user) {
      setNewName(user.name || "");
      setSelectedGender(user.gender || 'male');
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !currentRequestId) return;
    socket.emit('join-room', currentRequestId);
    
    socket.on('request-accepted', (data: any) => {
      toast.success("Mechanic accepted your request!");
      router.push(`/tracking?id=${currentRequestId}`);
    });

    socket.on('dispatch-status', (data: any) => {
      if (data.status === 'no-specialists') {
        setDispatchStatus('no-specialists');
        toast.error("No specialists available at the moment.", { icon: '🚫' });
      } else {
        setDispatchStatus('searching');
      }
    });

    return () => {
      socket.off('request-accepted');
      socket.off('dispatch-status');
    };
  }, [socket, currentRequestId, router]);
  
  // Tactical Fail-Safe Protocol: 15s Timeout 
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3 && nearbyMechanics.length > 0 && !dispatchStatus) {
      // Start searching state if not already set
      setDispatchStatus('searching');
      
      timer = setTimeout(() => {
        setDispatchStatus('no-specialists');
        toast.error("No responders accepted the broadcast.", { icon: '⏳' });
      }, 15000);
    }
    return () => clearTimeout(timer);
  }, [step, nearbyMechanics.length, dispatchStatus]);

  const handleRequest = async () => {
    if (!vehicleType || selectedIssues.length === 0) return;
    setLoading(true);
    setStep(3);
    try {
      const { data } = await api.post('/requests', {
        vehicleType,
        issueType: selectedIssues,
        address: currentAddress,
        location: user?.addresses?.[0]?.coordinates || { lat: 23.0225, lng: 72.5714 }
      });
      if (data.success) {
        const mechanics = data.nearbyMechanics || [];
        setNearbyMechanics(mechanics);
        setCurrentRequestId(data.data._id);
        
        if (mechanics.length === 0) {
          setDispatchStatus('no-specialists');
          toast.error("No specialists found in range.", { icon: '🚫' });
        } else {
          if (socket) socket.emit('join-room', data.data._id);
          toast.success("Nearby mechanics notified!");
        }
      }
    } catch (error) {
      toast.error("Failed to post request");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ name: newName, gender: selectedGender });
      toast.success("Profile updated!");
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
        coordinates: selectedCoords || undefined
      };
      const updatedAddresses = [...(user?.addresses || []), newAddress];
      await updateProfile({ addresses: updatedAddresses });
      toast.success("Address saved!");
      setIsAddAddressModalOpen(false);
      setAddressText("");
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedCoords(null);
    } catch (error) {
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (addressText.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
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
          setSuggestions(results);
          setShowSuggestions(true);
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
        const gpsAddress = { label: "Current GPS", address: "Detected Location", coordinates: { lat: latitude, lng: longitude } };
        await handleAddAddress(gpsAddress);
        setIsLocating(false);
      },
      () => { toast.error("Unable to retrieve location"); setIsLocating(false); }
    );
  };


  if (!user) {
    return (
      <div className="min-h-screen w-full bg-white/70 backdrop-blur-3xl flex flex-col items-center justify-center relative overflow-hidden noise-bg">
        <div className="fixed inset-0 pointer-events-none z-0">
          <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="neo-orb w-[min(400px,90vw)] h-[min(400px,90vw)] bg-primary/10 top-0 left-0" />
        </div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-dashed border-primary/40 rounded-2xl sm:rounded-[2rem] mb-8" />
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-gray-500 text-center px-4">Establishing Grid Vector...</p>
      </div>
    );
  }

  return (
    <div onMouseMove={handleMouseMove} className="min-h-screen bg-background text-gray-900 font-sans selection:bg-primary/30 antialiased relative noise-bg vanguard-grid">
      {/* Tactical Atmosphere Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="neo-orb w-[600px] h-[600px] bg-primary/20 -top-40 -left-40" />
        <motion.div animate={{ x: [0, -80, 0], y: [0, 120, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="neo-orb w-[500px] h-[500px] bg-gray-300/30 bottom-0 -right-20" />
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="neo-orb w-[400px] h-[400px] bg-yellow-200/10 top-1/2 left-1/3" />
        
        {/* Parallax Brand Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
          <h1 className="text-[30vw] font-black tracking-tighter leading-none transform -rotate-12">GNOW</h1>
        </div>
      </div>

      {/* Premium Top Header - Khatarnak Pivot */}
      <header className="fixed top-0 left-0 right-0 h-20 sm:h-24 bg-white/70 backdrop-blur-3xl border-b border-gray-100 z-50 transition-all duration-500 data-stream signal-scan">
        <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 group cursor-pointer min-w-0" onClick={() => { setStep(1); setVehicleType(null); setSelectedIssues([]); setActiveTab("request"); setDispatchStatus(null); }}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shrink-0">
              <Zap size={18} className="text-primary fill-primary sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-lg md:text-2xl font-black tracking-tighter block leading-none text-gray-900 uppercase truncate">GarageNow</span>
              <span className="text-[7px] md:text-[9px] font-black tracking-[0.4em] text-primary uppercase leading-none mt-1 truncate">Satellite Hub</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2 p-1.5 bg-gray-100/50 rounded-[2rem] border border-gray-200/50">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-8 py-3 rounded-[1.6rem] font-black transition-all duration-500 relative group overflow-hidden ${activeTab === item.id 
                  ? "bg-white text-gray-900 shadow-premium" 
                  : "text-gray-400 hover:text-gray-700 hover:bg-white/50"}`}
              >
                <div className={`relative z-10 transition-colors ${activeTab === item.id ? "text-primary scale-110" : ""}`}>
                  {item.icon}
                </div>
                <span className="relative z-10 text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                {item.badge && (
                  <span className="relative z-10 bg-primary text-black text-[8px] px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Satellite Sync</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter leading-none vanguard-glitch">Matrix Stable</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            </div>

            <motion.div ref={magneticLogout.ref} animate={{ x: magneticLogout.x, y: magneticLogout.y }} onMouseLeave={magneticLogout.handleMouseLeave}>
              <button 
                onClick={logout}
                className="hidden md:flex items-center gap-3 px-6 py-3 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 group"
              >
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
              </button>
            </motion.div>

            <motion.div ref={magneticProfile.ref} animate={{ x: magneticProfile.x, y: magneticProfile.y }} onMouseLeave={magneticProfile.handleMouseLeave} className="shrink-0">
              <button onClick={() => setIsEditNameModalOpen(true)} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl border-2 border-primary/20 p-0.5 overflow-hidden shadow-premium group hover:border-primary transition-all duration-500">
                <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[10px] sm:rounded-[12px] w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </button>
            </motion.div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl transition-transform active:scale-95 shrink-0"><Menu size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" /></button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
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
                <span className="text-lg font-black tracking-tighter text-gray-900 truncate">GNow</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-900 shrink-0"><X size={18} /></button>
            </div>
            <nav className="flex flex-col gap-3 flex-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all text-left w-full ${activeTab === item.id ? "bg-primary text-black shadow-lg" : "bg-gray-50 text-gray-500 border border-gray-100"}`}
                >
                  <div className={`shrink-0 ${activeTab === item.id ? "text-black" : "text-gray-400"}`}>{item.icon}</div>
                  <span className="text-[11px] uppercase tracking-[0.2em] truncate">{item.label}</span>
                  {item.badge && <span className="ml-auto bg-primary/20 text-primary text-[8px] px-2 py-0.5 rounded-full font-black uppercase shrink-0">{item.badge}</span>}
                </button>
              ))}
            </nav>
            <button onClick={logout} className="mt-6 flex items-center justify-center gap-3 px-5 py-4 bg-red-50 text-red-500 font-black uppercase tracking-[0.2em] rounded-2xl border border-red-100 w-full">
              <LogOut size={18} className="shrink-0" />
              <span className="text-[11px] truncate">Log Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-28 sm:pt-32 pb-16 px-4 sm:px-6 md:px-8 lg:px-10 w-full max-w-full min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10 relative z-10">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-[2px] w-8 md:w-12 bg-primary" />
                <span className="text-primary font-black text-[9px] md:text-[11px] uppercase tracking-[0.4em] md:tracking-[0.6em]">System Protocol</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-tight md:leading-[0.85] text-gray-900 break-words max-w-4xl">
                {activeTab === "request" ? (step === 1 ? "Select Category" : step === 2 ? "Identify Issue" : "Broadcasting") : "Identity Hub"}
              </h1>
            </div>
            {activeTab === "request" && step > 1 && step < 3 && (
              <button 
                onClick={() => setStep(step - 1)} 
                className="group h-16 px-8 rounded-2xl bg-white border border-gray-200 flex items-center gap-4 text-gray-500 hover:text-gray-900 font-black uppercase text-[10px] tracking-widest transition-all shadow-sm hover:shadow-premium"
              >
                <ArrowRight size={20} className="rotate-180 group-hover:-translate-x-2 transition-transform" /> 
                Go Back
              </button>
            )}
          </header>

          <AnimatePresence mode="wait">
            {activeTab === "request" ? (
              <motion.div key="request-view" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "circOut" }} className="relative z-10">
                {step === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                    {vehicleTypes.map((v) => (
                      <motion.button
                        key={v.id}
                        onClick={() => { setVehicleType(v.id); setStep(2); }}
                        style={{ rotateX: mousePos.y, rotateY: -mousePos.x }}
                        className="group relative flex flex-col p-6 sm:p-8 md:p-12 bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] items-start text-left transition-all duration-700 shadow-premium hover:shadow-yellow-400/30 hover:bg-zinc-900 overflow-hidden min-w-0"
                      >
                        {/* Tactical HUD Brackets */}
                        <div className="tactical-bracket bracket-tl" />
                        <div className="tactical-bracket bracket-tr" />
                        <div className="tactical-bracket bracket-bl" />
                        <div className="tactical-bracket bracket-br" />

                        <div className="absolute top-12 right-12 w-16 h-16 bg-gray-50/50 group-hover:bg-primary rounded-full flex items-center justify-center transition-all duration-500 shadow-inner group-hover:rotate-45">
                          <ArrowRight size={28} className="text-gray-400 group-hover:text-black transition-colors" />
                        </div>
                        <div className="mb-16 w-24 h-24 bg-gray-50 group-hover:bg-yellow-400/20 rounded-[2.5rem] flex items-center justify-center text-gray-300 group-hover:text-primary transition-all duration-500 group-hover:scale-110">
                          {v.icon}
                        </div>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-2 md:mb-4 group-hover:text-white transition-colors leading-tight break-words">{v.name}</h3>
                        <p className="text-gray-400 font-bold uppercase text-[10px] md:text-[11px] tracking-[0.25em] md:tracking-[0.3em] group-hover:text-gray-500 transition-all">{v.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {commonIssues.map((issue) => {
                        const isSelected = selectedIssues.includes(issue.id);
                        return (
                          <button
                            key={issue.id}
                            onClick={() => isSelected ? setSelectedIssues(selectedIssues.filter(i => i !== issue.id)) : setSelectedIssues([...selectedIssues, issue.id])}
                            className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-4 sm:gap-6 text-left group min-w-0 ${isSelected ? "bg-zinc-900 border-zinc-900 text-white ring-2 ring-yellow-400 shadow-yellow-400/20 shadow-2xl" : "bg-white border-gray-100 text-gray-900 shadow-sm hover:border-gray-200"}`}
                          >
                            <div className={`p-4 w-fit rounded-2xl transition-colors ${isSelected ? "bg-yellow-400/10 text-primary" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                              {issue.icon}
                            </div>
                            <span className="font-black text-sm uppercase tracking-widest">{issue.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-6 md:gap-8">
                      <div className="p-6 sm:p-8 md:p-10 bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] shadow-sm flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                        <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-gray-50 rounded-[1.2rem] md:rounded-2xl flex items-center justify-center text-primary mt-1 sm:mt-0"><MapPin size={20} className="md:w-6 md:h-6" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-widest mb-1 md:mb-2 text-xs">Pick up configuration</p>
                          <p className="font-black text-base md:text-xl text-gray-900 break-words leading-snug max-w-full">{currentAddress}</p>
                        </div>
                      </div>
                      <button onClick={handleRequest} disabled={selectedIssues.length === 0 || loading} className="cta-button w-full py-4 md:py-8 text-sm md:text-xl group disabled:opacity-50 flex items-center justify-center gap-3">
                        {loading ? "Activating Grid..." : `Dispatch Protocol (${selectedIssues.length})`} 
                        <ArrowRight size={20} className="md:w-6 md:h-6 group-hover:translate-x-2 transition-transform shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center w-full px-4 sm:px-6">
                      {dispatchStatus === 'no-specialists' ? (
                          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000 max-w-2xl px-6 w-full">
                           <div className="relative mb-8 sm:mb-12">
                              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400/10 rounded-[3rem] flex items-center justify-center text-primary shadow-2xl relative z-10">
                                 <AlertTriangle size={48} className="sm:w-16 sm:h-16" strokeWidth={1.5} />
                              </motion.div>
                              <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 opacity-30 animate-pulse" />
                           </div>
                           
                           <div className="space-y-4 sm:space-y-6 mb-10 sm:mb-12">
                              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter uppercase text-gray-900 leading-none">Signal <span className="text-primary italic">Lost</span></h2>
                              <p className="text-gray-400 font-bold uppercase text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.4em] max-w-md leading-relaxed mx-auto">
                                 No responders available. Adjust your protocols or try again.
                              </p>
                           </div>
  
                           <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-xs sm:max-w-none">
                              <button onClick={() => { setStep(1); setVehicleType(null); setSelectedIssues([]); setDispatchStatus(null); }} className="w-full sm:w-auto px-12 py-5 sm:py-6 rounded-[2rem] bg-yellow-400 text-black font-black uppercase text-[10px] tracking-[0.3em] hover:bg-yellow-500 transition-all shadow-xl flex items-center justify-center gap-4">
                                 <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-2 transition-transform" />
                                 Go Back
                              </button>
                           </div>
                        </div>
                    ) : nearbyMechanics.length === 0 ? (
                      <>
                        <div className="relative w-56 h-56 mb-12 flex items-center justify-center">
                          <div className="absolute inset-0 border-2 border-gray-100 rounded-full" />
                          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
                          <div className="w-40 h-40 bg-white shadow-xl rounded-full flex items-center justify-center text-primary relative">
                            <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
                            <Zap size={64} fill="currentColor" />
                          </div>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-gray-900 mb-2 md:mb-4">Activating Grid</h2>
                        <p className="text-gray-500 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] max-w-sm leading-loose">Establishing connection to active responders.</p>
                      </>
                    ) : (
                      <div className="w-full flex flex-col gap-10">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-yellow-400/10 rounded-[2rem] flex items-center justify-center text-primary mb-6 shadow-sm"><CheckCircle2 size={32} /></div>
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-gray-900">Responders Located</h2>
                          <p className="text-gray-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.25em] mt-2">Redirecting to live tracker...</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                          {nearbyMechanics.map((mech, idx) => (
                            <div 
                              key={idx} 
                              className={`bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left transition-all duration-500 relative overflow-hidden group hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] min-w-0 ${mech.isFullMatch ? "border-emerald-500 bg-emerald-50/5 ring-1 ring-emerald-500/20" : "border-gray-100"}`}
                            >
                               {/* Match Quality Banner */}
                               {mech.isFullMatch && (
                                  <div className="absolute top-0 right-10 bg-emerald-500 text-white px-6 py-2 rounded-b-2xl shadow-lg flex items-center gap-2">
                                     <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                     <span className="text-[9px] font-black uppercase tracking-widest">Full Protocol Match</span>
                                  </div>
                               )}

                               <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.2rem] sm:rounded-[2rem] bg-gray-50 p-1 border border-gray-100 shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden mx-auto sm:mx-0">
                                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mech.name}`} className="rounded-xl sm:rounded-[1.8rem] w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                               </div>
                               
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h4 className="font-black text-gray-900 uppercase tracking-tight text-xl sm:text-3xl leading-none truncate">{mech.name}</h4>
                                    {!mech.isFullMatch && (
                                       <span className="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md uppercase tracking-widest">Partial Match</span>
                                    )}
                                 </div>
                                 
                                 <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-1.5 text-yellow-500 font-black text-xs bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/10"><span>★</span> {mech.rating}</div>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">{mech.distanceStr}</span>
                                 </div>

                                 <div className="flex flex-col gap-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                                       {mech.isFullMatch ? "Specialized in All Requested Systems" : "Specialized In:"}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                       {(mech.matchedSkills || mech.expertise)?.map((exp: string) => (
                                          <span key={exp} className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all ${mech.matchedSkills?.includes(exp) ? "bg-zinc-900 text-primary border border-zinc-900 shadow-lg" : "bg-gray-50 text-gray-400 border border-gray-100 opacity-40 grayscale"}`}>
                                             {exp}
                                          </span>
                                       ))}
                                    </div>
                                 </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="profile-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Profile Detail */}
                <div className="lg:col-span-5 bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 flex flex-col items-center text-center shadow-sm relative overflow-hidden group min-w-0 w-full">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[2.5rem] border-4 border-gray-50 p-1 mb-8 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[1.8rem] sm:rounded-[2.2rem] w-full h-full object-cover" />
                  </div>
                  <div className="mb-8 md:mb-10 w-full">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter uppercase mb-2 text-gray-900 leading-[0.9] truncate">{user?.name}</h2>
                    <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => setIsEditNameModalOpen(true)} className="primary-button w-full h-18 text-[9px] sm:text-[10px] tracking-[0.2em] shadow-xl">Edit Identity</button>
                </div>
                {/* Secondary Cards */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                  <div className="bg-white p-6 sm:p-8 md:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 shadow-sm flex-1 min-w-0 w-full">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8 sm:mb-10">Stored Bases</h3>
                    <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-2 scrollbar-hide overflow-x-hidden">
                      {user?.addresses && user.addresses.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                          <div className="flex flex-col gap-3 min-w-0">
                            {user.addresses.map((addr: any, i: number) => (
                              <div key={i} className="flex items-center gap-4 sm:gap-6 p-5 sm:p-6 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:bg-zinc-900 transition-all duration-500">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-yellow-400 group-hover:text-black transition-colors shrink-0"><MapPin size={20} /></div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest group-hover:text-white transition-colors truncate block">{addr.label}</span>
                                  <p className="text-gray-400 text-xs font-bold truncate group-hover:text-gray-500 transition-colors">{addr.address}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-30">No bases detected</p>}
                    </div>
                    <button onClick={() => setIsAddAddressModalOpen(true)} className="mt-8 w-full border-2 border-dashed border-gray-100 p-8 rounded-[2rem] text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:bg-gray-50 transition-all">Add New Base Point</button>
                  </div>
                  <div className="p-8 bg-zinc-900 rounded-[3rem] text-white flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-black shadow-lg"><Shield size={32} /></div>
                      <div><p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em] mb-1">Encrypted Tier</p><p className="text-2xl font-black tracking-tighter uppercase leading-none">Premium Service</p></div>
                    </div>
                    <ArrowRight size={24} className="text-gray-400" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Header for Mobile */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 flex items-center justify-between px-6 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg"><Zap size={20} className="text-primary" fill="currentColor" /></div>
          <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">GNow</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl border-2 border-gray-50 p-0.5 overflow-hidden shadow-sm">
             <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[12px] w-full h-full object-cover" />
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-transform"><Menu size={20} /></button>
        </div>
      </div>

      {/* Profile/Actions Modals */}

      {/* Modals */}
      <AnimatePresence>
        {isEditNameModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg bg-white p-6 md:p-12 rounded-[3rem] md:rounded-[3.5rem] border border-gray-100 shadow-2xl">
              <h3 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase mb-2 text-gray-900">Update Identity</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10">Configure handle</p>
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 p-1 bg-gray-50 rounded-[2rem] border border-gray-100">
                  {['male', 'female'].map(g => (
                    <button key={g} onClick={() => setSelectedGender(g as 'male' | 'female')} className={`py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedGender === g ? 'bg-primary text-black' : 'text-gray-400 hover:text-gray-600'}`}>{g}</button>
                  ))}
                </div>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="premium-input w-full bg-gray-50 border-gray-100" placeholder="Identity Handle" />
                <div className="flex gap-4">
                  <button onClick={() => setIsEditNameModalOpen(false)} className="flex-1 h-18 bg-gray-50 rounded-[2rem] font-black text-[10px] tracking-widest text-gray-400">Cancel</button>
                  <button onClick={handleUpdateName} disabled={loading} className="flex-[2] primary-button h-18 text-[10px] tracking-widest shadow-xl">{loading ? 'Syncing...' : 'Confirm Update'}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isAddAddressModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-white/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl bg-white p-6 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <h3 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase mb-2 text-gray-900">Define Grid Point</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10">Map your coordinates</p>
              <div className="space-y-8">
                {isLoaded && (
                  <div className="w-full h-48 sm:h-64 md:h-80 rounded-[2.5rem] overflow-hidden mb-8 border border-gray-100 relative shadow-inner">
                    <GoogleMap mapContainerStyle={mapContainerStyle} center={selectedCoords || mapCenter} zoom={zoom} onClick={async (e) => {
                      if (e.latLng) {
                        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                        setSelectedCoords(coords);
                        setZoom(17);
                        setAddressText("Refining coordinates...");
                        try {
                          const response = await fetch(`https://photon.komoot.io/reverse?lat=${coords.lat}&lon=${coords.lng}`);
                          const data = await response.json();
                          if (data.features?.length > 0) setAddressText(data.features[0].properties.name || "Pinned Point");
                        } catch (err) {}
                      }
                    }} options={{ disableDefaultUI: true, styles: mapStyles }}>
                      {(selectedCoords || mapCenter) && <Marker position={selectedCoords || mapCenter} />}
                    </GoogleMap>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 rounded-[2rem] border border-gray-100">
                  {['Home', 'Work', 'Safehouse'].map(l => (
                    <button key={l} onClick={() => setAddressLabel(l)} className={`py-4 rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${addressLabel === l ? 'bg-primary text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{l}</button>
                  ))}
                </div>
                <button onClick={fetchGPSLocation} disabled={isLocating} className="w-full h-14 md:h-16 bg-primary/10 text-primary border border-primary/20 rounded-[2rem] font-black text-[10px] tracking-widest flex items-center justify-center gap-4 hover:bg-primary/20 transition-all">
                  <Navigation size={18} className={isLocating ? "animate-spin" : ""} />
                  {isLocating ? 'Acquiring...' : 'Acquire GPS Point'}
                </button>
                <div className="relative">
                  <input value={addressText} onChange={(e) => { setAddressText(e.target.value); setShowSuggestions(true); }} className="premium-input w-full pl-12 bg-gray-50 border-gray-100 text-xs md:text-sm" placeholder="Manual address entry..." />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-[110] overflow-hidden">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => { setAddressText(s.fullAddress); setSelectedCoords(s.coords); setMapCenter(s.coords); setZoom(17); setShowSuggestions(false); }} className="w-full text-left p-6 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <p className="text-gray-900 text-sm font-black uppercase tracking-widest truncate">{s.name}</p>
                          <p className="text-gray-400 text-[10px] font-bold truncate">{s.fullAddress}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setIsAddAddressModalOpen(false)} className="h-14 md:h-16 bg-gray-50 rounded-[2rem] font-black text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-all">Cancel</button>
                  <button onClick={() => handleAddAddress()} disabled={loading || !addressText} className="primary-button h-14 md:h-16 text-[10px] tracking-widest shadow-xl">Confirm Point</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
