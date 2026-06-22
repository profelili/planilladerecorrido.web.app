import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc, DocumentData } from "firebase/firestore";
import { PlanillaData } from "../types";

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Check if credentials are set
const isConfigured = !!env.VITE_FIREBASE_API_KEY;

let app;
let db: any = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase App:", error);
  }
}

export function isFirebaseConfigured(): boolean {
  return isConfigured && db !== null;
}

export async function savePlanillaToCloud(data: PlanillaData): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase no está configurado. Por favor, agregue las variables de entorno VITE_FIREBASE en la configuración del proyecto."
    );
  }

  try {
    // Convert undefined to omit them for Firestore compatibility
    const cleanData = JSON.parse(JSON.stringify(data));

    const docRef = await addDoc(collection(db, "planillas"), {
      data: cleanData,
      createdAt: new Date().toISOString(),
      docenteNombre: data.docenteNombre || "Docente sin nombre",
      periodo: `${data.dorsoMesDe || "Mes"}/${data.dorsoAnio || "Año"}`,
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Error al guardar la planilla en Firestore:", error);
    throw new Error(error.message || "Error al conectar con Firestore");
  }
}

export async function loadPlanillaFromCloud(id: string): Promise<PlanillaData> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase no está configurado.");
  }

  try {
    const docRef = doc(db, "planillas", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const docData = docSnap.data() as DocumentData;
      return docData.data as PlanillaData;
    } else {
      throw new Error("La planilla no existe o fue eliminada.");
    }
  } catch (error: any) {
    console.error("Error al cargar planilla de Firestore:", error);
    throw new Error(error.message || "Error al descargar planilla");
  }
}
