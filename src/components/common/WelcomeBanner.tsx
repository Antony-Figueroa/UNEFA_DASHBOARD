import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { motion } from "framer-motion";
import { FiHome, FiCalendar, FiUser } from "react-icons/fi";

/**
 * WelcomeBanner Component
 * Displays a compact greeting with user name, current time, and date.
 * Uses the system's primary color: #054F94 (brand-600)
 */
const WelcomeBanner: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time with seconds
  const formatTime = () => currentTime.toLocaleTimeString("es-VE", { 
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true 
  });

  // Full date format
  const formatDate = () => currentTime.toLocaleDateString("es-VE", { 
    weekday: "long", day: "numeric", month: "long", year: "numeric" 
  });

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  // System primary color: #054F94
  const PRIMARY_COLOR = '#054F94';

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl text-white shadow-xl"
      style={{ 
        background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #065A99 100%)` 
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Left: Greeting & User */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 sm:size-14 rounded-xl bg-white/15 backdrop-blur shrink-0">
              <FiUser className="size-6 sm:size-7 text-white/80" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60 font-medium">
                {getGreeting()}
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                {user?.name || "Usuario"}
              </h1>
            </div>
          </div>

          {/* Right: Date & Time */}
          <div className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-white/20 to-white/5 shrink-0">
              <FiCalendar className="size-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold text-white">{formatTime()}</p>
              <p className="text-xs font-medium uppercase text-white/60 tracking-wider">{formatDate()}</p>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
          <FiHome className="size-4" />
          <span>Panel de Control • SIGP UNEFA</span>
        </div>
      </div>
    </motion.section>
  );
};

export default WelcomeBanner;