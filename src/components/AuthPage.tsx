import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'signin' | 'signup'

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  )
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Hibás e-mail-cím vagy jelszó.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'A belépés előtt erősítsd meg az e-mail-címedet.'
  }
  if (normalized.includes('user already registered')) {
    return 'Ehhez az e-mail-címhez már tartozik fiók.'
  }
  if (normalized.includes('password should be')) {
    return 'A jelszó nem felel meg a biztonsági követelményeknek.'
  }
  if (normalized.includes('rate limit')) {
    return 'Túl sok próbálkozás történt. Kérjük, próbáld meg később.'
  }

  return 'A művelet nem sikerült. Ellenőrizd az adatokat, majd próbáld újra.'
}

// A megerősítő link hibája (pl. lejárt link) a Supabase-től az URL-ben érkezik.
function readAuthLinkError() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
  const code = params.get('error_code') ?? params.get('error')
  if (!code) return ''

  window.history.replaceState(null, '', window.location.pathname)

  if (code === 'otp_expired') {
    return 'A megerősítő link lejárt vagy már felhasználták. Lépj be, vagy regisztrálj újra egy új linkért.'
  }
  return 'Az e-mail-cím megerősítése nem sikerült. Kérjük, próbáld újra.'
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(readAuthLinkError)
  const [success, setSuccess] = useState('')

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
    setPasswordAgain('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const normalizedEmail = email.trim().toLowerCase()

    if (mode === 'signup' && password.length < 8) {
      setError('A jelszó legalább 8 karakter hosszú legyen.')
      return
    }

    if (mode === 'signup' && password !== passwordAgain) {
      setError('A két jelszó nem egyezik.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (signInError) throw signInError
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })

        if (signUpError) throw signUpError

        if (!data.session) {
          setSuccess('A fiók elkészült. A belépéshez erősítsd meg az e-mail-címedet a kiküldött levélben.')
          setPassword('')
          setPasswordAgain('')
        }
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : ''
      setError(translateAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  const isSignUp = mode === 'signup'

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand auth-brand" href="/" aria-label="EXO kezdőlap">
          <span className="brand-mark">E</span>
          <span>EXO</span>
        </a>

        <div className="auth-story-copy">
          <span className="section-label">Excel átalakító</span>
          <h1>A táblázatok<br />új munkafolyamata.</h1>
          <p>
            Egy helyen töltheted fel, alakíthatod át és kezelheted a gyártáshoz
            szükséges Excel-fájlokat.
          </p>
        </div>

        <div className="auth-steps" aria-label="Az EXO működése">
          <span><b>01</b> Feltöltés</span>
          <span><b>02</b> Átalakítás</span>
          <span><b>03</b> Letöltés</span>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Fiókműveletek">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignUp}
              className={!isSignUp ? 'active' : ''}
              onClick={() => changeMode('signin')}
            >
              Belépés
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignUp}
              className={isSignUp ? 'active' : ''}
              onClick={() => changeMode('signup')}
            >
              Regisztráció
            </button>
          </div>

          <div className="auth-heading">
            <span className="auth-kicker">{isSignUp ? 'Új fiók' : 'Üdv újra'}</span>
            <h2 id="auth-title">{isSignUp ? 'Hozd létre a fiókodat.' : 'Lépj be a fiókodba.'}</h2>
            <p>
              {isSignUp
                ? 'A kezdéshez csak egy e-mail-címre és egy biztonságos jelszóra van szükség.'
                : 'Add meg a regisztrációkor használt e-mail-címedet és jelszavadat.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>E-mail-cím</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="nev@vallalkozas.hu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Jelszó</span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'Legalább 8 karakter' : 'Add meg a jelszavad'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={isSignUp ? 8 : undefined}
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? 'Elrejtés' : 'Mutatás'}
                </button>
              </div>
            </label>

            {isSignUp && (
              <label>
                <span>Jelszó újra</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password-confirmation"
                  autoComplete="new-password"
                  placeholder="Ismételd meg a jelszavad"
                  value={passwordAgain}
                  onChange={(event) => setPasswordAgain(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
            )}

            {error && <p className="auth-message error" role="alert">{error}</p>}
            {success && <p className="auth-message success" role="status">{success}</p>}

            <button className="auth-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Folyamatban…' : isSignUp ? 'Fiók létrehozása' : 'Belépés'}</span>
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <p className="auth-switch">
            {isSignUp ? 'Már van fiókod?' : 'Még nincs fiókod?'}
            <button type="button" onClick={() => changeMode(isSignUp ? 'signin' : 'signup')}>
              {isSignUp ? 'Lépj be' : 'Regisztrálj'}
            </button>
          </p>
        </div>

        <p className="auth-legal">A folytatással elfogadod az EXO felhasználási és adatkezelési feltételeit.</p>
      </section>
    </main>
  )
}
