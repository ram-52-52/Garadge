"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, Briefcase, CreditCard, MapPin,
  Users, LogOut, ChevronRight, Zap,
  Calendar, Clock, Shield, Info,
  Fuel, Settings, User as UserIcon,
  ChevronDown, Search, ArrowRight, Bike,
  Wrench, Battery, Gauge, AlertTriangle,
  CheckCircle2, Navigation
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const menuItems = [
  { id: "request", icon: <Car size={20} />, label: "Get Help" },
  { id: "profile", icon: <UserIcon size={20} />, label: "My Account" },
];

const vehicleTypes = [
  {
    id: '2-WHEELER',
    name: 'Two-Wheeler',
    icon: <Bike size={48} />,
    desc: 'Bikes, Scooters, etc.',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4-WHEELER',
    name: 'Four-Wheeler',
    icon: <Car size={48} />,
    desc: 'Cars, SUVs, Vans',
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

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("request");
  const [step, setStep] = useState(1); // 1: Vehicle, 2: Issue, 3: Dispatching
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [nearbyMechanics, setNearbyMechanics] = useState<any[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  
  // 📍 New Profile & Address States
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressText, setAddressText] = useState("");
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(user?.gender || 'male');
  const [isLocating, setIsLocating] = useState(false);

  const { updateProfile } = useAuth();
  
  const currentAddress = user?.addresses?.length ? user.addresses[0].address : "Satellite, Ahmedabad, Gujarat";

  // ⚡ Socket Listener for Request Acceptance
  React.useEffect(() => {
    if (!socket || !currentRequestId) return;

    socket.emit('join-room', currentRequestId);

    socket.on('request-accepted', (data: any) => {
      toast.success("Mechanic accepted your request!");
      router.push(`/tracking/${currentRequestId}`);
    });

    // 🕵️ Safety check: If request was already accepted while joining the room
    const checkInitialStatus = async () => {
      try {
        const { data } = await api.get(`/requests/${currentRequestId}`);
        if (data.success && data.data.status !== 'pending') {
          router.push(`/tracking/${currentRequestId}`);
        }
      } catch (e) {
        console.error("Initial status check failed", e);
      }
    };
    checkInitialStatus();

    return () => {
      socket.off('request-accepted');
    };
  }, [socket, currentRequestId, router]);

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
        setNearbyMechanics(data.nearbyMechanics || []);
        const requestId = data.data._id;
        setCurrentRequestId(requestId);
        
        // 🏠 Join room immediately so we don't miss "Accepted" events
        if (socket) {
          socket.emit('join-room', requestId);
        }
        
        toast.success("Nearby mechanics notified!");
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
      toast.success("Profile updated successfully!");
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
      
      toast.success("Address saved to your grid!");
      setIsAddAddressModalOpen(false);
      setAddressText("");
    } catch (error) {
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const fetchGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        let addressName = "Detecting Location...";
        
        // Reverse Geocoding attempt
        try {
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}`);
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            // Get a shorter address (e.g., Neighborhood, City)
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

        const gpsAddress = {
          label: "Current GPS",
          address: addressName,
          coordinates: { lat: latitude, lng: longitude }
        };
        await handleAddAddress(gpsAddress);
        setIsLocating(false);
      },
      (error) => {
        toast.error("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-slate-200 font-sans selection:bg-primary/30 antialiased overflow-hidden">
      {/* Sidebar - Remains consistent across platform */}
      <aside className="hidden md:flex w-80 flex-col py-10 px-8 border-r border-white/5 bg-[#0D1117] h-screen fixed left-0">
        <div className="flex items-center gap-2 mb-16">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-indigo-glow">
            <Zap size={22} className="text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-black tracking-tighter">GarageNow</span>
        </div>

        <div className="mb-12">
          <p className="text-slate-200 text-label font-black uppercase tracking-widest mb-1">Welcome,</p>
          <p className="text-h2 md:text-h2-lg font-black tracking-tight">{user?.name || "Member"}</p>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group ${activeTab === item.id ? "bg-primary/10 text-primary shadow-indigo-glow" : "text-slate-500 hover:text-slate-200"
                }`}
            >
              <div className={activeTab === item.id ? "text-primary" : "text-slate-500 group-hover:text-slate-200"}>
                {item.icon}
              </div>
              <span className="text-sm uppercase tracking-widest whitespace-nowrap font-bold">{item.label}</span>
              {activeTab === item.id && <div className="w-1 h-6 bg-primary rounded-full ml-auto" />}
            </button>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-4 px-4 py-4 mt-auto text-rose-500 font-bold hover:bg-rose-500/10 rounded-2xl transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-80 pt-24 pb-6 px-6 md:p-12 overflow-y-auto h-screen scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h1 className="text-h1 md:text-h1-md lg:text-h1-lg font-black tracking-tighter uppercase leading-tight mb-2">
                {activeTab === "request" ? "Request Help" : menuItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-slate-200 font-black text-label-md uppercase tracking-widest">
                {activeTab === "request" && (
                  <>
                    {step === 1 && "Choose your wheels"}
                    {step === 2 && "What went wrong?"}
                    {step === 3 && "Broadcasting signal..."}
                  </>
                )}
                {activeTab !== "request" && "Managing your preferences"}
              </p>
            </div>
            {activeTab === "request" && step > 1 && step < 3 && (
              <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-white font-bold flex items-center gap-2 transition-all">
                <ArrowRight size={20} className="rotate-180" /> Back
              </button>
            )}
          </header>

          <AnimatePresence mode="wait">
            {activeTab === "request" && (
              <motion.div 
                key="request-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr"
                  >
                    {vehicleTypes.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setVehicleType(v.id); setStep(2); }}
                        className="group relative flex flex-col p-8 glass-card border border-white/5 rounded-4xl items-center text-center hover:bg-white/[0.03] hover:border-primary/50 transition-all overflow-hidden h-full"
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight size={24} className="text-primary" />
                        </div>
                        <div className="mb-8 w-full h-48 bg-slate-900/50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                          <img src={v.image} alt={v.name} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-60 transition-all duration-500 scale-105 group-hover:scale-100" />
                          <div className="relative z-10 text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            {v.icon}
                          </div>
                        </div>
                        <h3 className="text-h2 font-black tracking-tighter uppercase mb-2 group-hover:text-primary transition-colors">{v.name}</h3>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">{v.desc}</p>
                      </button>
                    ))}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                      {commonIssues.map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => {
                            if (selectedIssues.includes(issue.id)) {
                              setSelectedIssues(selectedIssues.filter(i => i !== issue.id));
                            } else {
                              setSelectedIssues([...selectedIssues, issue.id]);
                            }
                          }}
                          className={`p-6 rounded-3xl border flex items-center gap-4 transition-all h-full ${selectedIssues.includes(issue.id)
                              ? "bg-primary/20 border-primary shadow-indigo-glow"
                              : "glass-card border-white/5 hover:border-white/20"
                            }`}
                        >
                          <div className={`${selectedIssues.includes(issue.id) ? "text-primary" : "text-slate-500"} transition-colors shrink-0`}>
                            {issue.icon}
                          </div>
                          <span className="font-black text-label uppercase tracking-widest text-left">{issue.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-6">
                      <div className="glass-card p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                          <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mb-1">Pick up address</p>
                          <p className="font-black text-body text-white">{currentAddress}</p>
                        </div>
                      </div>

                      <button
                        onClick={handleRequest}
                        disabled={selectedIssues.length === 0 || loading}
                        className="cta-button w-full h-18 font-black uppercase text-label-md flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Processing..." : `Dispatch Mechanic (${selectedIssues.length})`} <ArrowRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                  >
                    {nearbyMechanics.length === 0 ? (
                      <>
                        <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
                          <div className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full animate-spin-slow" />
                          <div className="absolute inset-4 border-2 border-primary/20 rounded-full" />
                          <div className="relative flex items-center justify-center text-primary drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                            <Zap size={64} fill="currentColor" />
                          </div>
                          <div className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-20" />
                        </div>
                        <h2 className="text-h2 font-black tracking-tighter uppercase mb-4">Searching for Help</h2>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em] max-w-sm leading-relaxed">
                          Your signal is live. Nearby mechanics are receiving your details. Please hold on...
                        </p>
                      </>
                    ) : (
                      <div className="w-full flex flex-col gap-8">
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                            <CheckCircle2 size={32} />
                          </div>
                          <h2 className="text-h2 font-black tracking-tighter uppercase">Mechanics Found!</h2>
                          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Establishing connection to high-speed responders</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
                          {nearbyMechanics.map((mech, idx) => (
                            <div key={mech._id || `mech-${idx}`} className="glass-card p-6 rounded-3xl border border-emerald-500/20 flex items-center gap-6 text-left relative overflow-hidden group hover:bg-emerald-500/5 transition-all">
                              <div className="absolute top-0 right-0 p-4">
                                <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                  <MapPin size={10} /> {mech.distanceStr || "Nearby"}
                                </div>
                              </div>
                              <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500/30 p-0.5 shrink-0">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mech.name}`} className="rounded-[14px]" alt="mech" />
                              </div>
                              <div>
                                <h4 className="font-black text-white uppercase tracking-tighter text-body-md leading-none mb-1">{mech.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-500 font-bold text-xs">★ {mech.rating}</span>
                                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                  <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{mech.expertise?.[0] || "Specialist"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8">
                          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Redirecting to Live Tracker...</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* 👤 Account Details */}
                <div className="glass-card p-10 rounded-4xl border border-white/5 flex flex-col items-center text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  
                  <div className="w-28 h-28 rounded-[2.5rem] border-2 border-primary/20 p-1.5 mb-8 bg-slate-900 shadow-indigo-glow transition-transform group-hover:scale-105 duration-500 overflow-hidden">
                    <img 
                      src={user?.gender === 'female' ? "/female.png" : "/men.png"} 
                      className="rounded-[2rem] w-full h-full object-cover" 
                      alt="user" 
                    />
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-h2 md:text-h2-lg font-black tracking-tighter uppercase mb-2 leading-none text-white">{user?.name}</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">{user?.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="font-bold text-xs uppercase text-primary">Active</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Role</p>
                      <p className="font-bold text-xs uppercase text-slate-300">{user?.role}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                        setNewName(user?.name || "");
                        setSelectedGender(user?.gender || 'male');
                        setIsEditNameModalOpen(true);
                    }}
                    className="primary-button w-full h-14 !rounded-2xl text-xs uppercase font-black tracking-widest shadow-indigo"
                  >
                    Edit Profile Details
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  {/* 🛡️ Subscription Card */}
                  <div className="glass-card p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">Active Plan</div>
                    </div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 leading-none">Security Matrix</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-indigo-glow"><Shield size={28} /></div>
                        <div>
                          <p className="font-black text-h2 uppercase tracking-tighter text-white leading-none mb-1">Premium Plus</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valid until April 2026</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toast("Renewal sequence initiated. Redirecting to payment...", { icon: "💳" })}
                        className="text-xs font-black text-primary uppercase underline hover:text-white transition-colors"
                      >
                        Renew
                      </button>
                    </div>
                  </div>

                  {/* 📍 Saved Addresses List */}
                  <div className="glass-card p-8 rounded-[32px] border border-white/5 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">Saved Grid Points</h3>
                        <span className="text-primary text-[10px] font-black uppercase tracking-widest">{user?.addresses?.length || 0} Saved</span>
                    </div>

                    <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                      {user?.addresses && user.addresses.length > 0 ? user.addresses.map((addr: any, i: number) => (
                        <div key={`addr-${i}-${addr.label}`} className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/[0.08] transition-all">
                             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <MapPin size={18} />
                             </div>
                             <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{addr.label}</span>
                                    {addr.coordinates && <Zap size={10} className="text-primary fill-primary" />}
                                </div>
                                <p className="text-slate-500 text-xs font-bold truncate">{addr.address}</p>
                             </div>
                        </div>
                      )) : (
                          <div className="py-10 flex flex-col items-center gap-3 opacity-30">
                              <MapPin size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest">No Grid Points Saved</p>
                          </div>
                      )}
                    </div>

                    <button 
                        onClick={() => setIsAddAddressModalOpen(true)}
                        className="mt-6 flex items-center justify-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-2 border-dashed border-white/5 p-5 rounded-2xl hover:bg-white/5 hover:border-primary/30 hover:text-primary transition-all group"
                    >
                        <Zap size={14} className="group-hover:animate-pulse" /> Add New Grid Point
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🛑 MODALS Section */}

            {/* Edit Name Modal */}
            {isEditNameModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-md glass-card p-10 rounded-[3rem] border border-white/10 shadow-luxurious"
                >
                  <h3 className="text-h2 font-black tracking-tighter uppercase mb-2">Update Identity</h3>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-8">Change your public display handle</p>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-1 bg-slate-900 rounded-2xl border border-white/5">
                        <button 
                            onClick={() => setSelectedGender('male')}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGender === 'male' ? 'bg-primary text-white shadow-indigo' : 'text-slate-500'}`}
                        >
                            Male
                        </button>
                        <button 
                            onClick={() => setSelectedGender('female')}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGender === 'female' ? 'bg-primary text-white shadow-indigo' : 'text-slate-500'}`}
                        >
                            Female
                        </button>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Display Name</label>
                        <input 
                            value={newName} onChange={(e) => setNewName(e.target.value)}
                            className="premium-input w-full" placeholder="Enter name"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsEditNameModalOpen(false)} className="flex-1 h-14 bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                        <button onClick={handleUpdateName} disabled={loading} className="flex-[2] primary-button h-14 !rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-indigo">{loading ? 'Updating...' : 'Save Changes'}</button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Add Address Modal */}
            {isAddAddressModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-md glass-card p-10 rounded-[3rem] border border-white/10 shadow-luxurious"
                >
                  <h3 className="text-h2 font-black tracking-tighter uppercase mb-2">Define Grid Point</h3>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-8">Save a location for rapid dispatching</p>
                  
                  <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border border-white/5 mb-6">
                        {['Home', 'Work', 'Other'].map(l => (
                            <button 
                                key={l}
                                onClick={() => setAddressLabel(l)}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${addressLabel === l ? 'bg-primary text-white shadow-indigo' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={fetchGPSLocation}
                        disabled={isLocating}
                        className="w-full h-14 bg-primary/10 border border-primary/30 rounded-2xl text-primary font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-primary/20 transition-all"
                    >
                        {isLocating ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} />}
                        {isLocating ? 'Scanning GPS...' : 'Use Current GPS Position'}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-5 flex items-center text-slate-500"><MapPin size={18} /></div>
                        <input 
                            value={addressText} onChange={(e) => setAddressText(e.target.value)}
                            className="premium-input w-full pl-14" placeholder="Enter manual address..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setIsAddAddressModalOpen(false)} className="flex-1 h-14 bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                        <button 
                            onClick={() => handleAddAddress()} 
                            disabled={loading || !addressText} 
                            className="flex-[2] primary-button h-14 !rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-indigo"
                        >
                            {loading ? 'Saving...' : 'Save to Grid'}
                        </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Floating Logo Overlay for Mobile */}
      <div className="fixed top-6 left-6 md:hidden z-[60]">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-indigo-glow">
          <Zap size={24} className="text-white" fill="currentColor" />
        </div>
      </div>
      <div className="fixed top-8 right-8 md:hidden z-[60]">
        <div className="w-10 h-10 rounded-2xl border-2 border-primary/30 p-0.5 overflow-hidden">
          <img src={user?.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[14px]" alt="avatar" />
        </div>
      </div>
    </div>
  );
}
