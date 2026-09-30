import { useState } from 'react'
import { FileDropzone } from './components/FileDropzone'

export default function App() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Bútoripari adatátalakító</span>
        <h1>EXO</h1>
        <p>
          Tölts fel egy exportfájlt, ellenőrizd az adatokat, majd alakítsd át a
          gyártáshoz szükséges formátumba.
        </p>
      </section>

      <section className="converter" aria-labelledby="converter-title">
        <div>
          <span className="step">01</span>
          <h2 id="converter-title">Forrásfájl kiválasztása</h2>
          <p className="muted">Az első verzió Excel-fájlokkal fog dolgozni.</p>
        </div>

        <FileDropzone file={file} onFileChange={setFile} />

        <button className="primary-button" type="button" disabled={!file}>
          Beolvasás és ellenőrzés
        </button>

        <p className="status" role="status">
          {file
            ? `Kiválasztva: ${file.name}`
            : 'A konvertálási szabályok a mintafájlok alapján kerülnek beépítésre.'}
        </p>
      </section>
    </main>
  )
}

