import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthPage } from './components/AuthPage'
import { supabase } from './lib/supabase'
import { parseInputFile } from './parsers/tableParser'
import { buildZsaluWorkbook } from './converters/zsaluExcel'
import type { ParseResult } from './types/conversion'

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5v2.25A2.25 2.25 0 0 0 7.25 20h9.5A2.25 2.25 0 0 0 19 17.75V15.5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M5 18.5v.25A2.25 2.25 0 0 0 7.25 21h9.5A2.25 2.25 0 0 0 19 18.75v-.25" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.75h6.6L18 8.15v12.1H7V3.75Z" />
      <path d="M13.5 3.75v4.8H18M9.5 13h6M9.5 16h4.5" />
    </svg>
  )
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notice, setNotice] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [customer, setCustomer] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setAuthReady(true)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (!authReady) {
    return (
      <div className="app-loading" role="status">
        <span className="brand-mark">E</span>
        <strong>EXO</strong>
        <i></i>
      </div>
    )
  }

  if (!session) return <AuthPage />

  const userInitials = session.user.email?.slice(0, 2).toUpperCase() ?? 'EX'

  const errors = result?.issues.filter((issue) => issue.level === 'hiba') ?? []
  const warnings = result?.issues.filter((issue) => issue.level === 'figyelmeztetés') ?? []
  const canDownload = !!result && result.parts.length > 0 && errors.length === 0 && customer.trim() !== '' && !busy

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.item(0) ?? null
    event.target.value = ''
    setFile(selected)
    setResult(null)
    setNotice('')
    if (!selected) return

    setCustomer((current) => current || selected.name.replace(/\.[^.]+$/, ''))
    setBusy(true)
    try {
      const parsed = await parseInputFile(selected)
      setResult(parsed)
      const hasErrors = parsed.issues.some((issue) => issue.level === 'hiba')
      setNotice(hasErrors
        ? 'A fájl hibákat tartalmaz, javítsd őket a letöltés előtt.'
        : `${parsed.parts.length} alkatrész beolvasva, átalakításra kész.`)
    } catch {
      setResult({ parts: [], issues: [{ level: 'hiba', message: 'A fájl nem olvasható. XLSX, XLS vagy CSV fájlt tölts fel.' }] })
    } finally {
      setBusy(false)
    }
  }

  async function handleDownload() {
    if (!result || !canDownload) return
    setBusy(true)
    try {
      const blob = await buildZsaluWorkbook(customer.trim(), result.parts)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${customer.trim().replace(/[\\/:*?"<>|]+/g, '_')}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      setNotice('A Zsalu rendelő Excel letöltve.')
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Az átalakítás nem sikerült.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="EXO kezdőlap">
          <span className="brand-mark">E</span>
          <span>EXO</span>
        </a>

        <nav className="topnav" aria-label="Fő navigáció">
          <a href="#workflow">Hogyan működik?</a>
          <span className="connection-pill connected">
            <i aria-hidden="true"></i>
            Supabase kapcsolódva
          </span>
          <span className="user-email">{session.user.email}</span>
          <button
            className="profile-button"
            type="button"
            aria-label="Kijelentkezés"
            title="Kijelentkezés"
            onClick={() => supabase.auth.signOut()}
          >
            <span>{userInitials}</span>
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <span className="section-label">Excel átalakító</span>
            <h1 id="page-title">Táblázatból<br />gyártási fájl.</h1>
            <p>
              Töltsd fel a meglévő Excel-táblázatodat, mi pedig előkészítjük az
              általad megadott gyártási formátumban.
            </p>
          </div>

          <div className="format-badge" aria-label="Támogatott fájlformátumok">
            <span>XLS</span>
            <span>XLSX</span>
            <span>CSV</span>
          </div>
        </section>

        <section className="workflow" id="workflow" aria-label="Excel átalakítás lépései">
          <article className={`action-card upload-card${file ? ' is-complete' : ''}`}>
            <div className="card-topline">
              <span className="step-number">01</span>
              <span className="step-state">{file ? 'Feltöltve' : 'Első lépés'}</span>
            </div>

            <div className="icon-frame"><UploadIcon /></div>
            <div className="card-copy">
              <h2>Excel tábla feltöltése</h2>
              <p>Bármilyen szerkezetű Excel-fájlt fogadunk. Az eredeti fájl változatlan marad.</p>
            </div>

            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
            />
            <button className="action-button" type="button" onClick={() => inputRef.current?.click()}>
              {file ? 'Másik fájl feltöltése' : 'Fájl kiválasztása'}
              <span aria-hidden="true">↗</span>
            </button>
          </article>

          <div className="connector" aria-hidden="true">
            <span></span>
            <b>→</b>
          </div>

          <article className={`action-card download-card${file ? ' is-ready' : ''}`}>
            <div className="card-topline">
              <span className="step-number">02</span>
              <span className="step-state">{file ? 'Előkészítésre vár' : 'Második lépés'}</span>
            </div>

            <div className="icon-frame"><DownloadIcon /></div>
            <div className="card-copy">
              <h2>Átalakított tábla letöltése</h2>
              <p>Az adatok a Zsalu Kft. rendelő sablonjába kerülnek, pontosan annak formátumában.</p>
            </div>

            <label className="order-field">
              <span>Megrendelő neve</span>
              <input
                type="text"
                value={customer}
                placeholder="pl. XY Kft 1"
                onChange={(event) => setCustomer(event.target.value)}
              />
              <small>Minden új rendelésnél legyen egyedi (pl. XY Kft 1, XY Kft 2).</small>
            </label>

            <button className="action-button" type="button" disabled={!canDownload} onClick={handleDownload}>
              Excel letöltése
              <span aria-hidden="true">↓</span>
            </button>
          </article>
        </section>

        <section className="file-status" aria-live="polite">
          <div className="status-icon"><FileIcon /></div>
          <div>
            <span className="status-label">Aktuális munkafájl</span>
            <strong>{file ? file.name : 'Még nincs feltöltött fájl'}</strong>
          </div>
          <div className={`status-dot${result && errors.length === 0 ? ' active' : ''}`}>
            <span></span>
            {!file ? 'Feltöltésre vár' : busy ? 'Feldolgozás…' : errors.length ? `${errors.length} hiba` : `${result?.parts.length ?? 0} alkatrész`}
          </div>
        </section>

        {result && result.issues.length > 0 && (
          <section className="issue-list" aria-label="Ellenőrzés eredménye">
            {[...errors, ...warnings].slice(0, 50).map((issue, index) => (
              <p key={index} className={issue.level === 'hiba' ? 'is-error' : 'is-warning'}>
                <b>{issue.level === 'hiba' ? 'Hiba' : 'Figyelem'}{issue.row ? ` · ${issue.row}. sor` : ''}</b>
                {issue.message}
              </p>
            ))}
            {result.issues.length > 50 && <p>…és további {result.issues.length - 50} tétel.</p>}
          </section>
        )}

        {notice && (
          <div className="notice" role="status">
            <span aria-hidden="true">✓</span>
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Értesítés bezárása">×</button>
          </div>
        )}
      </main>

      <footer>
        <span>© 2026 EXO</span>
        <span>Biztonságos Excel-feldolgozás</span>
      </footer>
    </div>
  )
}
