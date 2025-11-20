import React from "react";
import { motion } from "motion/react";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-slate-900 to-slate-700">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
            >
                {/* Glowing spinning circle */}
                <motion.div
                    className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Soft pulsing text */}
                <motion.p
                    className="mt-6 text-white text-xl tracking-wide font-light"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    Loading...
                </motion.p>
            </motion.div>
        </div>
    );
}
