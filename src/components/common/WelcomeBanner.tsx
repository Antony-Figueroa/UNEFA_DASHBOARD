import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/auth";
import { TimeIcon } from "../../icons";
import { motion } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions, Engine } from "@tsparticles/engine";

interface WelcomeBannerProps {
  onActionClick?: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [particlesLoaded, setParticlesLoaded] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesLoaded(true);
    });
  }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "¡Buenos días!";
    if (hour >= 12 && hour < 19) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  };

  const particlesOptions: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "connect",
        },
      },
      modes: {
        connect: {
          distance: 100,
          links: { opacity: 0.3 },
          radius: 150,
        },
      },
    },
    particles: {
      color: { value: ["#ffffff", "#3B9FD8", "#5BB5E8"] },
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.15,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: false,
        speed: 0.3,
        straight: false,
      },
      number: {
        density: { enable: true, width: 800, height: 800 },
        value: 50,
      },
      opacity: {
        animation: {
          enable: true,
          speed: 0.5,
          sync: false,
        },
        value: { min: 0.1, max: 0.5 },
      },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 2.5 } },
    },
    detectRetina: true,
  }), []);

  return (
    <motion.section
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-[#054F94] via-[#0A6FBF] to-[#054F94] text-white shadow-xl dark:from-[#033563] dark:via-[#065A99] dark:to-[#033563]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-labelledby="welcome-title"
      role="banner"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" aria-hidden="true" />
      
      <div className="absolute -top-20 -left-20 size-60 rounded-full bg-[#3B9FD8]/10 blur-3xl" aria-hidden="true" />
      <div className="absolute top-0 right-0 size-40 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
      
      {particlesLoaded && (
        <Particles
          id="welcomeParticles"
          options={particlesOptions}
          className="absolute inset-0 z-0"
        />
      )}
      
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10" aria-hidden="true">
        <svg className="w-full h-full" viewBox="0 0 200 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B9FD8" stopOpacity="0" />
              <stop offset="50%" stopColor="#3B9FD8" stopOpacity="1" />
              <stop offset="100%" stopColor="#3B9FD8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="100" y1="0" x2="100" y2="400" stroke="url(#lineGradient)" strokeWidth="2" />
          <line x1="120" y1="0" x2="120" y2="400" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="size-2 rounded-full bg-[#3B9FD8]" aria-hidden="true" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/90">
              Panel de Control
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B9FD8]/20 backdrop-blur-sm border border-[#3B9FD8]/30">
            <svg className="size-3 sm:size-3.5 text-[#3B9FD8]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="text-[10px] font-bold text-[#3B9FD8] uppercase tracking-wider">
              UNEFA
            </span>
          </div>
        </motion.div>

        <motion.h1 
          variants={itemVariants}
          id="welcome-title"
          className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight"
        >
          <span className="block text-white/80 text-sm sm:text-base lg:text-lg font-medium mb-0.5 sm:mb-1">
            {getGreeting()}
          </span>
          <span className="bg-gradient-to-r from-white via-white to-[#3B9FD8] bg-clip-text text-transparent">
            {user?.name || "Usuario"}
          </span>
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="max-w-2xl text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed mb-6 sm:mb-8"
        >
          Gestiona las prácticas profesionales, supervisa el progreso de los estudiantes 
          y mantén al día los períodos académicos desde un solo lugar.
        </motion.p>

        <motion.div variants={itemVariants}>
          <div 
            className="inline-flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 sm:px-6 py-3 sm:py-4 shadow-lg hover:bg-white/15 transition-all duration-300"
            role="timer"
            aria-label={`Hora actual: ${formatTime(currentTime)}, ${formatDate(currentTime)}`}
          >
            <div className="flex items-center justify-center size-10 sm:size-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#3B9FD8] to-[#054F94] shadow-lg shrink-0">
              <TimeIcon className="size-5 sm:size-6 text-white" aria-hidden="true" />
            </div>
            
            <div className="min-w-0">
              <span className="block text-lg sm:text-2xl font-bold tabular-nums tracking-tight text-white">
                {formatTime(currentTime)}
              </span>
              <span className="text-[10px] sm:text-xs font-medium uppercase text-white/60 tracking-wider truncate block">
                {formatDate(currentTime)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-[#054F94]/50 to-transparent pointer-events-none" aria-hidden="true" />
    </motion.section>
  );
};

export default WelcomeBanner;
