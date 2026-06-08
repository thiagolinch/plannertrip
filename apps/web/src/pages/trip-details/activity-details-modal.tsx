import { Calendar, X, MapPin, Edit2, Info } from "lucide-react";
import { Button } from "../../components/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityDetailsModalProps {
  activity: {
    id: string;
    title: string;
    occurs_at: string;
    local: string | null;
  };
  closeActivityDetailsModal: () => void;
  onOpenEditModal: () => void;
}

export function ActivityDetailsModal({
  activity,
  closeActivityDetailsModal,
  onOpenEditModal,
}: ActivityDetailsModalProps) {
  const dateObj = new Date(activity.occurs_at);
  const formattedDate = format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedDayOfWeek = format(dateObj, "EEEE", { locale: ptBR });
  const formattedTime = format(dateObj, "HH:mm");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-[540px] max-w-full rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-6 border border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Info className="size-5 text-lime-300" />
            <h2 className="text-lg font-semibold text-zinc-200">Detalhes da atividade</h2>
          </div>
          <button type="button" onClick={closeActivityDetailsModal}>
            <X className="size-5 text-zinc-400 hover:text-zinc-300" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Atividade</span>
            <p className="text-xl font-bold text-zinc-100 break-words leading-snug">
              {activity.title}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="size-4 text-lime-300" />
                Data e Horário
              </span>
              <div className="text-sm text-zinc-200 space-y-0.5 font-medium">
                <p className="capitalize">{formattedDayOfWeek}</p>
                <p>{formattedDate}</p>
                <div className="mt-1">
                  <span className="text-lime-300 font-semibold text-xs bg-lime-300/10 px-2 py-0.5 rounded-full inline-block">
                    {formattedTime}h
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="size-4 text-lime-300" />
                Localização
              </span>
              <div className="text-sm text-zinc-200 font-medium">
                {activity.local ? (
                  <p className="break-words line-clamp-4" title={activity.local}>
                    {activity.local}
                  </p>
                ) : (
                  <p className="text-zinc-500 italic">Nenhum local especificado</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            onClick={onOpenEditModal}
          >
            <Edit2 className="size-4" />
            Editar atividade
          </Button>
          <Button
            type="button"
            className="w-full"
            onClick={closeActivityDetailsModal}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
