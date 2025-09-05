"use client";

import { cn } from "~/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface AnimatedBeamProps {
  className?: string;
  containerClassName?: string;
  gradientColor?: string;
  delay?: number;
  duration?: number;
  pathColor?: string;
  pathWidth?: number;
  reverse?: boolean;
  bidirectional?: boolean;
}

export function AnimatedBeam({
  className,
  containerClassName,
  gradientColor = "#18CCFC",
  delay = 0,
  duration = 3,
  pathColor = "gray",
  pathWidth = 2,
  reverse = false,
  bidirectional = false,
}: AnimatedBeamProps) {
  return (
    <div className={cn("absolute inset-0", containerClassName)}>
      <svg
        className={cn("absolute inset-0 h-full w-full", className)}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={0.2}
          strokeDasharray="5,5"
        />
        <motion.line
          x1={reverse ? "100" : "0"}
          y1="50"
          x2={reverse ? "100" : "0"}
          y2="50"
          stroke={`url(#gradient-${gradientColor})`}
          strokeWidth={pathWidth}
          initial={{ x2: reverse ? "100" : "0" }}
          animate={{ x2: reverse ? "0" : "100" }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        {bidirectional && (
          <motion.line
            x1={!reverse ? "100" : "0"}
            y1="50"
            x2={!reverse ? "100" : "0"}
            y2="50"
            stroke={`url(#gradient-${gradientColor})`}
            strokeWidth={pathWidth}
            initial={{ x2: !reverse ? "100" : "0" }}
            animate={{ x2: !reverse ? "0" : "100" }}
            transition={{
              duration,
              delay: delay + duration / 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        <defs>
          <linearGradient id={`gradient-${gradientColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={gradientColor} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}