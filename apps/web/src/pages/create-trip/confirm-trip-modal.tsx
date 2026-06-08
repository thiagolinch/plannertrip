import { User, X } from "lucide-react";
import { FormEvent } from "react";
import { Button } from "../../components/button";

interface ConfirmTripModalProps {
  closeConfirmTripModal: () => void
  setOwnerName: (name: string) => void;
  createTrip: (event: FormEvent<HTMLFormElement>) => void;
  destination: string;
  dataTripFrom: number | undefined;
  dataTripTo: number | undefined;
  dataTripMonth: string | undefined;
  ownerName: string;
}

export function ConfirmTripModal({
  closeConfirmTripModal,
  createTrip,
  setOwnerName,
  destination,
  dataTripFrom,
  dataTripTo,
  dataTripMonth,
  ownerName
}: ConfirmTripModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-[640px] max-w-full rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-lg font-semibold">Confirmar criação de viagem</h2>
            <button>
              <X className="size-5 text-zinc-400" onClick={closeConfirmTripModal} />
            </button>
          </div>

          <p className="text-sm text-zinc-400">
            Para concluir a criação da viagem para <span className="font-semibold text-zinc-100">{destination}</span> nas datas de <span className="font-semibold text-zinc-100">{dataTripFrom} a {dataTripTo} de {dataTripMonth} de 2024</span> preencha seu nome abaixo:
          </p>
        </div>
        
        <form onSubmit={createTrip} className="space-y-3">
          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <User className="text-zinc-400 size-5" />
            <input
              type="text"
              name="name"
              value={ownerName}
              placeholder="Seu nome completo"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              onChange={event => setOwnerName(event.target.value)}
            />
          </div>

          <Button type="submit" size="full">
            Confirmar criação da viagem
          </Button>
        </form>
      </div>
    </div>
  )
}