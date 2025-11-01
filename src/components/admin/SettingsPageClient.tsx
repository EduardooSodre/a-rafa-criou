'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Globe, CreditCard, Shield, Search, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

interface SettingsData {
    siteName: string
    siteDescription: string
    siteUrl: string
    supportEmail: string
    pixEnabled: boolean
    stripeEnabled: boolean
    maintenanceMode: boolean
    allowGuestCheckout: boolean
    maxDownloadsPerProduct: number
    downloadLinkExpiration: number
    enableWatermark: boolean
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    googleAnalyticsId: string
    facebookPixelId: string
}

export default function SettingsPageClient() {
    const { showToast } = useToast()
    const [settings, setSettings] = useState<SettingsData>({
        siteName: '',
        siteDescription: '',
        siteUrl: '',
        supportEmail: '',
        pixEnabled: true,
        stripeEnabled: true,
        maintenanceMode: false,
        allowGuestCheckout: true,
        maxDownloadsPerProduct: 3,
        downloadLinkExpiration: 24,
        enableWatermark: false,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        googleAnalyticsId: '',
        facebookPixelId: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadSettings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings(data)
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error)
            showToast('Erro ao carregar configurações', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })

            if (response.ok) {
                showToast('Configurações salvas com sucesso!', 'success')
            } else {
                throw new Error('Erro ao salvar')
            }
        } catch (error) {
            console.error('Erro ao salvar configurações:', error)
            showToast('Erro ao salvar configurações', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8">Carregando configurações...</div>
    }

    return (
        <div className="p-8">
            <div className="mb-8 bg-gradient-to-r from-[#FED466] to-[#FD9555] rounded-lg p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Configurações</h1>
                        <p className="text-white/90">Gerencie as configurações do sistema</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                    <TabsTrigger value="general">
                        <Globe className="w-4 h-4 mr-2" />
                        Geral
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagamentos
                    </TabsTrigger>
                    <TabsTrigger value="downloads">
                        <Shield className="w-4 h-4 mr-2" />
                        Downloads
                    </TabsTrigger>
                    <TabsTrigger value="seo">
                        <Search className="w-4 h-4 mr-2" />
                        SEO
                    </TabsTrigger>
                    <TabsTrigger value="integrations">
                        <Layout className="w-4 h-4 mr-2" />
                        Integrações
                    </TabsTrigger>
                </TabsList>

                {/* Geral */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Site</CardTitle>
                            <CardDescription>Configurações básicas do e-commerce</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="siteName">Nome do Site</Label>
                                <Input
                                    id="siteName"
                                    value={settings.siteName}
                                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                    placeholder="A Rafa Criou"
                                />
                            </div>
                            <div>
                                <Label htmlFor="siteDescription">Descrição</Label>
                                <Textarea
                                    id="siteDescription"
                                    value={settings.siteDescription}
                                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                    placeholder="E-commerce de PDFs educacionais"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label htmlFor="siteUrl">URL do Site</Label>
                                <Input
                                    id="siteUrl"
                                    type="url"
                                    value={settings.siteUrl}
                                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                                    placeholder="https://arafacriou.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="supportEmail">Email de Suporte</Label>
                                <Input
                                    id="supportEmail"
                                    type="email"
                                    value={settings.supportEmail}
                                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                    placeholder="contato@arafacriou.com"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
                                    <p className="text-sm text-gray-600">Site ficará temporariamente indisponível</p>
                                </div>
                                <Switch
                                    id="maintenanceMode"
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="allowGuestCheckout">Permitir Compra sem Cadastro</Label>
                                    <p className="text-sm text-gray-600">Clientes podem comprar sem criar conta</p>
                                </div>
                                <Switch
                                    id="allowGuestCheckout"
                                    checked={settings.allowGuestCheckout}
                                    onCheckedChange={(checked) => setSettings({ ...settings, allowGuestCheckout: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pagamentos */}
                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Métodos de Pagamento</CardTitle>
                            <CardDescription>Configure os provedores de pagamento disponíveis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <Label>PIX</Label>
                                        <p className="text-sm text-gray-600">Pagamento instantâneo via PIX</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.pixEnabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, pixEnabled: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <Label>Stripe</Label>
                                        <p className="text-sm text-gray-600">Cartão de crédito via Stripe</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.stripeEnabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Downloads */}
                <TabsContent value="downloads" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações de Download</CardTitle>
                            <CardDescription>Controle segurança e limites de download</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="maxDownloads">Máximo de Downloads por Produto</Label>
                                <Input
                                    id="maxDownloads"
                                    type="number"
                                    min="1"
                                    value={settings.maxDownloadsPerProduct}
                                    onChange={(e) => setSettings({ ...settings, maxDownloadsPerProduct: parseInt(e.target.value) })}
                                />
                                <p className="text-sm text-gray-600 mt-1">Limite de downloads permitidos por compra</p>
                            </div>
                            <div>
                                <Label htmlFor="linkExpiration">Expiração do Link (horas)</Label>
                                <Input
                                    id="linkExpiration"
                                    type="number"
                                    min="1"
                                    value={settings.downloadLinkExpiration}
                                    onChange={(e) => setSettings({ ...settings, downloadLinkExpiration: parseInt(e.target.value) })}
                                />
                                <p className="text-sm text-gray-600 mt-1">Tempo de validade dos links de download</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="enableWatermark">Marca d&apos;água nos PDFs</Label>
                                    <p className="text-sm text-gray-600">Adicionar watermark com email do comprador</p>
                                </div>
                                <Switch
                                    id="enableWatermark"
                                    checked={settings.enableWatermark}
                                    onCheckedChange={(checked) => setSettings({ ...settings, enableWatermark: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SEO */}
                <TabsContent value="seo" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO & Meta Tags</CardTitle>
                            <CardDescription>Otimização para mecanismos de busca</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="metaTitle">Título Padrão (Meta Title)</Label>
                                <Input
                                    id="metaTitle"
                                    value={settings.metaTitle}
                                    onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                                    placeholder="A Rafa Criou - PDFs Educacionais"
                                />
                            </div>
                            <div>
                                <Label htmlFor="metaDescription">Descrição Padrão (Meta Description)</Label>
                                <Textarea
                                    id="metaDescription"
                                    value={settings.metaDescription}
                                    onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                                    placeholder="Encontre os melhores PDFs educacionais para seu aprendizado"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label htmlFor="metaKeywords">Palavras-chave (Keywords)</Label>
                                <Input
                                    id="metaKeywords"
                                    value={settings.metaKeywords}
                                    onChange={(e) => setSettings({ ...settings, metaKeywords: e.target.value })}
                                    placeholder="pdf, educação, aprendizado, ebooks"
                                />
                                <p className="text-sm text-gray-600 mt-1">Separadas por vírgula</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrações */}
                <TabsContent value="integrations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analytics & Tracking</CardTitle>
                            <CardDescription>Integrações com ferramentas de análise</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                                <Input
                                    id="googleAnalytics"
                                    value={settings.googleAnalyticsId}
                                    onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                                    placeholder="G-XXXXXXXXXX"
                                />
                            </div>
                            <div>
                                <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                                <Input
                                    id="facebookPixel"
                                    value={settings.facebookPixelId}
                                    onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
                                    placeholder="123456789012345"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-[#FED466] to-[#FD9555] hover:opacity-90"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
            </div>
        </div>
    )
}
