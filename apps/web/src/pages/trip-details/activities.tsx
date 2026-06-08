import { CircleCheck, Edit2, Trash2, MapPin } from "lucide-react";
import { api } from "../../lib/axios";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditActivityModal } from "./edit-activity-modal";
import { ActivityDetailsModal } from "./activity-details-modal";

interface Activity {
  id: string;
  title: string;
  occurs_at: string;
  local: string | null;
}

interface ActivityCategory {
  date: string;
  activities: Activity[];
}

interface ActivitiesProps {
  isOwner: boolean;
}

export function Activities({ isOwner }: ActivitiesProps) {
  const { tripId } = useParams()
  const [activities, setActivities] = useState<ActivityCategory[]>([])
  const [selectedEditActivity, setSelectedEditActivity] = useState<Activity | null>(null)
  const [selectedDetailsActivity, setSelectedDetailsActivity] = useState<Activity | null>(null)

  const fetchActivities = useCallback(() => {
    api.get(`trips/${tripId}/activities`).then(response => setActivities(response.data.activities))
  }, [tripId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  async function handleDeleteActivity(activityId: string) {
    const confirmDelete = window.confirm("Deseja realmente remover esta atividade?")
    if (!confirmDelete) return

    try {
      await api.delete(`/activities/${activityId}`)
      fetchActivities()
    } catch (error) {
      console.error("Erro ao deletar atividade:", error)
      alert("Erro ao deletar atividade.")
    }
  }

  return (
    <div className="space-y-8">
      {activities.map(category => {
        return (
          <div key={category.date} className="space-y-2.5">
            <div className="flex gap-2 items-baseline">
              <span className="text-xl text-zinc-300 font-semibold">Dia {format(new Date(category.date), 'd')}</span>
              <span className="text-xs text-zinc-500">{format(new Date(category.date), 'EEEE', { locale: ptBR })}</span>
            </div>
            {category.activities.length > 0 ? (
              <div className="space-y-2">
                {category.activities.map(activity => {
                  return (
                    <div 
                      key={activity.id} 
                      onClick={() => setSelectedDetailsActivity(activity)}
                      className="px-4 py-2.5 bg-zinc-900 rounded-xl shadow-shape flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-800/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CircleCheck className="size-5 text-lime-300 shrink-0 group-hover:text-lime-400 transition-colors" />
                        <div className="space-y-0.5 min-w-0">
                          <span className="block text-zinc-100 font-medium truncate group-hover:text-zinc-50 transition-colors">{activity.title}</span>
                          {activity.local && (
                            <span className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-zinc-350 transition-colors">
                              <MapPin className="size-3.5 shrink-0" />
                              <span className="truncate">{activity.local}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-zinc-400 text-sm">
                          {format(new Date(activity.occurs_at), 'HH:mm')}h
                        </span>
                        <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEditActivity(activity)
                            }}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                            title="Editar atividade"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteActivity(activity.id)
                              }}
                              className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                              title="Excluir atividade"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Nenhuma atividade cadastrada nessa data.</p>
            )}
          </div>
        )
      })}

      {selectedEditActivity && (
        <EditActivityModal
          activity={selectedEditActivity}
          closeEditActivityModal={() => setSelectedEditActivity(null)}
          onRefreshActivities={fetchActivities}
        />
      )}

      {selectedDetailsActivity && (
        <ActivityDetailsModal
          activity={selectedDetailsActivity}
          closeActivityDetailsModal={() => setSelectedDetailsActivity(null)}
          onOpenEditModal={() => {
            const act = selectedDetailsActivity
            setSelectedDetailsActivity(null)
            setSelectedEditActivity(act)
          }}
        />
      )}
    </div>
  )
}