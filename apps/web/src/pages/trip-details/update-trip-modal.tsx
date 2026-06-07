import { Calendar, MapPin, X } from "lucide-react";
import { Button } from "../../components/button";
import { FormEvent, useState } from "react";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { DateRange, DayPicker } from "react-day-picker";
import { format } from "date-fns";

interface Trip {
  id: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  is_confirmed: boolean;
}

interface UpdateTripModalProps {
  closeUpdateTripModal: () => void;
  trip: Trip | undefined;
}

export function UpdateTripModal({
  closeUpdateTripModal,
  trip,
}: UpdateTripModalProps) {
  const { tripId } = useParams();
  const [destination, setDestination] = useState(trip?.destination || "");
  const [eventStartAndEndDates, setEventStartAndEndDates] = useState<DateRange | undefined>(
    trip
      ? {
          from: new Date(trip.starts_at),
          to: new Date(trip.ends_at),
        }
      : undefined
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpdateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!destination || !eventStartAndEndDates?.from || !eventStartAndEndDates?.to) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.put(`/trips/${tripId}`, {
        destination,
        starts_at: eventStartAndEndDates.from.toISOString(),
        ends_at: eventStartAndEndDates.to.toISOString(),
      });
      window.document.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedDate =
    eventStartAndEndDates && eventStartAndEndDates.from && eventStartAndEndDates.to
      ? format(eventStartAndEndDates.from, "d' de 'LLL").concat(" até ").concat(format(eventStartAndEndDates.to, "d' de 'LLL"))
      : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-[640px] max-w-full rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-5 my-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-lg font-semibold">Alterar local/data</h2>
            <button onClick={closeUpdateTripModal}>
              <X className="size-5 text-zinc-400 hover:text-zinc-300" />
            </button>
          </div>

          <p className="text-sm text-zinc-400">
            Atualize o destino e as datas da sua viagem.
          </p>
        </div>

        <form onSubmit={handleUpdateTrip} className="space-y-3">
          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <MapPin className="text-zinc-400 size-5" />
            <input
              name="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Para onde você vai?"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
            />
          </div>

          <button
            type="button"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2 text-left w-full"
          >
            <Calendar className="text-zinc-400 size-5" />
            <span className="text-zinc-100 text-lg flex-1">
              {displayedDate || "Quando?"}
            </span>
          </button>

          {isDatePickerOpen && (
            <div className="flex justify-center p-2 bg-zinc-950 border border-zinc-800 rounded-lg overflow-x-auto">
              <DayPicker
                mode="range"
                selected={eventStartAndEndDates}
                onSelect={setEventStartAndEndDates}
              />
            </div>
          )}

          <Button size="full" disabled={isSubmitting}>
            {isSubmitting ? "Salvando alterações..." : "Salvar alterações"}
          </Button>
        </form>
      </div>
    </div>
  );
}
