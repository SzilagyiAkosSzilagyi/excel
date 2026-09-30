import { CFB } from 'xlsx'
import type { ZsaluPart } from '../types/conversion'

// A Zsalu Kft. eredeti rendelő sablonja; a kimenet mindig ebből készül,
// így a formázás, a legördülő listák, a súgó munkalap és a rejtett oszlopok
// változatlanok maradnak. Csak az alkatrészsorok (3. sortól) íródnak be.
const TEMPLATE_URL = '/sablonok/zsalu-rendelo.xlsx'
const SHEET_PATH = '/xl/worksheets/sheet1.xml'
const FIRST_ROW = 3
const LAST_ROW = 400

export const MAX_PARTS = LAST_ROW - FIRST_ROW + 1

// Az oszlopok alapstílusa a sablon <cols> beállítása szerint.
const COLUMN_STYLE: Record<string, string> = { E: '16' }
const DEFAULT_STYLE = '3'

// Rejtett segédoszlopok, amelyeket a Zsalu szabásoptimalizálója olvas.
const HIDDEN_DEFAULTS: [string, number][] = [
  ['J', 0], ['K', 40], ['M', 0], ['N', 40], ['P', 0], ['Q', 40],
]

type CfbEntry = { content: ArrayLike<number>; size: number }

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readText(cfb: unknown, path: string) {
  const entry = CFB.find(cfb, path) as CfbEntry | null
  if (!entry) throw new Error(`Hiányzik a sablonból: ${path}`)
  return new TextDecoder().decode(new Uint8Array(entry.content))
}

function writeText(cfb: unknown, path: string, text: string) {
  const entry = CFB.find(cfb, path) as CfbEntry | null
  if (!entry) throw new Error(`Hiányzik a sablonból: ${path}`)
  const content = new TextEncoder().encode(text)
  entry.content = content
  entry.size = content.length
}

// A sablon cellánkénti stílusai soronként (pl. E3 → 22), hogy a beírt cella
// ugyanazt a formázást kapja, mint az üres sablonban.
function cellStyles(rowXml: string) {
  const styles = new Map<string, string>()
  for (const match of rowXml.matchAll(/<c r="([A-Z]+)\d+"[^>]*?\ss="(\d+)"/g)) {
    styles.set(match[1], match[2])
  }
  return styles
}

function helperCells(row: number, rotatable: boolean, styles: Map<string, string>) {
  const style = (column: string) => styles.get(column) ?? DEFAULT_STYLE
  const formula = `<c r="H${row}" s="${style('H')}" t="str"><f>IF(G${row}="Igen","1","0")</f><v>${rotatable ? 1 : 0}</v></c>`
  const hidden = HIDDEN_DEFAULTS.map(
    ([column, value]) => `<c r="${column}${row}" s="${style(column)}"><v>${value}</v></c>`,
  )
  return { formula, hidden }
}

function partRow(row: number, customer: string, part: ZsaluPart, styles: Map<string, string>) {
  const style = (column: string) => styles.get(column) ?? COLUMN_STYLE[column] ?? DEFAULT_STYLE
  const text = (column: string, value: string) =>
    value ? `<c r="${column}${row}" s="${style(column)}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>` : ''
  const number = (column: string, value: number) => `<c r="${column}${row}" s="${style(column)}"><v>${value}</v></c>`
  const { formula, hidden } = helperCells(row, part.rotatable, styles)
  const [j, k, m, n, p, q] = hidden

  const cells = [
    text('A', customer),
    text('B', part.material),
    text('C', part.label),
    number('D', part.quantity),
    number('E', part.length),
    number('F', part.width),
    text('G', part.rotatable ? 'Igen' : 'Nem'),
    formula,
    text('I', part.edgeFront),
    j, k,
    text('L', part.edgeBack),
    m, n,
    text('O', part.edgeLeft),
    p, q,
    text('R', part.edgeRight),
  ]
  return `<row r="${row}" spans="1:19" x14ac:dyDescent="0.45">${cells.join('')}</row>`
}

// Üres sor a sablon szerkezetében: a meglévő cellák megmaradnak, de a
// megosztott H-képletek önálló képletté alakulnak, hogy a sorok egymástól
// függetlenül felülírhatók legyenek.
function unshareFormula(rowXml: string, row: number) {
  return rowXml.replace(
    /<f t="shared"[^>]*?(?:\/>|>[^<]*<\/f>)/g,
    `<f>IF(G${row}="Igen","1","0")</f>`,
  )
}

export async function buildZsaluWorkbook(customer: string, parts: ZsaluPart[]) {
  if (parts.length === 0) throw new Error('Nincs átalakítható alkatrész.')
  if (parts.length > MAX_PARTS) {
    throw new Error(`A Zsalu sablonba legfeljebb ${MAX_PARTS} alkatrészsor fér.`)
  }

  const response = await fetch(TEMPLATE_URL)
  if (!response.ok) throw new Error('A Zsalu sablon nem tölthető be.')
  const cfb = CFB.read(new Uint8Array(await response.arrayBuffer()), { type: 'array' })

  const sheet = readText(cfb, SHEET_PATH)
  const rows = new Map<number, string>()
  const rowPattern = /<row r="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g
  const dataStart = sheet.indexOf('<sheetData>') + '<sheetData>'.length
  const dataEnd = sheet.indexOf('</sheetData>')
  for (const match of sheet.slice(dataStart, dataEnd).matchAll(rowPattern)) {
    rows.set(Number(match[1]), match[0])
  }

  for (const [row, xml] of rows) {
    if (row >= FIRST_ROW && row <= LAST_ROW) rows.set(row, unshareFormula(xml, row))
  }

  parts.forEach((part, index) => {
    const row = FIRST_ROW + index
    rows.set(row, partRow(row, customer, part, cellStyles(rows.get(row) ?? '')))
  })

  const sheetData = [...rows.entries()].sort(([a], [b]) => a - b).map(([, xml]) => xml).join('')
  writeText(cfb, SHEET_PATH, sheet.slice(0, dataStart) + sheetData + sheet.slice(dataEnd))

  // A képletlánc a régi cellákra hivatkozik; Excel megnyitáskor újraépíti.
  CFB.utils.cfb_del(cfb, '/xl/calcChain.xml')
  writeText(
    cfb,
    '/[Content_Types].xml',
    readText(cfb, '/[Content_Types].xml').replace(/<Override PartName="\/xl\/calcChain\.xml"[^>]*\/>/, ''),
  )
  writeText(
    cfb,
    '/xl/_rels/workbook.xml.rels',
    readText(cfb, '/xl/_rels/workbook.xml.rels').replace(/<Relationship [^>]*Target="calcChain\.xml"[^>]*\/>/, ''),
  )
  writeText(
    cfb,
    '/xl/workbook.xml',
    readText(cfb, '/xl/workbook.xml').replace(/<calcPr ([^>]*?)\/>/, (tag, attrs: string) =>
      attrs.includes('fullCalcOnLoad') ? tag : `<calcPr ${attrs} fullCalcOnLoad="1"/>`,
    ),
  )

  const output = CFB.write(cfb, { fileType: 'zip', type: 'array', compression: true }) as ArrayLike<number>
  return new Blob([new Uint8Array(output)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
