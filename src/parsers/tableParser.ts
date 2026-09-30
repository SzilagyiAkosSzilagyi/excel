import { read, utils } from 'xlsx'
import { EDGE_OPTIONS, type EdgeOption, type ParseResult, type ValidationIssue, type ZsaluPart } from '../types/conversion'

// A Zsalu sablon korlátai (adatérvényesítés és súgó munkalap alapján).
const MIN_SIZE = 10
const MAX_LENGTH = 2770
const MAX_WIDTH = 2040
const MAX_QUANTITY = 99999
const MIN_WIDTH_LONG_EDGE = 70
const MIN_WIDTH_SHORT_EDGE = 180

type Field =
  | 'customer' | 'material' | 'label' | 'quantity' | 'length' | 'width' | 'rotatable'
  | 'edgeFront' | 'edgeBack' | 'edgeLeft' | 'edgeRight'

type EdgeField = 'edgeFront' | 'edgeBack' | 'edgeLeft' | 'edgeRight'

const EDGE_POSITIONS: [EdgeField, string[]][] = [
  ['edgeFront', ['elol', 'front', 'kantev', 'vorne']],
  ['edgeBack', ['hatul', 'hatso', 'back', 'kanteh', 'hinten']],
  ['edgeLeft', ['bal', 'left', 'kantel', 'links']],
  ['edgeRight', ['jobb', 'right', 'kanter', 'rechts']],
]

// Sorrend számít: a megrendelő oszlopot a "név" előtt kell felismerni.
const FIELD_KEYWORDS: [Exclude<Field, EdgeField>, string[]][] = [
  ['customer', ['megrendelo', 'aufkb', 'customer', 'ugyfel']],
  ['rotatable', ['forg', 'rotat', 'drehbar']],
  ['quantity', ['darab', 'db', 'menny', 'qty', 'quantity', 'stuck', 'anzahl', 'pcs']],
  ['length', ['hossz', 'length', 'lange']],
  ['width', ['szel', 'width', 'breite']],
  ['material', ['anyag', 'material', 'plakb', 'dekor', 'szin']],
  ['label', ['jeloles', 'megnevezes', 'alkatresz', 'teilbez', 'elem', 'nev', 'name', 'part']],
]

const FIELD_NAMES: Record<Field, string> = {
  customer: 'Megrendelő neve',
  material: 'Anyag',
  label: 'Jelölés',
  quantity: 'Darab',
  length: 'Hossz',
  width: 'Szélesség',
  rotatable: 'Forgatható',
  edgeFront: 'Élzárás elöl',
  edgeBack: 'Élzárás hátul',
  edgeLeft: 'Élzárás bal',
  edgeRight: 'Élzárás jobb',
}

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function isEdgeHeader(header: string) {
  return header.includes('elz') || header.includes('kante') || header.includes('edge')
}

function detectColumns(headerRow: unknown[]) {
  const columns = new Map<Field, number>()

  headerRow.forEach((cell, index) => {
    const header = normalize(cell)
    if (!header) return

    if (isEdgeHeader(header)) {
      const edge = EDGE_POSITIONS.find(([field, words]) => !columns.has(field) && words.some((word) => header.includes(word)))
      if (edge) columns.set(edge[0], index)
      return
    }

    const field = FIELD_KEYWORDS.find(([name, words]) => !columns.has(name) && words.some((word) => header.includes(word)))
    if (field) columns.set(field[0], index)
  })

  return columns
}

