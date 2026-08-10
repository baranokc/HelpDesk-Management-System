"use client";

import { motion } from "framer-motion";

// Kanat çırpan martı SVG bileşeni
function FlyingSeagull({
  delay = 0,
  duration = 18,
  startY = "20%",
  scale = 1,
}: {
  delay?: number;
  duration?: number;
  startY?: string;
  scale?: number;
}) {
  return (
    <motion.div
      initial={{ x: "-10vw", y: startY }}
      animate={{
        x: "110vw",
        y: [startY, "15%", "25%", startY],
      }}
      transition={{
        x: {
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          delay: delay,
        },
        y: {
          duration: duration / 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        },
      }}
      style={{ scale }}
      className="absolute pointer-events-none opacity-25 dark:opacity-30"
    >
      <svg
        width="36"
        height="24"
        viewBox="0 0 36 24"
        fill="none"
        className="stroke-black dark:stroke-white transition-colors duration-300"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Sol kanat, gövde ve sağ kanat - Kanat çırpma animasyonu */}
        <motion.path
          animate={{
            d: [
              "M2 14 Q 9 2, 18 10 Q 27 2, 34 14",  // Kanatlar yukarıda
              "M2 8 Q 9 12, 18 10 Q 27 12, 34 8",   // Kanatlar düz / aşağıda
              "M2 14 Q 9 2, 18 10 Q 27 2, 34 14",  // Kanatlar tekrar yukarıda
            ],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </motion.div>
  );
}

export function BackgroundSeagulls() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 🌟 Kare Kalem (Grid Paper) Arka Plan Deseni */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#0000000f_1px,transparent_1px),linear-gradient(to_bottom,#0000000f_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:28px_28px]" 
      />

      {/* 🕊️ Farklı Boyut ve Hızlarda Uçuşan Martılar */}
      <FlyingSeagull startY="12%" duration={22} delay={0} scale={0.9} />
      <FlyingSeagull startY="28%" duration={16} delay={5} scale={0.7} />
      <FlyingSeagull startY="45%" duration={26} delay={11} scale={1.1} />
      <FlyingSeagull startY="18%" duration={20} delay={15} scale={0.6} />
    </div>
  );
}