import { CircleCheck, Edit2, Trash2, MapPin, ChevronDown, Calendar } from "lucide-react";
import { api } from "../../lib/axios";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditActivityModal } from "./edit-activity-modal";
import { ActivityDetailsModal } from "./activity-details-modal";

export interface Activity {
  id: string;
  title: string;
  occurs_at: string;
  local: string | null;
}

export interface ActivityCategory {
  date: string;
  activities: Activity[];
}

interface ActivitiesProps {
  isOwner: boolean;
  activities: ActivityCategory[];
  onRefreshActivities: () => void;
}

export function Activities({ isOwner, activities, onRefreshActivities }: ActivitiesProps) {
  const [selectedEditActivity, setSelectedEditActivity] = useState<Activity | null>(null)
  const [selectedDetailsActivity, setSelectedDetailsActivity] = useState<Activity | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function handleDeleteActivity(activityId: string) {
    const confirmDelete = window.confirm("Deseja realmente remover esta atividade?")
    if (!confirmDelete) return

    try {
      await api.delete(`/activities/${activityId}`)
      onRefreshActivities()
    } catch (error) {
      console.error("Erro ao deletar atividade:", error)
      alert("Erro ao deletar atividade.")
    }
  }

  const totalActivities = activities.reduce((acc, category) => acc + category.activities.length, 0)
  const hasMoreThanFour = totalActivities > 4

  const renderCategoriesList = () => {
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasMoreThanFour && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="size-5 text-zinc-400 group-hover:text-lime-300 transition-colors" />
            <span className="text-zinc-200 font-medium text-sm">
              {isOpen ? "Ocultar atividades da viagem" : `Visualizar todas as atividades da viagem (${totalActivities})`}
            </span>
          </div>
          <ChevronDown className={`size-5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {(!hasMoreThanFour || isOpen) && (
        <div className={hasMoreThanFour ? "max-h-96 overflow-y-auto pr-2 space-y-6 border border-zinc-800/60 bg-zinc-950/20 p-4 rounded-xl" : "space-y-6"}>
          {renderCategoriesList()}
        </div>
      )}

      {selectedEditActivity && (
        <EditActivityModal
          activity={selectedEditActivity}
          closeEditActivityModal={() => setSelectedEditActivity(null)}
          onRefreshActivities={onRefreshActivities}
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