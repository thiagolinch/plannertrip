import { AtSign, CheckCircle2, CircleDashed, Plus, X } from "lucide-react";
import { Button } from "../../components/button";
import { FormEvent, useState } from "react";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";

interface Participant {
  id: string;
  name: string | null;
  email: string;
  is_confirmed: boolean;
}

interface ManageGuestsModalProps {
  closeManageGuestsModal: () => void;
  participants: Participant[];
  onRefreshParticipants: () => void;
}

export function ManageGuestsModal({
  closeManageGuestsModal,
  participants,
  onRefreshParticipants,
}: ManageGuestsModalProps) {
  const { tripId } = useParams();
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  async function handleInviteGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const email = data.get("email")?.toString();

    if (!email) {
      return;
    }

    setIsSendingInvite(true);

    try {
      await api.post(`/trips/${tripId}/invites`, { email });
      onRefreshParticipants();
      event.currentTarget.reset();
    } catch (error) {
      console.error("Erro ao convidar participante:", error);
    } finally {
      setIsSendingInvite(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-[640px] max-w-full rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-lg font-semibold">Gerenciar convidados</h2>
            <button onClick={closeManageGuestsModal}>
              <X className="size-5 text-zinc-400 hover:text-zinc-300" />
            </button>
          </div>

          <p className="text-sm text-zinc-400">
            Convidados receberão e-mails para confirmar presença na viagem.
          </p>
        </div>

        {/* Scrollable List of Guests */}
        <div className="max-h-60 overflow-y-auto space-y-4 pr-1">
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex items-center justify-between gap-4 p-2 bg-zinc-950/40 rounded-lg border border-zinc-800/40">
              <div className="space-y-1 min-w-0 flex-1">
                <span className="block font-medium text-zinc-100 truncate">
                  {participant.name ?? `Convidado ${index + 1}`}
                </span>
                <span className="block text-xs text-zinc-400 truncate">
                  {participant.email}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {participant.is_confirmed ? (
                  <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/20">
                    <CheckCircle2 className="size-3.5" />
                    <span>Confirmado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full border border-zinc-700">
                    <CircleDashed className="size-3.5" />
                    <span>Pendente</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-zinc-800" />

        {/* Invite Form */}
        <form onSubmit={handleInviteGuest} className="space-y-3">
          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <AtSign className="text-zinc-400 size-5" />
            <input
              type="email"
              name="email"
              placeholder="Digite o e-mail do convidado"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
              disabled={isSendingInvite}
            />
          </div>

          <Button size="full" disabled={isSendingInvite}>
            {isSendingInvite ? (
              "Enviando convite..."
            ) : (
              <>
                <Plus className="size-5" />
                Convidar
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
