# Planejamento Dryfit · Tributário 2027

Apresentação interativa e estática de planejamento tributário da Dryfit. O ponto de entrada do site é `index.html`, compatível com publicação direta pelo GitHub Pages, sem build ou dependências de servidor.

## Estrutura publicada

O repositório mantém os ativos estáticos na raiz (a alternativa mais segura para preservar os arquivos originais e a compatibilidade com Pages):

- `index.html` — ponto de entrada e carregador estático da apresentação.
- `PAINEL_TRIBUTARIO_CNPJ_67073133000169.html` — conteúdo principal dos slides.
- `painel_tributario.css` e `client_final.css` — estilos.
- `painel_tributario.js`, `meeting_chart_3d.js` e `client_final.js` — interações e gráfico.
- `three.global.js` — biblioteca Three.js.
- `Manrope-Variable.ttf` e `Manrope-OFL.txt` — fonte e licença.
- `THREE-LICENSE.txt` — licença da biblioteca Three.js.
- `painel_tributario.test.cjs` — testes da simulação (executar com `node painel_tributario.test.cjs`).
- `MANIFESTO_PUBLICACAO_DRYFIT_2026-11-12.json` — manifesto de publicação.

O `index.html` corrige os caminhos legados para Three.js e declara a fonte com o caminho da raiz. A página continua usando HTML, CSS e JavaScript estáticos; não usa caminhos absolutos que quebrem em uma publicação de projeto no GitHub Pages.

## GitHub Pages

Configure em **Settings → Pages → Build and deployment** a opção **Deploy from a branch**, branch `main`, pasta `/(root)`.

URL esperada: https://sousasilvacont-ai.github.io/dryfit-planejamento-2027/

A simulação é ilustrativa; valide dados, enquadramento e legislação antes de usá-la como apuração fiscal.
