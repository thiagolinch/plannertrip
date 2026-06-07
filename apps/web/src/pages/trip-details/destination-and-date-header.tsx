import { MapPin, Calendar, Settings2, ChevronLeft } from "lucide-react";
import { Button } from "../../components/button";
import { useState } from "react";
import { format } from "date-fns";
import { UpdateTripModal } from "./update-trip-modal";

interface Trip {
  id: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  is_confirmed: boolean
}

interface DestinationAndDateHeaderProps {
  trip: Trip | undefined;
}

export function DestinationAndDateHeader({ trip }: DestinationAndDateHeaderProps) {
  const [isUpdateTripModalOpen, setIsUpdateTripModalOpen] = useState(false)

  const handleDashboard = () => {
    window.location.href = "/"
  }

  function openUpdateTripModal() {
    setIsUpdateTripModalOpen(true)
  }

  function closeUpdateTripModal() {
    setIsUpdateTripModalOpen(false)
  }

  const displayedDate = trip ? format(new Date(trip.starts_at), "d' de 'LLL").concat(' até ').concat(format(new Date(trip.ends_at), "d' de 'LLL"))
    : null

  return (
    <div className="px-4 py-3 min-h-[4rem] md:h-16 rounded-xl bg-zinc-900 shadow-shape flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
        <button onClick={handleDashboard} className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-lg shrink-0">
          <ChevronLeft className="size-5 text-zinc-400" />
          <p className="text-zinc-100">Voltar</p>
        </button>
        
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="size-5 text-zinc-400 shrink-0" />
          <span className="text-zinc-100 truncate">{trip?.destination}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="size-5 text-zinc-400" />
          <span className="text-zinc-100">{displayedDate}</span>
        </div>

        <div className="hidden sm:block w-px h-6 bg-zinc-800" />

        <Button onClick={openUpdateTripModal} variant="secondary" className="w-full sm:w-auto justify-center">
          Alterar local/data
          <Settings2 className="size-5" />
        </Button>
      </div>

      {isUpdateTripModalOpen && (
        <UpdateTripModal 
          closeUpdateTripModal={closeUpdateTripModal}
          trip={trip}
        />
      )}
    </div>
  )
}