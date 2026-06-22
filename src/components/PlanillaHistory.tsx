/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HistoryEntry, PlanillaData } from "../types";
import PlanillaPreview from "./PlanillaPreview";
import { 
  Search, 
  Calendar, 
  Briefcase, 
  User, 
  FileSpreadsheet, 
  Trash2, 
  FolderOpen, 
  Save, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  Clock, 
  SearchX,
  Users,
  Eye
} from "lucide-react";

interface PlanillaHistoryProps {
  currentData: PlanillaData;
  onLoadData: (data: PlanillaData) => void;
}

export default function PlanillaHistory({ currentData, onLoadData }: PlanillaHistoryProps) {
  // History list loaded and stored locally
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem("planilla_gcba_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Could not load history from localStorage:", e);
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingLoadEntry, setPendingLoadEntry] = useState<HistoryEntry | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<HistoryEntry | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"sheet" | "data">("sheet");
  
  // Suggest a title based on active workspace information
  useEffect(() => {
    const activeDocente = currentData.docenteNombre?.trim() || "";
    const activeMes = currentData.dorsoMesDe?.trim() || currentData.frenteMes?.trim() || "";
    const activeAnio = currentData.frenteAnio?.trim() || currentData.dorsoAnio?.trim() || "";
    
    let suggested = "Planilla";
    if (activeDocente) {
      suggested += ` - ${activeDocente}`;
    }
    if (activeMes) {
      suggested += ` (${activeMes}`;
      if (activeAnio) {
        suggested += ` ${activeAnio}`;
      }
      suggested += ")";
    } else if (activeAnio) {
      suggested += ` (${activeAnio})`;
    }
    
    setSaveTitle(suggested);
  }, [currentData]);

  // Persist history to localStorage
  const saveHistoryToStorage = (updatedHistory: HistoryEntry[]) => {
    try {
      localStorage.setItem("planilla_gcba_history", JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (e) {
      console.error("Could not save history to localStorage:", e);
    }
  };

  // Create current planilla state snapshot
  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    const newEntry: HistoryEntry = {
      id: "hist_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      title: saveTitle.trim(),
      savedAt: new Date().toISOString(),
      docenteNombre: currentData.docenteNombre || "Sin docente asignado",
      cargo: currentData.cargo || "Sin cargo asignado",
      periodoMes: currentData.dorsoMesDe || currentData.frenteMes || "S/M",
      periodoAnio: currentData.frenteAnio || currentData.dorsoAnio || "S/A",
      studentsCount: currentData.estudiantes.length,
      data: JSON.parse(JSON.stringify(currentData)) // Deep clone current data copy
    };

    const updated = [newEntry, ...history];
    saveHistoryToStorage(updated);
    
    // Show quick success visual confirmation
    setShowSaveConfirm(true);
    setTimeout(() => {
      setShowSaveConfirm(false);
    }, 3000);
  };

  // Perform load action with safe confirmation
  const handleConfirmLoad = () => {
    if (!pendingLoadEntry) return;
    onLoadData(pendingLoadEntry.data);
    setShowLoadModal(false);
    setPendingLoadEntry(null);
  };

  const handleTriggerLoad = (entry: HistoryEntry) => {
    setPendingLoadEntry(entry);
    setShowLoadModal(true);
  };

  // Perform delete action
  const handleConfirmDelete = () => {
    if (!pendingDeleteEntry) return;
    const updated = history.filter(h => h.id !== pendingDeleteEntry.id);
    saveHistoryToStorage(updated);
    setShowDeleteModal(false);
    setPendingDeleteEntry(null);
  };

  const handleTriggerDelete = (entry: HistoryEntry) => {
    setPendingDeleteEntry(entry);
    setShowDeleteModal(true);
  };

  // Filtering based on search query
  const filteredHistory = history.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.docenteNombre.toLowerCase().includes(q) ||
      item.cargo.toLowerCase().includes(q) ||
      item.periodoMes.toLowerCase().includes(q) ||
      item.periodoAnio.toLowerCase().includes(q)
    );
  });

  // Formatting timestamp for human display in Spanish
  const formatSavedDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " hs";
    } catch (e) {
      return "Fecha desconocida";
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      
      {/* Save Active State Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
            <Save className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Guardar Planilla Actual en Historial</h2>
            <p className="text-[11px] text-slate-500 font-medium">Congela el estado actual de los cargadores para recuperarlo o re-duplicarlo el mes siguiente.</p>
          </div>
        </div>

        <form onSubmit={handleSaveCurrent} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full flex flex-col gap-1.5">
              <label htmlFor="save-title-input" className="text-[11px] font-bold text-slate-700 ml-0.5">Nombre / Identificación del Historial</label>
              <input
                id="save-title-input"
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Ej. Planilla - Mayo 2026 (Maestro Carlos)"
                required
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-205 focus:border-orange-500 focus:bg-white rounded-xl placeholder:text-slate-400 transition-all outline-none"
              />
            </div>
            
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              Guardar Copia
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex items-center gap-2 leading-relaxed">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>
              <strong>Consejo inteligente:</strong> Guardar una copia te permite mantener todas las planillas de meses anteriores archivadas. Si el mes que viene es el mismo docente y los mismos alumnos, solo tienes que <strong>"Cargar"</strong> la planilla guardada, cambiar las fechas, ¡y listo!
            </span>
          </div>

          {showSaveConfirm && (
            <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold p-3 border border-emerald-200 rounded-xl flex items-center gap-2 animate-pulse">
              <Check className="w-4 h-4 text-emerald-600" />
              ¡Planilla guardada correctamente en tu historial local! La verás listada abajo.
            </div>
          )}
        </form>
      </section>

      {/* History List section */}
      <section className="flex flex-col gap-4">
        
        {/* Search and metadata row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              Historial de Planillas Guardadas 
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {history.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Buscá, consultá y cargá planillas registradas en el dispositivo.</p>
          </div>

          {history.length > 0 && (
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por docente, mes o título..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 focus:border-orange-500 rounded-xl placeholder:text-slate-400 opacity-90 hover:opacity-100 transition-all outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {/* List render */}
        {history.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center text-center gap-4">
            <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <div className="max-w-md">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">No hay planillas en el historial</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Aún no has guardado ninguna planilla en este navegador. Escribe la planilla del mes en el editor y haz clic en <strong>"Guardar Copia"</strong> arriba para registrar tu primera plantilla. Esto guardará toda la información: docente, firmas, observaciones y los alumnos con sus asistencias correspondientes.
              </p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          /* Search Empty State */
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center gap-3">
            <SearchX className="w-6 h-6 text-slate-400" />
            <div>
              <p className="text-xs font-bold text-slate-700">No se encontraron resultados para "{searchTerm}"</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Probá buscando con otros términos como el apellido del docente o un mes.</p>
            </div>
            <button 
              onClick={() => setSearchTerm("")} 
              className="text-[11px] font-bold text-orange-600 hover:underline hover:text-orange-700 cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          /* Desktop & Mobile Responsive Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all">
            {filteredHistory.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <div 
                  key={entry.id} 
                  className={`bg-white rounded-2xl border transition-all duration-300 p-4 md:p-5 flex flex-col justify-between ${
                    isExpanded 
                      ? "border-orange-400 ring-2 ring-orange-50/50 shadow-md md:col-span-2 lg:col-span-3 bg-orange-50/5" 
                      : "border-slate-200 hover:border-orange-200 hover:shadow-xs bg-white"
                  }`}
                >
                  <div className="w-full">
                    {/* Card Header Row */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex flex-col gap-1 max-w-[75%]">
                        <span className="text-[9px] font-bold text-orange-605 tracking-wider uppercase">REGISTRO GUARDADO</span>
                        <h3 className="text-xs font-bold text-slate-900 leading-snug" title={entry.title}>
                          {entry.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-lg font-mono shrink-0">
                        {entry.periodoMes} {entry.periodoAnio}
                      </span>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex flex-col gap-1.5 py-3 border-t border-b border-slate-100 text-[11px] mb-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">
                          {entry.docenteNombre}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-600">
                          {entry.cargo}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">
                          <strong>{entry.studentsCount}</strong> estudiantes en nómina
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Expandable Preview Area */}
                    {isExpanded && (
                      <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-205 flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-200">
                        {/* Tab Selector inside Card Details */}
                        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl self-start">
                          <button
                            type="button"
                            onClick={() => setPreviewMode("sheet")}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              previewMode === "sheet"
                                ? "bg-white text-orange-700 shadow-3xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Vista Planilla Original (Frente/Dorso A4)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewMode("data")}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              previewMode === "data"
                                ? "bg-white text-orange-700 shadow-3xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            Ficha de Datos Resumida
                          </button>
                        </div>

                        {previewMode === "sheet" ? (
                          /* Visual Planilla Sheet */
                          <div className="w-full bg-slate-150/50 p-3 rounded-xl border border-slate-200 overflow-hidden">
                            <div className="text-[10px] font-bold text-slate-500 mb-3 font-sans flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-orange-600" />
                              Esta es una vista previa estática del archivo original guardado. No modificará tus cargadores actuales:
                            </div>
                            <PlanillaPreview data={entry.data} />
                          </div>
                        ) : (
                          /* Structured Summary list */
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Left Column: Quick Header Specs */}
                            <div className="md:col-span-5 flex flex-col gap-2.5">
                              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-250 pb-1">DATOS DE LA ESCUELA</h4>
                              
                              <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                                <div>
                                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Escuela N°</span>
                                  <span className="font-semibold text-slate-800">{entry.data.escuelaNro || "Sin especificar"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block text-[9px] uppercase">D.E. (Distrito)</span>
                                  <span className="font-semibold text-slate-800">{entry.data.distritoEscolar || "Sin especificar"}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Establecimiento / Hospital</span>
                                  <span className="font-semibold text-slate-800">{entry.data.establecimientoLugar || "Sin especificar"}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Observaciones del Dorso</span>
                                  <span className="font-medium text-slate-600 block bg-white p-2 rounded-lg border border-slate-150 text-[10px] italic leading-normal max-h-24 overflow-y-auto">
                                    {entry.data.dorsoObservaciones || "Sin observaciones guardadas."}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right Column: Students Roll Call */}
                            <div className="md:col-span-7 flex flex-col gap-2.5">
                              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-250 pb-1">ESTUDIANTES EN ESTA PLANILLA</h4>
                              
                              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                                {entry.data.estudiantes.filter(st => st.nomina?.trim() || st.diagnostico?.trim()).map((st, sidx) => (
                                  <div key={st.id || sidx} className="p-2.5 flex items-center justify-between text-[11px] gap-2 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-1.5 shrink-0 max-w-[50%]">
                                      <span className="font-mono text-slate-400 w-4 inline-block text-right">{sidx + 1}.</span>
                                      <span className="font-bold text-slate-800 truncate" title={st.nomina}>
                                        {st.nomina}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 font-medium font-sans text-slate-600 text-[10px]">
                                      {st.grado && <span className="bg-slate-50 px-1 py-0.5 rounded border border-slate-100">Grado: <strong>{st.grado}</strong></span>}
                                      {st.edad && <span className="bg-slate-50 px-1 py-0.5 rounded border border-slate-100">Edad: <strong>{st.edad}</strong></span>}
                                      {st.diagnostico && <span className="max-w-[100px] truncate bg-slate-50 px-1 py-0.5 rounded border border-slate-100" title={st.diagnostico}>Diag: {st.diagnostico}</span>}
                                      
                                      {st.incluirFrente ? (
                                        <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded" title="Aparece en Frente">FRENTE</span>
                                      ) : null}

                                      {st.incluirDorso ? (
                                        <span className="text-[9px] font-bold bg-orange-50 text-orange-850 border border-orange-200 px-1.5 py-0.5 rounded" title="Aparece en Dorso">DORSO</span>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                                {entry.data.estudiantes.filter(st => st.nomina?.trim()).length === 0 && (
                                  <div className="p-4 text-center text-slate-400 italic text-[11px]">
                                    No hay estudiantes con nombres cargados en la planilla guardada.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive action note */}
                        <div className="text-[10px] font-bold text-orange-800 bg-orange-50/80 p-2.5 rounded-lg border border-orange-100 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                          <span>¡Tus datos están seguros! Si querés editar o imprimir esta planilla guardada hoy, pulsá <strong>"Cargar Planilla en Pantalla"</strong> abajo.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Foot Toolbar buttons */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold gap-2">
                    <div className="flex items-center gap-1 font-medium select-none">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{formatSavedDate(entry.savedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-sans">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className={`px-3 py-1.5 font-bold rounded-lg transition-all text-[11px] cursor-pointer border ${
                          isExpanded 
                            ? "bg-slate-200 border-slate-300 text-slate-800"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                        }`}
                        title="Ver listado de alumnos y detalles"
                      >
                        {isExpanded ? "Cerrar Detalles" : "Ver Detalles"}
                      </button>

                      <button
                        onClick={() => handleTriggerLoad(entry)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs text-[11px]"
                        title="Cargar esta planilla en el Formulario"
                      >
                        <FolderOpen className="w-3 h-3 text-white" />
                        <span>Cargar Planilla en Pantalla</span>
                      </button>

                      <button
                        onClick={() => handleTriggerDelete(entry)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100"
                        title="Eliminar de historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* Confirmation Load Modal */}
      {showLoadModal && pendingLoadEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-2.5 rounded-full text-orange-600 border border-amber-100">
                  <FolderOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">¿Cargar planilla en el Editor?</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{pendingLoadEntry.title}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-bold">
                    Tus planillas históricas en la lista están 100% seguras y NUNCA se borrarán ni modificarán al hacer esto.
                  </p>
                </div>
                
                <div className="h-px bg-slate-200"></div>

                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    Al confirmar, simplemente traemos una copia de esos datos a la pestaña <strong className="text-slate-900">"Formulario de Carga"</strong> para que puedas modificarlos o imprimirlos hoy. Reemplazará lo que ves actualmente en tu pantalla de redacción.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoadModal(false);
                    setPendingLoadEntry(null);
                  }}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLoad}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Confirmar y Cargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      {showDeleteModal && pendingDeleteEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2.5 rounded-full text-red-600 border border-red-100">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-red-900 uppercase">¿Eliminar del Historial?</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{pendingDeleteEntry.title}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                ¿Estás seguro de que deseas eliminar esta planilla de tu historial local? Esta acción no se puede deshacer de forma automática.
              </p>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPendingDeleteEntry(null);
                  }}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  No, mantener
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Sí, eliminar para siempre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