function findHeader(rows: unknown[][]) {
  for (let index = 0; index < Math.min(rows.length, 30); index += 1) {
    const columns = detectColumns(rows[index])
    if (columns.has('length') && columns.has('width')) return { index, columns }
  }
  return null
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function parseNumber(value: unknown) {
  if (typeof value === 'number') return value
  const cleaned = text(value).replace(/\s/g, '').replace(',', '.')
  return cleaned === '' ? Number.NaN : Number(cleaned)
}

function parseRotatable(value: unknown) {
  return ['igen', 'i', 'yes', 'y', 'ja', 'x', '1', 'true', 'forgathato'].includes(normalize(value))
}

const EDGE_ALIASES = new Map<string, EdgeOption>([
  ['2', 'ABS 2mm'], ['2mm', 'ABS 2mm'], ['abs2', 'ABS 2mm'],
  ['08', 'ABS 0,8mm'], ['08mm', 'ABS 0,8mm'], ['abs08', 'ABS 0,8mm'],
  ['04', 'ABS 0,4mm'], ['04mm', 'ABS 0,4mm'], ['abs04', 'ABS 0,4mm'],
])

function parseEdge(value: unknown): EdgeOption | '' | null {
  const key = normalize(value)
  if (['', '0', 'nincs', 'nem', 'no', 'none'].includes(key)) return ''
  const exact = EDGE_OPTIONS.find((option) => normalize(option) === key)
  return exact ?? EDGE_ALIASES.get(key) ?? null
}

function parseSheet(rows: unknown[][]): ParseResult | null {
  const header = findHeader(rows)
  if (!header) return null

  const { columns } = header
  const issues: ValidationIssue[] = []
  const parts: ZsaluPart[] = []
  const cell = (row: unknown[], field: Field) => {
    const index = columns.get(field)
    return index === undefined ? '' : row[index]
  }

  if (!columns.has('quantity')) {
    issues.push({ level: 'figyelmeztetés', message: 'Nincs darabszám oszlop, minden alkatrész 1 darabként kerül át.' })
  }

  for (let index = header.index + 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    if (!row || row.every((value) => text(value) === '')) continue
    if (text(cell(row, 'length')) === '' && text(cell(row, 'width')) === '') continue
    // Második fejlécsor (pl. a Zsalu sablon magyar fejléce a technikai alatt).
    if (Number.isNaN(parseNumber(cell(row, 'length'))) && findHeader([row])) continue

    const error = (message: string) => issues.push({ level: 'hiba', message, row: rowNumber })
    const warning = (message: string) => issues.push({ level: 'figyelmeztetés', message, row: rowNumber })

    const length = parseNumber(cell(row, 'length'))
    const width = parseNumber(cell(row, 'width'))
    const quantity = columns.has('quantity') ? parseNumber(cell(row, 'quantity')) : 1
    const material = text(cell(row, 'material'))

    if (!Number.isInteger(length) || length < MIN_SIZE || length > MAX_LENGTH) {
      error(`A hossz egész szám legyen ${MIN_SIZE} és ${MAX_LENGTH} mm között (kapott: „${text(cell(row, 'length'))}”).`)
    }
    if (!Number.isInteger(width) || width < MIN_SIZE || width > MAX_WIDTH) {
      error(`A szélesség egész szám legyen ${MIN_SIZE} és ${MAX_WIDTH} mm között (kapott: „${text(cell(row, 'width'))}”).`)
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      error(`A darabszám egész szám legyen 1 és ${MAX_QUANTITY} között (kapott: „${text(cell(row, 'quantity'))}”).`)
    }
    if (!material) error('Hiányzik az anyag megnevezése vagy kódja.')

    const edges = {} as Record<EdgeField, EdgeOption | ''>
    for (const [field] of EDGE_POSITIONS) {
      const parsed = parseEdge(cell(row, field))
      if (parsed === null) {
        error(`Ismeretlen élzárás (${FIELD_NAMES[field]}): „${text(cell(row, field))}”. Választható: ${EDGE_OPTIONS.join(', ')}.`)
      }
      edges[field] = parsed ?? ''
    }

    if ((edges.edgeFront || edges.edgeBack) && width < MIN_WIDTH_LONG_EDGE) {
      warning(`${MIN_WIDTH_LONG_EDGE} mm-nél keskenyebb alkatrész hosszú élét a Zsalu nem tudja élzárni.`)
    }
    if ((edges.edgeLeft || edges.edgeRight) && width < MIN_WIDTH_SHORT_EDGE) {
      warning(`${MIN_WIDTH_SHORT_EDGE} mm alatt a rövid élzárást ${MIN_WIDTH_SHORT_EDGE} mm-ből vágják vissza, és a ${MIN_WIDTH_SHORT_EDGE} mm-t számlázzák.`)
    }

    parts.push({
      material,
      label: text(cell(row, 'label')),
      quantity,
      length,
      width,
      rotatable: parseRotatable(cell(row, 'rotatable')),
      ...edges,
      sourceRow: rowNumber,
    })
  }

  if (parts.length === 0) issues.push({ level: 'hiba', message: 'A fájlban nem található alkatrészsor.' })
  return { parts, issues }
}

// CSV-nél a kódolást magunk döntjük el: UTF-8, ha érvényes, különben a magyar
// Excel alapértelmezett Windows-1250 kódolása.
function decodeCsv(bytes: ArrayBuffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1250').decode(bytes)
  }
}

export async function parseInputFile(file: File): Promise<ParseResult> {
  const bytes = await file.arrayBuffer()
  const workbook = /\.(csv|txt)$/i.test(file.name)
    ? read(decodeCsv(bytes).replace(/^﻿/, ''), { type: 'string' })
    : read(bytes, { type: 'array' })

  for (const name of workbook.SheetNames) {
    const rows = utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: true, defval: '' })
    const result = parseSheet(rows)
    if (result) return result
  }

  return {
    parts: [],
    issues: [{
      level: 'hiba',
      message: 'Nem található fejlécsor. Legalább egy „Hossz” és egy „Szélesség” oszlop szükséges (továbbá: Anyag, Darab, Jelölés, Forgatható, élzárás elöl/hátul/bal/jobb).',
    }],
  }
}
