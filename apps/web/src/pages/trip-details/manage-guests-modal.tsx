import { AtSign, CheckCircle2, CircleDashed, Plus, X, Edit2, Trash2, Check } from "lucide-react";
import { Button } from "../../components/button";
import { FormEvent, useState } from "react";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";

interface Participant {
  id: string;
  name: string | null;
  email: string;
  is_confirmed: boolean;
  is_owner: boolean;
}

interface ManageGuestsModalProps {
  closeManageGuestsModal: () => void;
  participants: Participant[];
  onRefreshParticipants: () => void;
  isOwner: boolean;
}

export function ManageGuestsModal({
  closeManageGuestsModal,
  participants,
  onRefreshParticipants,
  isOwner,
}: ManageGuestsModalProps) {
  const { tripId } = useParams();
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function handleInviteGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = data.get("email")?.toString();

    if (!email) {
      return;
    }

    setIsSendingInvite(true);

    try {
      await api.post(`/trips/${tripId}/invites`, { email });
      onRefreshParticipants();
      form.reset();
      alert("Convidado adicionado com sucesso!");
      closeManageGuestsModal();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Erro ao convidar participante:", axiosError);
      alert(axiosError.response?.data?.message || "Erro ao convidar participante.");
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function handleDeleteParticipant(participantId: string) {
    const confirmDelete = window.confirm("Deseja realmente remover este convidado da viagem?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/participants/${participantId}`);
      onRefreshParticipants();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Erro ao remover convidado:", axiosError);
      alert(axiosError.response?.data?.message || "Erro ao remover convidado.");
    }
  }

  async function handleSaveEditParticipant(participantId: string) {
    if (!editEmail) return;

    setIsSavingEdit(true);
    try {
      await api.patch(`/participants/${participantId}`, { email: editEmail });
      setEditingParticipantId(null);
      onRefreshParticipants();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Erro ao atualizar e-mail do convidado:", axiosError);
      alert(axiosError.response?.data?.message || "Erro ao atualizar e-mail.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  function startEditing(participant: Participant) {
    setEditingParticipantId(participant.id);
    setEditEmail(participant.email);
  }

  function cancelEditing() {
    setEditingParticipantId(null);
    setEditEmail("");
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
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
                  {participant.name ?? `Convidado ${index + 1}`} {participant.is_owner && <span className="text-xs text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded ml-1">Organizador</span>}
                </span>
                {editingParticipantId === participant.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      disabled={isSavingEdit}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 outline-none focus:border-lime-300 flex-1"
                    />
                    <button
                      onClick={() => handleSaveEditParticipant(participant.id)}
                      disabled={isSavingEdit}
                      className="text-green-400 hover:text-green-300 disabled:opacity-50 p-1"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSavingEdit}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 p-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <span className="block text-xs text-zinc-400 truncate">
                    {participant.email}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
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

                {isOwner && !participant.is_owner && editingParticipantId !== participant.id && (
                  <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
                    <button
                      onClick={() => startEditing(participant)}
                      className="text-zinc-400 hover:text-zinc-200 p-1 transition-colors"
                      title="Editar e-mail"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteParticipant(participant.id)}
                      className="text-zinc-400 hover:text-red-400 p-1 transition-colors"
                      title="Remover convidado"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-zinc-800" />

        {/* Invite Form / Restriction Info */}
        {isOwner ? (
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
        ) : (
          <div className="bg-zinc-950 border border-zinc-800/60 p-4 rounded-lg flex items-center gap-3 justify-center text-zinc-400 text-sm">
            <span>⚠️ Apenas o organizador desta viagem pode convidar novos participantes.</span>
          </div>
        )}
      </div>
    </div>
  );
}
