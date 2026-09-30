// A Zsalu Kft. rendelő sablonjának élzárás-legördülő listája (A9279:A9289).
export const EDGE_OPTIONS = [
  'ABS 2mm',
  'Más ABS 2mm',
  'ABS 0,8mm',
  'Más ABS 0,8mm',
  'ABS 0,4mm',
  'Más0,4mm',
  'Élfurnér',
  'Más Élfurnér',
  'Élléc',
  'Más Élléc',
  'Falc',
] as const

export type EdgeOption = (typeof EDGE_OPTIONS)[number]

// Egy sor a Zsalu Kft. rendelő programjában (3. sortól lefelé).
export interface ZsaluPart {
  material: string // B – Anyag
  label: string // C – Jelölés
  quantity: number // D – Darab
  length: number // E – Hossz "A", szálirányú bruttó méret (mm)
  width: number // F – Szél "B" bruttó méret (mm)
  rotatable: boolean // G – Forg? (Igen / Nem)
  edgeFront: EdgeOption | '' // I – Élz. elöl "A"
  edgeBack: EdgeOption | '' // L – Élz. hátul "A"
  edgeLeft: EdgeOption | '' // O – Élz. bal "B"
  edgeRight: EdgeOption | '' // R – Élz. jobb "B"
  sourceRow: number
}

export interface ValidationIssue {
  level: 'hiba' | 'figyelmeztetés'
  message: string
  row?: number
}

export interface ParseResult {
  parts: ZsaluPart[]
  issues: ValidationIssue[]
}
