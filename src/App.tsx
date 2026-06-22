/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PlanillaData } from "./types";
import { examplePlanillaData, initialEmptyData } from "./data";
import PlanillaForm from "./components/PlanillaForm";
import PlanillaPreview from "./components/PlanillaPreview";
import PlanillaHistory from "./components/PlanillaHistory";
import ShareModal from "./components/ShareModal";
import { generatePdfFromHtml } from "./utils/pdfGenerator";
import { isFirebaseConfigured, loadPlanillaFromCloud } from "./lib/firebase";
import { 
  FileDown, 
  Printer, 
  Eye, 
  History, 
  Settings, 
  Sparkles, 
  BookOpen, 
  Info, 
  ShieldCheck, 
  DownloadCloud, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Share2
} from "lucide-react";

export default function App() {
  // Load initial data checking URL query parameter first, then localStorage
  const [data, setData] = useState<PlanillaData>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const shared = params.get("shared_data") || params.get("planilla_data");
        if (shared) {
          try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(shared))));
            if (decoded && (decoded.docenteNombre || decoded.estudiantes || decoded.alumnos)) {
              return decoded;
            }
          } catch (e) {
            console.warn("Could not load shared data from URL parameter:", e);
          }
        }
      }
      const saved = localStorage.getItem("planilla_gcba_data");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return examplePlanillaData;
  });

  const [activeTab, setActiveTab] = useState<"form" | "preview" | "history">("form");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState(false);
  const [showSharedBanner, setShowSharedBanner] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Cloud/Firebase state management
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [showFirebaseBanner, setShowFirebaseBanner] = useState(false);

  // Load from Firebase Firestore when ID is present in URL
  useEffect(() => {
    async function checkCloudId() {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const cloudId = params.get("id") || params.get("share_id");
      if (cloudId) {
        setIsLoadingCloud(true);
        setCloudError(null);
        try {
          if (isFirebaseConfigured()) {
            const loadedData = await loadPlanillaFromCloud(cloudId);
            setData(loadedData);
            setShowFirebaseBanner(true);
          } else {
            console.warn("Firebase not configured, cannot load short URL");
            setCloudError("La app se inició con un enlace de Firebase, pero la base de datos no está configurada aún en este entorno de AI Studio.");
          }
        } catch (error: any) {
          console.error("Error loading planilla from Firebase:", error);
          setCloudError(error.message || "Error al descargar la planilla desde la nube.");
        } finally {
          setIsLoadingCloud(false);
          // Clear query param so reload operates on draft
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("id");
            url.searchParams.delete("share_id");
            window.history.replaceState({}, document.title, url.toString());
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }
    checkCloudId();
  }, []);

  // Parse if window location held shared_data on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("shared_data") || params.get("planilla_data")) {
        setShowSharedBanner(true);
        // Clear param so subsequent saves or reloads are clean
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("shared_data");
          url.searchParams.delete("planilla_data");
          window.history.replaceState({}, document.title, url.toString());
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }, []);

  // Save changes to localStorage on data updates
  useEffect(() => {
    try {
      localStorage.setItem("planilla_gcba_data", JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, [data]);

  // Check if inside iframe and auto-trigger printing if `?print=true`
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window.self !== window.top);
      
      const params = new URLSearchParams(window.location.search);
      if (params.get("print") === "true") {
        // Clear print parameter to prevent loops on refresh
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("print");
          window.history.replaceState({}, document.title, url.toString());
        } catch (e) {
          console.warn(e);
        }
        
        // Wait slightly for mounting to finish, then trigger native print
        const timer = setTimeout(() => {
          window.focus();
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Load example data
  const handleLoadExample = () => {
    setData(examplePlanillaData);
  };

  // Clear all form data
  const handleClear = () => {
    setData(initialEmptyData);
  };

  // Export PDF calling html2canvas + jspdf
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError(null);
    try {
      await generatePdfFromHtml("planilla-frente", "planilla-dorso", data.docenteNombre);
    } catch (err: any) {
      console.error(err);
      setPdfError("Ocurrió un error al generar el PDF. Por favor, intente de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print utilizing native browser print dialog
  const handlePrint = () => {
    window.focus();
    window.print();
  };



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* Dynamic style sheet for perfect printing capability */}
      <style>{`
        @media screen {
          .print-only {
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
          }
        }
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          html, body, #root, body > div {
            background-color: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            width: auto !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            position: static !important;
            width: 297mm !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Mantener el diseño tabular de las tablas para una alineación perfecta de columnas */
          .print-only table {
            display: table !important;
            width: 100% !important;
          }
          .print-only thead {
            display: table-header-group !important;
          }
          .print-only tbody {
            display: table-row-group !important;
          }
          .print-only tr {
            display: table-row !important;
          }
          .print-only td, .print-only th {
            display: table-cell !important;
          }

          /* Forzar contenedores horizontales A4 de alta calidad para el Frente y el Dorso */
          #planilla-frente, #planilla-dorso {
            display: flex !important; /* Mantener diseño flex interno de la tarjeta */
            flex-direction: column !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 10mm !important;
            width: 297mm !important;
            height: 210mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background-color: #ffffff !important;
            transform: none !important;
            position: static !important;
          }
          
          #planilla-frente {
            page-break-after: always !important;
            break-after: page !important;
          }
          
          #planilla-dorso {
            page-break-before: always !important;
            break-before: page !important;
          }

          .planilla-page-wrapper {
            display: block !important;
            width: 297mm !important;
            height: 210mm !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            background-color: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            transform: none !important;
            position: static !important;
          }

          .planilla-sheet-inner {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: static !important;
            transform: none !important;
            width: 297mm !important;
            height: 210mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 12mm !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Main Header - hidden when printing */}
      <header className="bg-white border-b border-slate-200 py-5 px-6 shrink-0 no-print shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-xl text-white shadow-md shadow-orange-100">
              <FileDown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Planilla de recorrido Domi1
                <span className="bg-orange-50 text-orange-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-100">
                  Formato Oficial
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Escuela Domiciliaria Nº 1 - Sección Domicilios • Inscripción, Asistencia y Horario
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Share button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              title="Compartir por WhatsApp, Email o Google Drive"
            >
              <Share2 className="w-4 h-4" />
              Compartir Planilla
            </button>

            {/* Download and print controls */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:pointer-events-none"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Descargar PDF Oficial
                </>
              )}
            </button>

            {/* Only pdf generation remains in this section */}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto p-4 md:p-6 flex flex-col gap-6 no-print max-w-[1440px]">
        
        {/* Success Shared Data Imported Banner */}
        {showSharedBanner && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl text-xs gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Planilla cargada correctamente desde el enlace compartido!</strong> Puedes revisarla, editarla y generar el PDF oficial como desees.
              </span>
            </div>
            <button
              onClick={() => setShowSharedBanner(false)}
              className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Firebase Cloud Data Loaded Banner */}
        {showFirebaseBanner && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl text-xs gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Planilla descargada con éxito desde Firebase!</strong> Estás visualizando la copia de la nube. Puedes editarla libremente (estos cambios son borradores locales).
              </span>
            </div>
            <button
              onClick={() => setShowFirebaseBanner(false)}
              className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cloud Loading Error Banner */}
        {cloudError && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-xl text-xs gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 font-medium">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
              <span>
                <strong>Aviso de Firebase:</strong> {cloudError}
              </span>
            </div>
            <button
              onClick={() => setCloudError(null)}
              className="p-1 hover:bg-amber-100 rounded text-amber-700 transition-colors shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading overlay during Cloud downloads */}
        {isLoadingCloud && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center my-4 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
            <span className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
            <span className="text-sm font-bold text-slate-800">Descargando planilla desde Firestore...</span>
            <span className="text-xs text-slate-400 font-medium">Obteniendo la nómina del servidor seguro de planilladerecorrido</span>
          </div>
        )}

        {/* Navigation/View chooser - Tab Selector is always visible on top */}
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex flex-row gap-1 self-start md:w-[580px] w-full no-print">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-grow flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "form"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Eye className="w-4 h-4" />
            Formulario de Carga
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-grow flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Printer className="w-4 h-4" />
            Vista Previa de Impresión
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-grow flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Planillas
          </button>
        </div>

        {activeTab === "form" && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 no-print">
            {pdfError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 text-xs font-medium">
                {pdfError}
              </div>
            )}
            <PlanillaForm
              data={data}
              onChange={setData}
              onLoadExample={handleLoadExample}
              onClear={handleClear}
            />
          </div>
        )}

        {activeTab === "preview" && (
          /* Vista Previa View - Full Screen Width Layout (no sidebar) to maximize display space and prevent cut offs */
          <div className="w-full flex flex-col gap-6 no-print">
            <PlanillaPreview data={data} />
          </div>
        )}

        {activeTab === "history" && (
          <div className="w-full no-print">
            <PlanillaHistory 
              currentData={data} 
              onLoadData={(loadedData) => {
                setData(loadedData);
                setActiveTab("form");
              }} 
            />
          </div>
        )}

      </main>

      {/* Hidden print-only workspace element to ensure standard print behavior regardless of the current active tab */}
      <div className="print-only">
        <PlanillaPreview data={data} />
      </div>

      {/* Footer - hidden when printing */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 font-medium shrink-0 no-print mt-auto">
        <p>© 2026 Escuela Domiciliaria Nº 1 DE 15•  Escuelas Verdes♻️ - Prof. Liliana Alvarez  • Diseñado para la carga ágil del personal docente.</p>
      </footer>

      {/* Share Modal configuration overlay */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        data={data} 
      />

    </div>
  );
}
