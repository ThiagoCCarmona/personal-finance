# Sistema de Gestão Financeira Pessoal (Self-Hosted) — Fase 1 + Fase 2

Sistema web responsivo (mobile-first e desktop) com suporte a PWA instalável, single-user, self-hosted via Docker em VPS própria, com foco absoluto em privacidade e integridade financeira.

---

## 🚀 O Que Foi Entregue

### Fase 1 (MVP)
1. **Segurança e Autenticação:** Setup inicial de usuário único (`/setup`), hash de senha bcrypt, sessão com cookies `HttpOnly`, expiração configurável por inatividade (padrão 12h).
2. **Modo Privacidade:** Toggle instantâneo com ícone de olho no cabeçalho para mascarar todos os valores como `R$ ••••`.
3. **Contas e Instituições:** Bancos, carteiras digitais e dinheiro em espécie com **Saldo Consolidado**.
4. **Categorias e Subcategorias:** Estrutura em árvore, paleta de cores e categorias padrão pré-cadastradas.
5. **Lançamentos & Extrato:** Lançamentos com atualização atômica de saldos e tabela pré-calculada `resumo_mensal`.
6. **Dashboard:** Gráficos de evolução temporal e gastos por categoria.
7. **PWA:** Web App Manifest e Service Worker para instalação no celular.

### Fase 2 (Cartões, Recorrência e Parcelamentos)
1. **Cartões de Crédito & Limites:**
   - CRUD de Cartões de Crédito (instituição, apelido, limite, dia de fechamento e dia de vencimento).
   - Cálculo automático de **Limite Utilizado**, **Limite Disponível** e percentual de comprometimento com barras de progresso visuais.
   - Consulta detalhada da **Fatura do Mês** com navegação mês a mês e extrato completo dos lançamentos do ciclo.
2. **Ciclo de Fatura:**
   - Cálculo no backend via `calcularCompetenciaFatura`: compras feitas após o `dia_fechamento` caem automaticamente na fatura do mês seguinte.
   - Tratamento de dois eixos de data: data de competência real (`data_compra`) e mês da fatura (`data_competencia_fatura`).
3. **Compras Parceladas:**
   - Registro de compra parcelada com cálculo exato de centavos.
   - Geração automática e atômica das $N$ parcelas futuras associadas aos ciclos de fatura corretos.
   - Acompanhamento do progresso das parcelas pagas vs. restantes e saldo devedor remanescente.
4. **Recorrências (Despesas e Receitas Fixas):**
   - Gestão de despesas e receitas recorrentes com frequência (mensal, bimestral, trimestral, semestral, anual), dia de referência e dia estimado na fatura.
   - Verificação inteligente de status no mês: distinção clara entre **"Já Lançado"** e **"Previsto, ainda não lançado"**.
   - Ação rápida para efetivar o lançamento na competência atual com 1 clique.
5. **Home / Dashboard Atualizado:**
   - Bloco de **Contas e Faturas a Pagar do Mês** destacando faturas abertas e custos fixos pendentes.
   - Card de **Comprometimento Futuro** exibindo a soma das parcelas de cartões vincendas nos próximos meses.
   - Modal de lançamento rápido com suporte a seleção de cartão de crédito e opção integrada de parcelamento.

### Fase 3 (Patrimônio e Câmbio)
1. **Investimentos & Carteira:**
   - Cadastro de ativos por tipo (`Renda Fixa`, `Ações`, `FIIs`, `Cripto`, `Fundos`, `Previdência`, `Outros`).
   - Movimentações de Aporte, Resgate, Rendimento e Atualização de Saldo.
   - Cálculo automático de **Preço Médio ponderado** no backend.
   - Resumo da carteira com Valor Aplicado, Saldo Atual, Rentabilidade Acumulada nominal e percentual.
   - Gráfico de Alocação por Classe de Ativo.
