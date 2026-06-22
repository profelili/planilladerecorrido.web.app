import React, { useRef, useState, useEffect } from "react";
import { 
  PenTool, 
  RotateCcw, 
  Upload, 
  Type, 
  CheckCircle2, 
  Trash2,
  Sparkles,
  Info
} from "lucide-react";

interface SignaturePadProps {
  value?: string; // base64 image URL
  aclaracion?: string;
  onSave: (signatureDataUrl: string | undefined, aclaracionText: string) => void;
  defaultTeacherName?: string;
}

export default function SignaturePad({ value, aclaracion = "", onSave, defaultTeacherName = "" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState(aclaracion || defaultTeacherName);
  const [activeTab, setActiveTab] = useState<"draw" | "type" | "upload">(value ? "draw" : "draw");
  const [fontStyle, setFontStyle] = useState<string>("font-cursive-1");
  const [isSaved, setIsSaved] = useState(false);

  // Sync typedName with default name if changed
  useEffect(() => {
    if (!typedName && defaultTeacherName) {
      setTypedName(defaultTeacherName);
    }
  }, [defaultTeacherName]);

  // Setup canvas with high DPI and initial drawing instructions
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // High DPI support
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        // Dark midnight fountain pen ink color
        ctx.strokeStyle = "#0f172a"; 

        // If there's an existing signature base64 load it onto the canvas
        if (value && value.startsWith("data:image")) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, rect.width, rect.height);
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = value;
        } else {
          clearCanvas();
        }
      }
    }
  }, [activeTab]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Add subtle background text "Dibuje su firma aquí"
        ctx.font = "italic 11px sans-serif";
        ctx.fillStyle = "#cbd5e1";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Dibuje su firma sobre la línea", rect.width / 2, rect.height / 2 - 10);
        
        // Guidelines line
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(30, rect.height - 25);
        ctx.lineTo(rect.width - 30, rect.height - 25);
        ctx.strokeStyle = "#e2e8f0";
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }
    }
  };

  // Helper to draw
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | TouchEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Mouse events
    if ("clientX" in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    
    // Touch events
    if ("touches" in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return null;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Clear instructions on first touch/click
      const rect = canvas.getBoundingClientRect();
      const isEmpty = isCanvasBlank(canvas);
      if (isEmpty) {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = "#1e3a8a"; // Dynamic blue ink on active draw
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#0f172a"; // Keep deep neutral ink look
      }
      autoSave();
    }
  };

  // Detect blank canvas
  const isCanvasBlank = (canvas: HTMLCanvasElement): boolean => {
    const context = canvas.getContext("2d");
    if (!context) return true;
    const buffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    return !buffer.some(color => color !== 0);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === "string") {
          onSave(event.target.result, typedName);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const autoSave = () => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      if (!isCanvasBlank(canvas)) {
        // High quality dataurl compression
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl, typedName);
      }
    }
  };

  const handleSaveTextSignature = () => {
    if (!typedName) return;
    
    // Dynamically draw beautiful cursive letters on a hidden canvas to generate signature base64
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 150;
    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 400, 150);
      
      // Load Google fonts or standard cursive
      let fontSetting = "italic 32px cursive";
      if (fontStyle === "font-cursive-1") {
        fontSetting = "italic 36px 'Brush Script MT', cursive, sans-serif";
      } else if (fontStyle === "font-cursive-2") {
        fontSetting = "bold italic 30px 'Georgia', serif";
      } else if (fontStyle === "font-cursive-3") {
        fontSetting = "italic 28px 'Courier New', monospace";
      }
      
      ctx.font = fontSetting;
      ctx.fillStyle = "#1e3a8a"; // Classic blue pen color
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, 200, 75);
      
      // Small calligraphic line underline
      ctx.beginPath();
      ctx.moveTo(80, 105);
      ctx.quadraticCurveTo(200, 115, 320, 100);
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      onSave(tempCanvas.toDataURL("image/png"), typedName);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClearSignature = () => {
    if (activeTab === "draw") {
      clearCanvas();
    }
    onSave(undefined, typedName);
  };

  const handleAclaracionChange = (val: string) => {
    setTypedName(val);
    onSave(value, val);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-orange-600" />
          <h4 className="text-xs font-bold text-slate-800">Cargar Firma Digital Especial</h4>
        </div>
        
        {value && (
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Firma guardada
          </span>
        )}
      </div>

      <div className="text-[11px] text-slate-500 leading-relaxed font-sans">
        Dibuja tu rúbrica o escribe tu nombre para generar una firma digital estilizada que se estampará automáticamente en el <strong>Frente (Pág 1)</strong> y del <strong>Dorso (Pág 2)</strong> del reporte PDF.
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-lg gap-1 border border-slate-250/30">
        <button
          type="button"
          onClick={() => setActiveTab("draw")}
          className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === "draw" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Dibujar a mano
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("type")}
          className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === "type" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          Estilo Caligráfico
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === "upload" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Subir archivo
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs flex flex-col gap-3 min-h-[140px] justify-center">
        
        {activeTab === "draw" && (
          <div className="flex flex-col gap-2 items-center">
            <div className="relative w-full max-w-sm">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 border border-slate-200 rounded-lg cursor-crosshair touch-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
              />
              <button
                type="button"
                onClick={handleClearSignature}
                title="Limpiar firma"
                className="absolute top-2 right-2 p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 transition-colors shadow-3xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 italic">
              Use su dedo sobre el teléfono, o el cursor del mouse sobre la pantalla para firmar
            </span>
          </div>
        )}

        {activeTab === "type" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Escribe tu nombre para la firma:</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 focus:border-orange-500 rounded-lg outline-none bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFontStyle("font-cursive-1")}
                className={`py-2 p-1 border text-sm text-center rounded-lg transition-all font-serif italic ${
                  fontStyle === "font-cursive-1" ? "border-orange-500 bg-orange-50 text-orange-900 font-bold" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                Letra Cursiva
              </button>
              <button
                type="button"
                onClick={() => setFontStyle("font-cursive-2")}
                className={`py-2 p-1 border text-xs text-center rounded-lg transition-all font-serif ${
                  fontStyle === "font-cursive-2" ? "border-orange-500 bg-orange-50 text-orange-900 font-bold" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                Letra Elegante
              </button>
              <button
                type="button"
                onClick={() => setFontStyle("font-cursive-3")}
                className={`py-2 p-1 border text-xs text-center rounded-lg transition-all font-mono ${
                  fontStyle === "font-cursive-3" ? "border-orange-500 bg-orange-50 text-orange-900 font-bold" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                Letra Clásica
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveTextSignature}
              disabled={!typedName}
              className="w-full mt-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar y aplicar firma caligráfica
            </button>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="flex flex-col gap-2 items-center justify-center p-3 text-center border-2 border-dashed border-slate-2 py-4 rounded-xl hover:bg-slate-50 transition-colors group relative cursor-pointer">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-orange-500 transition-colors mb-1" />
            <span className="text-xs font-bold text-slate-700">Subir firma escaneada / foto</span>
            <span className="text-[10px] text-slate-400 font-medium">Soporta PNG, JPEG de trazos limpios</span>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Signature Aclaracion field, always visible to customize printed name */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
          Aclaración de Firma impresa
        </label>
        <input
          type="text"
          value={typedName}
          onChange={(e) => handleAclaracionChange(e.target.value)}
          placeholder="Escriba aquí la aclaración (Nombre, Apellido, Cargo, DNI, etc.)"
          className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-205 focus:border-orange-500 rounded-lg transition-all outline-none"
        />
        <div className="text-[9px] text-slate-400 mt-0.5 leading-tight flex items-start gap-1">
          <Info className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
          <span>Este texto se posicionará debajo de la firma en las carátulas impresas de PDF.</span>
        </div>
      </div>

      {/* Clean button */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onSave(undefined, "");
            setTypedName("");
          }}
          className="py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 self-end"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar firma digital del documento
        </button>
      )}
    </div>
  );
}
