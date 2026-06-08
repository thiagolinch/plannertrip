import { Calendar, Tag, X, MapPin } from "lucide-react";
import { Button } from "../../components/button";
import { FormEvent, useState } from "react";
import { api } from "../../lib/axios";
import { AxiosError } from "axios";

interface EditActivityModalProps {
  closeEditActivityModal: () => void
  activity: {
    id: string
    title: string
    occurs_at: string
    local: string | null
  }
  onRefreshActivities: () => void
}

export function EditActivityModal({
  closeEditActivityModal,
  activity,
  onRefreshActivities,
}: EditActivityModalProps) {
  const [isSavingActivity, setIsSavingActivity] = useState(false)
  const [title, setTitle] = useState(activity.title)
  const [local, setLocal] = useState(activity.local || "")
  
  // Format occurs_at to YYYY-MM-DDTHH:mm in local timezone
  const dateObj = new Date(activity.occurs_at)
  const tzOffset = dateObj.getTimezoneOffset() * 60000
  const localISODate = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16)
  const [occursAt, setOccursAt] = useState(localISODate)

  async function updateActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title || !occursAt) {
      return
    }

    setIsSavingActivity(true)

    try {
      await api.patch(`/activities/${activity.id}`, {
        title,
        occurs_at: new Date(occursAt).toISOString(),
        local: local || null,
      })

      alert("Atividade atualizada com sucesso!")
      closeEditActivityModal()
      onRefreshActivities()
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error("Erro ao atualizar atividade:", axiosError)
      alert(axiosError.response?.data?.message || "Erro ao atualizar atividade. Certifique-se de que a data está dentro do período da viagem.")
    } finally {
      setIsSavingActivity(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-[640px] max-w-full rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-lg font-semibold">Editar atividade</h2>
            <button type="button" onClick={closeEditActivityModal}>
              <X className="size-5 text-zinc-400 hover:text-zinc-300" />
            </button>
          </div>

          <p className="text-sm text-zinc-400">
            Todos convidados podem visualizar e atualizar as atividades.
          </p>
        </div>
        
        <form onSubmit={updateActivity} className="space-y-3">
          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Tag className="text-zinc-400 size-5" />
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Qual a atividade?"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
              disabled={isSavingActivity}
            />
          </div>

          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <MapPin className="text-zinc-400 size-5" />
            <input
              name="local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Onde será a atividade? (opcional)"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              disabled={isSavingActivity}
            />
          </div>

          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Calendar className="text-zinc-400 size-5" />
            <input
              type="datetime-local"
              name="occurs_at"
              value={occursAt}
              onChange={(e) => setOccursAt(e.target.value)}
              placeholder="Data e horário da atividade"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
              disabled={isSavingActivity}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="secondary" className="w-full" onClick={closeEditActivityModal} disabled={isSavingActivity}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full" disabled={isSavingActivity}>
              {isSavingActivity ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
