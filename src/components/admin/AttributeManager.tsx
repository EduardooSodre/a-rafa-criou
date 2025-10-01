'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AttributeValue {
    id: string
    value: string
    slug?: string
}

interface Attribute {
    id: string
    name: string
    slug?: string
    values?: AttributeValue[]
}

interface AttributeManagerProps {
    selectedAttributes: { attributeId: string; valueIds: string[] }[]
    onChange: (attributes: { attributeId: string; valueIds: string[] }[]) => void
}

export default function AttributeManager({ selectedAttributes, onChange }: AttributeManagerProps) {
    const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreatingNew, setIsCreatingNew] = useState(false)
    const [newAttributeName, setNewAttributeName] = useState('')
    const [newAttributeValues, setNewAttributeValues] = useState<string[]>([''])
    const [editingValueFor, setEditingValueFor] = useState<string | null>(null)
    const [newValueInput, setNewValueInput] = useState('')

    // Carregar atributos do banco ao montar
    useEffect(() => {
        loadAttributes()
    }, [])

    async function loadAttributes() {
        try {
            setIsLoading(true)
            const response = await fetch('/api/admin/attributes')
            if (response.ok) {
                const data = await response.json()
                setAvailableAttributes(data)
            }
        } catch (error) {
            console.error('Erro ao carregar atributos:', error)
        } finally {
            setIsLoading(false)
        }
    }

    function slugify(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    async function handleCreateAttribute() {
        if (!newAttributeName.trim()) return

        const values = newAttributeValues.filter(v => v.trim())
        if (values.length === 0) {
            alert('Adicione pelo menos um valor para o atributo')
            return
        }

        try {
            const slug = slugify(newAttributeName)
            const response = await fetch('/api/admin/attributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAttributeName.trim(),
                    slug,
                    values: values.map(v => ({
                        value: v.trim(),
                        slug: slugify(v)
                    }))
                })
            })

            if (response.ok) {
                await loadAttributes()
                setNewAttributeName('')
                setNewAttributeValues([''])
                setIsCreatingNew(false)
            } else {
                const error = await response.json()
                alert(error.error || 'Erro ao criar atributo')
            }
        } catch (error) {
            console.error('Erro ao criar atributo:', error)
            alert('Erro ao criar atributo')
        }
    }

    async function handleAddValue(attributeId: string) {
        if (!newValueInput.trim()) return

        try {
            const response = await fetch('/api/admin/attributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attributeId,
                    value: newValueInput.trim(),
                    slug: slugify(newValueInput)
                })
            })

            if (response.ok) {
                await loadAttributes()
                setNewValueInput('')
                setEditingValueFor(null)
            } else {
                const error = await response.json()
                alert(error.error || 'Erro ao adicionar valor')
            }
        } catch (error) {
            console.error('Erro ao adicionar valor:', error)
            alert('Erro ao adicionar valor')
        }
    }

    function toggleAttribute(attributeId: string) {
        const exists = selectedAttributes.find(a => a.attributeId === attributeId)
        if (exists) {
            onChange(selectedAttributes.filter(a => a.attributeId !== attributeId))
        } else {
            onChange([...selectedAttributes, { attributeId, valueIds: [] }])
        }
    }

    function toggleValue(attributeId: string, valueId: string) {
        const attr = selectedAttributes.find(a => a.attributeId === attributeId)
        if (!attr) return

        const hasValue = attr.valueIds.includes(valueId)
        onChange(
            selectedAttributes.map(a =>
                a.attributeId === attributeId
                    ? {
                          ...a,
                          valueIds: hasValue
                              ? a.valueIds.filter(v => v !== valueId)
                              : [...a.valueIds, valueId]
                      }
                    : a
            )
        )
    }

    function addValueField() {
        setNewAttributeValues([...newAttributeValues, ''])
    }

    function updateValueField(index: number, value: string) {
        const updated = [...newAttributeValues]
        updated[index] = value
        setNewAttributeValues(updated)
    }

    function removeValueField(index: number) {
        setNewAttributeValues(newAttributeValues.filter((_, i) => i !== index))
    }

    if (isLoading) {
        return <div className="text-center py-4">Carregando atributos...</div>
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Atributos do Produto</CardTitle>
                        <CardDescription>
                            Selecione atributos existentes ou crie novos (ex: Cor, Idioma, Tamanho)
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setIsCreatingNew(!isCreatingNew)}
                        variant="outline"
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Novo Atributo
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Formulário de Criação */}
                {isCreatingNew && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                        <div>
                            <Label>Nome do Atributo (ex: Cor, Idioma, Tamanho)</Label>
                            <Input
                                value={newAttributeName}
                                onChange={e => setNewAttributeName(e.target.value)}
                                placeholder="Ex: Cor"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Valores do Atributo</Label>
                            <div className="space-y-2 mt-1">
                                {newAttributeValues.map((value, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={value}
                                            onChange={e => updateValueField(index, e.target.value)}
                                            placeholder={`Ex: ${newAttributeName || 'Valor'} ${index + 1}`}
                                        />
                                        {newAttributeValues.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeValueField(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addValueField}
                                className="mt-2"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Adicionar Valor
                            </Button>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                onClick={handleCreateAttribute}
                                size="sm"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Criar Atributo
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setIsCreatingNew(false)
                                    setNewAttributeName('')
                                    setNewAttributeValues([''])
                                }}
                                size="sm"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Lista de Atributos Disponíveis */}
                {availableAttributes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Nenhum atributo criado ainda. Crie o primeiro!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {availableAttributes.map(attr => {
                            const isSelected = selectedAttributes.some(a => a.attributeId === attr.id)
                            const selectedAttr = selectedAttributes.find(a => a.attributeId === attr.id)

                            return (
                                <div
                                    key={attr.id}
                                    className={`border rounded-lg p-4 transition-all ${
                                        isSelected
                                            ? 'border-[#FED466] bg-[#FED466]/5'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleAttribute(attr.id)}
                                                className="w-5 h-5"
                                            />
                                            <div>
                                                <div className="font-semibold text-lg">{attr.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {attr.values?.length || 0} {attr.values?.length === 1 ? 'valor' : 'valores'}
                                                </div>
                                            </div>
                                        </label>

                                        {isSelected && (
                                            <Badge variant="secondary" className="bg-[#FED466]">
                                                Selecionado
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Valores do Atributo */}
                                    {isSelected && (
                                        <div className="mt-3 space-y-2">
                                            <Label className="text-sm font-medium">
                                                Valores disponíveis:
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {attr.values?.map(value => {
                                                    const isValueSelected = selectedAttr?.valueIds.includes(value.id)
                                                    return (
                                                        <label
                                                            key={value.id}
                                                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                                                                isValueSelected
                                                                    ? 'border-[#FD9555] bg-[#FED466]/20'
                                                                    : 'border-gray-300 hover:border-[#FED466]'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isValueSelected}
                                                                onChange={() => toggleValue(attr.id, value.id)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm font-medium">{value.value}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>

                                            {/* Adicionar novo valor */}
                                            {editingValueFor === attr.id ? (
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        value={newValueInput}
                                                        onChange={e => setNewValueInput(e.target.value)}
                                                        placeholder="Novo valor"
                                                        className="flex-1"
                                                        onKeyPress={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                handleAddValue(attr.id)
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleAddValue(attr.id)}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingValueFor(null)
                                                            setNewValueInput('')
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingValueFor(attr.id)}
                                                    className="mt-2"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Adicionar Valor
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
