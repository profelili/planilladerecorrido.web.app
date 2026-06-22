/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Parse oklch(L C H / A) colors to standard rgb/rgba
function parseOklch(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([+-]?[0-9.]+(?:deg|rad|grad|turn)?)(?:\s*[\/\,]\s*([0-9.]+%?))?\s*\)/i);
    if (!match) {
      if (oklchStr.includes("var(")) {
        return "rgb(150, 160, 175)";
      }
      return "rgb(128, 128, 128)";
    }
    
    const lStr = match[1];
    const cStr = match[2];
    const hStr = match[3];
    const aStr = match[4];
    
    let L = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
    let C = parseFloat(cStr);
    
    let h = 0;
    if (hStr.endsWith("deg")) {
      h = parseFloat(hStr);
    } else if (hStr.endsWith("rad")) {
      h = parseFloat(hStr) * (180 / Math.PI);
    } else if (hStr.endsWith("grad")) {
      h = parseFloat(hStr) * 0.9;
    } else if (hStr.endsWith("turn")) {
      h = parseFloat(hStr) * 360;
    } else {
      h = parseFloat(hStr);
    }
    
    let hRad = h * (Math.PI / 180);
    let a = C * Math.cos(hRad);
    let b = C * Math.sin(hRad);
    
    let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    let m_ = L - 0.1055613458 * a - 0.0638541128 * b;
    let s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    
    let l = l_ * l_ * l_;
    let m = m_ * m_ * m_;
    let s = s_ * s_ * s_;
    
    let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let b_rgb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    
    const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val * 255)));
    
    if (aStr) {
      let alpha = parseFloat(aStr);
      if (aStr.endsWith("%")) alpha = parseFloat(aStr) / 100;
      return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b_rgb)}, ${alpha})`;
    } else {
      return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b_rgb)})`;
    }
  } catch (err) {
    return "rgb(128, 128, 128)";
  }
}

// Parse oklab(L a b / alpha) colors to standard rgb/rgba
function parseOklab(oklabStr: string): string {
  try {
    const match = okllabMatch(oklabStr);
    if (!match) {
      if (oklabStr.includes("var(")) {
        return "rgb(150, 160, 175)";
      }
      return "rgb(128, 128, 128)";
    }
    
    const lStr = match[1];
    const aStr = match[2];
    const bStr = match[3];
    const alphaStr = match[4];
    
    let L = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
    let a = parseFloat(aStr);
    let b = parseFloat(bStr);
    
    let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    let m_ = L - 0.1055613458 * a - 0.0638541128 * b;
    let s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    
    let l = l_ * l_ * l_;
    let m = m_ * m_ * m_;
    let s = s_ * s_ * s_;
    
    let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let b_rgb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    
    const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val * 255)));
    
    if (alphaStr) {
      let alpha = parseFloat(alphaStr);
      if (alphaStr.endsWith("%")) alpha = parseFloat(alphaStr) / 100;
      return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b_rgb)}, ${alpha})`;
    } else {
      return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b_rgb)})`;
    }
  } catch (err) {
    return "rgb(128, 128, 128)";
  }
}

function okllabMatch(oklabStr: string) {
  return oklabStr.match(/oklab\(\s*([0-9.]+%?)\s+([+-]?[0-9.]+)\s+([+-]?[0-9.]+)(?:\s*[\/\,]\s*([0-9.]+%?))?\s*\)/i);
}

function replaceColorMix(str: string): string {
  let index = str.toLowerCase().indexOf("color-mix(");
  let safetyCounter = 0;
  while (index !== -1 && safetyCounter < 1000) {
    safetyCounter++;
    let openCount = 1;
    let i = index + "color-mix(".length;
    while (i < str.length && openCount > 0) {
      if (str[i] === "(") {
        openCount++;
      } else if (str[i] === ")") {
        openCount--;
      }
      i++;
    }
    if (openCount === 0) {
      const fullColorMix = str.substring(index, i);
      let fallback = "rgba(100, 100, 100, 0.3)";
      if (fullColorMix.includes("white")) {
        fallback = "rgba(255, 255, 255, 0.8)";
      } else if (fullColorMix.includes("black")) {
        fallback = "rgba(0, 0, 0, 0.2)";
      }
      str = str.substring(0, index) + fallback + str.substring(i);
    } else {
      break;
    }
    index = str.toLowerCase().indexOf("color-mix(");
  }
  return str;
}

