import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import logo from '../../assets/imgs/logo.svg'

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('Falha ao autenticar com o Google. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const provider = new OAuthProvider('apple.com')
      await signInWithPopup(auth, provider)
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('Falha ao autenticar com a Apple. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center bg-zinc-950">
      <div className="max-w-md w-full px-6 text-center space-y-8">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="plann.er" className="h-10" />
          <p className="text-zinc-400 text-md">
            Faça login para gerenciar suas viagens e planejar novas rotas.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl shadow-xl space-y-4 backdrop-blur-md">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-lime-300 text-zinc-950 font-medium h-11 px-5 rounded-lg hover:bg-lime-400 transition-colors disabled:opacity-50"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Entrar com o Google
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-800 border border-zinc-700 text-zinc-50 font-medium h-11 px-5 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {/* Apple Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39z" />
            </svg>
            Entrar com a Apple
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Ao prosseguir, você concorda com nossos <br />
          <a className="text-zinc-400 underline" href="#">termos de uso</a> e <a className="text-zinc-400 underline" href="#">políticas de privacidade</a>.
        </p>
      </div>
    </div>
  )
}
