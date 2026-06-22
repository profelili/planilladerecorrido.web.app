/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  orden: number;
  nomina: string;
  grado: string;
  edad: string;
  nac: string;
  diagnostico: string;
  domicilio: string;
  telefono: string;
  incluirFrente: boolean;
  incluirDorso: boolean;
  // Page 1 Specifics (Frente)
  frenteAus: string;
  frentePres: string;
  frenteHorario: string;
  frenteCalif: string;
  frenteObservaciones: string;
  // Page 2 Specifics (Dorso)
  dorsoDias: string;
  dorsoHoras: string;
  dorsoTotalHoras: string;
}

export interface PlanillaData {
  docenteNombre: string;
  cargo: string;
  modulo: string;
  turno: string;
  // Page 1 Date (Frente: End of month)
  frenteDia: string;
  frenteMes: string;
  frenteAnio: string;
  // Page 2 Date (Dorso: Start of month)
  dorsoDia: string;
  dorsoMes: string;
  dorsoAnio: string;
  dorsoMesDe: string; // "Mes de: Agosto"
  // Students list
  estudiantes: Student[];
  // Page 1 Docente Asistencia
  asistenciaClasesDadas: string;
  asistenciaAsistencias: string;
  asistenciaLicencias: string;
  asistenciaDiasHabiles: string;
  asistenciaObservaciones: string;
  // Page 2 Info
  dorsoObservaciones: string;
  // Digital signature fields
  firmaUrl?: string; // Base64 of the signature drawing or uploaded file
  firmaAclaracion?: string; // Optional name or details to display below signature
}

export interface HistoryEntry {
  id: string;
  title: string;
  savedAt: string;
  docenteNombre: string;
  cargo: string;
  periodoMes: string; // e.g. "Mayo"
  periodoAnio: string; // e.g. "2026"
  studentsCount: number;
  data: PlanillaData;
}

