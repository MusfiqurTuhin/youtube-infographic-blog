"use client";

import { InfographicData } from "@/types";
import { motion } from "framer-motion";
import { Quote, CheckCircle, Clock, Activity, BarChart } from "lucide-react";

interface Props {
    data: InfographicData;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Infographic({ data }: Props) {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto p-6 space-y-8"
        >
            {/* Header */}
            <motion.header variants={item} className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    {data.title}
                </h1>
                <div className="glass inline-block px-6 py-3 rounded-xl italic text-gray-300 relative">
                    <Quote className="w-4 h-4 absolute -top-2 -left-2 text-accent" />
                    &ldquo;{data.quote}&rdquo;
                </div>
            </motion.header>

            {/* Summary */}
            <motion.section variants={item} className="glass p-6 rounded-2xl border-l-4 border-accent">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Executive Summary
                </h2>
                <p className="text-lg leading-relaxed text-gray-200">{data.summary}</p>
            </motion.section>

            {/* Key Stats Grid */}
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.keyStats.map((stat, idx) => (
                    <div key={idx} className="glass p-4 rounded-xl text-center hover:bg-white/5 transition-colors">
                        <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
                        <div className="text-2xl font-bold text-secondary mt-1">{stat.value}</div>
                    </div>
                ))}
            </motion.div>

            {/* Two Column Layout: Timeline & Takeaways */}
            <div className="grid md:grid-cols-3 gap-8">

                {/* Timeline (Left 2/3) */}
                <motion.div variants={item} className="md:col-span-2 space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Clock className="w-6 h-6 text-primary" />
                        Timeline & Steps
                    </h3>
                    <div className="space-y-0 relative border-l-2 border-white/10 ml-3">
                        {data.timeline.map((step, idx) => (
                            <div key={idx} className="pl-8 pb-8 relative group">
                                {/* Dot */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:bg-primary transition-colors" />

                                <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded mb-2 inline-block">
                                    {step.time}
                                </span>
                                <h4 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                                    {step.title}
                                </h4>
                                <p className="text-gray-400 text-sm">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Takeaways (Right 1/3) */}
                <motion.div variants={item} className="space-y-6">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        Key Takeaways
                    </h3>
                    <div className="space-y-4">
                        {data.takeaways.map((point, idx) => (
                            <div key={idx} className="glass p-4 rounded-xl border-l-4 border-green-500/50">
                                <p className="text-sm font-medium">{point}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
