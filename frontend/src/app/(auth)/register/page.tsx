"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { UserPlus, Mail, Lock, User, Wrench, ArrowRight, Zap, ShieldCheck, Globe, Activity } from "lucide-react";
import { useMagnetic } from "@/hooks/useMagnetic";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [regData, setRegData] = useState({ name: "", email: "", password: "", role: "customer" });
    const [loading, setLoading] = useState(false);

    // Tactical Vanguard Hooks
    const magneticLogo = useMagnetic(0.3);
    const magneticRegister = useMagnetic(0.2);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(regData);
            toast.success("Welcome to the Grid! 🚗");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background flex items-start justify-center px-4 py-8 sm:p-6 sm:items-center relative font-sans noise-bg antialiased vanguard-grid overflow-y-auto">
            {/* Tactical Atmosphere Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="neo-orb w-[600px] h-[600px] bg-primary/20 -top-40 -left-40" />
                <motion.div animate={{ x: [0, -80, 0], y: [0, 120, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="neo-orb w-[500px] h-[500px] bg-gray-300/20 bottom-0 -right-20" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="neo-orb w-[400px] h-[400px] bg-yellow-200/10 top-1/2 left-1/3" />
                
                {/* Parallax Brand Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
                    <h1 className="text-[30vw] font-black tracking-tighter leading-none transform -rotate-12">GNOW</h1>
                </div>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-lg z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-8 sm:mb-10">
                    <motion.div
                        ref={magneticLogo.ref} animate={{ x: magneticLogo.x, y: magneticLogo.y }} onMouseLeave={magneticLogo.handleMouseLeave}
                        className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-900 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl"
                    >
                        <UserPlus size={24} className="text-primary sm:w-7 sm:h-7" />
                    </motion.div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-gray-900 mb-2 uppercase leading-none">New Node Setup</h1>
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] sm:tracking-[0.4em]">Register in the Operational Grid.</p>
                </div>

                {/* Register Card */}
                <div className="glass-premium p-5 sm:p-10 rounded-[2rem] sm:rounded-[4rem] relative overflow-hidden signal-scan">
                    {/* Tactical HUD Brackets */}
                    <div className="tactical-bracket bracket-tl" />
                    <div className="tactical-bracket bracket-tr" />
                    <div className="tactical-bracket bracket-bl" />
                    <div className="tactical-bracket bracket-br" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Strategy Selector */}
                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <button
                                type="button"
                                onClick={() => setRegData({ ...regData, role: 'customer' })}
                                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border flex flex-col items-center gap-2 sm:gap-3 transition-all ${regData.role === 'customer'
                                        ? 'bg-zinc-900 text-white shadow-xl scale-[1.02]'
                                        : 'bg-gray-50/50 border-gray-100 text-gray-400 opacity-60'
                                    }`}
                            >
                                <User size={28} className={regData.role === 'customer' ? 'text-primary' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Customer</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegData({ ...regData, role: 'mechanic' })}
                                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border flex flex-col items-center gap-2 sm:gap-3 transition-all ${regData.role === 'mechanic'
                                        ? 'bg-zinc-900 text-white shadow-xl scale-[1.02]'
                                        : 'bg-gray-50/50 border-gray-100 text-gray-400 opacity-60'
                                    }`}
                            >
                                <Wrench size={28} className={regData.role === 'mechanic' ? 'text-primary' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Responder</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity Handle (Full Name)</label>
                            <div className="relative group">
                                <User className="absolute left-6 top-6 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="John Responder"
                                    className="premium-input w-full pl-16 text-sm md:text-base bg-gray-50/50 border-gray-100"
                                    required
                                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Communication Uplink (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-6 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="node@uplink.com"
                                    className="premium-input w-full pl-16 text-sm md:text-base bg-gray-50/50 border-gray-100"
                                    required
                                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Passkey (Password)</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-6 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="premium-input w-full pl-16 text-sm md:text-base bg-gray-50/50 border-gray-100"
                                    required
                                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <motion.div ref={magneticRegister.ref} animate={{ x: magneticRegister.x, y: magneticRegister.y }} onMouseLeave={magneticRegister.handleMouseLeave}>
                            <button
                                disabled={loading}
                                type="submit"
                                className="cta-button w-full h-18 mt-4 font-black tracking-widest text-[11px] uppercase shadow-xl"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Initializing Hub...</span>
                                ) : (
                                    <>
                                        Establish Node <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    <div className="mt-10 text-center border-t border-gray-50 pt-8">
                        <Link href="/login" className="text-gray-400 hover:text-gray-900 transition-colors text-[10px] font-black uppercase tracking-[0.2em] flex flex-col gap-2">
                            Legacy Hub detected? <span className="text-zinc-900 text-2xl tracking-tighter uppercase leading-none group transition-all">Sign In to Grid</span>
                        </Link>
                    </div>
                </div>

                {/* Privacy Assurance */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="flex items-center gap-2 text-gray-900 font-extrabold text-[10px] uppercase tracking-widest">
                        <ShieldCheck size={16} /> Data Encryption
                    </div>
                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-2 text-gray-900 font-extrabold text-[10px] uppercase tracking-widest text-center">
                        Terms of Protocol Applied
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
