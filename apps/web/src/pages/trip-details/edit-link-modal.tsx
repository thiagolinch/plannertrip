import { Link2, Tag, X } from "lucide-react";
import { Button } from "../../components/button";
import { FormEvent, useState } from "react";
import { api } from "../../lib/axios";

interface EditLinkModalProps {
  closeEditLinkModal: () => void
  link: {
    id: string
    title: string
    url: string
  }
  onRefreshLinks: () => void
}

export function EditLinkModal({
  closeEditLinkModal,
  link,
  onRefreshLinks
}: EditLinkModalProps) {
  const [isSavingLink, setIsSavingLink] = useState(false)
  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.url)

  async function updateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title || !url) {
      return
    }

    setIsSavingLink(true)

    try {
      await api.patch(`/links/${link.id}`, {
        title,
        url
      })

      alert("Link atualizado com sucesso!")
      closeEditLinkModal()
      onRefreshLinks()
    } catch (error) {
      console.error("Erro ao atualizar link:", error)
      alert("Erro ao atualizar link.")
    } finally {
      setIsSavingLink(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-[640px] max-w-full rounded-xl py-5 px-6 shadow-shape bg-zinc-900 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-lg font-semibold">Editar link</h2>
            <button onClick={closeEditLinkModal}>
              <X className="size-5 text-zinc-400 hover:text-zinc-300" />
            </button>
          </div>

          <p className="text-sm text-zinc-400">
            Todos convidados podem visualizar e atualizar os links importantes.
          </p>
        </div>
        
        <form onSubmit={updateLink} className="space-y-3">
          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Tag className="text-zinc-400 size-5" />
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do link (mín. 4 caracteres)"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
              minLength={4}
              disabled={isSavingLink}
            />
          </div>

          <div className="h-14 px-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Link2 className="text-zinc-400 size-5" />
            <input
              type="url"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL do link (ex: https://...)"
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              required
              disabled={isSavingLink}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeEditLinkModal} disabled={isSavingLink}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSavingLink}>
              {isSavingLink ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
