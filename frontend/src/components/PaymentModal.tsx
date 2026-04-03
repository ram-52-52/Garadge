"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Banknote, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

interface PaymentModalProps {
    requestId: string;
    amount: number;
    onSuccess: () => void;
}

const paymentMethods = [
    { id: 'upi', icon: <Smartphone />, label: 'UPI / Google Pay', color: 'text-purple-400' },
    { id: 'card', icon: <CreditCard />, label: 'Credit / Debit Card', color: 'text-blue-400' },
    { id: 'cash', icon: <Banknote />, label: 'Cash on Service', color: 'text-emerald-400' },
];

export default function PaymentModal({ requestId, amount, onSuccess }: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create mock order
            const { data: orderData } = await api.post('/payments/order', { requestId, amount });
            
            // 2. Simulate standard payment delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Verify mock payment
            const { data: verifyData } = await api.post('/payments/verify', {
                requestId,
                orderId: orderData.orderId,
                paymentId: `pay_${Math.random().toString(36).substring(7)}`
            });

            if (verifyData.success) {
                setCompleted(true);
                toast.success('Payment Successful! 💸');
                setTimeout(() => onSuccess(), 2000);
            }
        } catch (error: any) {
            toast.error('Payment failed. Please try again.');
        } finally {
            setLoading(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md glass-card p-8 rounded-[40px] shadow-2xl relative overflow-hidden"
            >
                {!completed ? (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Payment Secure</h2>
                            <p className="text-slate-400 text-sm mt-1">Select a method to complete the service</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8 flex items-center justify-between">
                            <span className="text-slate-300 font-medium text-sm">Total Amount</span>
                            <span className="text-white text-2xl font-bold">₹{amount}</span>
                        </div>

                        <div className="space-y-4 mb-8">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`w-full p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                                        selectedMethod === method.id 
                                        ? 'bg-primary/20 border-primary text-white scale-[1.02]' 
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    <div className={method.color}>{method.icon}</div>
                                    <span className="font-semibold text-sm">{method.label}</span>
                                    {selectedMethod === method.id && (
                                        <div className="ml-auto w-5 h-5 bg-primary rounded-full flex items-center justify-center scale-75">
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={loading}
                            onClick={handlePayment}
                            className="primary-button w-full h-16 text-lg font-bold"
                        >
                            {loading ? (
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : `Pay ₹${amount}`}
                        </button>
                    </>
                ) : (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-10"
                    >
                        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} className="animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Transaction Success!</h2>
                        <p className="text-slate-400">Thank you for using GarageNow.</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
