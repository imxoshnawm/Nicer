"use client";

import { motion, type Variants } from "framer-motion";
import { ReactNode } from "react";

// ============================================================
// Animation Variants
// ============================================================

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
    },
};

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
    },
};

export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -60 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
    },
};

export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 60 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
    },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
    },
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1,
        },
    },
};

export const glowPulse: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.8, ease: "easeOut" },
    },
};

// ============================================================
// Motion Wrapper Components
// ============================================================

interface MotionProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function FadeInUp({ children, className = "", delay = 0 }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0, y: 40 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function FadeInDown({ children, className = "", delay = 0 }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0, y: -40 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function FadeInLeft({ children, className = "", delay = 0 }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0, x: -60 },
                visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function FadeInRight({ children, className = "", delay = 0 }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0, x: 60 },
                visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function ScaleIn({ children, className = "", delay = 0 }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({ children, className = "", delay = 0 }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                        delayChildren: delay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = "" }: Omit<MotionProps, "delay">) {
    return (
        <motion.div
            variants={fadeInUp}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Floating animation for decorative elements
export function FloatingElement({ children, className = "", duration = 3 }: MotionProps & { duration?: number }) {
    return (
        <motion.div
            animate={{
                y: [-10, 10, -10],
                rotate: [-2, 2, -2],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// 3D card tilt effect
export function TiltCard({ children, className = "" }: Omit<MotionProps, "delay">) {
    return (
        <motion.div
            whileHover={{
                rotateX: -5,
                rotateY: 5,
                scale: 1.02,
                transition: { duration: 0.3 },
            }}
            style={{ transformStyle: "preserve-3d", perspective: 1000 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Glow hover button
export function GlowButton({ children, className = "" }: Omit<MotionProps, "delay">) {
    return (
        <motion.div
            whileHover={{
                scale: 1.05,
                boxShadow: "0 0 40px rgba(0, 168, 232, 0.6)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Counter animation component
export function AnimatedCounter({ value, className = "" }: { value: string; className?: string }) {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
            className={className}
        >
            {value}
        </motion.span>
    );
}

export { motion };
