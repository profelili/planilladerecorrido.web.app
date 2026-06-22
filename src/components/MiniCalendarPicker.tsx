import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";

interface MiniCalendarPickerProps {
  initialDay?: string;
  initialMonth?: string;
  initialAnio?: string;
  onSelectDate: (day: string, month: string, year: string, monthName: string) => void;
  label?: string;
  accentColor?: "amber" | "orange";
}

interface Holiday {
  day: number;
  month: number; // 1-indexed
  name: string;
}

// Official Holidays in Argentina for 2026 (including sliding/bridge transfers)
const ARG_HOLIDAYS_2026: Record<number, Holiday[]> = {
  1: [
    { day: 1, month: 1, name: "Año Nuevo - Feriado Nacional" }
  ],
  2: [
    { day: 16, month: 2, name: "Carnaval - Feriado Nacional" },
    { day: 17, month: 2, name: "Carnaval - Feriado Nacional" }
  ],
  3: [
    { day: 24, month: 3, name: "Día Nacional de la Memoria por la Verdad y la Justicia" }
  ],
  4: [
    { day: 2, month: 4, name: "Día del Veterano y de los Caídos en la Guerra de Malvinas" },
    { day: 3, month: 4, name: "Viernes Santo (Feriado Inamovible)" }
  ],
  5: [
    { day: 1, month: 5, name: "Día del Trabajador - Feriado Nacional" },
    { day: 25, month: 5, name: "Día de la Revolución de Mayo" }
  ],
  6: [
    { day: 15, month: 6, name: "Paso a la Inmortalidad del Gral. Güemes (Trasladable)" },
    { day: 20, month: 6, name: "Paso a la Inmortalidad del Gral. Manuel Belgrano" }
  ],
  7: [
    { day: 9, month: 7, name: "Día de la Independencia - Feriado Inamovible" },
    { day: 10, month: 7, name: "Feriado con Fines Turísticos" }
  ],
  8: [
    { day: 17, month: 8, name: "Paso a la Inmortalidad del Gral. José de San Martín" }
  ],
  9: [],
  10: [
    { day: 12, month: 10, name: "Día del Respeto a la Diversidad Cultural" }
  ],
  11: [
    { day: 20, month: 11, name: "Día de la Soberanía Nacional (Feriado Nacional)" },
    { day: 23, month: 11, name: "Feriado con Fines Turísticos (Puente)" }
  ],
  12: [
    { day: 8, month: 12, name: "Día de la Inmaculada Concepción" },
    { day: 25, month: 12, name: "Navidad - Feriado Nacional" }
  ]
};

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEK_DAYS_ES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

