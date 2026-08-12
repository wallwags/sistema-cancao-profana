# 🎹 CANÇÃO PROFANA — VST CONSOLE & LANDING PORTAL

> Um sistema de captação de inscrições e vendas altamente interativo no estilo **Brutalista de Estúdio (Studio Warm Dark)** para o festival de música autoral do **Estúdio Pedra Profana**.

Este repositório contém a página de vendas oficial e o motor de inscrições (Quiz Gamificado) do concurso musical "Canção Profana", projetado sob as mais avançadas técnicas de usabilidade mobile-first, acessibilidade visual de alto contraste e skeuomorphism/flat-morphism digital.

---

## 🎨 Design System: "Studio Warm Dark"

O projeto implementa uma identidade visual quente, analógica e sofisticada, inspirada em racks de efeitos físicos e mixers de estúdio de alta gama:

*   **Fundo Principal (Primary BG):** `#0F0D0B` (Preto quente texturizado)
*   **Background Secundário (Card BG):** `#1A1612` (Profundidade sutil)
*   **Background Elevado (Modais/Elevated):** `#242019`
*   **Bordas e Divisores (CNC Borders):** `#2E2820` (Linhas finas industriais)
*   **Cor de Destaque / CTA Principal (Amber Gold):** `#D4A843` (Dourado âmbar de alto brilho)
*   **Texto Primário (Warm White):** `#F0EAE0` (Off-white de fácil leitura, contraste WCAG AA mínimo)
*   **Texto Secundário (Muted Gold):** `#A89880`

---

## 🚀 Principais Recursos & Interatividades

1.  **Top Bar de Urgência (Countdown):** Um cronômetro integrado no topo que exibe a regressão do lote ativo em tempo real, gerando urgência comportamental.
2.  **Infográficos de Fluxo Brutalistas:** Diagramação elegante e responsiva explicando as etapas regulamentares de forma gráfica e estruturada, evitando blocos massivos de texto.
3.  **Matriz de Ancoragem de Valor:** Compara de forma assertiva e riscada os valores reais de produção fonográfica de mercado (EP avaliado em R$ 20.000) contra a inscrição simbólica, provando que o artista não corre riscos de perda.
4.  **Quiz Gamificado em Popup (Inscrição Expressa):** O formulário de inscrição é totalmente embutido em um popup *glassmorphic* com desfoque de fundo estilo iOS, dividindo o processo em 5 passos fáceis sem expor cobranças de taxas antes do passo de resumo final.
5.  **Fila de Escalados (Roster Queue):** No passo 4, os integrantes da banda são adicionados como faixas em uma lista interativa, gerando cards de perfil individuais e atualizando a taxa de forma dinâmica e segura.
6.  **Painel Administrativo Embutido (Inovação):** 
    *   Um painel de controle protegido por senha (**`profana2026`**) está embutido diretamente no rodapé da página (ícone de engrenagem).
    *   Permite que os organizadores do festival alterem dinamicamente o status dos lotes (Ativo, Encerrado, Em breve), o status da Live transmissão (Em breve, Ao vivo com banner vermelho piscante, ou Encerrada com replays) e alterem o contador de vagas restantes. O site re-renderiza o DOM instantaneamente em tempo real!

---

## 📦 Como Rodar Localmente

O sistema foi otimizado para carregar instantaneamente, dependendo de zero frameworks de build no front-end de partida. Toda a lógica reativa e o canvas de áudio foram escritos em Vanilla JS ultra-veloz.

1.  Clone este repositório:
    ```bash
    git clone https://github.com/SEU-USUARIO/sistema-cancao-profana.git
    ```
2.  Inicie um servidor estático local. Se tiver o Python instalado:
    ```bash
    python3 -m http.server 8080
    ```
3.  Abra seu navegador em `http://localhost:8080`.

---

## 🛡️ Segurança e Antifraude

A arquitetura do sistema assegura que nenhum dado de preço final calculado no front-end seja enviado de forma crua ao gateway de pagamentos (Asaas/Mercado Pago). O servidor calcula soberanamente o valor com base na contagem de integrantes validados e no lote ativo no banco de dados Supabase antes de emitir o Pix copia e cola e assinar os webhooks transacionais.

---

*Desenvolvido por Senior UI/UX Front-End Engineer para fomento da música autoral independente.*
