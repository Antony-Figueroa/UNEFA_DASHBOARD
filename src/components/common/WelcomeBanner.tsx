import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { TimeIcon } from "../../icons";

interface WelcomeBannerProps {
  onActionClick?: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

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
    });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-brand-500 to-brand-600 p-8 text-white shadow-lg dark:from-brand-600 dark:to-brand-700">
      {/* Decorative Stars/Sparkles */}
      {/* <div className="absolute top-4 right-10 opacity-20">
        <ShootingStarIcon className="size-20 rotate-45" />
      </div>
      <div className="absolute bottom-4 left-1/2 opacity-10">
        <ShootingStarIcon className="size-12 -rotate-12" />
      </div>
      <div className="absolute top-1/2 right-1/4 opacity-15">
        <ShootingStarIcon className="size-16 rotate-180" />
      </div> */}

      <div className="relative z-10 flex flex-col items-start gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-100">
          PANEL DE CONTROL
        </span>
        <h1 className="text-3xl font-bold sm:text-4xl">
          ¡Bienvenido de nuevo, {user?.name || "Usuario"}!
        </h1>
        <p className="max-w-xl text-lg text-brand-50 opacity-90">
          Gestiona las prácticas profesionales, supervisa el progreso de los estudiantes y mantén al día los períodos académicos desde un solo lugar.
        </p>
        
        <div className="mt-2 flex items-center gap-3 rounded-full bg-white px-6 py-3 text-brand-600 shadow-sm transition-all hover:shadow-md">
          <TimeIcon className="size-5" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] font-medium uppercase opacity-70">
              {formatDate(currentTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
