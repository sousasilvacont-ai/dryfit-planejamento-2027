# Planejamento Dryfit · Tributário 2027

Apresentação interativa, estática e pronta para publicação no GitHub Pages. A página principal está em `index.html`; ela não precisa de build, servidor de aplicação ou dependências externas.

O controle de créditos estimados varia de 0% a 100% e reduz somente IBS/CBS por fora na simulação; o DAS permanece inalterado. Ele é hipotético: crédito real depende de aquisição elegível, documento fiscal eletrônico idôneo e demais requisitos legais. Compra sem nota idônea não permite apropriar crédito.

## Estrutura

- `index.html` — apresentação principal.
- `PAINEL_TRIBUTARIO_CNPJ_67073133000169.html` — endereço legado que redireciona para `index.html`.
- `assets/css/` — folhas de estilo.
- `assets/js/` — interações, gráfico e Three.js.
- `assets/fonts/` — Manrope e licença OFL.
- `painel_tributario.test.cjs` — valida os cálculos da simulação.
- `THREE-LICENSE.txt` está junto ao bundle de Three.js em `assets/js/`.

Os caminhos são relativos à raiz do projeto, para funcionar tanto na raiz de um domínio quanto em um endereço de projeto do GitHub Pages.

## Publicação no GitHub Pages

Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, `main` e `/(root)`. Após a alteração ser integrada à `main` e publicada, a URL esperada é <https://sousasilvacont-ai.github.io/dryfit-planejamento-2027/>.

O comparativo apresenta os parâmetros de planejamento identificados na tela e a referência estimada de CBS descrita nas notas técnicas.

O botão **Tela cheia** no topo usa a Fullscreen API nativa do navegador. O mesmo botão ou a tecla **Esc** retorna à visualização normal. O modo preserva a navegação e o gráfico; a opção aparece quando o navegador disponibiliza a API. Referência técnica: [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen).

O planejamento apresenta a decisão pelo Simples tradicional no cenário atual da Dryfit. O parecer de ICMS em Goiás, a distinção entre benefícios nas compras e no DAS e as fontes oficiais estão em [docs/PARECER_ICMS_GOIAS.md](docs/PARECER_ICMS_GOIAS.md).

A operação apresentada é industrial: fabricação e venda da produção própria, no Anexo II. Eventual revenda consta somente como ressalva condicional no rodapé do planejamento. O comparativo permanece na produção própria.

O B2B apresenta dois parágrafos por regime: no Simples tradicional, tributação pelo faturamento e crédito inferior a 1% da venda para o comprador no regime regular, limitado às faixas analisadas; com IBS/CBS por fora, o comprador pode aproveitar o IBS/CBS integral incidente na operação e a indústria passa a descontar créditos de compras elegíveis, explicados no quadro Créditos e documentação. O crédito do comprador é maior nas frutas secas tributadas analisadas. Seu valor segue a tributação do produto e os requisitos legais; alíquota zero não cria crédito da operação para o adquirente. Percentuais detalhados e exemplo numérico ficam nas notas técnicas e no parecer. O motor de cálculo mantém a partilha de CBS/IBS de 2027 e sua validação independente do slider hipotético de créditos da indústria.

## Validação local

Com Node.js instalado, execute `node painel_tributario.test.cjs` na raiz do projeto.

O teste real no Chrome usa um perfil isolado, interações por mouse/teclado e o protocolo DevTools, sem dependências de pacote. Para servir o projeto localmente, execute node scripts/serve-static.cjs 8882. Com o site servido por HTTP, execute `node scripts/validate-e2e.cjs URL local`. No Windows, o script usa o caminho padrão do Chrome; outro executável pode ser indicado em `CHROME_PATH`. Requer Node.js 22 ou posterior. Evidências e capturas ficam em `docs/agent/validation/`.
