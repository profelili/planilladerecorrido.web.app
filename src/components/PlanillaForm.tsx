/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PlanillaData, Student } from "../types";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Calendar, 
  Clock, 
  BookOpen, 
  Phone, 
  MapPin, 
  Activity, 
  Award,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import MiniCalendarPicker from "./MiniCalendarPicker";
import SignaturePad from "./SignaturePad";

interface PlanillaFormProps {
  data: PlanillaData;
  onChange: (newData: PlanillaData) => void;
  onLoadExample: () => void;
  onClear: () => void;
}

export default function PlanillaForm({ data, onChange, onLoadExample, onClear }: PlanillaFormProps) {
  // Main form sections collapse state
  const [secDocenteOpen, setSecDocenteOpen] = useState(true);
  const [secAlumnosOpen, setSecAlumnosOpen] = useState(true);
  const [secAsistenciaOpen, setSecAsistenciaOpen] = useState(true);

  // Track which students have their detailed cards expanded
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>(() => {
    // Expand the first student by default if available to guide the user
    const initial: Record<string, boolean> = {};
    if (data.estudiantes.length > 0) {
      initial[data.estudiantes[0].id] = true;
    }
    return initial;
  });

  const toggleStudentExpand = (id: string) => {
    setExpandedStudentIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to update main data fields
  const updateField = (field: keyof PlanillaData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // Helper to update specific student fields
  const updateStudent = (id: string, field: keyof Student, value: any) => {
    const updatedEstudiantes = data.estudiantes.map((st) => {
      if (st.id === id) {
        return { ...st, [field]: value };
      }
      return st;
    });
    onChange({ ...data, estudiantes: updatedEstudiantes });
  };

  // Helper to safely generate a unique ID
  const generateUniqueId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      try { return crypto.randomUUID(); } catch (e) {}
    }
    return "st_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
  };

  // Add new student and automatically expand their card for editing
  const addStudent = () => {
    const nextOrden = data.estudiantes.length + 1;
    const newId = generateUniqueId();
    const newStudent: Student = {
      id: newId,
      orden: nextOrden,
      nomina: "",
      grado: "",
      edad: "",
      nac: "arg.",
      diagnostico: "",
      domicilio: "",
      telefono: "",
      incluirFrente: true,
      incluirDorso: true,
      frenteAus: "-",
      frentePres: "",
      frenteHorario: "",
      frenteCalif: "",
      frenteObservaciones: "",
      dorsoDias: "",
      dorsoHoras: "",
      dorsoTotalHoras: "",
    };

    onChange({
      ...data,
      estudiantes: [...data.estudiantes, newStudent],
    });

    // Expand the newly created student immediately
    setExpandedStudentIds(prev => ({
      ...prev,
      [newId]: true
    }));
  };

  // Remove student
  const removeStudent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid triggering expand toggle
    const remaining = data.estudiantes.filter((st) => st.id !== id);
    // Re-adjust orden numbers
    const updated = remaining.map((st, index) => ({
      ...st,
      orden: index + 1,
    }));
    onChange({ ...data, estudiantes: updated });
  };

  // Move student up/down for re-ordering
  const moveStudent = (e: React.MouseEvent, index: number, direction: "up" | "down") => {
    e.stopPropagation(); // Avoid triggering expand toggle
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === data.estudiantes.length - 1) return;

    const newEstudiantes = [...data.estudiantes];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    
    // Swap
    const temp = newEstudiantes[index];
    newEstudiantes[index] = newEstudiantes[targetIdx];
    newEstudiantes[targetIdx] = temp;

    // Repopulate sequential orden order
    const ordered = newEstudiantes.map((st, i) => ({
      ...st,
      orden: i + 1,
    }));

    onChange({ ...data, estudiantes: ordered });
  };

  // Auto-calculate helper for teacher's form based on typical school rules
  const handleAutoFillAsistenciaDocente = () => {
    onChange({
      ...data,
      asistenciaClasesDadas: "20.",
      asistenciaAsistencias: "7 días",
      asistenciaLicencias: "Ninguna / Licencia 70 A si corresponde",
      asistenciaDiasHabiles: "11 días.",
      asistenciaObservaciones: "Actividades curriculares y de acompañamiento domiciliario regulares.",
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans max-w-full">
      
      {/* Quick Action Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-orange-50/70 p-4 rounded-xl border border-orange-100 gap-3">
        <div>
          <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-600" />
            Acciones Rápidas de la Planilla
          </h3>
          <p className="text-[11px] text-orange-700/80 font-medium mt-0.5">
            Cargue los datos predefinidos de prueba o limpie toda la planilla para ingresar una nueva.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onLoadExample}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white hover:bg-orange-700 text-xs rounded-lg font-bold transition-all shadow-xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Cargar Ejemplo Oficial
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-250 text-slate-750 hover:bg-slate-300 hover:text-slate-900 text-xs rounded-lg font-bold transition-all active:scale-95 border border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpiar Todo
          </button>
        </div>
      </div>

      {/* SECTION 1: CABECERA Y DATOS DEL DOCENTE */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 ${secDocenteOpen ? "overflow-visible" : "overflow-hidden"}`}>
        <button
          type="button"
          onClick={() => setSecDocenteOpen(!secDocenteOpen)}
          className={`w-full flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100 hover:bg-slate-100/50 transition-colors ${secDocenteOpen ? "rounded-t-xl" : "rounded-xl"}`}
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                1. Datos del Docente y Cabecera
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Nombre de maestro/a, cargo, fechas de Frente (Pág 1) y Dorso (Pág 2).
              </p>
            </div>
          </div>
          {secDocenteOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {secDocenteOpen && (
          <div className="p-5 flex flex-col gap-5 bg-white animate-in fade-in duration-150">
            {/* Input Grid Columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-700 ml-0.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Nombre y Apellido del Docente
                </label>
                <input
                  type="text"
                  value={data.docenteNombre}
                  onChange={(e) => updateField("docenteNombre", e.target.value)}
                  placeholder="Ej: Andrea Gómez (como figura en DDJJ)"
                  className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50/50 border border-slate-205 focus:border-orange-500 focus:bg-white rounded-lg transition-all outline-none"
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-700 ml-0.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  Cargo Oficial
                </label>
                <select
                  value={data.cargo}
                  onChange={(e) => updateField("cargo", e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50/50 border border-slate-205 focus:border-orange-500 focus:bg-white rounded-lg transition-all outline-none"
                >
                  <option value="Maestra/o de Grado">Maestra/o de Grado</option>
                  <option value="Maestro/a de Tecnologías, Diseño y Programación">Maestro/a de Tecnologías, Diseño y Programación</option>
                  <option value="Maestra/o de Educación Musical">Maestra/o de Educación Musical</option>
                  <option value="Maestro/a de Artes Visuales">Maestro/a de Artes Visuales</option>
                  <option value="Maestra de Atención Temprana">Maestra de Atención Temprana</option>
                  <option value="Maestra de Sección">Maestra de Sección</option>
                </select>
              </div>

              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-700 ml-0.5">Turno</label>
                <select
                  value={data.turno}
                  onChange={(e) => updateField("turno", e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50/50 border border-slate-205 focus:border-orange-500 focus:bg-white rounded-lg transition-all outline-none"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Mañana/Tarde">Mañana/Tarde</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 ml-0.5">Módulo (Opcional)</label>
                <input
                  type="text"
                  value={data.modulo}
                  onChange={(e) => updateField("modulo", e.target.value)}
                  placeholder="Ej: Módulo I"
                  className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50/50 border border-slate-205 focus:border-orange-500 focus:bg-white rounded-lg transition-all outline-none"
                />
              </div>

              {/* Page 1 (Frente) Date details (End of Month) */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-250/50 flex flex-col gap-2 md:col-span-5">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  Fecha Frente (Fin de mes)
                </span>
                
                <MiniCalendarPicker
                  initialDay={data.frenteDia}
                  initialMonth={data.frenteMes}
                  initialAnio={data.frenteAnio}
                  accentColor="amber"
                  onSelectDate={(day, month, year) => {
                    onChange({
                      ...data,
                      frenteDia: day,
                      frenteMes: month,
                      frenteAnio: year
                    });
                  }}
                />

                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <label className="block text-[9px] font-bold text-amber-800 uppercase mb-0.5">Día</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={data.frenteDia}
                      onChange={(e) => updateField("frenteDia", e.target.value)}
                      placeholder="Ej: 30"
                      className="w-full text-center text-xs font-bold p-2 border border-amber-205/60 rounded-md bg-white focus:outline-none focus:border-amber-500 shadow-3xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-amber-800 uppercase mb-0.5">Mes</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={data.frenteMes}
                      onChange={(e) => updateField("frenteMes", e.target.value)}
                      placeholder="Ej: 07"
                      className="w-full text-center text-xs font-bold p-2 border border-amber-205/60 rounded-md bg-white focus:outline-none focus:border-amber-500 shadow-3xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-amber-800 uppercase mb-0.5">Año</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={data.frenteAnio}
                      onChange={(e) => updateField("frenteAnio", e.target.value)}
                      placeholder="2026"
                      className="w-full text-center text-xs font-bold p-2 border border-amber-205/60 rounded-md bg-white focus:outline-none focus:border-amber-500 shadow-3xs"
                    />
                  </div>
                </div>
              </div>

              {/* Page 2 (Dorso) Date details (Month that starts) */}
              <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-250/40 flex flex-col gap-2 md:col-span-5">
                <span className="text-[10px] uppercase font-bold text-orange-900 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-700" />
                  Fecha Dorso (Mes que se inicia)
                </span>

                <MiniCalendarPicker
                  initialDay={data.dorsoDia}
                  initialMonth={data.dorsoMes}
                  initialAnio={data.dorsoAnio}
                  accentColor="orange"
                  onSelectDate={(day, month, year, monthName) => {
                    onChange({
                      ...data,
                      dorsoDia: day,
                      dorsoMes: month,
                      dorsoAnio: year,
                      dorsoMesDe: monthName
                    });
                  }}
                />

                <div className="grid grid-cols-12 gap-2 mt-1">
                  <div className="col-span-3">
                    <label className="block text-[9px] font-bold text-orange-855 uppercase mb-0.5">Día</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={data.dorsoDia}
                      onChange={(e) => updateField("dorsoDia", e.target.value)}
                      placeholder="01"
                      className="w-full text-center text-xs font-bold p-2 border border-orange-205/60 rounded-md bg-white focus:outline-none focus:border-orange-500 shadow-3xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[9px] font-bold text-orange-855 uppercase mb-0.5">Mes</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={data.dorsoMes}
                      onChange={(e) => updateField("dorsoMes", e.target.value)}
                      placeholder="08"
                      className="w-full text-center text-xs font-bold p-2 border border-orange-205/60 rounded-md bg-white focus:outline-none focus:border-orange-500 shadow-3xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[9px] font-bold text-orange-855 uppercase mb-0.5">Año</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={data.dorsoAnio}
                      onChange={(e) => updateField("dorsoAnio", e.target.value)}
                      placeholder="2026"
                      className="w-full text-center text-xs font-bold p-2 border border-orange-205/60 rounded-md bg-white focus:outline-none focus:border-orange-500 shadow-3xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[9px] font-bold text-orange-855 uppercase mb-0.5">Nombre Mes</label>
                    <input
                      type="text"
                      value={data.dorsoMesDe}
                      onChange={(e) => updateField("dorsoMesDe", e.target.value)}
                      placeholder="Agosto"
                      className="w-full text-center text-xs font-bold p-2 border border-orange-205/60 rounded-md bg-white focus:outline-none focus:border-orange-500 shadow-3xs truncate"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Separator / Digital Signature Section */}
            <div className="border-t border-slate-100 pt-4">
              <SignaturePad
                value={data.firmaUrl}
                aclaracion={data.firmaAclaracion}
                defaultTeacherName={data.docenteNombre}
                onSave={(sigUrl, aclText) => {
                  onChange({
                    ...data,
                    firmaUrl: sigUrl,
                    firmaAclaracion: aclText
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: ESTUDIANTES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setSecAlumnosOpen(!secAlumnosOpen)}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                2. Nómina de Alumnos y Asistencias
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Carga de alumnos individuales. Los campos se adaptan sin tablas incómodas y sin scroll horizontal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-orange-100 text-orange-850 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {data.estudiantes.length} {data.estudiantes.length === 1 ? 'Alumno' : 'Alumnos'}
            </span>
            {secAlumnosOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </button>

        {secAlumnosOpen && (
          <div className="p-4 sm:p-5 flex flex-col gap-4 bg-white animate-in fade-in duration-150">
            
            {/* Header info bar */}
            <div className="p-3 bg-orange-50/50 border border-orange-100/60 rounded-xl flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-orange-900 leading-normal font-medium">
                <strong>¿Cómo funciona?</strong> Cada alumno se asienta en un bloque independiente. Puede expandir cualquier bloque con un toque para editar todos sus detalles. Use los checkboxes para indicar si el alumno aparecerá en el <strong>Frente (Pág 1)</strong>, en el <strong>Dorso (Pág 2)</strong>, o en ambos.
              </p>
            </div>

            {/* List of dynamic user cards */}
            <div className="flex flex-col gap-3">
              {data.estudiantes.length === 0 ? (
                /* Pure and clean empty state */
                <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded-full border border-slate-100 text-slate-400 shadow-3xs">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">No hay alumnos en la nómina</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Comienza presionando el botón "Añadir Alumno a la Nómina" de abajo o carga los datos de ejemplo iniciales.
                    </p>
                  </div>
                </div>
              ) : (
                data.estudiantes.map((st, idx) => {
                  const isExpanded = !!expandedStudentIds[st.id];
                  const hasName = st.nomina.trim().length > 0;
                  
                  return (
                    <div 
                      key={st.id} 
                      className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                        isExpanded 
                          ? "border-orange-400 bg-orange-50/5 ring-1 ring-orange-400/20" 
                          : "border-slate-205 bg-white hover:border-slate-350"
                      }`}
                    >
                      {/* Collapsed Header / Trigger bar */}
                      <div 
                        onClick={() => toggleStudentExpand(st.id)}
                        className="w-full flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Order Indicator */}
                          <span className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-bold truncate leading-tight ${hasName ? "text-slate-800" : "text-slate-400 italic"}`}>
                              {hasName ? st.nomina : "(Estudiante sin nombre asignado)"}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-slate-500 font-semibold font-sans">
                              {st.grado && (
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-650">Grado: {st.grado}</span>
                              )}
                              {st.edad && (
                                <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-650">{st.edad} años</span>
                              )}
                              {st.diagnostico && (
                                <span className="hidden sm:inline bg-slate-100 px-1 py-0.5 rounded text-slate-650 font-mono truncate max-w-[120px]" title={st.diagnostico}>Diag: {st.diagnostico}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges / Controls Wrapper */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="hidden sm:flex items-center gap-1">
                            {st.incluirFrente ? (
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                FRENTE
                              </span>
                            ) : null}
                            {st.incluirDorso ? (
                              <span className="bg-orange-100 text-orange-800 border border-orange-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                DORSO
                              </span>
                            ) : null}
                          </div>

                          {/* Quick details about attendance */}
                          <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono font-bold hidden sm:block">
                            Aus:{st.frenteAus || "-"} Pres:{st.frentePres || "-"}
                          </div>

                          {/* Move up/down buttons */}
                          <div className="flex items-center gap-0.5 mr-1 border-r border-slate-200 pr-1 select-none">
                            <button
                              type="button"
                              onClick={(e) => moveStudent(e, idx, "up")}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-all"
                              title="Subir"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => moveStudent(e, idx, "down")}
                              disabled={idx === data.estudiantes.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-all"
                              title="Bajar"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Trash delete action */}
                          <button
                            type="button"
                            onClick={(e) => removeStudent(e, st.id)}
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar Alumno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Chevron toggles */}
                          <div className="p-1 text-slate-500 bg-white border border-slate-200 rounded-md">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Student Form Body */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-150">
                          
                          {/* PAGE SECTION A: DATOS GENERALES DEL ESTUDIANTE */}
                          <div className="flex flex-col gap-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-orange-500" />
                              Información General del Estudiante
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                              <div className="md:col-span-4 flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-605">Nombre Completo (Nómina)</label>
                                <input
                                  type="text"
                                  value={st.nomina}
                                  onChange={(e) => updateStudent(st.id, "nomina", e.target.value)}
                                  placeholder="Ej: Susanita Giménez"
                                  className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-md focus:border-orange-500 focus:bg-white transition-all outline-none"
                                />
                              </div>

                              <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-600 font-sans">Grado / Sección</label>
                                <input
                                  type="text"
                                  value={st.grado}
                                  onChange={(e) => updateStudent(st.id, "grado", e.target.value)}
                                  placeholder="Ej: 3° / 2 años"
                                  className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-md focus:border-orange-500 focus:bg-white transition-all outline-none text-center"
                                />
                              </div>

                              <div className="md:col-span-1 flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-605">Edad</label>
                                <input
                                  type="text"
                                  value={st.edad}
                                  onChange={(e) => updateStudent(st.id, "edad", e.target.value)}
                                  placeholder="Ej: 8"
                                  className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-md focus:border-orange-500 focus:bg-white transition-all outline-none text-center"
                                />
                              </div>

                              <div className="md:col-span-1 flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-605">Nac.</label>
                                <input
                                  type="text"
                                  value={st.nac}
                                  onChange={(e) => updateStudent(st.id, "nac", e.target.value)}
                                  placeholder="arg."
                                  className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-md focus:border-orange-500 focus:bg-white transition-all outline-none text-center"
                                />
                              </div>

                              <div className="md:col-span-4 flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-605 flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-orange-500" />
                                  Diagnóstico (Breve)
                                </label>
                                <input
                                  type="text"
                                  value={st.diagnostico}
                                  onChange={(e) => updateStudent(st.id, "diagnostico", e.target.value)}
                                  placeholder="Ej: Broncoespasmo recurrente"
                                  className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-md focus:border-orange-500 focus:bg-white transition-all outline-none"
                                />
                              </div>

                              <div className="md:col-span-8 flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-605 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-orange-500" />
                                  Domicilio Real del Alumno
                                </label>
                                <input
                                  type="text"
                                  value={st.domicilio}
                                  onChange={(e) => updateStudent(st.id, "domicilio", e.target.value)}
                                  placeholder="Av. Gaona 803 - 1° Plan A."
                                  className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-md focus:border-orange-500 focus:bg-white transition-all outline-none"
                                />
                              </div>

                              <div className="md:col-span-4 flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-650 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-orange-500" />
                                  Teléfono (Acompañante)
                                </label>
                                <input
                                  type="text"
                                  value={st.telefono}
                                  onChange={(e) => updateStudent(st.id, "telefono", e.target.value)}
                                  placeholder="11-8888-2002"
                                  className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-md focus:border-orange-500 focus:bg-white transition-all outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* GRID SPLIT FOR FRENTE & DORSO DETAILS */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
                            
                            {/* BLOCK B: ESPECÍFICO FRENTE (PÁG 1) */}
                            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-250/30 flex flex-col gap-3">
                              <div className="flex justify-between items-center border-b border-amber-200/50 pb-1.5">
                                <h5 className="text-[10px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                                  Asistencia Física (Frente - Pág 1)
                                </h5>

                                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-0.5 rounded border border-amber-200/60 shadow-3xs hover:bg-amber-50 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={st.incluirFrente}
                                    onChange={(e) => updateStudent(st.id, "incluirFrente", e.target.checked)}
                                    className="rounded text-amber-600 focus:ring-amber-500 w-3 h-3 cursor-pointer"
                                  />
                                  <span className="text-[10px] text-amber-950 font-bold select-none cursor-pointer">Incluir en Pág 1</span>
                                </label>
                              </div>

                              <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${st.incluirFrente ? 'opacity-100' : 'opacity-40 select-none pointer-events-none'}`}>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Faltas (Aus.)</label>
                                  <input
                                    type="text"
                                    value={st.frenteAus}
                                    onChange={(e) => updateStudent(st.id, "frenteAus", e.target.value)}
                                    placeholder="Ej: -"
                                    className="w-full text-center text-xs font-semibold px-2 py-1.5 border border-amber-205/65 rounded shadow-3xs outline-none bg-white focus:border-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Clases (Pres.)</label>
                                  <input
                                    type="text"
                                    value={st.frentePres}
                                    onChange={(e) => updateStudent(st.id, "frentePres", e.target.value)}
                                    placeholder="Ej: 3"
                                    className="w-full text-center text-xs font-semibold px-2 py-1.5 border border-amber-205/65 rounded shadow-3xs outline-none bg-white focus:border-amber-500"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Horas/Días de Atención Frente</label>
                                  <input
                                    type="text"
                                    value={st.frenteHorario}
                                    onChange={(e) => updateStudent(st.id, "frenteHorario", e.target.value)}
                                    placeholder="Ej: Martes y jueves 08:00 a 10:00"
                                    className="w-full text-xs font-semibold px-2.5 py-1.5 border border-amber-205/65 rounded shadow-3xs outline-none bg-white focus:border-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Calific.</label>
                                  <input
                                    type="text"
                                    value={st.frenteCalif}
                                    onChange={(e) => updateStudent(st.id, "frenteCalif", e.target.value)}
                                    placeholder="Calif"
                                    className="w-full text-center text-xs font-semibold px-2 py-1.5 border border-amber-205/65 rounded shadow-3xs outline-none bg-white focus:border-amber-500"
                                  />
                                </div>
                                <div className="col-span-2 mt-1">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nota / Fecha de Ingreso/Egreso</label>
                                  <textarea
                                    value={st.frenteObservaciones}
                                    onChange={(e) => updateStudent(st.id, "frenteObservaciones", e.target.value)}
                                    placeholder="Escriba comentarios específicos para el frente..."
                                    rows={1}
                                    className="w-full text-xs font-semibold px-2.5 py-1.5 border border-amber-205/65 rounded shadow-3xs outline-none bg-white focus:border-amber-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* BLOCK C: ESPECÍFICO DORSO (PÁG 2) */}
                            <div className="bg-orange-50/40 p-4 rounded-xl border border-orange-250/30 flex flex-col gap-3">
                              <div className="flex justify-between items-center border-b border-orange-200/50 pb-1.5">
                                <h5 className="text-[10px] font-bold text-orange-950 uppercase tracking-widest flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-orange-700" />
                                  Horario de Trabajo (Dorso - Pág 2)
                                </h5>

                                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-0.5 rounded border border-orange-200/60 shadow-3xs hover:bg-orange-50 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={st.incluirDorso}
                                    onChange={(e) => updateStudent(st.id, "incluirDorso", e.target.checked)}
                                    className="rounded text-orange-600 focus:ring-orange-500 w-3 h-3 cursor-pointer"
                                  />
                                  <span className="text-[10px] text-orange-950 font-bold select-none cursor-pointer">Incluir en Pág 2</span>
                                </label>
                              </div>

                              <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${st.incluirDorso ? 'opacity-100' : 'opacity-40 select-none pointer-events-none'}`}>
                                <div className="col-span-2 font-semibold">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Días del Cronograma</label>
                                  <input
                                    type="text"
                                    value={st.dorsoDias}
                                    onChange={(e) => updateStudent(st.id, "dorsoDias", e.target.value)}
                                    placeholder="Ej: Martes y jueves"
                                    className="w-full text-xs font-semibold px-2.5 py-1.5 border border-orange-205/50 rounded shadow-3xs outline-none bg-white focus:border-orange-500"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Horas Ejecutadas</label>
                                  <input
                                    type="text"
                                    value={st.dorsoHoras}
                                    onChange={(e) => updateStudent(st.id, "dorsoHoras", e.target.value)}
                                    placeholder="Ej: 08:00 a 10:00 hs."
                                    className="w-full text-xs font-semibold px-2.5 py-1.5 border border-orange-205/50 rounded shadow-3xs outline-none bg-white focus:border-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Total de Horas</label>
                                  <input
                                    type="text"
                                    value={st.dorsoTotalHoras}
                                    onChange={(e) => updateStudent(st.id, "dorsoTotalHoras", e.target.value)}
                                    placeholder="Ej: 8"
                                    className="w-full text-center text-xs font-semibold px-2.5 py-1.5 border border-orange-205/50 rounded shadow-3xs outline-none bg-white focus:border-orange-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Student button */}
            <div className="flex justify-start mt-1">
              <button
                type="button"
                onClick={addStudent}
                className="flex items-center gap-2 px-5 py-3 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 shadow-sm hover:shadow active:scale-95 transition-all w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                Añadir Alumno a la Nómina
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: ASISTENCIA DOCENTE Y OBSERVACIONES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setSecAsistenciaOpen(!secAsistenciaOpen)}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                3. Asistencias Docente y Observaciones
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Datos globales de clases dadas, firmas y comentarios finales para Frente y Dorso.
              </p>
            </div>
          </div>
          {secAsistenciaOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {secAsistenciaOpen && (
          <div className="p-5 flex flex-col gap-6 bg-white animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Asistencia Frente (Pág 1) */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-250/30 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-1.5">
                  <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                    Asistencia Docente (Frente / Pág 1)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAutoFillAsistenciaDocente}
                    className="text-[10px] text-amber-700 font-bold hover:underline flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Autocompletar estándar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600">Clases Dadas</label>
                    <input
                      type="text"
                      value={data.asistenciaClasesDadas}
                      onChange={(e) => updateField("asistenciaClasesDadas", e.target.value)}
                      placeholder="Ej: 20."
                      className="w-full text-xs font-semibold px-2.5 py-2 border border-amber-200/50 rounded bg-white shadow-3xs outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600">Asistencias</label>
                    <input
                      type="text"
                      value={data.asistenciaAsistencias}
                      onChange={(e) => updateField("asistenciaAsistencias", e.target.value)}
                      placeholder="Ej: 7 días"
                      className="w-full text-xs font-semibold px-2.5 py-2 border border-amber-200/50 rounded bg-white shadow-3xs outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600">Días Hábiles</label>
                    <input
                      type="text"
                      value={data.asistenciaDiasHabiles}
                      onChange={(e) => updateField("asistenciaDiasHabiles", e.target.value)}
                      placeholder="Ej: 11 días."
                      className="w-full text-xs font-semibold px-2.5 py-2 border border-amber-200/50 rounded bg-white shadow-3xs outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600">Inasistencias / Licencias</label>
                    <input
                      type="text"
                      value={data.asistenciaLicencias}
                      onChange={(e) => updateField("asistenciaLicencias", e.target.value)}
                      placeholder="Ej: ninguna"
                      className="w-full text-xs font-semibold px-2.5 py-2 border border-amber-200/50 rounded bg-white shadow-3xs outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[10px] font-bold text-slate-600">Observaciones Generales de Asistencia (Maestro)</label>
                  <textarea
                    rows={3}
                    value={data.asistenciaObservaciones}
                    onChange={(e) => updateField("asistenciaObservaciones", e.target.value)}
                    placeholder="Instrucciones especiales, reuniones o detalles de clases dadas..."
                    className="w-full text-xs font-semibold px-2.5 py-2 border border-amber-200/50 rounded bg-white shadow-3xs outline-none focus:border-amber-400 leading-normal"
                  />
                </div>
              </div>

              {/* Horario Dorso (Pág 2) */}
              <div className="bg-orange-50/40 p-4 rounded-xl border border-orange-250/30 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-3">
                  <div className="border-b border-orange-200/50 pb-1.5">
                    <h4 className="text-[10px] font-bold text-orange-850 uppercase tracking-widest">
                      Información del Horario (Dorso / Pág 2)
                    </h4>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600">Observaciones del Dorso</label>
                    <textarea
                      rows={4}
                      value={data.dorsoObservaciones}
                      onChange={(e) => updateField("dorsoObservaciones", e.target.value)}
                      placeholder="Se anotan indicaciones de cargo o notas extras del horario global institucional..."
                      className="w-full text-xs font-semibold px-2.5 py-2 border border-orange-200/50 rounded bg-white shadow-3xs outline-none focus:border-orange-500 leading-normal"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-lg border border-orange-100/50 text-[10px] text-slate-500 leading-relaxed font-sans">
                  <strong>Recordatorio Importante GCBA:</strong> En el dorso se asienta el horario de trabajo completo real que figura en su Declaración Jurada (DDJJ) de la Escuela, no sólo las horas de atención específicas de cada alumno individual.
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
