"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const BlockScroll = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  // All animations complete by 0.5 (halfway through the scroll)
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [15, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);

  return (
    <div
      ref={ref}
      className={cn(
        "min-h-screen flex items-center justify-center [perspective:1200px] py-20",
        className
      )}
    >
      <motion.div
        style={{
          scale,
          opacity,
          rotateX,
          y,
          transformStyle: "preserve-3d",
        }}
        className="w-full max-w-5xl"
      >
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#70b340]/30 transition-colors duration-300">
          {children}
        </div>
      </motion.div>
    </div>
  );
};