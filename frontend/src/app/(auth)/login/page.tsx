"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { LogIn, Mail, Lock, ArrowRight, ShieldCheck, Zap, Globe, Activity } from "lucide-react";
import { useMagnetic } from "@/hooks/useMagnetic";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [credentials, setCredentials] = useState({ email: "", password: "", role: "customer" });
    const [loading, setLoading] = useState(false);

    // Tactical Vanguard Hooks
    const magneticLogo = useMagnetic(0.3);
    const magneticSubmit = useMagnetic(0.2);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(credentials);
            toast.success("Welcome back! 🚗");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background flex items-start justify-center px-4 py-12 sm:p-6 sm:items-center relative font-sans noise-bg antialiased vanguard-grid overflow-y-auto">
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
                className="w-full max-w-md z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <motion.div
                        ref={magneticLogo.ref} animate={{ x: magneticLogo.x, y: magneticLogo.y }} onMouseLeave={magneticLogo.handleMouseLeave}
                        className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-900 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl"
                    >
                        <Zap size={24} className="text-primary fill-primary sm:w-7 sm:h-7" />
                    </motion.div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-gray-900 mb-2 uppercase leading-none">Authentication</h1>
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] sm:tracking-[0.4em]">Precision Access Node.</p>
                </div>

                {/* Login Card */}
                <div className="glass-premium p-5 sm:p-10 rounded-[2rem] sm:rounded-[4rem] relative overflow-hidden signal-scan">
                    {/* Tactical HUD Brackets */}
                    <div className="tactical-bracket bracket-tl" />
                    <div className="tactical-bracket bracket-tr" />
                    <div className="tactical-bracket bracket-bl" />
                    <div className="tactical-bracket bracket-br" />

                    {/* 🎭 Role Selector */}
                    <div className="flex bg-gray-50/50 backdrop-blur-md p-1 rounded-2xl mb-10 border border-gray-100 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setCredentials({ ...credentials, role: 'customer' })}
                            className={`flex-1 py-3.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-widest transition-all ${credentials.role === 'customer'
                                    ? 'bg-zinc-900 text-white shadow-xl'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Customer Hub
                        </button>
                        <button
                            type="button"
                            onClick={() => setCredentials({ ...credentials, role: 'mechanic' })}
                            className={`flex-1 py-3.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-widest transition-all ${credentials.role === 'mechanic'
                                    ? 'bg-zinc-900 text-white shadow-xl'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Responder Hub
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grid Identity (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-6 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="your@node.com"
                                    className="premium-input w-full pl-16 text-sm md:text-base bg-gray-50/50 border-gray-100"
                                    required
                                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Pass (Password)</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-6 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="premium-input w-full pl-16 text-sm md:text-base bg-gray-50/50 border-gray-100"
                                    required
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <motion.div ref={magneticSubmit.ref} animate={{ x: magneticSubmit.x, y: magneticSubmit.y }} onMouseLeave={magneticSubmit.handleMouseLeave}>
                            <button
                                disabled={loading}
                                type="submit"
                                className="primary-button w-full h-18 mt-4 font-black tracking-widest text-[11px] uppercase shadow-xl"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Authorizing...</span>
                                ) : (
                                    <>
                                        Initialize Session <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    <div className="mt-10 flex flex-col items-center gap-4 border-t border-gray-50 pt-8">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">New Node detected?</p>
                        <Link
                            href="/register"
                            className="text-gray-900 font-black tracking-tighter text-xl sm:text-2xl hover:text-primary transition-colors flex items-center gap-2 group uppercase leading-none"
                        >
                            Join Grid Network
                            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="flex items-center gap-2 text-gray-900 font-black text-[10px] uppercase tracking-widest">
                        <ShieldCheck size={16} /> Secure Node
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-2 text-gray-900 font-black text-[10px] uppercase tracking-widest">
                        <Zap size={16} /> Instant Sync
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
