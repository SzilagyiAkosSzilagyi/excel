export interface SourceDocument {
  fileName: string
  sheets: SourceSheet[]
}

export interface SourceSheet {
  name: string
  rows: unknown[][]
}

export interface CuttingItem {
  sequence: number
  grainLength: number
  crossLength: number
  edgeBanding: string
  edgeLength1: number
  edgeLength2: number
  edgeCross1: number
  edgeCross2: number
  rotatable: boolean
  jobId: string
  cabinet: string
  part: string
  note: string
}

export interface ValidationIssue {
  level: 'hiba' | 'figyelmeztetés'
  message: string
  row?: number
  column?: string
}

