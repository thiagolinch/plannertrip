import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/axios";
import { CreateActivityModal } from "./create-activity-modal";
import { ImportantLinks, Link } from "./important-links";
import { Guests, Participant } from "./guests";
import { Activities, ActivityCategory } from "./activities";
import { DestinationAndDateHeader } from "./destination-and-date-header";
import { LoadingOverlay } from "../../components/loading-overlay";

interface Trip {
  id: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  is_confirmed: boolean;
}

interface MyParticipant {
  id: string;
  name: string | null;
  email: string;
  is_confirmed: boolean;
  is_owner: boolean;
}

export function TripDetailsPage() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState<Trip | undefined>()
  const [myParticipant, setMyParticipant] = useState<MyParticipant | undefined>()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmingTrip, setIsConfirmingTrip] = useState(false)
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false)
  const [activities, setActivities] = useState<ActivityCategory[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [isLoading, setIsLoading] = useState(true)

  function fetchActivities() {
    api.get(`trips/${tripId}/activities`).then(response => setActivities(response.data.activities))
  }

  function fetchParticipants() {
    api.get(`trips/${tripId}/participants`).then(response => setParticipants(response.data.participants))
  }

  function fetchLinks() {
    api.get(`/trips/${tripId}/links`).then(response => setLinks(response.data.links))
  }

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      api.get(`/trips/${tripId}`),
      api.get(`/trips/${tripId}/activities`),
      api.get(`/trips/${tripId}/participants`),
      api.get(`/trips/${tripId}/links`)
    ]).then(([tripRes, activitiesRes, participantsRes, linksRes]) => {
      setTrip(tripRes.data.trip)
      setMyParticipant(tripRes.data.my_participant)
      setActivities(activitiesRes.data.activities)
      setParticipants(participantsRes.data.participants)
      setLinks(linksRes.data.links)
    }).catch(error => {
      console.error("Erro ao carregar os dados da viagem:", error)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [tripId])

  async function handleConfirmPresence() {
    if (!myParticipant) return
    setIsConfirming(true)
    try {
      await api.patch(`/participants/${myParticipant.id}/confirm`)
      window.document.location.reload()
    } catch (error) {
      console.error("Erro ao confirmar presença:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  async function handleConfirmTrip() {
    setIsConfirmingTrip(true)
    try {
      await api.patch(`/trips/${tripId}/confirm`)
      window.document.location.reload()
    } catch (error) {
      console.error("Erro ao confirmar viagem:", error)
    } finally {
      setIsConfirmingTrip(false)
    }
  }

  function openCreateActivityModal() {
    setIsCreateActivityModalOpen(true)
  }

  function closeCreateActivityModal() {
    setIsCreateActivityModalOpen(false)
  }

  return (
    <>
      {isLoading && <LoadingOverlay message="Carregando detalhes da viagem..." />}
      <div className="max-w-6xl px-6 py-10 mx-auto space-y-8">
      <DestinationAndDateHeader trip={trip} isOwner={myParticipant?.is_owner || false} />

      {trip && !trip.is_confirmed && myParticipant?.is_owner && (
        <div className="bg-zinc-900 border border-orange-400/20 px-6 py-4 rounded-xl shadow-shape flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-zinc-100 font-medium">
              ⚠️ Esta viagem ainda não foi confirmada! Confirme para disparar os convites por e-mail para todos os convidados.
            </span>
          </div>
          <button
            onClick={handleConfirmTrip}
            disabled={isConfirmingTrip}
            className="bg-orange-400 text-zinc-950 rounded-lg px-5 py-2.5 font-medium flex items-center justify-center gap-2 hover:bg-orange-500 shrink-0"
          >
            {isConfirmingTrip ? "Confirmando..." : "Confirmar viagem"}
          </button>
        </div>
      )}

      {myParticipant && !myParticipant.is_owner && !myParticipant.is_confirmed && (
        <div className="bg-zinc-900 border border-lime-300/20 px-6 py-4 rounded-xl shadow-shape flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-zinc-100 font-medium">
              🎉 Você foi convidado(a) para esta viagem! Confirme sua presença para começar a colaborar.
            </span>
          </div>
          <button
            onClick={handleConfirmPresence}
            disabled={isConfirming}
            className="bg-lime-300 text-lime-950 rounded-lg px-5 py-2.5 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 shrink-0"
          >
            {isConfirming ? "Confirmando..." : "Confirmar presença"}
          </button>
        </div>
      )}

      <main className="flex flex-col lg:flex-row gap-8 lg:gap-16 px-4">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <h2 className="text-3xl font-semibold">Atividades</h2>

            <button onClick={openCreateActivityModal} className="bg-lime-300 text-lime-950 rounded-lg px-5 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 w-full sm:w-auto">
              <Plus className="size-5" />
              Cadastrar atividade
            </button>
          </div>

          <Activities 
            isOwner={myParticipant?.is_owner || false} 
            activities={activities} 
            onRefreshActivities={fetchActivities} 
          />
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <ImportantLinks 
            isOwner={myParticipant?.is_owner || false} 
            links={links} 
            onRefreshLinks={fetchLinks} 
          />

          <div className="w-full h-px bg-zinc-800" />

          <Guests 
            isOwner={myParticipant?.is_owner || false} 
            participants={participants} 
            onRefreshParticipants={fetchParticipants} 
          />
        </div>
      </main>

      {isCreateActivityModalOpen && (
        <CreateActivityModal
          closeCreateActivityModal={closeCreateActivityModal}
        />
      )}
    </div>
    </>
  )
}