export default function MiniCalendarPicker({
  initialDay = "",
  initialMonth = "",
  initialAnio = "",
  onSelectDate,
  accentColor = "orange"
}: MiniCalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial date or default to current date
  const now = new Date();
  const defaultYear = initialAnio ? parseInt(initialAnio, 10) : now.getFullYear();
  const defaultMonth = initialMonth ? parseInt(initialMonth, 10) - 1 : now.getMonth();

  const [currentMonth, setCurrentMonth] = useState(defaultMonth >= 0 && defaultMonth < 12 ? defaultMonth : now.getMonth());
  const [currentYear, setCurrentYear] = useState(defaultYear > 1900 ? defaultYear : now.getFullYear());
  const [hoveredHoliday, setHoveredHoliday] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close calendar if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Find if a particular day is a holiday
  const getHolidayForDay = (dayNum: number): Holiday | undefined => {
    const monthHolidays = ARG_HOLIDAYS_2026[currentMonth + 1] || [];
    return monthHolidays.find(h => h.day === dayNum);
  };

  // Selected state reflection
  const isSelected = (day: number) => {
    const isSameDay = day === parseInt(initialDay, 10);
    const isSameMonth = (currentMonth + 1) === parseInt(initialMonth, 10);
    const isSameYear = currentYear === parseInt(initialAnio, 10);
    return isSameDay && isSameMonth && isSameYear;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (dayNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const dayStr = String(dayNum).padStart(2, "0");
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const yearStr = String(currentYear);
    const monthName = MONTH_NAMES_ES[currentMonth];
    
    onSelectDate(dayStr, monthStr, yearStr, monthName);
    setIsOpen(false);
  };

  const selectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    
    const dayStr = String(today.getDate()).padStart(2, "0");
    const monthStr = String(today.getMonth() + 1).padStart(2, "0");
    const yearStr = String(today.getFullYear());
    const monthName = MONTH_NAMES_ES[today.getMonth()];
    
    onSelectDate(dayStr, monthStr, yearStr, monthName);
    setIsOpen(false);
  };

  const selectFirstDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dayStr = "01";
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const yearStr = String(currentYear);
    const monthName = MONTH_NAMES_ES[currentMonth];
    
    onSelectDate(dayStr, monthStr, yearStr, monthName);
    setIsOpen(false);
  };

  const selectLastDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lastDayNum = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayStr = String(lastDayNum).padStart(2, "0");
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const yearStr = String(currentYear);
    const monthName = MONTH_NAMES_ES[currentMonth];
    
    onSelectDate(dayStr, monthStr, yearStr, monthName);
    setIsOpen(false);
  };

  // Color classes map
  const colorStyles = {
    orange: {
      btnBg: "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-100",
      border: "border-orange-200",
      accentBg: "bg-orange-600 text-white",
      hoverBg: "hover:bg-orange-100/70 text-orange-950",
      badge: "bg-orange-50 text-orange-700 hover:bg-orange-100",
      focusBorder: "focus:border-orange-500"
    },
    amber: {
      btnBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-100",
      border: "border-amber-200",
      accentBg: "bg-amber-600 text-white",
      hoverBg: "hover:bg-amber-100/70 text-amber-950",
      badge: "bg-amber-50 text-amber-700 hover:bg-amber-100",
      focusBorder: "focus:border-amber-500"
    }
  }[accentColor];

  // Render Days Grid
  const daysGrid: React.ReactNode[] = [];
  // Empty slots for days before the 1st of month
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const active = isSelected(d);
    const holiday = getHolidayForDay(d);
    
    daysGrid.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={(e) => handleDayClick(d, e)}
        onMouseEnter={() => {
          if (holiday) setHoveredHoliday(holiday.name);
        }}
        onMouseLeave={() => {
          setHoveredHoliday(null);
        }}
        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer relative ${
          active 
            ? colorStyles.accentBg + " scale-110 shadow-xs" 
            : holiday 
              ? "bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200" 
              : "text-slate-700 " + colorStyles.hoverBg
        }`}
        title={holiday?.name}
      >
        <span>{d}</span>
        {holiday && !active && (
          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500" />
        )}
      </button>
    );
  }

  // Pre-fill labels
  const formattedVal = initialDay && initialMonth && initialAnio 
    ? `${initialDay}/${initialMonth}/${initialAnio}`
    : "Sin fecha";

  // Check if selected day itself is a currently active Holiday
  const currentSelectedDayNum = parseInt(initialDay, 10);
  const currentSelectedMonthNum = parseInt(initialMonth, 10);
  let selectedHolidayInfo: string | null = null;
  if (!isNaN(currentSelectedDayNum) && !isNaN(currentSelectedMonthNum)) {
    const holidaysForSelectedMonth = ARG_HOLIDAYS_2026[currentSelectedMonthNum] || [];
    const matched = holidaysForSelectedMonth.find(h => h.day === currentSelectedDayNum);
    if (matched) {
      selectedHolidayInfo = matched.name;
    }
  }

  return (
    <div className="relative inline-block w-full" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-white/90 hover:bg-white border rounded-lg shadow-3xs cursor-pointer transition-all active:scale-98 relative group ${
          isOpen ? `ring-2 ring-${accentColor}-400 border-${accentColor}-400` : "border-slate-205"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-left w-full sm:w-auto">
          <CalendarIcon className={`w-3.5 h-3.5 ${accentColor === "orange" ? "text-orange-500" : "text-amber-500"} group-hover:scale-115 transition-transform`} />
          <span className="text-xs font-bold text-slate-800">{formattedVal}</span>
          {selectedHolidayInfo && (
            <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-rose-200 uppercase tracking-wide">
              Feriado
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold ${accentColor === "orange" ? "text-orange-600" : "text-amber-600"} uppercase group-hover:underline text-left sm:text-right shrink-0 mt-0.5 sm:mt-0`}>
          Abrir Calendario 🇦🇷
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 w-[290px] animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header Month and Year Selector */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-center">
              <span className="w-20 text-center">{MONTH_NAMES_ES[currentMonth]}</span>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-100 text-[11px] font-bold py-0.5 px-1.5 rounded cursor-pointer outline-none border border-transparent focus:border-slate-350"
              >
                {Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i).map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekdays indicator heading */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1.5">
            {WEEK_DAYS_ES.map(day => (
              <div key={day} className="w-8">{day}</div>
            ))}
          </div>

          {/* Days content grids */}
          <div className="grid grid-cols-7 gap-1 justify-items-center mb-2.5">
            {daysGrid}
          </div>

          {/* Holiday Information Header */}
          {(hoveredHoliday || selectedHolidayInfo) && (
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 mb-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-950 font-medium leading-tight">
                <strong>🇦🇷 Feriado:</strong> {hoveredHoliday || selectedHolidayInfo}
              </p>
            </div>
          )}

          {/* Shortcuts for rapid automated date computation */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={selectFirstDay}
                className="flex-1 text-[9px] font-bold bg-slate-50 border border-slate-205 text-slate-700 py-1.5 px-1 rounded hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all active:scale-95 text-center"
              >
                1º de este Mes
              </button>
              <button
                type="button"
                onClick={selectLastDay}
                className="flex-1 text-[9px] font-bold bg-slate-50 border border-slate-205 text-slate-700 py-1.5 px-1 rounded hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all active:scale-95 text-center"
              >
                Último de este Mes
              </button>
            </div>
            <button
              type="button"
              onClick={selectToday}
              className={`w-full text-[9px] font-bold py-1.5 px-2 rounded cursor-pointer transition-all active:scale-95 text-center ${colorStyles.btnBg}`}
            >
              Seleccionar Fecha Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
