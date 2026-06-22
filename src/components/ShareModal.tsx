import React, { useState, useEffect } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Sparkles,
  Share2,
  FileText,
  Loader2,
  AlertCircle,
  HelpCircle,
  QrCode,
  CloudLightning,
  CloudCheck,
  ExternalLink
} from "lucide-react";
import { PlanillaData } from "../types";
import { generatePdfBlobFromHtml } from "../utils/pdfGenerator";
import { isFirebaseConfigured, savePlanillaToCloud } from "../lib/firebase";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PlanillaData;
}

type ShareStatus = "idle" | "generating" | "ready" | "error";

export default function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTextStatus, setCopiedTextStatus] = useState<string | null>(null);
  
  // PDF Sharing specific states
  const [pdfStatus, setPdfStatus] = useState<ShareStatus>("idle");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfSizeStr, setPdfSizeStr] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [webShareSupported, setWebShareSupported] = useState(false);

  // Firebase Firestore states
  const [firebaseId, setFirebaseId] = useState<string | null>(null);
  const [isFirebaseSaving, setIsFirebaseSaving] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [copiedFirebaseLink, setCopiedFirebaseLink] = useState(false);

  const [siteOrigin, setSiteOrigin] = useState("https://planilladerecorrido.web.app");

  // Check Web Share API compatibility for Files
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteOrigin(window.location.origin);
    }

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      // Test with a generic mock PDF file to see if the browser allows sharing PDF files
      try {
        const dummyFile = new File(["dummy"], "test.pdf", { type: "application/pdf" });
        if (navigator.canShare({ files: [dummyFile] })) {
          setWebShareSupported(true);
        }
      } catch (e) {
        console.warn("Navigator.canShare not supported or failed on files:", e);
      }
    }
  }, []);

  if (!isOpen) return null;

  // Generate local Base64 URL fallback
  const getBase64ShareUrl = () => {
    try {
      const json = JSON.stringify(data);
      const base64 = btoa(unescape(encodeURIComponent(json)));
      return `${siteOrigin}/?shared_data=${base64}`;
    } catch (e) {
      console.error("Error generating base64 url:", e);
      return siteOrigin;
    }
  };

  const localShareUrl = getBase64ShareUrl();
  const firebaseShareUrl = firebaseId ? `${siteOrigin}/?id=${firebaseId}` : "";
  const activeShareUrl = firebaseId ? firebaseShareUrl : localShareUrl;

  const teacherName = data.docenteNombre || "Docente";
  const period = `${data.dorsoMesDe || "Mes"} / ${data.dorsoAnio || "Año"}`;
  const studentCount = data.estudiantes?.length || 0;
  const safeFileName = `Planilla_Recorrido_${teacherName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  // Start generating the PDF File on the fly for sharing
  const handlePreparePdf = async () => {
    setPdfStatus("generating");
    setErrorMessage("");
    try {
      const blob = await generatePdfBlobFromHtml("planilla-frente", "planilla-dorso", data.docenteNombre);
      const file = new File([blob], safeFileName, { type: "application/pdf" });
      
      const sizeKB = Math.round(blob.size / 1024);
      setPdfSizeStr(sizeKB > 1000 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);
      setPdfFile(file);
      setPdfStatus("ready");
    } catch (err: any) {
      console.error("Error preparing PDF for sharing:", err);
      setErrorMessage(err.message || "No se pudo generar el archivo de vista previa HTML.");
      setPdfStatus("error");
    }
  };

  // Upload to Firebase Firestore to get extremely lightweight short URL
  const handleGenerateFirebaseLink = async () => {
    setIsFirebaseSaving(true);
    setFirebaseError(null);
    try {
      const docId = await savePlanillaToCloud(data);
      setFirebaseId(docId);
    } catch (err: any) {
      console.error(err);
      setFirebaseError(err.message || "Error al subir la planilla.");
    } finally {
      setIsFirebaseSaving(false);
    }
  };

  // Trigger Native Web Share API to share the actual PDF file
  const handleNativeSharePdf = async () => {
    if (!pdfFile) return;
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Planilla de Recorrido - ${teacherName}`,
        text: `Hola, te comparto en formato PDF oficial la Planilla de Recorrido de ${teacherName} (${period}).`
      });
    } catch (err: any) {
      // Aborted is common if user cancels
      if (err.name !== "AbortError") {
        console.error("Native share failed:", err);
        alert("El sistema de envío nativo ha fallado. Puede descargar el PDF manualmente usando los accesos correspondientes.");
      }
    }
  };

  // Helper title & messages
  const shareTitle = `Planilla de Recorrido Oficial - ${teacherName}`;
  const getShareTextBody = () => {
    return `¡Hola! Te comparto la Planilla de Recorrido de la Escuela Domiciliaria Nº 1.\nDocente: ${teacherName}\nPeríodo: ${period}\nAlumnos inscritos: ${studentCount}\n\nPuedes verla en línea o descargar el PDF oficial aquí:\n${activeShareUrl}`;
  };

  const shareText = getShareTextBody();

  // Copy shareable link
  const handleCopyLink = async (urlToCopy: string, isFirebase: boolean = false) => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      if (isFirebase) {
        setCopiedFirebaseLink(true);
        setTimeout(() => setCopiedFirebaseLink(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Simple download shortcut
  const handleDownloadPdfFile = () => {
    if (!pdfFile) return;
    try {
      const downloadAnchor = document.createElement("a");
      const url = URL.createObjectURL(pdfFile);
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", safeFileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Header decoration */}
        <div className="bg-orange-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-xl">
              <Share2 className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide uppercase">Compartir Planilla PDF</h3>
              <p className="text-[10px] text-orange-100 font-medium">Formato Oficial de la Escuela Domiciliaria Nº 1</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Master Explanation */}
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-start gap-2.5">
          <Sparkles className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-950 font-medium leading-relaxed">
            Hemos adaptado el sistema para compartir de forma directa el **archivo de la Planilla PDF**. Prepara el documento oficial a continuación para mandarlo por tus redes preferidas.
          </div>
        </div>

        {/* Scrolling content panel */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[460px] bg-slate-50/50">
          
          {/* STEP 1: PDF Generation Centerpiece */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-orange-100 text-orange-700 rounded-full">
                  1
                </span>
                <span className="text-xs font-bold text-slate-800">Preparar Documento PDF Oficial</span>
              </div>
              
              {pdfStatus === "ready" && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                  Listo ({pdfSizeStr})
                </span>
              )}
            </div>

            {/* Preparation Actions */}
            {pdfStatus === "idle" && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-slate-500 font-medium">
                  Para poder exportar, el sistema renderizará el Frente y Dorso de alta calidad del docente <strong className="text-slate-800">"{teacherName}"</strong> en un archivo PDF unificado.
                </p>
                <button
                  type="button"
                  onClick={handlePreparePdf}
                  className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-97 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generar Archivo PDF para Compartir
                </button>
              </div>
            )}

            {pdfStatus === "generating" && (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                <span className="text-xs font-bold text-slate-800">Procesando y maquetando el PDF...</span>
                <span className="text-[10px] text-slate-400 font-medium font-sans">Esto tomará unos segundos</span>
              </div>
            )}

            {pdfStatus === "ready" && pdfFile && (
              <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-800 truncate" title={safeFileName}>
                      {safeFileName}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 block">
                      Tamaño: {pdfSizeStr} • Formato: PDF de 2 páginas (A4)
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdfFile}
                    className="flex-1 py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                  >
                    Mantener Copia Local (.pdf)
                  </button>
                  {webShareSupported && (
                    <button
                      type="button"
                      onClick={handleNativeSharePdf}
                      className="flex-1 py-1.5 px-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Share2 className="w-3 h-3" />
                      Enviar PDF de forma Directa
                    </button>
                  )}
                </div>
              </div>
            )}

            {pdfStatus === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[10px] text-red-950 font-medium">
                  <strong>No se pudo compilar:</strong> {errorMessage || "Por favor, configure los datos básicos del docente primero."}
                  <button
                    onClick={handlePreparePdf}
                    className="block underline mt-1 text-red-700 font-bold cursor-pointer"
                  >
                    Reintentar generación
                  </button>
                </div>
              </div>
            )}
          </div>

           {/* STEP 2: Firebase Firestore Cloud Integration */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3 shadow-3xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-orange-100 text-orange-700 rounded-full">
                2
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Compartir Enlace en la Nube (Firebase)
                {isFirebaseConfigured() ? (
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md border border-emerald-100 font-medium font-sans">
                    Activo
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-md border border-amber-100 font-medium font-sans">
                    No configurado
                  </span>
                )}
              </span>
            </div>

            {isFirebaseConfigured() ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Genera un enlace ultra-corto y persistente almacenado en tu base de datos de Firebase. Ideal para compartir por WhatsApp sin límites de tamaño.
                </p>

                {!firebaseId ? (
                  <button
                    type="button"
                    disabled={isFirebaseSaving}
                    onClick={handleGenerateFirebaseLink}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isFirebaseSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando en Firestore...
                      </>
                    ) : (
                      <>
                        <CloudLightning className="w-3.5 h-3.5" />
                        Generar Enlace Corto en Firestore
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
                      <CloudCheck className="w-4 h-4 text-emerald-600" />
                      Planilla guardada con éxito en la nube
                    </div>
                    
                    <div className="flex bg-white border border-slate-200 rounded-lg p-1 items-center justify-between gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={firebaseShareUrl}
                        className="flex-1 bg-transparent border-none text-[9px] font-mono text-slate-600 px-1 outline-none select-all truncate"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink(firebaseShareUrl, true)}
                        className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                          copiedFirebaseLink
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                        }`}
                      >
                        {copiedFirebaseLink ? "Copiado!" : "Copiar"}
                      </button>
                    </div>

                    <a
                      href={firebaseShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 self-start mt-0.5"
                    >
                      Probar enlace corto <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {firebaseError && (
                  <div className="bg-red-50 text-red-700 p-2 text-[10px] rounded border border-red-100 font-medium">
                    Error al guardar: {firebaseError}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-950 font-medium leading-relaxed">
                    <strong>Habilitar enlaces de Firebase:</strong> Para que tus planillas se guarden automáticamente en <strong>planilladerecorrido.web.app</strong>, agrega las claves del SDK en la sección de Ajustes y Secretos (Settings y Secrets) de AI Studio:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[9px] text-amber-800">
                      <li><code>VITE_FIREBASE_API_KEY</code></li>
                      <li><code>VITE_FIREBASE_PROJECT_ID</code></li>
                      <li><code>VITE_FIREBASE_APP_ID</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Fallback Base64 Link Sharing */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2.5 shadow-3xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-orange-100 text-orange-700 rounded-full">
                3
              </span>
              <span className="text-xs font-bold text-slate-800">
                Enlace de Respaldo Directo (Offline/Instantáneo)
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Este enlace codifica los datos enteros directamente en la dirección URL. Funciona de manera inmediata sin requerir bases de datos, aunque puede ser muy largo.
            </p>

            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 items-center justify-between gap-1.5">
              <input
                type="text"
                readOnly
                value={localShareUrl}
                className="flex-1 bg-transparent border-none text-[9px] font-mono text-slate-400 px-1 outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(localShareUrl, false)}
                className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                  copiedLink
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                }`}
              >
                {copiedLink ? "Copiado!" : "Copiar Enlace"}
              </button>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Cerrar Menú
          </button>
        </div>

      </div>
    </div>
  );
}
