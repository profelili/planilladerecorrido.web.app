/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { PlanillaData, Student } from "../types";
import BuenosAiresEscudo from "./BuenosAiresEscudo";
import { Maximize2, Sliders } from "lucide-react";

interface PlanillaPreviewProps {
  data: PlanillaData;
}

export default function PlanillaPreview({ data }: PlanillaPreviewProps) {
  // Ensure we always have exactly 8 rows in the table for consistent layout,
  // but if we have empty rows, we can reduce the number of rows (to 7 or 6) on the front page (frente)
  // as requested by the user, so that the signature area (firma y aclaración) doesn't overflow.
  const padStudents = (studentsList: Student[], isFrente: boolean = false): (Student | null)[] => {
    const list = [...studentsList];
    let maxRows = 8;

    if (isFrente) {
      if (list.length <= 6) {
        maxRows = 6; // Eliminate 2 empty rows
      } else if (list.length === 7) {
        maxRows = 7; // Eliminate 1 empty row
      }
    }

    while (list.length < maxRows) {
      list.push(null);
    }
    return list.slice(0, Math.max(maxRows, studentsList.length));
  };

  const frenteStudents = padStudents(data.estudiantes.filter(s => s.incluirFrente), true);
  const dorsoStudents = padStudents(data.estudiantes.filter(s => s.incluirDorso), false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<"fit" | "50" | "75" | "100" | "120">("fit");
  const [computedScale, setComputedScale] = useState(1);

  // Measure and compute ideal scale based on the available container width
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      if (zoomMode === "fit") {
        // Find visible width of this preview card context
        const parentWidth = containerRef.current.parentElement?.clientWidth || containerRef.current.clientWidth;
        // Accurate horizontal boundary: A4 landscape is 1123px. Add some margins (e.g. 48px comfort gap)
        const targetWidth = 1123 + 48;
        const newScale = Math.min(Math.max(parentWidth / targetWidth, 0.4), 1.15); // limit min boundary to 40% and max to 115%
        setComputedScale(newScale);
      } else {
        setComputedScale(parseInt(zoomMode, 10) / 100);
      }
    };

    updateScale();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      observer = new ResizeObserver(() => {
        updateScale();
      });
      if (containerRef.current.parentElement) {
        observer.observe(containerRef.current.parentElement);
      } else {
        observer.observe(containerRef.current);
      }
    }

    window.addEventListener("resize", updateScale);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [zoomMode]);

  // A4 landscape sizing
  const targetWidth = 1123;
  const targetHeight = 794;

  const pageContainerStyle = (scale: number): React.CSSProperties => ({
    width: `${Math.round(targetWidth * scale)}px`,
    height: `${Math.round(targetHeight * scale)}px`,
    position: "relative" as const,
    overflow: "hidden" as const,
    borderRadius: "8px",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  });

  const sheetStyle = (scale: number): React.CSSProperties => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "297mm",
    height: "210mm",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    boxSizing: "border-box",
  });

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full bg-slate-100/50 rounded-2xl border border-slate-200/80 p-4 gap-6 no-print">
      
      {/* Zoom Adjustments Toolbar */}
      <div className="flex flex-wrap items-center justify-between w-full bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-xs gap-3 no-print">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-bold text-slate-700">Zoom de la Planilla:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 font-sans">
          <button
            onClick={() => setZoomMode("fit")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              zoomMode === "fit"
                ? "bg-orange-600 text-white shadow-xs font-bold"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Ajustar al Ancho
          </button>
          
          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          
          <button
            onClick={() => setZoomMode("50")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              zoomMode === "50"
                ? "bg-orange-600 text-white shadow-xs font-bold"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
            }`}
          >
            50%
          </button>
          
          <button
            onClick={() => setZoomMode("75")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              zoomMode === "75"
                ? "bg-orange-600 text-white shadow-xs font-bold"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
            }`}
          >
            75%
          </button>
          
          <button
            onClick={() => setZoomMode("100")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              zoomMode === "100"
                ? "bg-orange-605 bg-orange-600 text-white shadow-xs font-bold"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
            }`}
          >
            100% (A4 Real)
          </button>

          <button
            onClick={() => setZoomMode("120")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              zoomMode === "120"
                ? "bg-orange-600 text-white shadow-xs font-bold"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
            }`}
          >
            120%
          </button>
        </div>
        
        <div className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 shadow-3xs">
          Escala: {Math.round(computedScale * 100)}%
        </div>
      </div>

      {/* Pages Workspace Container */}
      <div className="flex flex-col gap-10 items-center w-full py-4 bg-slate-50/50 rounded-xl overflow-x-auto border border-dashed border-slate-200 shadow-inner">
        
        {/* PAGE 1: FRENTE - INSCRIPCIÓN Y ASISTENCIA */}
        <div className="flex flex-col items-center">
          <h3 className="text-xs font-bold text-slate-500 mb-2 font-sans tracking-tight uppercase">Pág 1: Frente (Asistencia del Mes Finalizado)</h3>
          
          <div 
            className="planilla-page-wrapper border border-slate-300 shadow-md bg-white select-none relative"
            style={pageContainerStyle(computedScale)}
          >
            <div
              id="planilla-frente"
              className="planilla-sheet-inner relative bg-white text-black p-[12mm] flex flex-col justify-between"
              style={{
                ...sheetStyle(computedScale),
                fontFamily: "Times New Roman, serif, system-ui",
                boxSizing: "border-box",
              }}
            >
              <div>
            {/* Top Header Grid */}
            <div className="grid grid-cols-12 border-t-2 border-x-2 border-b-2 border-black">
              {/* GCBA Column */}
              <div className="col-span-2 border-r-2 border-black flex flex-col items-center justify-center py-2 h-[85px]">
                <BuenosAiresEscudo className="w-12 h-12" />
                <span className="text-[10px] font-bold tracking-wider mt-1">G.C.B.A</span>
              </div>

              {/* Title Column */}
              <div className="col-span-8 border-r-2 border-black flex flex-col items-center justify-between py-2 px-4 h-[85px]">
                <div className="text-center">
                  <div className="text-[12px] font-bold tracking-[0.1em] leading-tight font-sans">
                    ESCUELA DOMICILIARIA - SECCIÓN DOMICILIOS
                  </div>
                  <div className="text-[11px] font-bold tracking-[0.15em] leading-tight font-sans mt-0.5">
                    INSCRIPCIÓN Y ASISTENCIA
                  </div>
                </div>
                <div className="text-[10px] w-full flex justify-between items-end font-sans mt-2">
                  <span><strong>MINISTERIO de EDUCACIÓN</strong></span>
                  <span><strong>ESCUELA DOMICILIARIA Nº 1</strong></span>
                  <span>Maestro/a: <span className="underline decoration-dotted underline-offset-4 font-bold text-slate-800 text-[12px] px-1">{data.docenteNombre || "................................................"}</span></span>
                </div>
              </div>

              {/* Date & Turn Column */}
              <div className="col-span-2 flex flex-col h-[85px]">
                <div className="grid grid-cols-3 border-b-2 border-black text-center text-[8px] font-bold h-1/2">
                  <div className="border-r border-black flex items-center justify-center flex-col py-1">
                    <span>DÍA</span>
                    <span className="text-[12px] mt-0.5 font-bold h-5 flex items-center">{data.frenteDia || "  "}</span>
                  </div>
                  <div className="border-r border-black flex items-center justify-center flex-col py-1">
                    <span>MES</span>
                    <span className="text-[12px] mt-0.5 font-bold h-5 flex items-center">{data.frenteMes || "  "}</span>
                  </div>
                  <div className="flex items-center justify-center flex-col py-1">
                    <span>AÑO</span>
                    <span className="text-[12px] mt-0.5 font-bold h-5 flex items-center">{data.frenteAnio || "  "}</span>
                  </div>
                </div>
                <div className="flex items-center px-2 justify-start h-1/2 text-[10px] font-bold uppercase font-sans">
                  <span>TURNO: <span className="text-[12px] pl-1 font-bold text-slate-800">{data.turno}</span></span>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <table className="w-full text-left border-collapse border-b-2 border-x-2 border-black table-fixed">
              <thead>
                <tr className="border-b-2 border-black text-center text-[10px] font-bold">
                  <th className="w-[4%] border-r border-black py-1.5 leading-tight">Nº de orden</th>
                  <th className="w-[20%] border-r border-black py-1.5">Nómina</th>
                  <th className="w-[8%] border-r border-black py-1.5">grado</th>
                  <th className="w-[5%] border-r border-black py-1.5">edad</th>
                  <th className="w-[5%] border-r border-black py-1.5">Nac.</th>
                  <th className="w-[15%] border-r border-black py-1.5">Diagnóstico</th>
                  <th className="w-[20%] border-r border-black py-1.5">Domicilio y teléfono</th>
                  <th className="w-[8%] border-r border-black p-0">
                    <div className="border-b border-black py-0.5">asist. alum</div>
                    <div className="flex text-[8px]">
                      <span className="w-1/2 border-r border-black py-0.5">Aus.</span>
                      <span className="w-1/2 py-0.5">Pres.</span>
                    </div>
                  </th>
                  <th className="w-[12%] border-r border-black py-1.5">horario</th>
                  <th className="w-[5%] border-r border-black py-1.5">Calif.</th>
                  <th className="w-[18%] py-1.5">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {frenteStudents.map((st, idx) => {
                  const num = idx + 1;
                  if (!st) {
                    return (
                      <tr key={`empty-frente-${idx}`} className="border-b border-black/30 h-8 text-[9px]">
                        <td className="border-r border-black text-center font-bold text-gray-400">{num}</td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1 text-center"></td>
                        <td className="border-r border-black px-1 text-center"></td>
                        <td className="border-r border-black px-1 text-center"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black p-0">
                          <div className="flex h-full text-center">
                            <span className="w-1/2 border-r border-black/30"></span>
                            <span className="w-1/2"></span>
                          </div>
                        </td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1 text-center"></td>
                        <td className="px-1"></td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={st.id} className="border-b border-black text-[12px] min-h-8 align-middle bg-white hover:bg-slate-50 transition-colors">
                      <td className="border-r border-black text-center font-bold py-1">{st.orden || num}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans font-medium text-slate-900 whitespace-normal break-words">{st.nomina}</td>
                      <td className="border-r border-black px-1 py-1 text-center font-sans whitespace-normal break-words">{st.grado}</td>
                      <td className="border-r border-black px-1 py-1 text-center font-sans whitespace-normal break-words">{st.edad}</td>
                      <td className="border-r border-black px-1 py-1 text-center font-sans italic whitespace-normal break-words">{st.nac}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans text-[12px] leading-tight whitespace-normal break-words" title={st.diagnostico}>{st.diagnostico}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans text-[12px] leading-tight whitespace-normal break-words" title={`${st.domicilio} - ${st.telefono}`}>
                        {st.domicilio} {st.telefono && ` - ${st.telefono}`}
                      </td>
                      <td className="border-r border-black p-0 py-1">
                        <div className="flex h-full text-center divide-x divide-black">
                          <span className="w-1/2 flex items-center justify-center font-sans font-semibold text-red-600">{st.frenteAus || "-"}</span>
                          <span className="w-1/2 flex items-center justify-center font-sans font-semibold text-green-700">{st.frentePres || "-"}</span>
                        </div>
                      </td>
                      <td className="border-r border-black px-1.5 py-1 leading-tight font-sans text-[12px] whitespace-normal break-words" title={st.frenteHorario}>{st.frenteHorario}</td>
                      <td className="border-r border-black px-1 py-1 text-center font-sans font-semibold whitespace-normal break-words">{st.frenteCalif || "-"}</td>
                      <td className="px-1.5 py-1 font-sans text-[12px] leading-tight whitespace-normal break-words" title={st.frenteObservaciones}>{st.frenteObservaciones}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom section (Docente Asistencia) */}
          <div className="border-2 border-black p-4 mt-4 rounded-sm flex flex-col justify-between font-sans">
            <div className="text-[12px] font-bold border-b border-black pb-1 mb-3 tracking-wide text-slate-800">
              <u>ASISTENCIA del DOCENTE</u>
            </div>
            
            <div className="grid grid-cols-12 gap-y-2 text-[10px] leading-relaxed">
              <div className="col-span-12 flex items-baseline">
                <span className="font-bold flex-shrink-0 text-slate-700">Clases dadas:</span>
                <span className="border-b border-dashed border-gray-600 px-2 flex-grow font-semibold text-slate-950 ml-1 text-[12px]">
                  {data.asistenciaClasesDadas || "...................................................................................................................................................................................................................................."}
                </span>
              </div>
              <div className="col-span-12 flex items-baseline">
                <span className="font-bold flex-shrink-0 text-slate-700">Asistencias:</span>
                <span className="border-b border-dashed border-gray-600 px-2 flex-grow font-semibold text-slate-950 ml-1 text-[12px]">
                  {data.asistenciaAsistencias || "...................................................................................................................................................................................................................................."}
                </span>
              </div>
              <div className="col-span-12 flex items-baseline">
                <span className="font-bold flex-shrink-0 text-slate-700">Inasistencias y licencias:</span>
                <span className="border-b border-dashed border-gray-600 px-2 flex-grow font-semibold text-slate-950 ml-1 text-[12px]">
                  {data.asistenciaLicencias || "...................................................................................................................................................................................................................................."}
                </span>
              </div>
              <div className="col-span-12 flex items-baseline">
                <span className="font-bold flex-shrink-0 text-slate-700">Días hábiles:</span>
                <span className="border-b border-dashed border-gray-600 px-2 flex-grow font-semibold text-slate-950 ml-1 text-[12px]">
                  {data.asistenciaDiasHabiles || "...................................................................................................................................................................................................................................."}
                </span>
              </div>
              <div className="col-span-12 flex items-baseline">
                <span className="font-bold flex-shrink-0 text-slate-700">Observaciones:</span>
                <span className="border-b border-dashed border-gray-600 px-2 flex-grow font-medium text-slate-800 ml-1 break-all whitespace-normal break-words text-justify text-[12px]">
                  {data.asistenciaObservaciones || "...................................................................................................................................................................................................................................."}
                </span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex justify-end mt-4">
              <div className="text-center w-64 block relative">
                {data.firmaUrl && (
                  <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                    <img 
                      src={data.firmaUrl} 
                      alt="Firma" 
                      className="max-h-12 max-w-[200px] object-contain mix-blend-multiply" 
                      referrerPolicy="no-referrer"
                    />
                    {data.firmaAclaracion && (
                      <span className="text-[8px] text-gray-800 leading-none max-w-[200px] truncate block mt-[2px] font-sans font-semibold">
                        {data.firmaAclaracion}
                      </span>
                    )}
                  </div>
                )}
                <div className="border-t border-black w-full pt-1 text-[9px] font-bold uppercase tracking-wider text-slate-600 mt-14">
                  firma y aclaración
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2: DORSO - HORARIO */}
      <div className="flex flex-col items-center">
        <h3 className="text-xs font-bold text-slate-500 mb-2 font-sans tracking-tight uppercase">Pág 2: Dorso (Horario de Carga del Docente)</h3>
        
        <div 
          className="planilla-page-wrapper border border-slate-300 shadow-md bg-white select-none relative"
          style={pageContainerStyle(computedScale)}
        >
          <div
            id="planilla-dorso"
            className="planilla-sheet-inner relative bg-white text-black p-[12mm] flex flex-col justify-between"
            style={{
              ...sheetStyle(computedScale),
              fontFamily: "Times New Roman, serif, system-ui",
              boxSizing: "border-box",
            }}
          >
            <div>
            {/* Top Info Header Grid */}
            <div className="grid grid-cols-12 border-2 border-black font-sans mb-3 text-[10px]">
              {/* Left Details */}
              <div className="col-span-10 p-3 flex flex-col justify-between gap-y-1.5 leading-snug">
                <div className="flex justify-between items-center">
                  <span>
                    <strong>MAESTRA/O: </strong>
                    <span className="underline decoration-dotted underline-offset-4 font-bold text-slate-900 px-1 text-[12px]">
                      {data.docenteNombre || "..........................................................................."}
                    </span>
                  </span>
                  <span>
                    <strong>CARGO: </strong>
                    <span className="underline decoration-dotted underline-offset-4 font-bold text-slate-900 px-1 text-[12px]">
                      {data.cargo || "....................................................."}
                    </span>
                  </span>
                  <span>
                    <strong>MÓDULO: </strong>
                    <span className="underline decoration-dotted underline-offset-4 font-bold text-slate-900 px-1 text-[12px]">
                      {data.modulo || "..............................."}
                    </span>
                  </span>
                </div>
                
                <div className="text-[12px] font-bold text-center w-full uppercase tracking-widest mt-1">
                  HORARIO
                </div>
                
                <div className="text-[10px] font-bold text-left tracking-wide mt-0.5 text-slate-700">
                  ESCUELA DOMICILIARIA Nº 1.
                </div>
              </div>

              {/* Right Date Details */}
              <div className="col-span-2 border-l border-black flex flex-col justify-between">
                {/* Date Grid */}
                <div className="grid grid-cols-3 border-b border-black text-center text-[8px] font-bold h-1/3">
                  <div className="border-r border-black flex items-center justify-center flex-col py-0.5">
                    <span>DÍA</span>
                    <span className="text-[12px] font-bold">{data.dorsoDia || "  "}</span>
                  </div>
                  <div className="border-r border-black flex items-center justify-center flex-col py-0.5">
                    <span>MES</span>
                    <span className="text-[12px] font-bold">{data.dorsoMes || "  "}</span>
                  </div>
                  <div className="flex items-center justify-center flex-col py-0.5">
                    <span>AÑO</span>
                    <span className="text-[12px] font-bold">{data.dorsoAnio || "  "}</span>
                  </div>
                </div>
                {/* Turno */}
                <div className="border-b border-black px-2 flex items-center text-[9px] font-bold h-1/3">
                  <span>Turno: <span className="text-slate-800 text-[12px] pl-0.5">{data.turno}</span></span>
                </div>
                {/* Mes De */}
                <div className="px-2 flex items-center text-[9px] font-bold h-1/3">
                  <span>Mes de: <span className="text-slate-800 text-[12px] pl-0.5 italic">{data.dorsoMesDe || "..................."}</span></span>
                </div>
              </div>
            </div>

            {/* Dorso Table */}
            <table className="w-full text-left border-collapse border-b-2 border-x-2 border-black table-fixed">
              <thead>
                <tr className="border-y-2 border-black text-center text-[10px] font-bold">
                  <th className="w-[5%] border-r border-black py-1.5 leading-tight">Nº de Orden</th>
                  <th className="w-[28%] border-r border-black py-1.5">Nómina</th>
                  <th className="w-[15%] border-r border-black py-1.5">Días</th>
                  <th className="w-[15%] border-r border-black py-1.5">Horas</th>
                  <th className="w-[22%] border-r border-black py-1.5">Domicilio</th>
                  <th className="w-[10%] border-r border-black py-1.5">teléfono</th>
                  <th className="w-[5%] py-1.5 leading-tight">Total de horas</th>
                </tr>
              </thead>
              <tbody>
                {dorsoStudents.map((st, idx) => {
                  const num = idx + 1;
                  if (!st) {
                    return (
                      <tr key={`empty-dorso-${idx}`} className="border-b border-black/30 h-8 text-[9px]">
                        <td className="border-r border-black text-center font-bold text-gray-400">{num}</td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="border-r border-black px-1"></td>
                        <td className="text-center font-sans"></td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={st.id} className="border-b border-black text-[12px] min-h-8 align-middle bg-white hover:bg-slate-50 transition-colors">
                      <td className="border-r border-black text-center font-bold py-1">{st.orden || num}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans font-medium text-slate-900 whitespace-normal break-words">{st.nomina}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans text-[12px] leading-tight whitespace-normal break-words" title={st.dorsoDias}>{st.dorsoDias || "-"}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans text-[12px] leading-tight whitespace-normal break-words" title={st.dorsoHoras}>{st.dorsoHoras || "-"}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans text-[12px] leading-tight whitespace-normal break-words" title={st.domicilio}>{st.domicilio}</td>
                      <td className="border-r border-black px-1.5 py-1 font-sans text-[12px] whitespace-normal break-words" title={st.telefono}>{st.telefono || "-"}</td>
                      <td className="px-1 py-1 text-center font-sans font-semibold text-slate-800 whitespace-normal break-words text-[12px]">{st.dorsoTotalHoras || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Section - Dorso */}
          <div className="border border-black p-3.5 mt-4 rounded-sm flex flex-col justify-between font-sans">
            <div className="text-[10px] leading-relaxed">
              <div className="flex items-baseline mb-3">
                <span className="font-bold flex-shrink-0 text-slate-700">Observaciones:</span>
                <span className="border-b border-dashed border-gray-600 px-2 flex-grow font-medium text-slate-800 ml-1 break-all whitespace-normal break-words text-justify text-[12px]">
                  {data.dorsoObservaciones || "...................................................................................................................................................................................................................................."}
                </span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex justify-end mt-4">
              <div className="text-center w-64 block relative">
                {data.firmaUrl && (
                  <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                    <img 
                      src={data.firmaUrl} 
                      alt="Firma" 
                      className="max-h-12 max-w-[200px] object-contain mix-blend-multiply" 
                      referrerPolicy="no-referrer"
                    />
                    {data.firmaAclaracion && (
                      <span className="text-[8px] text-gray-800 leading-none max-w-[200px] truncate block mt-[2px] font-sans font-semibold">
                        {data.firmaAclaracion}
                      </span>
                    )}
                  </div>
                )}
                <div className="border-t border-black w-full pt-1 text-[9px] font-bold uppercase tracking-wider text-slate-600 mt-14">
                  firma y aclaración
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
