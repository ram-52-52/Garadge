"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

interface ReviewModalProps {
    requestId: string;
    onSuccess: () => void;
}

export default function ReviewModal({ requestId, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reviews', { requestId, rating, comment });
            setSubmitted(true);
            toast.success('Thank you for your feedback! ⭐️');
            setTimeout(() => onSuccess(), 2000);
        } catch (error) {
            toast.error('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md glass-card p-10 rounded-[48px] shadow-2xl text-center"
            >
                {!submitted ? (
                    <>
                        <h2 className="text-3xl font-bold text-white mb-2">Service Rated?</h2>
                        <p className="text-slate-400 mb-10 text-sm">How was your experience with the mechanic?</p>

                        <div className="flex justify-center gap-2 mb-10">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                    key={star}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    className="p-1"
                                >
                                    <Star 
                                        size={40} 
                                        fill={(hover || rating) >= star ? '#f59e0b' : 'none'} 
                                        className={(hover || rating) >= star ? 'text-accent' : 'text-slate-600'} 
                                        strokeWidth={1.5}
                                    />
                                </motion.button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <MessageCircle className="absolute left-4 top-4 text-slate-500" size={18} />
                                <textarea 
                                    required
                                    placeholder="Tell us what you liked (or didn't)..."
                                    className="glass-input w-full pl-12 pt-3 h-28 resize-none"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <button 
                                disabled={loading}
                                type="submit" 
                                className="primary-button w-full h-16 text-lg font-bold"
                            >
                                {loading ? 'Submitting...' : 'Send Review'}
                            </button>
                        </form>
                    </>
                ) : (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="py-10"
                    >
                        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} className="animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Review Submitted!</h2>
                        <p className="text-slate-400">Your feedback helps the community.</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