2. **Câmbio & PTAX Oficial:**
   - Ingestão direta e oficial do Banco Central do Brasil (BACEN Olinda API) para USD e EUR.
   - Histórico diário com cálculo de **Médias Móveis (MM7 e MM30)** e volatilidade nos últimos 30 dias.
   - Política rigorosa: dados históricos e observados, **sem previsões ou projeções especulativas**.
   - Calculadora de **Ganho Cambial**: comparação entre data de compra e liquidação com apuração de ganho/perda nominal e percentual.
3. **Simulador de Juros Compostos:**
   - Simulação interativa com valor inicial, aportes mensais e prazo configurável (1 a 30 anos).
   - Comparativo com benchmarks da economia brasileira: Poupança, Tesouro Selic/CDI, CDB 120% do CDI e Tesouro IPCA+.
   - Gráfico de área comparativo detalhando Total Investido vs. Rendimento dos Benchmarks.

### Fase 4 (Social e Cobranças PIX)
1. **Pessoas & Contatos:**
   - Cadastro de amigos/contatos com nome, apelido, telefone e e-mail.
   - Painel inteligente de destaque: "Quem deve para você agora".
2. **Empréstimos Individuais & Contas a Receber:**
   - Registro de empréstimos concedidos com débito atômico da conta bancária de origem e integração como ativo a receber.
   - Histórico com acompanhamento de valor total, valor pago e saldo devedor remanescente.
3. **Divisão de Despesas em Grupo (Rachar a Conta):**
   - Lançamento do valor total de contas coletivas (ex: pizza, bar) com cálculo inicial de divisão igualitária e cotas individuais editáveis.
   - Geração automática de dívidas vinculadas para cada participante.
4. **Quitações, Baixas Parciais e Perdão:**
   - Baixa manual ou via PIX com suporte a pagamentos parciais e crédito na conta de destino com lançamento de receita.
   - Opção de **Perdão de Dívida**: encerra a pendência sem gerar receitas espúrias ou distorcer o fluxo de caixa histórico.
5. **Cobranças PIX com Gerador EMVCo Oficial (Bacen):**
   - Gerador local de payload PIX Copia-e-Cola e QR Code no padrão oficial do Banco Central (BR Code) com CRC16-CCITT polinomial `0x1021`.
   - 100% privado e self-hosted, sem envio de chaves para APIs de terceiros.
   - Vínculo direto de cobranças a empréstimos e despesas: baixa automatizada com 1 clique.

### Fase 5 (Extras e Refinamento — Conclusão do Sistema)
1. **Simulador de Gastos & Impacto Futuro:**
   - Simulação antecipada de compras em Real ou Moeda Estrangeira (USD / EUR).
   - Conversão por cotação PTAX oficial diária ou cotação personalizada.
   - Simulação à vista (alerta de saldo e cheque especial) ou parcelada (projeção mês a mês nas faturas futuras do cartão e impacto no limite).
2. **Relatórios & Exportação Universal:**
   - Exportação em **CSV universal** (delimitador `;` e UTF-8 BOM para abertura perfeita no Excel brasileiro) para Extrato de Lançamentos e Balanço Patrimonial Consolidado.
   - Relatório financeiro formatado com estilos `@media print` para impressão direta e exportação em PDF.
3. **Backup Automatizado & Administração da VPS:**
   - Painel de Administração e Backup com métricas de integridade (tamanho do banco, volume de transações).
   - Botão para download instantâneo do **Dump SQL completo** com 1 clique (`/api/sistema/backup`).
   - Script autônomo `scripts/backup.sh` com rotina de retenção automática de 7 dias para cron/Docker.
4. **Refinamento de Performance:**
   - Migração `0005_extras_e_performance.sql` com índices compostos para aceleração de consultas temporais e agregações.

---

## 🛠️ Como Rodar com Docker Compose (Comando Único)

```bash
cp .env.example .env
docker compose up -d --build
```
Acesse em: **http://localhost:3001**

---

## 💻 Como Rodar em Modo de Desenvolvimento Local

### 1. Backend
```bash
cd backend
npm install
npm run db:migrate
npm run dev
```
Roda em `http://localhost:3001`.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Roda em `http://localhost:5173`.


### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Roda em `http://localhost:5173`.
