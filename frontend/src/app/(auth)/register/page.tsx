"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { UserPlus, Mail, Lock, User, Wrench, ShieldCheck, ArrowRight, Zap } from "lucide-react";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [regData, setRegData] = useState({ name: "", email: "", password: "", role: "customer" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(regData);
            toast.success("Welcome to GarageNow! 🚗");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Animated Glow Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse-slow" />

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-lg z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-14 h-14 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-emerald-500/20 shadow-xl"
                    >
                        <UserPlus size={28} className="text-white" />
                    </motion.div>
                    <h1 className="text-h1 md:text-h1-md lg:text-h1-lg font-black tracking-tighter text-white mb-1 uppercase">Create Account</h1>
                    <p className="text-slate-400 text-label md:text-label-md font-medium uppercase tracking-widest">Join the elite network of mechanics.</p>
                </div>

                {/* Register Card */}
                <div className="glass-card p-10 rounded-4xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <button
                                type="button"
                                onClick={() => setRegData({ ...regData, role: 'customer' })}
                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                    regData.role === 'customer' 
                                    ? 'bg-primary/20 border-primary text-white scale-[1.05]' 
                                    : 'bg-white/5 border-white/5 text-slate-500 opacity-60'
                                }`}
                            >
                                <User size={24} />
                                <span className="text-label font-bold uppercase tracking-widest">Customer</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegData({ ...regData, role: 'mechanic' })}
                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                    regData.role === 'mechanic' 
                                    ? 'bg-primary/20 border-primary text-white scale-[1.05]' 
                                    : 'bg-white/5 border-white/5 text-slate-500 opacity-60'
                                }`}
                            >
                                <Wrench size={24} />
                                <span className="text-label font-bold uppercase tracking-widest">Mechanic</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-label md:text-label-md font-black text-slate-300 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-5 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="premium-input w-full pl-14 text-body md:text-body-md"
                                    required
                                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-label md:text-label-md font-black text-slate-300 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-5 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className="premium-input w-full pl-14 text-body md:text-body-md"
                                    required
                                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
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
                                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="primary-button !bg-emerald-500 hover:!bg-emerald-600 w-full h-18 font-black tracking-wide shadow-emerald-500/20 text-label-md uppercase"
                        >
                            {loading ? (
                                <span className="animate-pulse">Creating...</span>
                            ) : (
                                <>
                                    CREATE ACCOUNT <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-slate-500 hover:text-white transition-colors text-label md:text-label-md font-medium uppercase tracking-widest">
                            Already have an account? <span className="text-primary font-bold">Sign In</span>
                        </Link>
                    </div>
                </div>

                {/* Policy Note */}
                <p className="mt-8 text-center text-slate-600 text-xs uppercase font-bold tracking-[0.2em]">
                    By creating an account, you agree to our <span className="text-slate-400 underline cursor-pointer">Terms of Service</span>
                </p>
            </motion.div>
        </div>
    );
}
