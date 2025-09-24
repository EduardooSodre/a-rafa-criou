# 📋 Próximos Passos — Projeto A Rafa Criou

## 1. Storage e Entrega de PDFs

- [ ] Configurar Cloudflare R2 (bucket privado, variáveis .env)
- [ ] Implementar upload seguro de PDFs (painel admin)
- [ ] Gerar URLs assinadas temporárias para download
- [ ] Integrar entrega automática pós-pagamento (e-mail + área do cliente)

## 2. Pagamentos e Checkout

- [ ] Integrar Stripe (Payment Intent), PayPal e Pix
- [ ] Implementar validação de cupons no backend
- [ ] Recalcular totais no checkout
- [ ] Webhooks idempotentes para pagamentos

## 3. Migração WooCommerce

- [ ] Criar scripts de import/export (clientes, pedidos, produtos, variações)
- [ ] Validar e rehash de senhas phpass no login
- [ ] Exibir histórico de pedidos migrados na área do cliente
- [ ] Permitir admin mesclar contas por e-mail

## 4. CMS Embutido

- [ ] Implementar editor (TipTap/Editor.js) para páginas e blocos
- [ ] Upload de imagens e PDFs pelo CMS
- [ ] Preview e publicação com revalidate

## 5. Catálogo, PDP e Traduções

- [ ] UI de variações de produto
- [ ] SEO por produto/variação (title, description, canonical)
- [ ] Suporte a múltiplos idiomas de PDF na PDP

## 6. Cupons e Notificações

- [ ] CRUD de cupons no admin
- [ ] Registro de uso em coupon_redemptions
- [ ] CRUD de notificações e preferências (e-mail, WhatsApp, SMS, Push)

## 7. Sistema de Afiliados

- [ ] CRUD de afiliados, links e comissões
- [ ] Registro automático de comissão na compra
- [ ] Painel do afiliado com relatórios

## 8. Proteção de PDFs

- [ ] Watermark dinâmica (e-mail + data)
- [ ] Limite de downloads por cliente
- [ ] Logs detalhados de downloads
- [ ] Fingerprint invisível (metadata)

## 9. SEO, PWA e Go-Live

- [ ] Middleware 301 via url_map
- [ ] next-sitemap, robots.txt, canonical tags
- [ ] Manifest + Service Worker (PWA)
- [ ] Deploy staging, troca DNS, monitoramento pós-go-live

---

## Observações

- Priorizar fundações: storage, pagamentos, migração, entrega automática
- Validar cada etapa com testes mínimos e checklist de aceitação
- Garantir acessibilidade AA e performance mobile-first
- Documentar endpoints, variáveis e fluxos críticos

---

_Atualizado em 23/09/2025 — Copilot_
