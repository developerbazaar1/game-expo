'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getEvent, submitPrompt } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, ShieldCheck, User, Send, RotateCcw, Target, Sparkles, Trophy, Loader2, Share2 } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import AIImagePanel from '@/components/AIImagePanel';
import PlayerImagePanel from '@/components/PlayerImagePanel';
import QRDisplay from '@/components/QRDisplay';
import PromptArenaLoader from '@/components/loaders/PromptArenaLoader';

export default function ScreenPage() {
    const { eventId } = useParams() as { eventId: string };
    const [event, setEvent] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [lastSubmission, setLastSubmission] = useState<any>(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [isImageReady, setIsImageReady] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [statusMessage, setStatusMessage] = useState('System Idle');
    const [copied, setCopied] = useState(false);
    const isFetchingRef = useRef(false);
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(playUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [playUrl, setPlayUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPlayUrl(`${window.location.origin}/play/${eventId}`);
        }
    }, [eventId]);
    const activePlayer = players.find(p => p.score === null);
    const rightPanelPlayer = activePlayer ?? lastSubmission;

    const quotes = [
        "Analyzing prompt patterns...",
        "Synthesizing visual matrix...",
        "Comparing neural weights...",
        "Interpolating creative latent space...",
        "Quantum rendering in progress...",
        "Decoding user imagination...",
        "Optimizing pixel distribution...",
        "Finalizing aesthetic score..."
    ];

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setStatusMessage(quotes[Math.floor(Math.random() * quotes.length)]);
            }, 1200);
            return () => clearInterval(interval);
        } else {
            setStatusMessage(activePlayer ? 'Awaiting Human Input' : 'Waiting for Combatant');
        }
    }, [loading, !!activePlayer]);

    const fetchData = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        try {
            const eventData: any = await getEvent(eventId, abortControllerRef.current.signal);
            setError('');
            setEvent(eventData);
            
            setPlayers(eventData.players || []);

            // Find most recent submission to show on Right Panel
            const submissions = (eventData.players || [])
                .filter((p: any) => p.generatedImageUrl)
                .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

            if (submissions.length > 0) {
                setLastSubmission(submissions[0]);
            } else {
                // Avoid showing a stale "last generated" image when this event has no submissions yet.
                setLastSubmission(null);
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
            setError(err.message);
        } finally {
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        let active = true;

        const poll = async () => {
            if (!active) return;
            await fetchData();
            if (!active) return;
            pollTimeoutRef.current = setTimeout(poll, 4000);
        };

        poll();

        return () => {
            active = false;
            if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
            abortControllerRef.current?.abort();
        };
    }, [eventId]);

    const handleSendPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        setLoading(true);
        setIsImageReady(false);
        setStatusMessage("Initializing Neural Link...");
        try {
            await submitPrompt(eventId, undefined, prompt);
            setPrompt('');
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // activePlayer moved to top

    useEffect(() => {
        if (activePlayer) {
            setShowQR(false);
        }
    }, [activePlayer]);

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-black text-rose-500 font-orbitron">
            <h1 className="text-4xl font-black italic">SYSTEM ERROR: {error}</h1>
        </div>
    );

    if (!event) return <PromptArenaLoader />;


    return (
        <div className="flex flex-col h-screen max-h-screen bg-[#050508] text-foreground p-6 font-inter relative overflow-hidden">
            <div className="scanline" />

            {/* HEADER */}
            <header className="text-center mb-6 z-10 relative">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative inline-block"
                >
                    <h1 className="text-5xl font-black font-orbitron tracking-tighter italic text-glow-blue leading-none mb-1">
                        PROMPT <span className="text-white">ARENA</span>
                    </h1>
                </motion.div>
                <div className="flex items-center justify-center gap-4 mt-1">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
                    <p className="text-[9px] font-orbitron uppercase tracking-[0.5em] text-primary/60">
                        Think It. Type It. Beat The AI.
                    </p>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
                </div>
            </header>

            <main className="flex flex-col lg:flex-row gap-6 flex-1 z-10 items-stretch overflow-y-auto lg:overflow-hidden mb-4 custom-scrollbar">
                {/* LEFT PANEL - Leaderboard */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col">
                    <Leaderboard players={players} />
                </div>

                {/* CENTER/RIGHT PANEL - Dual View */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {event.status === 'waiting' ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-glass rounded-[40px] border border-white/10 relative">
                            {playUrl && <QRDisplay url={playUrl} />}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                            {/* Comparison Stage */}
                            <div className="flex-1 flex gap-4 min-h-0">
                                {/* AI Target */}
                                <div className="flex-1 bg-glass rounded-[32px] border border-white/10 relative overflow-hidden group flex flex-col">
                                    <div className="absolute top-0 inset-x-0 h-10 bg-black/60 backdrop-blur-md flex items-center justify-between px-4 border-b border-primary/20 z-20">
                                        <span className="text-[9px] font-orbitron font-black text-primary uppercase tracking-[0.3em]">AI REFERENCE TARGET</span>
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-2 text-[8px] font-bold font-orbitron text-primary/60 hover:text-primary transition-colors uppercase tracking-widest"
                                        >
                                            {copied ? <ShieldCheck size={12} /> : <Share2 size={12} />}
                                            {copied ? 'Copied' : 'Invite'}
                                        </button>
                                    </div>
                                    <div className="flex-1 relative">
                                        {showQR ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
                                                <div className="scale-75">{playUrl && <QRDisplay url={playUrl} />}</div>
                                            </div>
                                        ) : (
                                            <AIImagePanel imageUrl={event.referenceImageUrl} status={event.status} description={event.referencePrompt} />
                                        )}
                                    </div>
                                </div>

                                {/* vs spacer with animation */}
                                <div className="w-12 self-center flex flex-col items-center gap-2">
                                    <div className="h-20 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
                                    <div className="w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center bg-black rotate-45">
                                        <span className="text-xs font-black font-orbitron text-primary -rotate-45 italic">VS</span>
                                    </div>
                                    <div className="h-20 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
                                </div>

                                {/* Player Generation */}
                                <div className="flex-1 bg-glass rounded-[32px] border border-white/20 relative overflow-hidden group flex flex-col">
                                    <div className="absolute top-0 inset-x-0 h-10 bg-black/60 backdrop-blur-md flex items-center justify-center border-b border-accent/20 z-20">
                                        <span className="text-[9px] font-orbitron font-black text-accent uppercase tracking-[0.3em]">YOUR GENERATED IMAGE</span>
                                    </div>
                                    <div className="flex-1 relative">
                                        <PlayerImagePanel
                                            imageUrl={rightPanelPlayer?.generatedImageUrl ?? null}
                                            lastPlayerName={rightPanelPlayer?.name ?? null}
                                            onLoad={() => setIsImageReady(true)}
                                        />
                                        {(loading || !isImageReady) && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center"
                                            >
                                                {/* Scanning Bar */}
                                                <motion.div
                                                    animate={{ top: ['0%', '100%', '0%'] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(0,210,255,0.8)] z-40"
                                                />

                                                <Loader2 size={48} className="text-primary animate-spin mb-6" />
                                                <div className="space-y-4">
                                                    <p className="text-xs font-orbitron font-black text-primary uppercase tracking-[0.4em] animate-pulse">Neural Synthesizing</p>
                                                    <AnimatePresence mode="wait">
                                                        <motion.div
                                                            key={statusMessage}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="flex flex-col items-center gap-2"
                                                        >
                                                            <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">{statusMessage}</p>
                                                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ x: '-100%' }}
                                                                    animate={{ x: '100%' }}
                                                                    transition={{ duration: 1.2, repeat: Infinity }}
                                                                    className="w-full h-full bg-primary/40"
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Player Info Bar */}
                            <div className="h-20 flex gap-4">
                                <div className="flex-1 bg-glass rounded-2xl border border-white/5 flex items-center px-6 gap-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary/5 pattern-grid opacity-10" />
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                                        {activePlayer ? (
                                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activePlayer.id || activePlayer.name}`} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <User size={20} className="text-primary/40" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-orbitron font-black text-primary/40 uppercase tracking-widest">Active Player</p>
                                        <AnimatePresence mode="wait">
                                            <motion.p
                                                key={activePlayer?.id || 'none'}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-lg font-black font-orbitron text-white uppercase"
                                            >
                                                {activePlayer ? activePlayer.name : 'Awaiting New Challenger...'}
                                            </motion.p>
                                        </AnimatePresence>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-orbitron font-black text-gold/40 uppercase tracking-widest">Current Status</p>
                                        <p className={`text-sm font-bold font-orbitron ${loading ? 'text-primary' : 'text-white/60'}`}>
                                            {loading ? 'PROCESSING...' : activePlayer ? 'YOUR TURN' : 'IDLE'}
                                        </p>
                                    </div>
                                </div>

                                {/* Wins Counter mini */}
                                <div className="w-48 bg-glass rounded-2xl border border-white/5 flex items-center justify-around px-4">
                                    <div className="text-center">
                                        <p className="text-[7px] font-orbitron font-black text-primary/40 uppercase">AI</p>
                                        <p className="text-xl font-black font-orbitron text-white">{event.aiWins || 0}</p>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="text-center">
                                        <p className="text-[7px] font-orbitron font-black text-accent/40 uppercase">YOU</p>
                                        <p className="text-xl font-black font-orbitron text-white">{event.humanWins || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <motion.div
                        animate={{
                            boxShadow: prompt.length > 0 && !loading
                                ? "0 0 30px rgba(0, 242, 255, 0.3)"
                                : "0 0 0px rgba(0, 242, 255, 0)"
                        }}
                        className="bg-black/90 border border-white/10 p-3 rounded-2xl flex gap-3 relative z-10"
                    >
                        <button
                            type="button"
                            onClick={() => setShowQR(!showQR)}
                            className="cursor-pointer px-6 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-orbitron font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 group"
                        >
                            <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> {showQR ? 'BACK' : 'REJOIN'}
                        </button>
                        <form onSubmit={handleSendPrompt} className="flex-1 flex gap-3">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={activePlayer ? "Enter your prompt to beat the AI..." : "Waiting for player..."}
                                disabled={!activePlayer || loading}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!activePlayer || loading || !prompt.trim()}
                                className={`cursor-pointer px-10 py-4 bg-primary text-black rounded-xl font-black font-orbitron text-xs uppercase tracking-widest transition-all relative group overflow-hidden ${(!activePlayer || loading || !prompt.trim()) ? 'opacity-30' : 'hover:scale-105 shadow-glow shadow-primary/30'}`}
                            >
                                {loading && (
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-3">
                                    {loading ? 'CALCULATING' : 'GENERATE'}
                                    <Zap size={14} fill="currentColor" />
                                </span>
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>

            {/* COMPACT FOOTER */}
            <footer className="mt-auto py-4 flex justify-between items-center z-10 px-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="flex gap-12">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
                        <span className="text-[10px] font-orbitron font-black text-primary/40 uppercase tracking-widest">AI WINS: {event.aiWins || 0}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rose]" />
                        <span className="text-[10px] font-orbitron font-black text-accent/40 uppercase tracking-widest">HUMAN WINS: {event.humanWins || 0}</span>
                    </div>
                </div>

                <div className="flex items-center gap-8 opacity-20 font-mono text-[8px] uppercase tracking-[0.3em]">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={10} />
                        <span>LINK SECURE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-1 bg-success rounded-full animate-pulse" />
                        <span>SYNC ACTIVE</span>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .pattern-grid {
                    background-size: 20px 20px;
                    background-image: linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px);
                }
                .shadow-glow {
                    box-shadow: 0 0 20px rgba(0, 210, 255, 0.3);
                }
            `}</style>
        </div>
    );
}
