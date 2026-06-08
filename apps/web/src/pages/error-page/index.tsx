import { Compass } from "lucide-react";
import { Button } from "../../components/button";
import { useNavigate } from "react-router-dom";

export function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-pattern bg-no-repeat bg-center bg-zinc-950 px-6 text-center space-y-8">
      <div className="flex flex-col items-center gap-3">
        <Compass className="size-20 text-lime-300 animate-pulse" />
        <h1 className="text-4xl font-bold text-zinc-100 tracking-tight mt-4">
          Ops! Rota não planejada
        </h1>
        <p className="text-zinc-400 text-md max-w-md">
          Parece que você pegou o caminho errado. Esta página não está cadastrada no seu itinerário de viagem.
        </p>
      </div>

      <div className="max-w-xs w-full">
        <Button onClick={() => navigate("/")} size="full">
          Voltar para o Dashboard
        </Button>
      </div>
    </div>
  );
}
