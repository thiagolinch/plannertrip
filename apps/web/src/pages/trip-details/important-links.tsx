import { Link2, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "../../components/button";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/axios";
import { CreateLinkModal } from "./create-link-modal";
import { EditLinkModal } from "./edit-link-modal";

interface Link {
  id: string
  title: string
  url: string
}

interface ImportantLinksProps {
  isOwner: boolean
}

export function ImportantLinks({ isOwner }: ImportantLinksProps) {
  const { tripId } = useParams()
  const [links, setLinks] = useState<Link[]>([])
  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false)
  const [selectedEditLink, setSelectedEditLink] = useState<Link | null>(null)

  const fetchLinks = useCallback(() => {
    api.get(`/trips/${tripId}/links`).then(response => {
      setLinks(response.data.links)
    })
  }, [tripId])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  async function handleDeleteLink(linkId: string) {
    const confirmDelete = window.confirm("Deseja realmente remover este link?")
    if (!confirmDelete) return

    try {
      await api.delete(`/links/${linkId}`)
      fetchLinks()
    } catch (error) {
      console.error("Erro ao deletar link:", error)
      alert("Erro ao deletar link.")
    }
  }

  function openCreateLinkModal() {
    setIsCreateLinkModalOpen(true)
  }

  function closeCreateLinkModal() {
    setIsCreateLinkModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-xl">Links importantes</h2>

      {links.length > 0 ? (
        <div className="space-y-5">
          {links.map(link => (
            <div key={link.id} className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <span className="block font-medium text-zinc-100 truncate">{link.title}</span>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block text-xs text-zinc-400 truncate hover:text-zinc-200"
                >
                  {link.url}
                </a>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedEditLink(link)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  title="Editar link"
                >
                  <Edit2 className="size-4" />
                </button>
                {isOwner && (
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                    title="Excluir link"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <Link2 className="text-zinc-400 size-5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Nenhum link cadastrado.</p>
      )}

      <Button onClick={openCreateLinkModal} variant="secondary" size="full">
        <Plus className="size-5" />
        Cadastrar novo link
      </Button>

      {isCreateLinkModalOpen && (
        <CreateLinkModal closeCreateLinkModal={closeCreateLinkModal} />
      )}

      {selectedEditLink && (
        <EditLinkModal
          link={selectedEditLink}
          closeEditLinkModal={() => setSelectedEditLink(null)}
          onRefreshLinks={fetchLinks}
        />
      )}
    </div>
  )
}