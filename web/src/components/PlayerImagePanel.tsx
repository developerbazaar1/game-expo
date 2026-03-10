'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export default function PlayerImagePanel({ imageUrl, lastPlayerName, onLoad }: { imageUrl: string | null, lastPlayerName: string | null, onLoad?: () => void }) {
    return (
        <div className="w-full h-full relative group">
            <div className="w-full h-full bg-black/40 relative overflow-hidden flex flex-col items-center justify-center transition-all">
                {imageUrl && imageUrl !== 'none' ? (
                    <motion.div
                        key={imageUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                    >
                        <img
                            src={imageUrl}
                            className="w-full h-full object-contain object-center"
                            alt="Player Generation"
                             style={{
                    height: "600px"
                   }}
                            onLoad={onLoad}
                            onError={(e) => {
                                // If the image fails to load, hide it and show placeholder
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.parentElement!.innerHTML = `<div class="text-center relative w-full h-full flex items-center justify-center"><div class="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-150 animate-pulse"></div><div class="relative z-10 flex flex-col items-center gap-6"><p class="font-orbitron font-black text-xs text-rose-500 tracking-widest uppercase">GENERATION FAILED</p></div></div>`;
                            }}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="font-orbitron font-black text-xs text-accent tracking-widest uppercase">{lastPlayerName}</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center relative">
                        <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="relative">
                                <User size={120} className="text-accent opacity-20" />
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black font-orbitron text-accent opacity-40">?</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black font-orbitron text-white uppercase tracking-widest">YOUR IMAGE</h3>
                                <p className="font-orbitron text-[10px] text-accent/40 uppercase tracking-[0.4em] leading-relaxed italic">Will Appear Here</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
