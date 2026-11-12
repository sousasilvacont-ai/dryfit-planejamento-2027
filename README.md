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

A simulação é ilustrativa. Valide dados, enquadramento e legislação antes de usá-la como apuração fiscal.

## Validação local

Com Node.js instalado, execute `node painel_tributario.test.cjs` na raiz do projeto.
