'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Player {
    id: string;
    name: string;
    score: number | null;
}

export default function Leaderboard({ players }: { players: Player[] }) {
    // Filter players with scores and sort them
    const rankedPlayers = [...players]
        .filter(p => p.score !== null)
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    const top3 = rankedPlayers.slice(0, 3);
    const others = rankedPlayers.slice(3);

    const getMedalColor = (idx: number) => {
        switch (idx) {
            case 0: return 'text-gold';
            case 1: return 'text-blue-400';
            case 2: return 'text-orange-500';
            default: return 'text-primary/60';
        }
    };

    const getMedalIcon = (idx: number) => {
        switch (idx) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-glass rounded-[32px] border border-white/10 p-6 relative overflow-hidden">
            <div className="flex items-center justify-center gap-3 mb-10 shrink-0">
                <h2 className="text-xl font-black font-orbitron tracking-[0.2em] uppercase text-gold italic">Leaderboard</h2>
            </div>

            <div className="space-y-3 mb-12 shrink-0">
                <AnimatePresence>
                    {top3.map((player, idx) => (
                        <motion.div
                            key={player.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            layout
                            className={`flex items-center justify-between p-4 rounded-xl relative overflow-hidden group ${idx === 0 ? 'bg-gradient-to-r from-gold/20 to-transparent border border-gold/30' : idx === 1 ? 'bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20' : 'bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="">{getMedalIcon(idx)}</span>
                                <span className={` font-black font-orbitron ${getMedalColor(idx)}`}>{idx + 1}</span>
                                <span className="font-bold uppercase tracking-tight truncate max-w-[120px] text-white/90">{player.name}</span>
                            </div>
                            <span className={`text-2xl font-black font-orbitron ${getMedalColor(idx)}`}>
                                {Math.round(player.score || 0)}%
                            </span>
                        </motion.div>
                    ))}
                    {top3.length === 0 && (
                        <div className="text-center py-10 opacity-20 font-orbitron text-[10px] uppercase tracking-widest border-2 border-dashed border-white/5 rounded-2xl">
                            Waiting for results
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-shrink-0 flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/50" />
                    <h3 className="text-[10px] font-orbitron font-black text-rose-500 uppercase tracking-[0.4em]">Live Scores</h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-500/50" />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    <AnimatePresence>
                        {others.map((player, idx) => (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                layout
                                className="flex items-center justify-between px-6 py-3 bg-white/5 rounded-xl border border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-white/20 font-bold">{idx + 4}</span>
                                    <span className="text-sm font-bold uppercase tracking-tight text-white/70">{player.name}</span>
                                </div>
                                <span className="text-sm font-black font-orbitron text-primary/60">{Math.round(player.score || 0)}%</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 242, 255, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 242, 255, 0.4);
                }
            `}</style>
        </div>
    );
}
