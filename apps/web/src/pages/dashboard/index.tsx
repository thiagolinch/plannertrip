import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, MapPin, Calendar, Compass, User } from 'lucide-react'
import { auth } from '../../lib/firebase'
import { api } from '../../lib/axios'
import logo from '../../assets/imgs/logo.svg'
import { Button } from '../../components/button'

interface Trip {
  id: string
  destination: string
  starts_at: string
  ends_at: string
  is_confirmed: boolean
  is_owner: boolean
  user_confirmed: boolean
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentUser = auth.currentUser

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await api.get('/trips')
        setTrips(response.data.trips)
      } catch (err) {
        console.error(err)
        setError('Não foi possível carregar as viagens. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [])

  const handleLogout = async () => {
    await auth.signOut()
    navigate('/login')
  }

  const formatDateRange = (startsAt: string, endsAt: string) => {
    const start = new Date(startsAt)
    const end = new Date(endsAt)
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    const startFormatted = start.toLocaleDateString('pt-BR', options)
    const endFormatted = end.toLocaleDateString('pt-BR', options)
    const year = start.getFullYear()

    return `${startFormatted} a ${endFormatted} de ${year}`
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="plann.er" className="h-7" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm hidden sm:flex">
              <User className="size-4 text-zinc-500" />
              <span>Olá, <strong className="text-zinc-200">{currentUser?.displayName || currentUser?.email}</strong></span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-zinc-400 hover:text-red-400 text-sm transition-colors font-medium border border-zinc-800 hover:border-red-500/30 px-3 py-1.5 rounded-lg"
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Minhas Viagens</h1>
            <p className="text-zinc-400 text-sm sm:text-base">Gerencie e acompanhe seus roteiros de viagens planejadas.</p>
          </div>

          <Button onClick={() => navigate('/trips/create')} className="flex items-center gap-2">
            <Plus className="size-5" />
            <span className="hidden sm:inline">Nova Viagem</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-lime-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-400 text-sm">Carregando viagens...</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl text-center py-10">
            {error}
          </div>
        ) : trips.length === 0 ? (
          /* Empty State */
          <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-6 bg-zinc-900/10 backdrop-blur-md">
            <div className="p-4 bg-zinc-900 rounded-full text-zinc-500">
              <Compass className="size-10" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Nenhuma viagem encontrada</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Você ainda não criou nenhuma viagem e não foi convidado para nenhuma. Comece planejando um novo destino com seus amigos!
              </p>
            </div>
            <Button onClick={() => navigate('/trips/create')} className="flex items-center gap-2 mx-auto">
              <Plus className="size-5" />
              <span>Criar minha primeira viagem</span>
            </Button>
          </div>
        ) : (
          /* Trips Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 p-6 rounded-xl space-y-4 cursor-pointer transition-all hover:scale-[1.02] shadow-lg backdrop-blur-sm group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      trip.is_owner
                        ? 'bg-lime-300/10 text-lime-300 border border-lime-500/20'
                        : 'bg-blue-300/10 text-blue-300 border border-blue-500/20'
                    }`}>
                      {trip.is_owner ? 'Organizador' : 'Convidado'}
                    </span>

                    {!trip.is_confirmed && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                        Não Confirmada
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg text-zinc-100 group-hover:text-lime-300 transition-colors flex items-center gap-2">
                    <MapPin className="size-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-400 pt-2 border-t border-zinc-800/50">
                  <Calendar className="size-4 shrink-0" />
                  <span>{formatDateRange(trip.starts_at, trip.ends_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
