import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from './lib/supabase'

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
  const [connection, setConnection] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ error }) => {
      if (active) setConnection(error ? 'error' : 'connected')
    })

    return () => {
      active = false
    }
  }, [])

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.item(0) ?? null
    setFile(selected)
    setNotice(selected ? 'A fájl sikeresen feltöltve. Az átalakításra kész.' : '')
  }

  function handleDownload() {
    setNotice('A letöltés a Supabase backend csatlakoztatása után válik elérhetővé.')
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
          <span className={`connection-pill ${connection}`}>
            <i aria-hidden="true"></i>
            {connection === 'connected'
              ? 'Supabase kapcsolódva'
              : connection === 'error'
                ? 'Kapcsolati hiba'
                : 'Kapcsolódás'}
          </span>
          <button className="profile-button" type="button" aria-label="Felhasználói profil">
            <span>ÁK</span>
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
              <p>A rendezett adatok a megadott célformátumban, letöltésre készen jelennek meg.</p>
            </div>

            <button className="action-button" type="button" disabled={!file} onClick={handleDownload}>
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
          <div className={`status-dot${file ? ' active' : ''}`}>
            <span></span>
            {file ? 'Feldolgozásra kész' : 'Feltöltésre vár'}
          </div>
        </section>

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
