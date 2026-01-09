"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlotReelProps {
    children: React.ReactNode;
    className?: string; // Added className to support Grid layouts
}

export function SlotReel({ children, className }: SlotReelProps) {
    return (
        <div className={cn("relative", className || "flex flex-col gap-3")}>
            <AnimatePresence mode="popLayout" initial={true}>
                {children}
            </AnimatePresence>
        </div>
    );
}

export const reelItemVariants = {
    initial: { y: -20, opacity: 0, scale: 0.95, filter: "blur(4px)" },
    animate: {
        y: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 1
        }
    },
    exit: { scale: 0.95, opacity: 0, filter: "blur(4px)" }
};
