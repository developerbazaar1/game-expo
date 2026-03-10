'use client';

import { useState } from 'react';
import { createEvent } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Zap, ShieldAlert, Monitor, ArrowRight, CheckCircle2, Loader2, Play } from 'lucide-react';

export default function Home() {
    const [name, setName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState('20');
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await createEvent(name, parseInt(maxPlayers));
            setEvent(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 relative overflow-hidden">
            <div className="scanline" />

            {/* Background Grid Decoration */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <header className="mb-14 text-center z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex justify-center mb-4"
                >
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary shadow-[0_0_30px_rgba(0,242,255,0.1)]">
                        <LayoutDashboard size={32} />
                    </div>
                </motion.div>
                <h1 className="text-5xl font-black font-orbitron italic tracking-tighter uppercase leading-none">
                    CMD <span className="text-primary text-glow-cyan">CONSOLE</span>
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-primary/40">
                    <Zap size={10} className="text-accent" />
                    System Deployment Hub
                </div>
            </header>

            <main className="w-full max-w-md z-10">
                <AnimatePresence mode="wait">
                    {!event ? (
                        <motion.form
                            key="create"
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            onSubmit={handleCreate}
                            className="bg-glass p-10 rounded-[40px] border border-white/10 shadow-2xl relative group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-focus-within:opacity-100 transition-opacity">
                                <ShieldAlert size={16} className="text-accent" />
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="relative group/field">
                                        <label className="block text-[10px] font-orbitron font-black uppercase tracking-[0.3em] text-primary/40 mb-3 group-focus-within/field:text-primary transition-colors">
                                            Operation Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary focus:bg-primary/5 text-white font-medium transition-all"
                                            required
                                            placeholder="GCS_SUMMIT_2026"
                                        />
                                    </div>
                                    <div className="relative group/field">
                                        <label className="block text-[10px] font-orbitron font-black uppercase tracking-[0.3em] text-primary/40 mb-3 group-focus-within/field:text-primary transition-colors">
                                            Max Combatants
                                        </label>
                                        <input
                                            type="number"
                                            value={maxPlayers}
                                            onChange={(e) => setMaxPlayers(e.target.value)}
                                            className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary focus:bg-primary/5 text-white font-medium transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-accent text-[10px] font-orbitron font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <ShieldAlert size={14} /> Critical Error: {error}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="cursor-pointer w-full relative group transform active:scale-[0.98] transition-all"
                                >
                                    <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <div className="relative bg-primary hover:bg-white text-black px-8 py-5 rounded-[24px] font-black font-orbitron text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" />
                                                <span>INITIALIZING...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={20} fill="currentColor" />
                                                <span>DEPLOY ARENA</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="success"
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            className="bg-glass p-12 rounded-[40px] border-2 border-primary/30 shadow-[0_0_80px_rgba(0,242,255,0.1)] text-center space-y-10 overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

                            <motion.div
                                initial={{ scale: 0.5, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                                className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(0,242,255,0.4)]"
                            >
                                <CheckCircle2 className="w-12 h-12 text-black" strokeWidth={3} />
                            </motion.div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-orbitron font-black text-primary uppercase tracking-[0.5em]">Operation Active</p>
                                    <h2 className="text-3xl font-black font-orbitron uppercase text-white tracking-tight italic">{event.name}</h2>
                                </div>
                                <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                                    <p className="font-mono text-primary/60 text-[10px] uppercase truncate max-w-[200px]">Node ID: {event.id}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Link
                                    href={`/screen/${event.id}`}
                                    className="group flex items-center justify-between bg-white hover:bg-primary text-black px-10 py-6 rounded-[24px] font-black font-orbitron text-lg uppercase tracking-widest transition-all"
                                >
                                    <span>Main Terminal</span>
                                    <Monitor size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={() => setEvent(null)}
                                    className="cursor-pointer text-white/30 text-[9px] font-orbitron font-black uppercase tracking-[0.5em] hover:text-accent transition-colors pt-4 flex items-center justify-center gap-2"
                                >
                                    Terminating Current Session <ArrowRight size={10} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="mt-16 flex items-center gap-4 opacity-20 font-mono text-[8px] uppercase tracking-[0.3em] z-10">
                <span>SEC_LAYER_v9</span>
                <span className="h-1 w-1 bg-white rounded-full" />
                <span>ROOT_AUTH_VERIFIED</span>
            </footer>
        </div>
    );
}
