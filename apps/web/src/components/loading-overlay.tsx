import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Carregando..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col items-center gap-4 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800/80 shadow-2xl backdrop-blur-lg">
        <div className="relative flex items-center justify-center">
          {/* External decorative slow rotating dashed ring */}
          <div className="absolute size-16 border-2 border-dashed border-lime-300/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
          
          {/* Inner decorative slow rotating dashed ring */}
          <div className="absolute size-20 border border-dashed border-zinc-700 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>

          {/* Main loader */}
          <Loader2 className="size-10 text-lime-300 animate-spin" />
        </div>
        
        {message && (
          <span className="text-zinc-300 text-sm font-medium tracking-wide animate-pulse mt-2">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