function replaceLightDark(str: string): string {
  let index = str.toLowerCase().indexOf("light-dark(");
  let safetyCounter = 0;
  while (index !== -1 && safetyCounter < 1000) {
    safetyCounter++;
    let openCount = 1;
    let i = index + "light-dark(".length;
    while (i < str.length && openCount > 0) {
      if (str[i] === "(") {
        openCount++;
      } else if (str[i] === ")") {
        openCount--;
      }
      i++;
    }
    if (openCount === 0) {
      const content = str.substring(index + "light-dark(".length, i - 1);
      let firstArg = "";
      let argOpenCount = 0;
      for (let j = 0; j < content.length; j++) {
        if (content[j] === "(") argOpenCount++;
        else if (content[j] === ")") argOpenCount--;
        else if (content[j] === "," && argOpenCount === 0) {
          firstArg = content.substring(0, j).trim();
          break;
        }
      }
      if (!firstArg) firstArg = content.trim();
      
      str = str.substring(0, index) + firstArg + str.substring(i);
    } else {
      break;
    }
    index = str.toLowerCase().indexOf("light-dark(");
  }
  return str;
}

// Clean both oklch and oklab from css strings
function replaceUnsupportedColorsInString(content: string): string {
  if (!content) return content;
  
  let result = content;
  
  // Replace color-mix and light-dark structures which crashes html2canvas
  result = replaceColorMix(result);
  result = replaceLightDark(result);
  
  if (result.toLowerCase().includes("oklch")) {
    result = result.replace(/oklch\(\s*([^)]+)\)/gi, (match) => {
      return parseOklch(match);
    });
  }
  if (result.toLowerCase().includes("oklab")) {
    result = result.replace(/oklab\(\s*([^)]+)\)/gi, (match) => {
      return parseOklab(match);
    });
  }
  
  // Replace any residual oklab/oklch occurrences (like in color-mix, theme definitions, or fallback properties) with srgb
  result = result.replace(/oklab/gi, "srgb");
  result = result.replace(/oklch/gi, "srgb");
  
  return result;
}

