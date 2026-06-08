import { MapPin, Calendar, Settings2, ArrowRight, CircleX, X } from "lucide-react";
import { Button } from "../../../components/button";
import { useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css'
import { format } from "date-fns";

interface DestinationAndDateStepProps {
  isGuestsInputOpen: boolean;
  eventStartAndEndDates: DateRange | undefined;
  closeGuestsInput: () => void;
  openGuestsInput: () => void;
  setDestination: (destination: string) => void;
  setEventStartAndEndDates: (dates: DateRange | undefined) => void;
}

export function DestinationAndDateStep({
  closeGuestsInput,
  isGuestsInputOpen,
  openGuestsInput,
  setDestination,
  setEventStartAndEndDates,
  eventStartAndEndDates
}: DestinationAndDateStepProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  function openDatePicker() {
    setIsDatePickerOpen(true);
  }

  function closeDatePicker() {
    setIsDatePickerOpen(false);
  }

  const handleDashboard = () => {
    window.location.href = "/"
  }

  const displayedDate = eventStartAndEndDates && eventStartAndEndDates.from && eventStartAndEndDates.to
    ? format(eventStartAndEndDates.from, "d' de 'LLL").concat(' até ').concat(format(eventStartAndEndDates.to, "d' de 'LLL"))
    : null

  return (
    <div className="min-h-16 h-auto md:h-16 bg-zinc-900 px-4 py-3 md:py-0 rounded-xl flex flex-col md:flex-row items-center shadow-shape gap-3">
      <div className="flex items-center gap-2 flex-1 w-full">
        <MapPin className="size-5 text-zinc-400" />
        <input
          disabled={isGuestsInputOpen}
          type="text"
          placeholder="Para onde você vai?"
          className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1 w-full"
          onChange={event => setDestination(event.target.value)}
        />
      </div>

      <button disabled={isGuestsInputOpen} onClick={openDatePicker} className="flex items-center gap-2 text-left w-full md:w-[240px] py-2 md:py-0">
        <Calendar className="size-5 text-zinc-400" />
        <span
          className="text-lg text-zinc-400 w-40 flex-1"
        >
          {displayedDate || 'Quando'}
        </span>
      </button>

      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-5 max-w-full">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-lg font-semibold">Selecione a data</h2>
                <button>
                  <X className="size-5 text-zinc-400" onClick={closeDatePicker} />
                </button>
              </div>
            </div>

            <DayPicker mode="range" selected={eventStartAndEndDates} onSelect={setEventStartAndEndDates} />
          </div>
        </div>
      )}

      <div className="hidden md:block w-px h-6 bg-zinc-800" />

      {isGuestsInputOpen ? (
        <Button onClick={closeGuestsInput} variant="secondary" className="w-full md:w-auto justify-center">
          Alterar local/data
          <Settings2 className="size-5" />
        </Button>
      ) : (
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button onClick={openGuestsInput} className="flex-1 md:flex-none justify-center">
            Continuar
            <ArrowRight className="size-5" />
          </Button>
          <Button onClick={handleDashboard} variant="danger" className="justify-center">
            <CircleX className="size-5 " />
          </Button>
        </div>
      )
      }
    </div >
  )
}