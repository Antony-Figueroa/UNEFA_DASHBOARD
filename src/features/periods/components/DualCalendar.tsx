import React, { useState } from 'react';

interface DualCalendarProps {
  startDate: Date;
  endDate: Date;
}

const DualCalendar: React.FC<DualCalendarProps> = ({ startDate, endDate }) => {
  // Helper to get start of month
  const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  
  // Helper to add months
  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const minMonth = getStartOfMonth(startDate);
  const maxMonth = getStartOfMonth(endDate);

  const [baseMonth, setBaseMonth] = useState(minMonth);

  const month1 = baseMonth;
  const month2 = addMonths(baseMonth, 1);

  const canGoPrev = baseMonth.getTime() > minMonth.getTime();
  const canGoNext = addMonths(baseMonth, 1).getTime() < maxMonth.getTime();

  const handlePrev = () => {
    if (canGoPrev) setBaseMonth(addMonths(baseMonth, -1));
  };

  const handleNext = () => {
    if (canGoNext) setBaseMonth(addMonths(baseMonth, 1));
  };

  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat('es-ES', options).format(date);
  };

  const renderMonth = (month: Date, isLeft: boolean) => {
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    
    const firstDayOfMonth = new Date(year, monthIdx, 1);
    
    // Get the first Monday of the week that contains the 1st of the month
    let startDay = firstDayOfMonth.getDay(); // 0-6 (0 is Sunday)
    if (startDay === 0) startDay = 7; // Convert Sunday to 7
    const daysFromPrevMonth = startDay - 1; // Days to show from previous month
    
    const calendarStart = new Date(year, monthIdx, 1 - daysFromPrevMonth);
    
    const days = [];
    for (let i = 0; i < 42; i++) { // Show 6 weeks
      const day = new Date(calendarStart);
      day.setDate(calendarStart.getDate() + i);
      days.push(day);
    }

    const weekDays = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

    return (
      <div className="flex-1 min-w-70 sm:min-w-[320px]">
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-base sm:text-[17px] font-bold text-gray-900 dark:text-white capitalize truncate">
            {formatDate(month, { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-1 shrink-0">
            {isLeft ? (
              <button 
                onClick={handlePrev}
                disabled={!canGoPrev}
                className={`p-1.5 rounded-full transition-colors ${
                  canGoPrev 
                    ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" 
                    : "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
            ) : (
              <button 
                onClick={handleNext}
                disabled={!canGoNext}
                className={`p-1.5 rounded-full transition-colors ${
                  canGoNext 
                    ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" 
                    : "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2 text-center">
          {weekDays.map((day) => (
            <div key={day} className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 py-2 tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 relative">
          {days.map((day, idx) => {
            const isSelected = day >= startDate && day <= endDate;
            const isStart = day.toDateString() === startDate.toDateString();
            const isEnd = day.toDateString() === endDate.toDateString();
            const isToday = day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day.getMonth() === monthIdx;
            const isMonday = day.getDay() === 1;
            const isSunday = day.getDay() === 0;

            const containerClasses = "relative h-8 sm:h-9 flex items-center justify-center transition-all duration-200";
    let backgroundClasses = "";
    let textClasses = isCurrentMonth 
      ? (isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")
      : "text-gray-200 dark:text-gray-700";
    
    const indicatorClasses = "absolute inset-0 flex items-center justify-center pointer-events-none";
    let dotClasses = "w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold transition-all duration-300";

            // Highlight Today
            if (isToday && !isSelected) {
              textClasses = "text-brand-600 dark:text-brand-400 font-extrabold";
            }

            if (isSelected) {
              backgroundClasses = "bg-gray-900/5 dark:bg-white/10";
              
              if (isStart) {
                backgroundClasses += " rounded-l-full";
                dotClasses += " bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-black/10 scale-105";
              } else if (isEnd) {
                backgroundClasses += " rounded-r-full";
                dotClasses += " bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-black/10 scale-105";
              } else {
                if (isMonday) backgroundClasses += " rounded-l-md";
                if (isSunday) backgroundClasses += " rounded-r-md";
              }

          if (isStart && isEnd) {
            backgroundClasses = ""; // No background for single day range, just the dot
            dotClasses = "w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-black/10 font-bold scale-105";
          }
        }

        return (
          <div key={idx} className={`${containerClasses} ${backgroundClasses}`}>
            <div className={indicatorClasses}>
              <div className={(isStart || isEnd) ? dotClasses : ""}></div>
              {isToday && !isStart && !isEnd && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-brand-600 dark:border-brand-400"></div>
              )}
            </div>
                <span className={`relative z-10 text-[11px] sm:text-[13px] font-semibold ${(isStart || isEnd) ? 'text-white dark:text-gray-900' : textClasses}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const totalWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-10 bg-white dark:bg-white/3 p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-x-auto">
        {renderMonth(month1, true)}
        <div className="hidden xl:block w-px bg-gray-100 dark:bg-white/10 my-4"></div>
        {renderMonth(month2, false)}
      </div>
      
      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex items-center gap-4 bg-white dark:bg-white/3 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-gray-900/5 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Días Totales</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {totalDays} <span className="text-xs font-medium text-gray-500">Días</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-white/3 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-gray-900/5 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <path d="m16.24 7.76-8.48 8.48"></path>
              <path d="m7.76 7.76 8.48 8.48"></path>
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Semanas Estimadas</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {totalWeeks} <span className="text-xs font-medium text-gray-500">Semanas{remainingDays > 0 ? ` y ${remainingDays} d` : ''}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualCalendar;
