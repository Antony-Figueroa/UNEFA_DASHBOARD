import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/auth";
import { TimeIcon } from "../../icons";
import { motion } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions, Engine } from "@tsparticles/engine";

interface WelcomeBannerProps {
  onActionClick?: () => void;
}

// Configuration for particles
const particlesOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: {
    color: {
      value: "transparent",
    },
  },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "connect",
      },
      resize: {
        enable: true,
      },
    },
    modes: {
      connect: {
        distance: 100,
        links: {
          opacity: 0.3,
        },
        radius: 150,
      },
    },
  },
  particles: {
    color: {
      value: ["#ffffff", "#C5A059", "#FFD700"],
    },
    links: {
      color: "#ffffff",
      distance: 120,
      enable: true,
      opacity: 0.15,
      width: 1,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: {
        default: "bounce",
      },
      random: true,
      speed: 0.5,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        width: 800,
        height: 800,
      },
      value: 80,
    },
    opacity: {
      animation: {
        enable: true,
        speed: 0.5,
        sync: false,
      },
      value: { min: 0.1, max: 0.5 },
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  detectRetina: true,
};

const WelcomeBanner: React.FC<WelcomeBannerProps> = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [particlesLoaded, setParticlesLoaded] = useState(false);

  // Initialize particles
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesLoaded(true);
    });
  }, []);

  // Timer for the clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-VE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const clockVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
        delay: 0.6,
      },
    },
  };

  // Generate stars for background decoration
  const generateStars = useCallback(() => {
    const stars = [];
    for (let i = 0; i < 20; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = 2 + Math.random() * 3;
      
      stars.push(
        <motion.div
          key={i}
          className="absolute size-1 rounded-full bg-white"
          style={{
            top: `${top}%`,
            left: `${left}%`,
          }}
          initial={{ opacity: 0.2, scale: 0.5 }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      );
    }
    return stars;
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#054F94] via-[#0A6FBF] to-[#054F94] text-white shadow-2xl dark:from-[#033563] dark:via-[#065A99] dark:to-[#033563]">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
      
      {/* Top light ray effect */}
      <div className="absolute -top-20 -left-20 size-60 rounded-full bg-[#C5A059]/10 blur-3xl" />
      <div className="absolute top-0 right-0 size-40 rounded-full bg-white/5 blur-2xl" />
      
      {/* Particles Container */}
      {particlesLoaded && (
        <Particles
          id="welcomeParticles"
          options={particlesOptions}
          className="absolute inset-0 z-0"
        />
      )}

      {/* Decorative twinkling stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {generateStars()}
      </div>

      {/* Diagonal decorative line */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
        <svg className="w-full h-full" viewBox="0 0 200 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0" />
              <stop offset="50%" stopColor="#C5A059" stopOpacity="1" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="100" y1="0" x2="100" y2="400" stroke="url(#lineGradient)" strokeWidth="2" />
          <line x1="120" y1="0" x2="120" y2="400" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 p-8 lg:p-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Badge */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="size-2 rounded-full bg-[#C5A059] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Panel de Control
            </span>
          </div>
          
          {/* UNEFA Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C5A059]/20 backdrop-blur-sm border border-[#C5A059]/30">
            <svg className="size-3.5 text-[#C5A059]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
              UNEFA
            </span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          variants={itemVariants}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
        >
          <span className="block text-white/80 text-lg sm:text-xl font-medium mb-1">
            ¡Bienvenido de nuevo!
          </span>
          <span className="bg-gradient-to-r from-white via-white to-[#C5A059] bg-clip-text text-transparent">
            {user?.name || "Usuario"}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p 
          variants={itemVariants}
          className="max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed mb-8"
        >
          Gestiona las prácticas profesionales, supervisa el progreso de los estudiantes 
          y mantén al día los períodos académicos desde un solo lugar.
        </motion.p>

        {/* Action Stats Row */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <svg className="size-5 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="block text-xs text-white/50 uppercase tracking-wider">Sistema</span>
              <span className="text-sm font-semibold text-white">Operativo</span>
            </div>
          </div>
          
          <div className="w-px h-8 bg-white/20 hidden sm:block" />
          
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <svg className="size-5 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="block text-xs text-white/50 uppercase tracking-wider">Conexión</span>
              <span className="text-sm font-semibold text-white">Estable</span>
            </div>
          </div>
        </motion.div>

        {/* Clock Card */}
        <motion.div 
          variants={clockVariants}
          className="inline-flex"
        >
          <div className="group relative flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 shadow-lg hover:bg-white/15 transition-all duration-300">
            {/* Decorative glow behind clock */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#C5A059]/0 via-[#C5A059]/5 to-[#C5A059]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8B7355] shadow-lg">
              <TimeIcon className="size-6 text-white" />
            </div>
            
            <div className="relative">
              <span className="block text-2xl font-bold tabular-nums tracking-tight text-white">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs font-medium uppercase text-white/60 tracking-wider">
                {formatDate(currentTime)}
              </span>
            </div>
            
            {/* Second indicator dots */}
            <div className="hidden sm:flex gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="size-1.5 rounded-full bg-[#C5A059]"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#054F94]/50 to-transparent pointer-events-none" />
    </div>
  );
};

export default WelcomeBanner;
