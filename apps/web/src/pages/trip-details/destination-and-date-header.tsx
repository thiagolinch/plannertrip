import { MapPin, Calendar, Settings2, ChevronLeft } from "lucide-react";
import { Button } from "../../components/button";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../lib/axios";
import { format } from "date-fns";

interface Trip {
  id: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  is_confirmed: boolean
}

export function DestinationAndDateHeader() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState<Trip | undefined>()
  console.log('trip infos: ', trip)

  useEffect(() => {
    api.get(`trips/${tripId}`).then(response => setTrip(response.data.trip))
  }, [tripId])

  const handleDashboard = () => {
    window.location.href = "/"
  }

  const displayedDate = trip ? format(new Date(trip.starts_at), "d' de 'LLL").concat(' até ').concat(format(new Date(trip.ends_at), "d' de 'LLL"))
    : null

  return (
    <div className="px-4 h-16 rounded-xl bg-zinc-900 shadow-shape flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={handleDashboard} className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-lg">
          <ChevronLeft className="size-5 text-zinc-400" />
          <p className="text-zinc-100">Voltar</p>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="size-5 text-zinc-400" />
        <span className="text-zinc-100">{trip?.destination}</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-zinc-400" />
          <span className="text-zinc-100">{displayedDate}</span>
        </div>

        <div className="w-px h-6 bg-zinc-800" />

        <Button variant="secondary">
          Alterar local/data
          <Settings2 className="size-5" />
        </Button>
      </div>
    </div>
  )
}