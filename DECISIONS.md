# Decisões de Arquitetura e Projeto (DECISIONS.md)

Este documento registra as decisões técnicas, justificativas e padrões adotados no desenvolvimento do Sistema de Gestão Financeira Pessoal (Self-Hosted).

---

## 1. Escolha da Stack Tecnológica
- **Decisão:** Adotar **TypeScript Full-Stack** com **Fastify (Node.js)** no backend e **React + Vite + Tailwind CSS** no frontend.
- **Justificativa:**
  - Fastify apresenta overhead mínimo de CPU e memória RAM, vital para ambiente containerizado em VPS econômica.
  - TypeScript compartilhado garante validação estrita de contratos de dados (DTOs) e regras financeiras entre cliente e servidor.
  - PostgreSQL 16 com campos monetários em `NUMERIC(15, 2)` impede imprecisões inerentes a números de ponto flutuante (IEEE 754).
  - React + Vite + Tailwind CSS possibilita uma UI mobile-first extremamente ágil, com animações suaves e facilidade de estilização consistente com o Modo Privacidade.

---

## 2. Autenticação, Sessão e Segurança
- **Decisão:** Implementação de modelo single-user estrito. Hash de senha com **bcrypt (12 rounds)** e gerenciamento de sessão via **Cookie HttpOnly, SameSite=Lax**, com token aleatório de alta entropia armazenado e validado no PostgreSQL (tabela `sessao`).
- **Justificativa:**
  - Elimina superfície de ataque de cadastro público não autorizado (o sistema detecta se já existe 1 usuário e bloqueia qualquer setup subsequente).
  - Sessão com expiração por inatividade configurável (padrão 12h) e encerramento obrigatório em logout ou ao fechar navegador sem "lembrar-me" persistente.

---

## 3. Integridade de Saldos e Agregações Históricas (`resumo_mensal`)
- **Decisão:** Todas as alterações em lançamentos (inclusão, atualização, exclusão) são executadas dentro de **transações atômicas no PostgreSQL (`BEGIN ... COMMIT`)**.
- **Justificativa:**
  - O saldo atual de cada conta (`saldo_atual`) e o acumulador da tabela `resumo_mensal` (chave primária composta `ano_mes, categoria_id, conta_id`) são atualizados de forma síncrona pelo backend, garantindo que relatórios históricos nunca precisem recalcular transações individuais do zero nem fiquem dessincronizados.
  - A regra é executada no backend, preservando a integridade independente de qualquer interface cliente.

---

## 4. Modo Privacidade (Visual Masking)
- **Decisão:** Implementação através de um `PrivacyContext` no React que injeta o estado ativo/inativo globalmente e componentes especializados `<PrivacyValue value={...} />`.
- **Justificativa:**
  - Permite mascaramento instantâneo de saldos, valores e lançamentos como `R$ ••••` sem requisições adicionais de rede ou perda de contexto na UI, otimizado para uso rápido em ambientes públicos.
  - Persiste a preferência em `localStorage` para navegação fluida.

---

## 5. PWA e Estratégia Offline
- **Decisão:** Configuração com `vite-plugin-pwa`, gerando manifesto de aplicativo web e service worker com cache de shell da aplicação (App Shell pattern).
- **Justificativa:**
  - Permite instalação nativa na tela inicial de celulares (Android/iOS) e desktops com visual de app independente (sem barra de URL do navegador).

---

## 6. Ciclo de Fatura e Cartões de Crédito (Fase 2)
- **Decisão:** Cálculo do ciclo de fatura centralizado no backend via utilitário `calcularCompetenciaFatura`. Compras feitas após o `dia_fechamento` avançam automaticamente a `data_competencia_fatura` para o próximo mês.
- **Justificativa:**
  - Garante fidelidade ao funcionamento real dos cartões de crédito brasileiros, separando a data real em que a compra ocorreu (`data_compra`) do mês em que o valor será efetivamente debitado na fatura (`data_competencia_fatura`).
  - Permite aos filtros do extrato e relatórios alternar entre visão contábil real e fluxo de caixa de fatura.

---

## 7. Compras Parceladas e Divisão de Centavos (Fase 2)
- **Decisão:** Geração atômica das $N$ parcelas na tabela `lancamento` no momento da criação da `compra_parcelada`, com absorção de eventuais diferenças de centavos na primeira parcela.
- **Justificativa:**
  - Evita inconsistências de arredondamento ($\sum \text{parcelas} \equiv \text{valor\_total}$).
  - Permite que parcelas futuras já constem nas faturas dos meses subsequentes, possibilitando o cálculo exato do comprometimento futuro do limite do cartão.

---

## 8. Recorrências: Previsão vs. Lançamento Real (Fase 2)
- **Decisão:** Manter itens recorrentes como modelos em `recorrencia`, projetando na tela inicial o status "Já Lançado" vs. "Previsto, ainda não lançado", com ação de efetivação manual/rápida.
- **Justificativa:**
  - Atende estritamente à especificação funcional, permitindo ao usuário prever os custos do mês antes de efetivá-los no extrato, sem poluir a tabela de lançamentos com despesas futuras não confirmadas.

---

