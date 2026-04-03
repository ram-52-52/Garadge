"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { 
    Users, Wrench, CreditCard, LayoutDashboard, 
    Settings, LogOut, CheckCircle2, XCircle, 
    ChevronRight, Search, Bell, BarChart3,
    ArrowUpRight, Clock, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    const [activeTab, setActiveTab] = useState('dashboard');

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

    const menuItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'users', icon: <Users size={20} />, label: 'All Users' },
        { id: 'mechanics', icon: <Wrench size={20} />, label: 'All Mechanics' },
        { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <div className="flex h-screen bg-[#0B0E14] text-slate-200 font-sans selection:bg-primary/30 antialiased overflow-hidden">
            
            {/* 🛡️ Admin Sidebar */}
            <aside className="hidden md:flex w-72 flex-col py-10 px-6 border-r border-white/5 bg-[#0D1117] h-screen relative z-20">
                <div className="flex items-center gap-3 mb-16 px-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                        <ShieldCheck size={22} className="text-white" />
                    </div>
                        <span className="text-2xl font-black tracking-tighter block leading-none">GarageNow</span>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group ${
                                activeTab === item.id ? "bg-primary/10 text-primary shadow-indigo-glow" : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                            }`}
                        >
                            <div className={activeTab === item.id ? "text-primary" : "text-slate-500 group-hover:text-slate-200"}>
                                {item.icon}
                            </div>
                            <span className="text-sm uppercase tracking-widest font-black">{item.label}</span>
                            {activeTab === item.id && <div className="w-1.5 h-6 bg-primary rounded-full ml-auto" />}
                        </button>
                    ))}
                </nav>

                <button onClick={logout} className="flex items-center gap-4 px-4 py-4 mt-auto text-rose-500 font-bold hover:bg-rose-500/10 rounded-2xl transition-all">
                    <LogOut size={20} />
                    <span className="text-sm uppercase tracking-widest font-black">Logout</span>
                </button>
            </aside>

            {/* 🏗️ Main Content */}
            <main className="flex-1 overflow-y-auto h-screen relative custom-scrollbar">
                
                {/* Header */}
                <header className="sticky top-0 z-10 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/5 p-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                            Platform <span className="text-primary">Overview</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
                            Real-time systems monitoring & validation
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="SEARCH DATA..." 
                                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-primary/50 w-64 uppercase font-bold tracking-widest"
                            />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 relative">
                            <Bell size={20} />
                            <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0B0E14]" />
                        </div>
                    </div>
                </header>

                <div className="p-8 pb-20 flex flex-col gap-10">
                    
                    {/* 📊 Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Users', value: stats.totalUsers, icon: <Users size={24} />, color: 'blue' },
                            { label: 'Verified Mechanics', value: stats.totalMechanics, icon: <Wrench size={24} />, color: 'emerald' },
                            { label: 'Platform Revenue', value: stats.totalRevenue, icon: <CreditCard size={24} />, color: 'indigo' },
                            { label: 'Total Requests', value: stats.totalRequests, icon: <BarChart3 size={24} />, color: 'amber' },
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-8 rounded-[32px] border border-white/5 flex flex-col relative overflow-hidden group"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/10 blur-[50px] -mr-8 -mt-8`} />
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                        {stat.icon}
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-black">
                                        <ArrowUpRight size={14} /> +12%
                                    </div>
                                </div>
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
                                <p className="text-3xl font-black tracking-tighter text-white mt-1 uppercase">
                                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* 🕒 Dynamic Data Table */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-[40px] border border-white/5 overflow-hidden shadow-luxurious"
                    >
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    {activeTab === 'dashboard' && <Clock size={24} />}
                                    {activeTab === 'users' && <Users size={24} />}
                                    {activeTab === 'mechanics' && <Wrench size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase">
                                        {activeTab === 'dashboard' ? 'Verification Queue' : 
                                         activeTab === 'users' ? 'Registered Customers' : 'All Mechanics'}
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                                        {activeTab === 'dashboard' ? 'Pending mechanic credential audits' : 
                                         activeTab === 'users' ? 'User base management & oversight' : 'Fleet management & performance'}
                                    </p>
                                </div>
                            </div>
                            <span className="bg-primary/20 text-primary text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-primary/20">
                                {activeTab === 'dashboard' ? pendingMechanics.length : 
                                 activeTab === 'users' ? allUsers.length : allMechanics.length} RECORDS
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0D1117] border-b border-white/5">
                                    <tr>
                                        {activeTab === 'dashboard' ? (
                                            <>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mechanic Profile</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expertise</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Date</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                            </>
                                        ) : activeTab === 'users' ? (
                                            <>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Name</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined Date</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mechanic Name</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rating</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Revenue</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* DASHBOARD TAB - PENDING MECHANICS */}
                                    {activeTab === 'dashboard' && (
                                        pendingMechanics.length > 0 ? pendingMechanics.map((mech) => (
                                            <tr key={mech._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl border-2 border-white/5 p-0.5 group-hover:border-primary/50 transition-colors bg-slate-900">
                                                            <img src={mech.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-[14px]" alt="avatar" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white uppercase tracking-tighter text-lg leading-none mb-1">{mech.name}</p>
                                                            <p className="text-slate-500 text-xs font-bold">{mech.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex gap-2">
                                                        {(mech.expertise || []).slice(0, 2).map((exp: string) => (
                                                            <span key={exp} className="bg-white/5 text-slate-400 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                                                                {exp}
                                                            </span>
                                                        ))}
                                                        {(mech.expertise || []).length > 2 && <span className="text-slate-600 text-[9px] font-bold">+{(mech.expertise || []).length - 2} more</span>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-slate-400 text-sm font-bold uppercase tracking-tighter">
                                                    {new Date(mech.createdAt).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            onClick={() => handleApprove(mech._id, mech.name)}
                                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-luxurious border border-emerald-500/20"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-luxurious border border-rose-500/20">
                                                            <XCircle size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <EmptyState icon={<CheckCircle2 size={32} />} title="Queue is Empty" subtitle="No pending mechanic applications" />
                                        )
                                    )}

                                    {/* USERS TAB - ALL CUSTOMERS */}
                                    {activeTab === 'users' && (
                                        allUsers.length > 0 ? allUsers.map((u) => (
                                            <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                                                            <Users size={20} />
                                                        </div>
                                                        <span className="font-black text-white uppercase tracking-tighter">{u.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-slate-400 font-bold text-sm">{u.email}</td>
                                                <td className="px-8 py-6 text-slate-500 text-xs font-black uppercase tracking-widest">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-500/20">
                                                        Verified Customer
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <EmptyState icon={<Users size={32} />} title="No Users Found" subtitle="Platform has zero registered customers" />
                                        )
                                    )}

                                    {/* MECHANICS TAB - ALL MECHANICS */}
                                    {activeTab === 'mechanics' && (
                                        allMechanics.length > 0 ? allMechanics.map((m) => (
                                            <tr key={m._id} className="hover:bg-white/[0.02] transition-colors group">
                                                 <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl border border-white/10 p-0.5 bg-slate-900">
                                                            <img src={m.gender === 'female' ? "/female.png" : "/men.png"} className="rounded-lg" alt="avatar" />
                                                        </div>
                                                        <span className="font-black text-white uppercase tracking-tighter">{m.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-emerald-500 font-black tracking-tighter">★ {m.rating || "4.5"}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                                                        m.isVerified ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                                                    }`}>
                                                        {m.isVerified ? "Verified" : "Pending Approval"}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right text-white font-black">
                                                    ₹{m.pricing?.toLocaleString() || "0"}
                                                </td>
                                            </tr>
                                        )) : (
                                            <EmptyState icon={<Wrench size={32} />} title="No Mechanics" subtitle="Fleet is currently empty" />
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
// Helper Components
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
    return (
        <tr>
            <td colSpan={4} className="px-8 py-20 text-center">
                <div className="flex flex-col items-center gap-4 opacity-50">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500">
                        {icon}
                    </div>
                    <div>
                        <p className="text-xl font-black text-white uppercase tracking-tight">{title}</p>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{subtitle}</p>
                    </div>
                </div>
            </td>
        </tr>
    );
}
