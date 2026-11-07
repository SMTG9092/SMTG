
import { useState } from 'react'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [message, setMessage] = useState('')

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      setMessage('Veuillez saisir votre identifiant et mot de passe.')
      return
    }

    setMessage('Interface prête. Authentification à connecter au serveur.')
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="visual-overlay" />

        <header className="brand">
          <div className="brand-symbol">S</div>
          <div>
            <h1>SMTG</h1>
            <span>MANAGEMENT SYSTEM</span>
          </div>
        </header>

        <div className="visual-content">
          <span className="visual-tag">ENTERPRISE MANAGEMENT</span>
          <h2>
            Manage your business.
            <br />
            <span>Control your future.</span>
          </h2>
          <p>
            Une plateforme intégrée pour piloter,
            organiser et optimiser l'ensemble
            des activités de votre entreprise.
          </p>
        </div>

        <footer className="visual-footer">
          SMTG ERP · BUSINESS MANAGEMENT PLATFORM
        </footer>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-symbol">S</div>
            <span>SMTG ERP</span>
          </div>

          <div className="welcome-icon">
            <span>↗</span>
          </div>

          <span className="welcome-label">WELCOME BACK</span>
          <h2>Sign in</h2>
          <p className="login-description">
            Connectez-vous à votre espace de travail.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="username">Identifiant</label>
            <div className="input-wrapper">
              <span className="input-icon">♙</span>
              <input
                id="username"
                type="text"
                placeholder="Votre identifiant"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <label htmlFor="password">Mot de passe</label>
            <div className="input-wrapper">
              <span className="input-icon">♙</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Se souvenir de moi</span>
              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  setMessage('Contactez votre administrateur pour réinitialiser votre mot de passe.')
                }
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button className="login-button" type="submit">
              Se connecter <span>→</span>
            </button>

            {message && (
              <div className="login-message" role="status">
                {message}
              </div>
            )}
          </form>

          <div className="security-note">
            <span>▣</span>
            Accès sécurisé · SMTG ERP
          </div>
        </div>

        <footer className="panel-footer">
          © 2026 SMTG · Tous droits réservés
        </footer>
      </section>
    </main>
  )
}

export default App
