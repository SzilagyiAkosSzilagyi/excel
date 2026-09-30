import { useId, useState, type DragEvent } from 'react'

interface FileDropzoneProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

export function FileDropzone({ file, onFileChange }: FileDropzoneProps) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  function acceptFirstFile(files: FileList | null) {
    onFileChange(files?.item(0) ?? null)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    acceptFirstFile(event.dataTransfer.files)
  }

  return (
    <label
      className={`dropzone${dragging ? ' is-dragging' : ''}`}
      htmlFor={inputId}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        id={inputId}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(event) => acceptFirstFile(event.target.files)}
      />
      <span className="dropzone-icon" aria-hidden="true">↑</span>
      <strong>{file ? file.name : 'Húzd ide a fájlt'}</strong>
      <span>{file ? 'Kattints másik fájl kiválasztásához' : 'vagy kattints a tallózáshoz'}</span>
      <small>XLSX, XLS vagy CSV</small>
    </label>
  )
}

