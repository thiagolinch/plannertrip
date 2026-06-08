import { UserRoundPlus, ArrowRight } from "lucide-react";
import { Button } from "../../../components/button";

interface InviteGuestsStepProps {
  openGuestsModal: () => void;
  openConfirmTripModal: () => void;
  emailsToInvite: string[]
}

export function InviteGuestsStep({
  emailsToInvite,
  openConfirmTripModal,
  openGuestsModal
}: InviteGuestsStepProps) {
  return (
    <div className="min-h-16 h-auto md:h-16 bg-zinc-900 px-4 py-3 md:py-0 rounded-xl flex flex-col md:flex-row items-center shadow-shape gap-3">
      <button type="button" onClick={openGuestsModal} className="flex items-center gap-2 flex-1 text-left w-full py-2 md:py-0">
        <UserRoundPlus className="size-5 text-zinc-400" />
        {emailsToInvite.length > 0 ? (
          <span className="text-zinc-100 text-lg flex-1">{emailsToInvite.length} pessoa(s) convidada(s)</span>
        ) : (
          <span className="text-zinc-400 text-lg flex-1">Quem estará na viagem?</span>
        )}
      </button>

      <div className="hidden md:block w-px h-6 bg-zinc-800" />

      <Button onClick={openConfirmTripModal} className="w-full md:w-auto justify-center">
        Confirmar viagem
        <ArrowRight className="size-5" />
      </Button>
    </div>
  )
}