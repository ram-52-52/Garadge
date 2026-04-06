"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Wrench, Shield, Zap, MapPin, ArrowRight, Globe, Activity, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMagnetic } from "@/hooks/useMagnetic";

export default function LandingPage() {
  const { user } = useAuth();
  
  // Tactical Vanguard Hooks
  const magneticLogo = useMagnetic(0.3);
  const magneticCTA = useMagnetic(0.2);
  const magneticSecondary = useMagnetic(0.2);

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

  return (
    <div onMouseMove={handleMouseMove} className="min-h-screen bg-background text-gray-900 overflow-x-hidden selection:bg-primary/30 relative noise-bg antialiased vanguard-grid">
      {/* Tactical Atmosphere Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="neo-orb w-[600px] h-[600px] bg-primary/20 -top-40 -left-40" />
        <motion.div animate={{ x: [0, -80, 0], y: [0, 120, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="neo-orb w-[500px] h-[500px] bg-gray-300/30 bottom-0 -right-20" />
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="neo-orb w-[400px] h-[400px] bg-yellow-200/10 top-1/2 left-1/3" />
        
        {/* Parallax Brand Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
          <h1 className="text-[30vw] font-black tracking-tighter leading-none transform -rotate-12">GNOW</h1>
        </div>
      </div>

      {/* Navbar - Responsive Refactor */}
      <nav className="relative z-50 flex items-center justify-between px-3 sm:px-6 py-4 sm:py-6 md:py-10 max-w-7xl mx-auto data-stream">
        <motion.div 
            ref={magneticLogo.ref}
            animate={{ x: magneticLogo.x, y: magneticLogo.y }}
            onMouseLeave={magneticLogo.handleMouseLeave}
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer min-w-0"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0">
            <Zap className="text-primary fill-primary" size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-2xl font-black tracking-tighter leading-none uppercase truncate">GarageNow</span>
            <span className="text-[5px] sm:text-[9px] font-black tracking-[0.3em] sm:tracking-[0.4em] text-primary uppercase mt-1 leading-none truncate">Vanguard Prime</span>
          </div>
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 md:gap-8"
        >
          {user ? (
            <Link href={user.role === 'mechanic' ? '/dashboard/mechanic' : '/dashboard/user'} className="primary-button !py-2.5 sm:!py-3 !px-4 sm:!px-8 !rounded-xl sm:!rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl">
              Command Suite
            </Link>
          ) : (
            <div className="flex items-center gap-2 sm:gap-6">
              <Link href="/login" className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">Login</Link>
              <Link href="/register" className="primary-button !py-2 sm:!py-3 !px-3 sm:!px-8 !rounded-xl sm:!rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl">Sign Up</Link>
            </div>
          )}
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 md:px-6 pt-16 md:pt-32 pb-24 md:pb-40 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/50 backdrop-blur-xl border border-white/60 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8 md:mb-12 shadow-sm signal-scan">
            <Zap size={14} className="animate-bounce" /> Precision Roadside Protocol
          </div>
          
          <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.95] sm:leading-[0.9] mb-8 md:mb-12 uppercase text-gray-900">
            MECHANIC ON <br />
            <span className="text-zinc-900 drop-shadow-2xl vanguard-glitch">DEMAND.</span>
          </h1>
          
          <p className="text-gray-500 font-bold text-sm md:text-xl max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed uppercase tracking-tight">
            Stranded? Broken down? Don't worry. Get professional mechanics at your node within minutes. Precise tracking, transparent pricing, instant relief.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-0">
            <motion.div ref={magneticCTA.ref} animate={{ x: magneticCTA.x, y: magneticCTA.y }} onMouseLeave={magneticCTA.handleMouseLeave} className="w-full sm:w-80">
              <Link href="/register" className="cta-button w-full h-16 sm:h-18 md:h-22 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center">
                Initialize Support <ArrowRight size={18} className="ml-2" />
              </Link>
            </motion.div>
            <motion.div ref={magneticSecondary.ref} animate={{ x: magneticSecondary.x, y: magneticSecondary.y }} onMouseLeave={magneticSecondary.handleMouseLeave} className="w-full sm:w-80">
              <Link href="/dashboard/mechanic" className="secondary-button w-full h-16 sm:h-18 md:h-22 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest border-border shadow-lg hover:bg-gray-50 flex items-center justify-center">
                Responder Node
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Feature Cards with 3D Tilt & Vanguard Glow */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 mt-20 md:mt-48 w-full px-4 sm:px-0"
        >
          {[
            { icon: <Globe />, title: "Precision Track", desc: "Live GPS tracking of your assigned mechanic with real-time ETA updates." },
            { icon: <Shield />, title: "Verified Elite", desc: "Every technician is background checked and certified for maximum safety." },
            { icon: <Activity />, title: "Instant Dispatch", desc: "Our algorithm ensures a responder arrives at your node in record time." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              style={{ rotateX: mousePos.y / 2, rotateY: -mousePos.x / 2 }}
              className="group relative flex flex-col p-8 sm:p-10 md:p-12 glass-premium rounded-[3rem] sm:rounded-[4rem] items-start text-left transition-all duration-700 hover:shadow-yellow-400/20 hover:bg-zinc-900 overflow-hidden signal-scan"
            >
              {/* Tactical HUD Brackets */}
              <div className="tactical-bracket bracket-tl" />
              <div className="tactical-bracket bracket-tr" />
              <div className="tactical-bracket bracket-bl" />
              <div className="tactical-bracket bracket-br" />

              <div className="w-16 h-16 bg-gray-50 group-hover:bg-primary/20 rounded-3xl flex items-center justify-center text-primary mb-10 transition-all duration-500 group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tighter leading-none group-hover:text-white transition-colors">{feature.title}</h3>
              <p className="text-gray-400 font-bold text-[10px] md:text-[11px] leading-relaxed uppercase tracking-widest group-hover:text-gray-500 transition-colors">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-10 md:py-16 border-t border-gray-100 mt-16 md:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg"><Zap size={22} className="text-primary fill-primary" /></div>
             <span className="font-black text-xl tracking-tighter uppercase">GNow</span>
          </div>
          <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] text-center md:text-left">© 2026 GarageNow Operational Grid</p>
          <div className="flex gap-6 sm:gap-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-primary transition-colors">Privacy</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-primary transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
