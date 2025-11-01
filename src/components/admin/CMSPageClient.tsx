'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Save, Trash2, Languages, Eye, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'

interface ContentBlock {
    id: string
    key: string
    type: string
    valueJson: {
        text?: string
        html?: string
        url?: string
        items?: string[]
    }
    sortOrder: number
}

interface ContentPage {
    id: string
    slug: string
    lang: string
    isActive: boolean
    blocks?: ContentBlock[]
}

export default function CMSPageClient() {
    const { showToast } = useToast()
    const [pages, setPages] = useState<ContentPage[]>([])
    const [selectedLang, setSelectedLang] = useState('pt')
    const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null)
    const [blockForm, setBlockForm] = useState({
        key: '',
        type: 'text',
        value: '',
    })

    useEffect(() => {
        loadPages()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLang])

    const loadPages = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/cms/pages?lang=${selectedLang}`)
            if (response.ok) {
                const data = await response.json()
                setPages(data)
            }
        } catch (error) {
            console.error('Erro ao carregar páginas:', error)
            showToast('Erro ao carregar páginas', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveBlock = async () => {
        if (!selectedPage) return

        try {
            const valueJson = blockForm.type === 'list' 
                ? { items: blockForm.value.split('\n').filter(Boolean) }
                : { text: blockForm.value }

            const payload = {
                id: editingBlock?.id,
                pageId: selectedPage.id,
                key: blockForm.key,
                type: blockForm.type,
                valueJson,
                sortOrder: editingBlock?.sortOrder || 0,
            }

            const url = editingBlock 
                ? '/api/admin/cms/blocks' 
                : '/api/admin/cms/blocks'
            
            const method = editingBlock ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                showToast('Bloco salvo com sucesso!', 'success')
                setIsDialogOpen(false)
                setEditingBlock(null)
                setBlockForm({ key: '', type: 'text', value: '' })
                loadPages()
            }
        } catch (error) {
            console.error('Erro ao salvar bloco:', error)
            showToast('Erro ao salvar bloco', 'error')
        }
    }

    const handleDeleteBlock = async (blockId: string) => {
        if (!confirm('Deseja realmente excluir este bloco?')) return

        try {
            const response = await fetch(`/api/admin/cms/blocks?id=${blockId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                showToast('Bloco excluído com sucesso!', 'success')
                loadPages()
            }
        } catch (error) {
            console.error('Erro ao excluir bloco:', error)
            showToast('Erro ao excluir bloco', 'error')
        }
    }

    const openEditBlock = (block: ContentBlock) => {
        setEditingBlock(block)
        setBlockForm({
            key: block.key,
            type: block.type,
            value: block.type === 'list' 
                ? (block.valueJson.items || []).join('\n')
                : (block.valueJson.text || block.valueJson.html || ''),
        })
        setIsDialogOpen(true)
    }

    const openNewBlock = (page: ContentPage) => {
        setSelectedPage(page)
        setEditingBlock(null)
        setBlockForm({ key: '', type: 'text', value: '' })
        setIsDialogOpen(true)
    }

    const getBlockTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            text: 'bg-blue-100 text-blue-800',
            richtext: 'bg-purple-100 text-purple-800',
            image: 'bg-green-100 text-green-800',
            list: 'bg-orange-100 text-orange-800',
        }
        return <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>
    }

    if (loading) {
        return <div className="p-8">Carregando...</div>
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#FED466] to-[#FD9555] rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">CMS - Gerenciamento de Conteúdo</h1>
                            <p className="text-white/90">Gerencie o conteúdo das páginas do site</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Languages className="w-5 h-5" />
                        <Select value={selectedLang} onValueChange={setSelectedLang}>
                            <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt">Português</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {pages.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-600">
                            Nenhuma página encontrada para este idioma
                        </CardContent>
                    </Card>
                ) : (
                    pages.map((page) => (
                        <Card key={page.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Code className="w-5 h-5" />
                                            {page.slug}
                                            {page.isActive ? (
                                                <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {page.blocks?.length || 0} blocos de conteúdo
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`/${page.slug}`, '_blank')}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Visualizar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => openNewBlock(page)}
                                            className="bg-gradient-to-r from-[#FED466] to-[#FD9555]"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Novo Bloco
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {page.blocks && page.blocks.length > 0 && (
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {page.blocks.map((block, idx) => (
                                            <AccordionItem key={block.id} value={`item-${idx}`}>
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-sm">{block.key}</span>
                                                        {getBlockTypeBadge(block.type)}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-3 pt-2">
                                                        <div className="bg-gray-50 p-3 rounded border">
                                                            <pre className="text-sm whitespace-pre-wrap">
                                                                {JSON.stringify(block.valueJson, null, 2)}
                                                            </pre>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditBlock(block)}
                                                            >
                                                                <Save className="w-4 h-4 mr-2" />
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteBlock(block.id)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Excluir
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBlock ? 'Editar Bloco' : 'Novo Bloco de Conteúdo'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure o bloco de conteúdo para a página
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="key">Chave (Key)</Label>
                            <Input
                                id="key"
                                value={blockForm.key}
                                onChange={(e) => setBlockForm({ ...blockForm, key: e.target.value })}
                                placeholder="hero_title, section_description, etc"
                            />
                        </div>
                        <div>
                            <Label htmlFor="type">Tipo</Label>
                            <Select
                                value={blockForm.type}
                                onValueChange={(value) => setBlockForm({ ...blockForm, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Texto Simples</SelectItem>
                                    <SelectItem value="richtext">Rich Text (HTML)</SelectItem>
                                    <SelectItem value="image">Imagem (URL)</SelectItem>
                                    <SelectItem value="list">Lista</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="value">
                                Conteúdo
                                {blockForm.type === 'list' && ' (um item por linha)'}
                            </Label>
                            <Textarea
                                id="value"
                                value={blockForm.value}
                                onChange={(e) => setBlockForm({ ...blockForm, value: e.target.value })}
                                rows={6}
                                placeholder={
                                    blockForm.type === 'list'
                                        ? 'Item 1\nItem 2\nItem 3'
                                        : 'Digite o conteúdo...'
                                }
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveBlock}
                                className="bg-gradient-to-r from-[#FED466] to-[#FD9555]"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Bloco
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