## 9. Carteira de Investimentos e Preço Médio Ponderado (Fase 3)
- **Decisão:** Modelar posições através de eventos contábeis na tabela `movimentacao_investimento` (aportes, resgates, rendimentos) e calcular Preço Médio ponderado e saldo aplicado estritamente no backend.
- **Justificativa:**
  - Garante rastreabilidade integral da evolução da posição do investidor ao longo do tempo.
  - O Preço Médio é recalculado dinamicamente com base nas aquisições e quantidades registradas, sem sofrer desvios por arredondamento no frontend.

---

## 10. Ingestão da Cotação Oficial PTAX e Ausência de Especulação (Fase 3)
- **Decisão:** Consumir a cotação oficial PTAX do Banco Central do Brasil (API Olinda BACEN) de forma resiliente, persistindo o histórico em `cotacao_cambio` e exibindo indicadores objetivos (MM7, MM30, volatilidade histórica). Estritamente sem modelos preditivos ou conselhos de compra/venda.
- **Justificativa:**
  - Cumpre rigorosamente a premissa de que sistemas financeiros pessoais devem informar e organizar o patrimônio com dados oficiais e auditáveis, sem especulações financeiras ou promessas enganosas de rendimento futuro.

---

## 11. Simulador Comparativo de Investimentos (Fase 3)
- **Decisão:** Projeção mensal de juros compostos com aportes periódicos calculada no backend, comparando simultaneamente múltiplos benchmarks da economia brasileira (Poupança, Tesouro Selic/CDI, CDB 120% CDI, Tesouro IPCA+).
- **Justificativa:**
  - Permite ao usuário visualizar de forma comparativa e imediata o custo de oportunidade e o efeito exponencial dos aportes ao longo dos anos, mantendo total privacidade visual por meio do componente `<PrivacyValue />`.

---

## 12. Gestão de Contas a Receber, Empréstimos e Divisões Sociais (Fase 4)
- **Decisão:** Ao criar um empréstimo ou bancar uma despesa compartilhada paga por conta bancária, o valor é debitado atomicamente da conta de origem no ato (gerando lançamento de débito), e passa a figurar como um ativo pendente a receber no patrimônio social.
- **Justificativa:**
  - Impede a ilusão financeira de que o saldo na conta continua disponível para gastos cotidianos quando o dinheiro já foi repassado a terceiros, garantindo conciliação bancária 100% fidedigna com o extrato real.

---

## 13. Mecanismo de Quitação, Baixas Parciais e Perdão de Dívidas (Fase 4)
- **Decisão:** Baixas manuais ou via PIX com destinação bancária geram lançamento atômico de receita e incremento do saldo. Baixas parciais mantêm o saldo devedor remanescente. O perdão de dívidas marca o status como `perdoada` e encerra a cobrança sem gerar lançamentos contábeis de despesa ou receita espúrios.
- **Justificativa:**
  - O perdão de uma dívida de amigo não representa um novo fluxo de caixa de saída (o dinheiro já saiu no momento do empréstimo), nem uma receita (nada entrou). Evita distorcer o fluxo de caixa histórico e o cálculo de receitas/despesas do mês.

---

## 14. Gerador de PIX Oficial Bacen EMVCo (BR Code) 100% Local (Fase 4)
- **Decisão:** Implementação nativa em TypeScript do padrão EMVCo do Banco Central do Brasil com cálculo de CRC16-CCITT polinomial `0x1021`, sem depender de APIs ou serviços externos de geração de PIX.
- **Justificativa:**
  - Garante total privacidade dos dados (chaves PIX, nomes de beneficiários e valores jamais trafegam por servidores terceiros) e independência absoluta de conectividade externa para a geração do Copia-e-Cola e QR Code.

---

## 15. Simulador de Gastos Multi-Moeda & Impacto Futuro (Fase 5)
- **Decisão:** Permitir simulação prévia de compras com conversão cambial oficial (PTAX Bacen) ou personalizada, calculando o impacto direto no saldo disponível ou nas faturas futuras mês a mês com ciclo de fechamento real antes de efetivar o lançamento.
- **Justificativa:**
  - Evita compras por impulso e surpresas na fatura ao permitir visualizar exatamente quanto do limite do cartão será consumido e qual o valor adicional em cada uma das próximas faturas.

---

## 16. Exportação de Relatórios CSV com Ponto-e-Vírgula e UTF-8 BOM (Fase 5)
- **Decisão:** Formatar a saída CSV com delimitador `;` e prefixo byte order mark (`\uFEFF`), formatando números com vírgula decimal (`1234,56`).
- **Justificativa:**
  - Garante abertura e renderização perfeitas de caracteres acentuados em português e colunas separadas automaticamente tanto no Microsoft Excel quanto no LibreOffice e Google Sheets.

---

## 17. Rotina Autônoma de Backup e Dump SQL com 1 Clique (Fase 5)
- **Decisão:** Fornecer script autônomo em shell com política de retenção (`backup.sh`) e endpoint `/api/sistema/backup` para download instantâneo do dump SQL transacional completo das tabelas.
- **Justificativa:**
  - Assegura autonomia total ao usuário na sua VPS, possibilitando restaurar o banco de dados a qualquer momento em caso de migração de servidor ou falha de infraestrutura.



