# Payment Method Icons

Este diretório contém ícones de métodos de pagamento utilizados no e-commerce.

## 📁 Arquivos Incluídos

- `visa.svg` - Visa (bandeira de crédito/débito)
- `mastercard.svg` - Mastercard (bandeira de crédito/débito)
- `amex.svg` - American Express (bandeira de crédito)
- `pix.svg` - PIX (sistema de pagamento instantâneo brasileiro)
- `paypal.svg` - PayPal (carteira digital)

## 📏 Especificações Técnicas

- **Formato**: SVG otimizado
- **Dimensões base**: 48×32px (proporção 3:2)
- **Otimização**: SVGO com multipass
- **Cores**: Baseadas nas guidelines oficiais de cada marca
- **Acessibilidade**: Incluem `title` e podem receber `aria-label`

## ⚖️ Informações Legais

### Marcas Registradas

**Visa®** - Marca registrada da Visa Inc.
- **Guidelines**: https://brand.visa.com/
- **Cores oficiais**: #1434CB (Visa Blue)
- **Uso permitido**: Indicação de método de pagamento aceito em estabelecimentos comerciais
- **Restrições**: Não alterar proporções, cores ou adicionar efeitos. Manter clearspace mínimo.

**Mastercard®** - Marca registrada da Mastercard International Incorporated
- **Guidelines**: https://brand.mastercard.com/
- **Cores oficiais**: #EB001B (Red), #F79E1B (Orange), sobreposição = #FF5F00
- **Uso permitido**: Indicação de método de pagamento aceito
- **Restrições**: Os dois círculos devem se sobrepor exatamente como especificado. Não separar ou recolorir.

**American Express®** - Marca registrada da American Express Company
- **Guidelines**: https://www.americanexpress.com/
- **Cores oficiais**: #006FCF (Amex Blue)
- **Uso permitido**: Indicação de método de pagamento aceito
- **Restrições**: Manter identidade visual oficial, não distorcer ou alterar cores.

**PIX** - Sistema de Pagamento Instantâneo do Banco Central do Brasil
- **Guidelines**: https://www.bcb.gov.br/estabilidadefinanceira/pix
- **Cores oficiais**: #32BCAD (Teal/Turquesa)
- **Licença**: **Domínio público** - Banco Central do Brasil
- **Uso**: Livre para uso comercial sem restrições

**PayPal®** - Marca registrada da PayPal Holdings, Inc.
- **Guidelines**: https://www.paypal.com/webapps/mpp/logo-center
- **Cores oficiais**: #003087 (PayPal Blue), #009CDE (Light Blue)
- **Uso permitido**: Indicação de método de pagamento aceito
- **Restrições**: Usar apenas versões aprovadas, não alterar cores ou proporções.

### Declaração de Uso

Os logos das bandeiras de pagamento são utilizados **exclusivamente** para:
1. Informar aos clientes quais métodos de pagamento são aceitos
2. Facilitar o reconhecimento visual durante o checkout
3. Cumprir requisitos contratuais dos processadores de pagamento (Stripe, Mercado Pago)

**Não implica em**:
- Endosso ou parceria especial com as marcas
- Certificação ou selo de qualidade
- Afiliação além da relação comercial padrão

### Conformidade com Guidelines

Todos os logos seguem as diretrações oficiais:
- ✅ Cores exatas conforme especificação
- ✅ Proporções mantidas (aspect ratio correto)
- ✅ Clearspace respeitado quando aplicável
- ✅ Versões aprovadas para uso digital
- ✅ Sem alterações não autorizadas

## 🔄 Atualização e Manutenção

Para atualizar qualquer logo:

1. **Verifique as guidelines oficiais** da marca (links acima)
2. **Baixe o SVG oficial** quando disponível publicamente
3. **Otimize o arquivo**:
   ```bash
   npx svgo --multipass --precision 2 input.svg -o output.svg
   ```
4. **Valide cores e proporções** com ferramenta de design
5. **Teste renderização** em diferentes tamanhos
6. **Atualize este README** com a data e fonte

## 📝 Notas Adicionais

- Os SVGs são otimizados para web (sem metadados desnecessários)
- Cores em formato hexadecimal para compatibilidade
- Viewbox ajustado para renderização consistente
- Compatível com Next.js Image component
- Testado em navegadores modernos (Chrome, Firefox, Safari, Edge)

**Última atualização**: 31/10/2025  
**Responsável**: Eduardo Sodré (desenvolvedor)  
**Projeto**: A Rafa Criou - E-commerce de Produtos Digitais
