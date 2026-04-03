"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { LogIn, Mail, Lock, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [credentials, setCredentials] = useState({ email: "", password: "", role: "customer" });
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Animated Glow Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 rounded-full blur-[120px] animate-pulse-slow" />

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-12">
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-indigo"
                    >
                        <Zap size={32} className="text-white" />
                    </motion.div>
                    <h1 className="text-h1 md:text-h1-md lg:text-h1-lg font-black tracking-tighter text-white mb-2 uppercase">GARAGENOW</h1>
                    <p className="text-slate-400 text-label md:text-label-md font-medium uppercase tracking-widest">Precision roadside assistance.</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-10 rounded-4xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    
                    <h2 className="text-h2 md:text-h2-md lg:text-h2-lg font-bold text-white mb-8 text-center tracking-tight uppercase">Login</h2>
                    
                    {/* 🎭 Role Selector */}
                    <div className="flex bg-slate-900/50 p-1 rounded-2xl mb-8 border border-white/5">
                        <button 
                            type="button"
                            onClick={() => setCredentials({ ...credentials, role: 'customer' })}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                credentials.role === 'customer' 
                                ? 'bg-primary text-white shadow-indigo' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Customer
                        </button>
                        <button 
                            type="button"
                            onClick={() => setCredentials({ ...credentials, role: 'mechanic' })}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                credentials.role === 'mechanic' 
                                ? 'bg-primary text-white shadow-indigo' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Mechanic
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-label md:text-label-md font-black text-slate-300 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-5 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="premium-input w-full pl-14 text-body md:text-body-md"
                                    required
                                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-label md:text-label-md font-black text-slate-300 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-5 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="premium-input w-full pl-14 text-body md:text-body-md"
                                    required
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="primary-button w-full h-18 mt-4 font-black tracking-wide text-label-md uppercase"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    ENTER GARAGE <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 flex flex-col items-center gap-4">
                        <p className="text-slate-500 text-label md:text-label-md font-medium uppercase tracking-widest">Don't have an account?</p>
                        <Link 
                            href="/register" 
                            className="text-primary font-black tracking-tighter text-h2 md:text-h2-md hover:text-white transition-colors flex items-center gap-2 group uppercase"
                        >
                            Join the Network 
                            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                   <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-tighter">
                       <ShieldCheck size={16} /> Secure Access
                   </div>
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                   <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-tighter">
                       <Zap size={16} /> Fast Dispatch
                   </div>
                </div>
            </motion.div>
        </div>
    );
}