export async function generatePdfFromHtml(
  frenteId: string,
  dorsoId: string,
  teacherName: string
): Promise<void> {
  const frenteElement = document.getElementById(frenteId);
  const dorsoElement = document.getElementById(dorsoId);

  if (!frenteElement || !dorsoElement) {
    throw new Error("No se encontraron los elementos de vista previa para generar el PDF.");
  }

  // Save original style contents and replace any oklch(...) or oklab(...) occurrences
  const originalStyles = Array.from(document.querySelectorAll("style")).map((s) => ({
    element: s,
    content: s.innerHTML,
  }));

  const links = Array.from(document.querySelectorAll("link[rel='stylesheet']")) as HTMLLinkElement[];
  const temporarilyInjectedStyles: HTMLStyleElement[] = [];
  const originalGetComputedStyle = window.getComputedStyle;
  
  // Back up and temporarily change link `rel` to prevent clone duplication loading in html2canvas iframe
  const linkOriginalRels = new Map<HTMLLinkElement, string>();

  // Deeply clean inline student sheet styles and back them up
  const elementStyleBackups = new Map<HTMLElement, string | null>();
  const backupAndCleanInlineStyles = (root: HTMLElement) => {
    const allElements = [root, ...Array.from(root.getElementsByTagName("*"))] as HTMLElement[];
    for (const el of allElements) {
      if (!el.getAttribute) continue;
      const inlineStyle = el.getAttribute("style");
      if (inlineStyle) {
        elementStyleBackups.set(el, inlineStyle);
        if (inlineStyle.toLowerCase().includes("oklch") || inlineStyle.toLowerCase().includes("oklab") || inlineStyle.toLowerCase().includes("color-mix")) {
          el.setAttribute("style", replaceUnsupportedColorsInString(inlineStyle));
        }
      }
    }
  };

  try {
    // 1. Clean inline styles of target elements
    backupAndCleanInlineStyles(frenteElement);
    backupAndCleanInlineStyles(dorsoElement);

    // 2. Monkeypatch window.getComputedStyle safely without any Illegal invocation errors
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
      let style: CSSStyleDeclaration;
      try {
        const ownerWindow = elt?.ownerDocument?.defaultView;
        if (ownerWindow && ownerWindow !== window && typeof ownerWindow.getComputedStyle === "function") {
          style = ownerWindow.getComputedStyle(elt, pseudoElt);
        } else {
          style = originalGetComputedStyle.call(window, elt, pseudoElt);
        }
      } catch (e) {
        try {
          style = originalGetComputedStyle.call(window, elt, pseudoElt);
        } catch (err) {
          // Absolute fallback
          return (elt as any).style || {
            getPropertyValue: () => "",
          };
        }
      }
      
      return new Proxy(style, {
        get(target, prop) {
          // Do NOT pass receiver here to ensure native getters run under target's context and prevent Illegal invocation
          const val = (target as any)[prop];
          if (typeof val === "function") {
            if (prop === "getPropertyValue") {
              return function (key: string) {
                try {
                  const originalVal = target.getPropertyValue(key);
                  if (typeof originalVal === "string" && (originalVal.toLowerCase().includes("oklch") || originalVal.toLowerCase().includes("oklab") || originalVal.toLowerCase().includes("color-mix"))) {
                    return replaceUnsupportedColorsInString(originalVal);
                  }
                  return originalVal;
                } catch (e) {
                  return "";
                }
              };
            }
            return val.bind(target);
          }
          if (typeof val === "string" && (val.toLowerCase().includes("oklch") || val.toLowerCase().includes("oklab") || val.toLowerCase().includes("color-mix"))) {
            return replaceUnsupportedColorsInString(val);
          }
          return val;
        },
      });
    } as any;

    // 3. Process <style> tags
    for (const style of originalStyles) {
      if (style.content.toLowerCase().includes("oklch") || style.content.toLowerCase().includes("oklab")) {
        style.element.innerHTML = replaceUnsupportedColorsInString(style.content);
      }
    }

    // 4. Process and disable standard `<link>` stylesheet tags to prevent duplicate iframe loads
    for (const link of links) {
      try {
        let cleanCss = "";
        const response = await fetch(link.href);
        if (response.ok) {
          const cssText = await response.text();
          cleanCss = replaceUnsupportedColorsInString(cssText);
        }
        
        if (cleanCss) {
          const styleTag = document.createElement("style");
          styleTag.innerHTML = cleanCss;
          document.head.appendChild(styleTag);
          temporarilyInjectedStyles.push(styleTag);
        }
      } catch (e) {
        console.warn("Could not inline stylesheet completely via fetch: ", link.href, e);
      }
      
      // Mark as disabled-stylesheet so html2canvas ignores completely during DOM cloning
      linkOriginalRels.set(link, link.rel);
      link.rel = "disabled-stylesheet";
    }

    // Create PDF with A4 paper format in landscape orientation
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const opt = {
      scale: 2, // Increases details
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    };

    // Render FRENTE page (Page 1)
    const frenteCanvas = await html2canvas(frenteElement, opt);
    const frenteImgData = frenteCanvas.toDataURL("image/jpeg", 0.95);
    
    // Standard landscape A4 is 297mm wide by 210mm high
    pdf.addImage(frenteImgData, "JPEG", 0, 0, 297, 210);

    // Add a new page for DORSO page (Page 2)
    pdf.addPage("a4", "landscape");
    
    const dorsoCanvas = await html2canvas(dorsoElement, opt);
    const dorsoImgData = dorsoCanvas.toDataURL("image/jpeg", 0.95);
    
    pdf.addImage(dorsoImgData, "JPEG", 0, 0, 297, 210);

    // Save the high quality PDF
    const safeName = teacherName ? teacherName.replace(/[^a-zA-Z0-9]/g, "_") : "Planilla";
    pdf.save(`Planilla_Recorrido_${safeName}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    // Restore window.getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;

    // Restore original styles
    for (const style of originalStyles) {
      style.element.innerHTML = style.content;
    }
    
    // Clean temporarily injected styles
    for (const styleTag of temporarilyInjectedStyles) {
      styleTag.remove();
    }
    
    // Restore link rels
    for (const [link, rel] of linkOriginalRels.entries()) {
      link.rel = rel;
    }

    // Restore inline element styles
    for (const [el, originalVal] of elementStyleBackups.entries()) {
      if (originalVal === null) {
        el.removeAttribute("style");
      } else {
        el.setAttribute("style", originalVal);
      }
    }
  }
}

export async function generatePdfBlobFromHtml(
  frenteId: string,
  dorsoId: string,
  teacherName: string
): Promise<Blob> {
  const frenteElement = document.getElementById(frenteId);
  const dorsoElement = document.getElementById(dorsoId);

  if (!frenteElement || !dorsoElement) {
    throw new Error("No se encontraron los elementos de vista previa para generar el PDF.");
  }

  // Save original style contents and replace any oklch(...) or oklab(...) occurrences
  const originalStyles = Array.from(document.querySelectorAll("style")).map((s) => ({
    element: s,
    content: s.innerHTML,
  }));

  const links = Array.from(document.querySelectorAll("link[rel='stylesheet']")) as HTMLLinkElement[];
  const temporarilyInjectedStyles: HTMLStyleElement[] = [];
  const originalGetComputedStyle = window.getComputedStyle;
  
  // Back up and temporarily change link `rel` to prevent clone duplication loading in html2canvas iframe
  const linkOriginalRels = new Map<HTMLLinkElement, string>();

  // Deeply clean inline student sheet styles and back them up
  const elementStyleBackups = new Map<HTMLElement, string | null>();
  const backupAndCleanInlineStyles = (root: HTMLElement) => {
    const allElements = [root, ...Array.from(root.getElementsByTagName("*"))] as HTMLElement[];
    for (const el of allElements) {
      if (!el.getAttribute) continue;
      const inlineStyle = el.getAttribute("style");
      if (inlineStyle) {
        elementStyleBackups.set(el, inlineStyle);
        if (inlineStyle.toLowerCase().includes("oklch") || inlineStyle.toLowerCase().includes("oklab") || inlineStyle.toLowerCase().includes("color-mix")) {
          el.setAttribute("style", replaceUnsupportedColorsInString(inlineStyle));
        }
      }
    }
  };

  try {
    // 1. Clean inline styles of target elements
    backupAndCleanInlineStyles(frenteElement);
    backupAndCleanInlineStyles(dorsoElement);

    // 2. Monkeypatch window.getComputedStyle safely without any Illegal invocation errors
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
      let style: CSSStyleDeclaration;
      try {
        const ownerWindow = elt?.ownerDocument?.defaultView;
        if (ownerWindow && ownerWindow !== window && typeof ownerWindow.getComputedStyle === "function") {
          style = ownerWindow.getComputedStyle(elt, pseudoElt);
        } else {
          style = originalGetComputedStyle.call(window, elt, pseudoElt);
        }
      } catch (e) {
        try {
          style = originalGetComputedStyle.call(window, elt, pseudoElt);
        } catch (err) {
          // Absolute fallback
          return (elt as any).style || {
            getPropertyValue: () => "",
          };
        }
      }
      
      return new Proxy(style, {
        get(target, prop) {
          const val = (target as any)[prop];
          if (typeof val === "function") {
            if (prop === "getPropertyValue") {
              return function (key: string) {
                try {
                  const originalVal = target.getPropertyValue(key);
                  if (typeof originalVal === "string" && (originalVal.toLowerCase().includes("oklch") || originalVal.toLowerCase().includes("oklab") || originalVal.toLowerCase().includes("color-mix"))) {
                    return replaceUnsupportedColorsInString(originalVal);
                  }
                  return originalVal;
                } catch (e) {
                  return "";
                }
              };
            }
            return val.bind(target);
          }
          if (typeof val === "string" && (val.toLowerCase().includes("oklch") || val.toLowerCase().includes("oklab") || val.toLowerCase().includes("color-mix"))) {
            return replaceUnsupportedColorsInString(val);
          }
          return val;
        },
      });
    } as any;

    // 3. Process <style> tags
    for (const style of originalStyles) {
      if (style.content.toLowerCase().includes("oklch") || style.content.toLowerCase().includes("oklab")) {
        style.element.innerHTML = replaceUnsupportedColorsInString(style.content);
      }
    }

    // 4. Process and disable standard `<link>` stylesheet tags to prevent duplicate iframe loads
    for (const link of links) {
      try {
        let cleanCss = "";
        const response = await fetch(link.href);
        if (response.ok) {
          const cssText = await response.text();
          cleanCss = replaceUnsupportedColorsInString(cssText);
        }
        
        if (cleanCss) {
          const styleTag = document.createElement("style");
          styleTag.innerHTML = cleanCss;
          document.head.appendChild(styleTag);
          temporarilyInjectedStyles.push(styleTag);
        }
      } catch (e) {
        console.warn("Could not inline stylesheet completely via fetch: ", link.href, e);
      }
      
      linkOriginalRels.set(link, link.rel);
      link.rel = "disabled-stylesheet";
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const opt = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    };

    // Render FRENTE page (Page 1)
    const frenteCanvas = await html2canvas(frenteElement, opt);
    const frenteImgData = frenteCanvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(frenteImgData, "JPEG", 0, 0, 297, 210);

    // Add a new page for DORSO page (Page 2)
    pdf.addPage("a4", "landscape");
    
    const dorsoCanvas = await html2canvas(dorsoElement, opt);
    const dorsoImgData = dorsoCanvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(dorsoImgData, "JPEG", 0, 0, 297, 210);

    return pdf.output("blob");

  } catch (error) {
    console.error("Error generating PDF Blob:", error);
    throw error;
  } finally {
    window.getComputedStyle = originalGetComputedStyle;

    for (const style of originalStyles) {
      style.element.innerHTML = style.content;
    }
    
    for (const styleTag of temporarilyInjectedStyles) {
      styleTag.remove();
    }
    
    for (const [link, rel] of linkOriginalRels.entries()) {
      link.rel = rel;
    }

    for (const [el, originalVal] of elementStyleBackups.entries()) {
      if (originalVal === null) {
        el.removeAttribute("style");
      } else {
        el.setAttribute("style", originalVal);
      }
    }
  }
}
