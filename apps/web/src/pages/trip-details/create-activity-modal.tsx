import { Calendar, Tag, X, MapPin } from "lucide-react";
import { Button } from "../../components/button";
import { FormEvent, useState } from "react";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";

interface CreateActivityModalProps {
  closeCreateActivityModal: () => void
}

export function CreateActivityModal({
  closeCreateActivityModal
}: CreateActivityModalProps) {
  const { tripId } = useParams()
  const [isCreatingActivity, setIsCreatingActivity] = useState(false)

  async function createActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)

    const title = data.get('title')?.toString()
    const occurs_at = data.get('occurs_at')?.toString()
    const local = data.get('local')?.toString()

    if (!title || !occurs_at) {
      return
    }

    setIsCreatingActivity(true)

    try {
      await api.post(`/trips/${tripId}/activities`, {
        title,
        occurs_at,
        local: local || null,
      })

      alert("Atividade criada com sucesso!")
      closeCreateActivityModal()
      window.document.location.reload()
    } catch (error) {
      console.error("Erro ao criar atividade:", error)
      alert("Erro ao criar atividade. Certifique-se de que a data está dentro do período da viagem.")
    } finally {
      setIsCreatingActivity(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-[640px] max-w-full rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-lg font-semibold">Cadastrar atividade</h2>
            <button type="button" onClick={closeCreateActivityModal}>
              <X className="size-5 text-zinc-400 hover:text-zinc-300" />
            </button>
          </div>

          <p className="text-sm text-zinc-400">
            Todos convidados podem visualizar as atividades.
          </p>
        </div>
        
        <form onSubmit={createActivity} className="space-y-3">
          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Tag className="text-zinc-400 size-5" />
            <input
              name="title"
              placeholder="Qual a atividade?"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
              disabled={isCreatingActivity}
            />
          </div>

          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <MapPin className="text-zinc-400 size-5" />
            <input
              name="local"
              placeholder="Onde será a atividade? (opcional)"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              disabled={isCreatingActivity}
            />
          </div>

          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Calendar className="text-zinc-400 size-5" />
            <input
              type="datetime-local"
              name="occurs_at"
              placeholder="Data e horário da atividade"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
              disabled={isCreatingActivity}
            />
          </div>

          <Button size="full" disabled={isCreatingActivity}>
            {isCreatingActivity ? "Criando atividade..." : "Salvar atividade"}
          </Button>
        </form>
      </div>
    </div>
  )
}