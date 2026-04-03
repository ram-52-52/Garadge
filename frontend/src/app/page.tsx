"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Wrench, Shield, Zap, MapPin, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark-darker text-white overflow-hidden selection:bg-primary/30">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto">
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Wrench className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter">GARAGENOW</span>
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
        >
          {user ? (
            <Link href={user.role === 'mechanic' ? '/dashboard/mechanic' : '/dashboard/user'} className="primary-button !py-2 !px-4 text-sm font-bold">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="primary-button !py-2 !px-4 text-sm font-bold">Join Now</Link>
            </>
          )}
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold uppercase tracking-widest mb-8">
            <Zap size={14} className="animate-bounce" /> 24/7 Roadside Assistance
          </span>
          <h1 className="text-h1 md:text-h1-md lg:text-h1-lg font-black tracking-tighter leading-tight mb-8 uppercase">
            MECHANIC ON <br />
            <span className="text-primary drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">DEMAND.</span>
          </h1>
          <p className="text-slate-400 text-body md:text-body-md max-w-2xl mx-auto mb-12 leading-relaxed">
            Stranded? Broken down? Don't worry. Get professional mechanics at your location within minutes. Precise tracking, transparent pricing, instant relief.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="primary-button h-16 w-full sm:w-64 text-label-md">
              Get Help Now <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="secondary-button h-16 w-full sm:w-64 text-label-md border border-white/5">
              Mechanic Login
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full"
        >
          {[
            { icon: <MapPin />, title: "Precision Tracking", desc: "Live GPS tracking of your assigned mechanic." },
            { icon: <Shield />, title: "Verified Experts", desc: "Only certified and background-checked technicians." },
            { icon: <Zap />, title: "Instant Dispatch", desc: "Average response time under 15 minutes." }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-[32px] text-left hover:bg-white/10 transition-all border-l-4 border-l-primary/30">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                {feature.icon}
              </div>
              <h3 className="text-h2 md:text-h2-md lg:text-h2-lg font-bold mb-2 uppercase tracking-tighter">{feature.title}</h3>
              <p className="text-slate-400 text-label md:text-label-md leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer Floating Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-darker to-transparent pointer-events-none z-20" />
    </div>
  );
}
