"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { 
    Users, Wrench, CreditCard, LayoutDashboard, 
    Settings, LogOut, CheckCircle2, XCircle, 
    ChevronRight, Search, Bell, BarChart3,
    ArrowUpRight, Clock, ShieldCheck, Zap,
    Menu, X, TrendingUp, Globe, Shield, Activity,
    Database, Server, AlertTriangle, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMagnetic } from '@/hooks/useMagnetic';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMechanics: 0,
        totalRevenue: 0,
        totalRequests: 0
    });
    const [pendingMechanics, setPendingMechanics] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allMechanics, setAllMechanics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'mechanics' | 'settings'>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const magneticLogOut = useMagnetic(0.3);
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, pendingRes, usersRes, mechanicsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/pending-mechanics'),
                api.get('/admin/users'),
                api.get('/admin/mechanics')
            ]);
            if (statsRes.data.success) setStats(statsRes.data.data);
            if (pendingRes.data.success) setPendingMechanics(pendingRes.data.data);
            if (usersRes.data.success) setAllUsers(usersRes.data.data);
            if (mechanicsRes.data.success) setAllMechanics(mechanicsRes.data.data);
        } catch (error) {
            toast.error("Failed to fetch administrative data");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, name: string) => {
        try {
            const { data } = await api.put(`/admin/approve-mechanic/${id}`);
            if (data.success) {
                toast.success(`${name} verified successfully!`);
                setPendingMechanics(prev => prev.filter(m => m._id !== id));
                setStats(prev => ({ ...prev, totalMechanics: prev.totalMechanics + 1 }));
            }
        } catch (error) {
            toast.error("Approval failed");
        }
    };

    const menuItems: { id: 'dashboard' | 'users' | 'mechanics' | 'settings'; icon: React.ReactNode; label: string; badge: number | null }[] = [
        { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Control Hub', badge: pendingMechanics.length > 0 ? pendingMechanics.length : null },
        { id: 'users', icon: <Users size={18} />, label: 'User Base', badge: null },
        { id: 'mechanics', icon: <Wrench size={18} />, label: 'Fleet Matrix', badge: null },
        { id: 'settings', icon: <Settings size={18} />, label: 'Node Settings', badge: null },
    ];

    const pageConfig: Record<string, { heading: string; subheading: string; icon: React.ReactNode }> = {
        dashboard: {
            heading: 'Control Hub',
            subheading: 'Verification Queue & System Overview',
            icon: <LayoutDashboard size={24} />
        },
        users: {
            heading: 'User Base',
            subheading: 'Registered Clusters & Member Management',
            icon: <Users size={24} />
        },
        mechanics: {
            heading: 'Fleet Matrix',
            subheading: 'Authorized Responder Deployment & Status',
            icon: <Wrench size={24} />
        },
        settings: {
            heading: 'Node Settings',
            subheading: 'System Configuration & Administration',
            icon: <Settings size={24} />
        }
    };

    const currentPage = pageConfig[activeTab] || pageConfig.dashboard;

    return (
        <div onMouseMove={handleMouseMove} className="min-h-screen bg-background text-gray-900 font-sans selection:bg-primary/30 antialiased relative noise-bg vanguard-grid">
            
            {/* Tactical Atmosphere Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div animate={{ x: [0, 80, 0], y: [0, -40, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="neo-orb w-[600px] h-[600px] bg-indigo-100 top-0 left-0" />
                <motion.div animate={{ x: [0, -100, 0], y: [0, 60, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="neo-orb w-[500px] h-[500px] bg-primary/20 bottom-0 right-0" />
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
                    <span className="text-[35vw] font-black tracking-tighter leading-none transform -rotate-6">GN</span>
                </div>
            </div>

            {/* ─── FIXED TOP HEADER ─── */}
            <header className="fixed top-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-3xl border-b border-gray-100 z-50 transition-all duration-500">
                <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-4 xl:px-12 flex items-center justify-between gap-2 md:gap-4">
                    
                    {/* Logo Section */}
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className="flex items-center gap-2 sm:gap-3 md:gap-4 group cursor-pointer min-w-0"
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shrink-0">
                            <ShieldCheck size={18} className="text-primary sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm sm:text-base lg:text-sm xl:text-lg 2xl:text-2xl font-black tracking-tighter block leading-none text-gray-900 uppercase truncate text-left">Directorate</span>
                            <span className="text-[7px] md:text-[9px] font-black tracking-[0.4em] text-primary uppercase leading-none mt-1 truncate text-left">Terminal Active</span>
                        </div>
                    </button>

                    <nav className="hidden lg:flex items-center gap-0.5 xl:gap-2 p-1 bg-gray-100/50 rounded-[2rem] border border-gray-200/50 overflow-x-auto scrollbar-hide max-w-[600px] xl:max-w-none">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-1.5 xl:gap-3 px-3 xl:px-8 py-2.5 xl:py-3 rounded-[1.6rem] font-black transition-all duration-500 relative group overflow-hidden shrink-0 ${activeTab === item.id 
                                    ? "bg-white text-gray-900 shadow-premium" 
                                    : "text-gray-400 hover:text-gray-700 hover:bg-white/50"}`}
                            >
                                <div className={`relative z-10 transition-colors ${activeTab === item.id ? "text-primary scale-110" : "group-hover:text-primary"}`}>
                                    {item.icon}
                                </div>
                                <span className="relative z-10 text-[7px] xl:text-[10px] uppercase tracking-[0.05em] xl:tracking-[0.2em]">{item.label}</span>
                                {item.badge && (
                                    <span className="relative z-10 bg-rose-500 text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* System status — desktop only */}
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="hidden xl:block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">System Status</span>
                            <div className="flex items-center gap-2">
                                <span className="hidden xl:block text-xs font-black text-emerald-600 uppercase tracking-tighter leading-none vanguard-glitch">Secure</span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                        </div>

                        {/* Logout — always visible */}
                        <motion.div ref={magneticLogOut.ref} animate={{ x: magneticLogOut.x, y: magneticLogOut.y }} onMouseLeave={magneticLogOut.handleMouseLeave}>
                            <button
                                onClick={logout}
                                className="hidden md:flex items-center gap-3 px-6 py-3 rounded-2xl text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all duration-300 group border border-transparent"
                            >
                                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                                <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest">Logout</span>
                            </button>
                        </motion.div>

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-transform shrink-0"
                        >
                            <Menu size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── DESKTOP SIDEBAR ─── */}
            {/* ─── DESKTOP SIDEBAR REMOVED AS PER USER REQUEST ─── */}

            {/* ─── MOBILE DRAWER ─── */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[200] bg-white flex flex-col px-4 pt-10 pb-8 overflow-y-auto scrollbar-hide"
                        style={{ width: '100%', maxWidth: '100vw' }}
                    >
                        <div className="flex justify-between items-center mb-8 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-xl shrink-0"><ShieldCheck size={18} className="text-primary" /></div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-base font-black tracking-tighter text-gray-900 uppercase truncate">Directorate</span>
                                    <span className="text-[8px] text-primary font-black uppercase tracking-widest">Terminal Active</span>
                                </div>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-900 transition-transform active:rotate-90 shrink-0"><X size={18} /></button>
                        </div>

                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] mb-3 px-1">Navigation</p>
                        <nav className="flex flex-col gap-2 flex-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-black transition-all text-left w-full ${activeTab === item.id
                                        ? "bg-zinc-900 text-white shadow-xl"
                                        : "bg-gray-50 text-gray-600 border border-gray-100"}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${activeTab === item.id ? 'bg-primary/20 text-primary' : 'bg-white text-gray-500'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[11px] uppercase tracking-[0.2em] truncate flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shrink-0">{item.badge}</span>
                                    )}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl min-w-0">
                                <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
                                    <ShieldCheck size={14} className="text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-gray-900 uppercase truncate">{user?.name || 'Admin'}</p>
                                    <p className="text-[9px] text-gray-400 font-bold truncate">{user?.email}</p>
                                </div>
                            </div>
                            <button onClick={logout} className="flex items-center gap-3 px-4 py-4 rounded-2xl font-black text-rose-500 bg-rose-50 border border-rose-100 w-full">
                                <LogOut size={16} className="shrink-0" />
                                <span className="text-[11px] uppercase tracking-[0.2em] truncate">Terminate Access</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MAIN CONTENT ─── */}
            <main className="pt-32 pb-16 px-4 sm:px-6 md:px-12 lg:px-24 w-full max-w-full min-h-screen flex flex-col relative z-10">

                {/* Dynamic Page Header */}
                <div className="py-8 md:py-12 mb-6 md:mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-[2px] w-8 bg-primary" />
                        <span className="text-primary font-black text-[9px] md:text-[11px] uppercase tracking-[0.4em]">
                            {currentPage.subheading}
                        </span>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-900 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center text-primary shadow-2xl shrink-0 mt-1">
                            {currentPage.icon}
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-none text-gray-900 break-words">
                                {currentPage.heading}
                            </h1>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                                Administrative Terminal
                                {activeTab !== 'settings' && <span className="ml-2 text-primary">· {activeTab === 'dashboard' ? pendingMechanics.length : activeTab === 'users' ? allUsers.length : allMechanics.length} records</span>}
                            </p>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>

                        {/* ═══════════════════════════════════════
                            DASHBOARD TAB — Stats + Verification Queue
                        ═══════════════════════════════════════ */}
                        {activeTab === 'dashboard' && (
                            <div className="flex flex-col gap-8 md:gap-12">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {[
                                        { label: 'Network Population', value: stats.totalUsers, icon: <Users size={24} />, color: 'blue', sub: 'Active Clusters' },
                                        { label: 'Authorized Fleet', value: stats.totalMechanics, icon: <Wrench size={24} />, color: 'emerald', sub: 'Verified Units' },
                                        { label: 'Quantum Credits', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <CreditCard size={24} />, color: 'primary', sub: 'Net Circulation' },
                                        { label: 'Signal Traffic', value: stats.totalRequests, icon: <TrendingUp size={24} />, color: 'amber', sub: 'Total Requests' },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            style={{ rotateX: mousePos.y / 6, rotateY: -mousePos.x / 6 }}
                                            className="bg-white/80 backdrop-blur-xl p-5 sm:p-6 md:p-8 rounded-[2rem] border border-white/60 shadow-premium relative group overflow-hidden min-w-0"
                                        >
                                            <div className="tactical-bracket bracket-tl scale-75 group-hover:scale-100 transition-transform" />
                                            <div className="tactical-bracket bracket-br scale-75 group-hover:scale-100 transition-transform" />
                                            <div className="flex items-center justify-between mb-6 relative z-10">
                                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${
                                                    stat.color === 'primary' ? 'bg-zinc-900 text-primary' :
                                                    stat.color === 'blue' ? 'bg-blue-600' :
                                                    stat.color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'
                                                }`}>
                                                    {stat.icon}
                                                </div>
                                                <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px]">
                                                    <TrendingUp size={12} /> +18.4%
                                                </div>
                                            </div>
                                            <div className="relative z-10">
                                                <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mb-1">{stat.label}</h3>
                                                <p className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 uppercase leading-none mb-1">{stat.value}</p>
                                                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{stat.sub}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Verification Queue Table */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-white/60 shadow-premium relative">
                                    <div className="p-5 sm:p-6 md:p-10 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-primary shadow-xl shrink-0 animate-pulse">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg sm:text-2xl font-black tracking-tighter uppercase text-gray-900 leading-none truncate">Verification Queue</h3>
                                                <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Pending Administrative Node Clearances</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-5 py-3 bg-zinc-900 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl whitespace-nowrap">
                                                {pendingMechanics.length} Pending
                                            </div>
                                            <div className="hidden sm:flex md:hidden lg:flex items-center gap-2 text-gray-400 text-[8px] font-black uppercase tracking-widest bg-gray-50 px-3 py-3 rounded-xl border border-gray-100 italic">
                                                <RefreshCw size={10} className="animate-spin-slow" /> Swipe Grid
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        {/* Mobile scroll hint */}
                                        <div className="md:hidden absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-50" />
                                        <div className="overflow-x-auto scrollbar-hide" style={{ touchAction: 'pan-y' }}>
                                            <table className="w-full text-left min-w-[600px]">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                                    <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operator</th>
                                                    <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialization</th>
                                                    <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered</th>
                                                    <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {pendingMechanics.length > 0 ? pendingMechanics.map((mech) => (
                                                    <tr key={mech._id} className="hover:bg-gray-50/80 transition-all group/row">
                                                        <td className="px-6 md:px-10 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-lg bg-gray-50 overflow-hidden shrink-0 group-hover/row:scale-110 transition-transform">
                                                                    <img src={mech.gender === 'female' ? "/female.png" : "/men.png"} className="w-full h-full object-cover" alt="avatar" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-black text-gray-900 uppercase tracking-tighter text-lg leading-none truncate">{mech.name}</p>
                                                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest truncate">{mech.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 md:px-10 py-6">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {(mech.expertise || []).slice(0, 2).map((exp: string) => (
                                                                    <span key={exp} className="bg-zinc-900 text-primary text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider">{exp}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 md:px-10 py-6 text-gray-500 text-sm font-bold uppercase tracking-tight">
                                                            {new Date(mech.createdAt).toLocaleDateString('en-GB')}
                                                        </td>
                                                        <td className="px-6 md:px-10 py-6 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleApprove(mech._id, mech.name)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95">
                                                                    <CheckCircle2 size={18} />
                                                                </button>
                                                                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95">
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <EmptyState icon={<ShieldCheck size={40} />} title="Queue Cleared" subtitle="Zero pending administrative audits" />
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                        {/* ═══════════════════════════════════════
                            USERS TAB
                        ═══════════════════════════════════════ */}
                        {activeTab === 'users' && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-gray-100 shadow-premium">
                                <div className="p-5 sm:p-6 md:p-10 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
                                            <Users size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg sm:text-2xl font-black tracking-tighter uppercase text-gray-900 leading-none truncate">Registered Clusters</h3>
                                            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Global User Statistics & Oversight</p>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                                        {allUsers.length} Members
                                    </div>
                                </div>
                                <div className="overflow-x-auto" style={{ touchAction: 'pan-y' }}>
                                    <table className="w-full text-left min-w-[500px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {allUsers.length > 0 ? allUsers.map((u) => (
                                                <tr key={u._id} className="hover:bg-gray-50/80 transition-all group/row">
                                                    <td className="px-6 md:px-10 py-5">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 bg-zinc-900 text-primary rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover/row:rotate-12 transition-transform">
                                                                <Users size={16} />
                                                            </div>
                                                            <span className="font-black text-gray-900 uppercase tracking-tighter text-base truncate">{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 md:px-10 py-5 text-gray-400 font-bold text-sm truncate max-w-[150px]">{u.email}</td>
                                                    <td className="px-6 md:px-10 py-5 text-gray-500 text-[10px] font-black uppercase tracking-widest">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 md:px-10 py-5 text-right">
                                                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100">Active</span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <EmptyState icon={<Users size={40} />} title="No Members" subtitle="Cluster database is currently empty" />
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════
                            MECHANICS TAB
                        ═══════════════════════════════════════ */}
                        {activeTab === 'mechanics' && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-gray-100 shadow-premium">
                                <div className="p-5 sm:p-6 md:p-10 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
                                            <Wrench size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg sm:text-2xl font-black tracking-tighter uppercase text-gray-900 leading-none truncate">Fleet Operations</h3>
                                            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Real-time Deployment & Maintenance Fleet</p>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                                        {allMechanics.length} Units
                                    </div>
                                </div>
                                <div className="overflow-x-auto" style={{ touchAction: 'pan-y' }}>
                                    <table className="w-full text-left min-w-[520px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fleet Unit</th>
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</th>
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Clearance</th>
                                                <th className="px-6 md:px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Pricing</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {allMechanics.length > 0 ? allMechanics.map((m) => (
                                                <tr key={m._id} className="hover:bg-gray-50/80 transition-all group/row">
                                                    <td className="px-6 md:px-10 py-6">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-12 h-12 rounded-2xl border-2 border-white bg-gray-50 overflow-hidden shrink-0 shadow-sm group-hover/row:scale-110 transition-transform">
                                                                <img src={m.gender === 'female' ? "/female.png" : "/men.png"} className="w-full h-full object-cover" alt="avatar" />
                                                            </div>
                                                            <span className="font-black text-gray-900 uppercase tracking-tighter text-base truncate">{m.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 md:px-10 py-6">
                                                        <div className="flex items-center gap-1.5 text-amber-500 font-black text-base">
                                                            <Zap size={14} className="fill-amber-500" /> {m.rating || "4.9"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 md:px-10 py-6">
                                                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${
                                                            m.isVerified ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-primary/10 text-primary border-primary/20"
                                                        }`}>
                                                            {m.isVerified ? "Combat Ready" : "Pending Sync"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 md:px-10 py-6 text-right font-black text-gray-900 text-xl tracking-tighter">
                                                        ₹{m.pricing?.toLocaleString() || "0"}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <EmptyState icon={<Wrench size={40} />} title="Fleet Offline" subtitle="Zero operational units logged in grid" />
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════
                            SETTINGS TAB
                        ═══════════════════════════════════════ */}
                        {activeTab === 'settings' && (
                            <div className="flex flex-col gap-6">
                                {/* System Info Card */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden">
                                    <div className="p-5 sm:p-8 border-b border-gray-100">
                                        <h3 className="text-base sm:text-xl font-black tracking-tighter uppercase text-gray-900">System Information</h3>
                                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Platform configuration & environment status</p>
                                    </div>
                                    <div className="p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Platform Version', value: 'GarageNow v2.0', icon: <Server size={16} /> },
                                            { label: 'API Status', value: 'Operational', icon: <Globe size={16} />, green: true },
                                            { label: 'Database', value: 'MongoDB Atlas', icon: <Database size={16} /> },
                                            { label: 'Socket Layer', value: 'Socket.io Active', icon: <Activity size={16} />, green: true },
                                            { label: 'Admin Account', value: user?.email || '—', icon: <ShieldCheck size={16} /> },
                                            { label: 'Auth Status', value: 'Root Authorized', icon: <Shield size={16} />, green: true },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 bg-gray-50/60 rounded-2xl border border-gray-100 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.green ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-900 text-primary'}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className={`text-sm font-black uppercase tracking-tight truncate ${item.green ? 'text-emerald-600' : 'text-gray-900'}`}>{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions Card */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden">
                                    <div className="p-5 sm:p-8 border-b border-gray-100">
                                        <h3 className="text-base sm:text-xl font-black tracking-tighter uppercase text-gray-900">Quick Actions</h3>
                                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Administrative controls & maintenance</p>
                                    </div>
                                    <div className="p-5 sm:p-8 flex flex-col gap-3">
                                        <button
                                            onClick={fetchDashboardData}
                                            className="flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-primary/5 hover:border-primary/20 rounded-2xl border border-gray-100 transition-all group text-left w-full"
                                        >
                                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:rotate-180 transition-transform duration-500">
                                                <RefreshCw size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Refresh Data</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Sync latest records from API</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-4 px-5 py-4 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-100 transition-all group text-left w-full"
                                        >
                                            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                                                <LogOut size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-rose-600 uppercase tracking-[0.2em]">Terminate Access</p>
                                                <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest">Sign out from admin terminal</p>
                                            </div>
                                        </button>

                                        <div className="flex items-center gap-4 px-5 py-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em]">Restricted Zone</p>
                                                <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Destructive actions require super-root clearance</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Links Card */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden">
                                    <div className="p-5 sm:p-8 border-b border-gray-100">
                                        <h3 className="text-base sm:text-xl font-black tracking-tighter uppercase text-gray-900">Platform Navigation</h3>
                                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Jump to any part of the platform</p>
                                    </div>
                                    <div className="p-5 sm:p-8 flex flex-col gap-3">
                                        {[
                                            { label: 'Landing Page', href: '/', desc: 'Public-facing home page', icon: <Globe size={16} /> },
                                            { label: 'User Dashboard', href: '/dashboard/user', desc: 'Customer request interface', icon: <Users size={16} /> },
                                            { label: 'Mechanic Dashboard', href: '/dashboard/mechanic', desc: 'Responder control panel', icon: <Wrench size={16} /> },
                                            { label: 'Login Page', href: '/login', desc: 'Authentication terminal', icon: <Shield size={16} /> },
                                        ].map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-zinc-900 hover:text-white rounded-2xl border border-gray-100 hover:border-zinc-900 transition-all group"
                                            >
                                                <div className="w-8 h-8 bg-zinc-100 group-hover:bg-primary/20 rounded-xl flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors shrink-0">
                                                    {link.icon}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:text-white truncate">{link.label}</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-300 truncate">{link.desc}</p>
                                                </div>
                                                <ChevronRight size={14} className="shrink-0 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
    return (
        <tr>
            <td colSpan={4} className="px-8 py-24 text-center">
                <div className="flex flex-col items-center gap-5">
                    <div className="w-16 h-16 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300">
                        {icon}
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">{title}</p>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">{subtitle}</p>
                    </div>
                </div>
            </td>
        </tr>
    );
}
