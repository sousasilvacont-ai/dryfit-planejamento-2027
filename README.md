# Planejamento Dryfit · Tributário 2027

Apresentação interativa de planejamento tributário da Dryfit. O site é estático e está organizado na raiz para publicação direta com GitHub Pages.

## Arquivos do site

- `index.html` — redireciona à apresentação principal.
- `PAINEL_TRIBUTARIO_CNPJ_67073133000169.html` — apresentação e estrutura dos slides.
- `painel_tributario.css` e `client_final.css` — estilos.
- `painel_tributario.js` e `client_final.js` — cálculos e interações.
- `meeting_chart_3d.js` — aprimoramento WebGL com gráfico HTML alternativo.
- `three.global.js` — biblioteca Three.js atualmente na raiz.
- `Manrope-Variable.ttf` e `Manrope-OFL.txt` — fonte e licença, atualmente na raiz.
- `painel_tributario.test.cjs` — testes dos cálculos (executar com `node painel_tributario.test.cjs`).
- `THREE-LICENSE.txt` — licença da biblioteca Three.js.
- `MANIFESTO_PUBLICACAO_DRYFIT_2026-11-12.json` — manifesto de arquivos enviado.

## Ativar a publicação

O repositório ainda precisa ter o GitHub Pages habilitado. No GitHub, abra **Settings → Pages** e, em **Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)** e clique em **Save**. Aguarde o deploy ficar concluído; o painel mostrará a URL pública.

URL esperada: https://sousasilvacont-ai.github.io/dryfit-planejamento-2027/

## Nota de compatibilidade dos ativos

Os arquivos enviados estão na raiz, mas o HTML/CSS original referencia Three.js em `vendor/three.global.js` e a fonte em `vendor/fonts/Manrope-Variable.ttf`. Até esses caminhos serem alinhados, o gráfico HTML de reserva continua disponível quando o script WebGL não inicializa, mas a fonte Manrope pode não carregar. Para organização definitiva, mova a biblioteca para `vendor/three.global.js` e a fonte para `vendor/fonts/Manrope-Variable.ttf`, ou ajuste as referências na página/folha de estilos.

A simulação é ilustrativa; valide dados, enquadramento e legislação antes de uso como apuração fiscal.
