'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AIImagePanel({ imageUrl, description }: { imageUrl: string, status?: string, description?: string }) {
    return (
        <div className="relative group bg-black/40 overflow-hidden">
            {imageUrl ? (
                <motion.img
                    key={imageUrl}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={imageUrl}
                    className="w-full h-full object-contain object-center"
                    alt="AI Reference"
                   style={{
                    height: "600px"
                   }}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-10 bg-black/40">
                    <Sparkles size={48} className="animate-spin-slow" />
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        </div>
    );
}
