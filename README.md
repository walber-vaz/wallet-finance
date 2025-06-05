# Wallet Finance

## Overview

E uma backend feito com NestJS, TypeORM e PostgreSQL que permite a criação de carteiras financeiras, onde possa realizar transações de entrada e saída, além de consultar o saldo atual.

## Tecnologias Utilizadas

- NestJS
- TypeORM
- PostgreSQL
- Docker
- Swagger
- PM2

## Algumas features usadas

Criar lock para evitar concorrência de transações. O lock: `{ mode: 'pessimistic_write' }` no TypeORM serve para aplicar um bloqueio de escrita (pessimistic write lock) ao buscar o registro no banco de dados. Isso significa que, ao buscar a entidade Wallet, o registro correspondente será bloqueado para que nenhuma outra transação possa modificá-lo até que a transação atual seja concluída.

Na prática, isso evita condições de corrida (race conditions) e garante integridade durante operações críticas, como transferências de saldo. Se outra transação tentar atualizar o mesmo registro enquanto ele está bloqueado, ela ficará esperando até que o bloqueio seja liberado.

Lembrando que tem outras técnicas (race condition) para evitar concorrência.

### Resumindo

O lock: { mode: 'pessimistic_write' } garante que ninguém mais possa modificar o registro Wallet buscado até que sua transação termine, aumentando a segurança em operações concorrentes.

### Usando o PM2

PM2 é um gerenciador de processos para Node.js que facilita a execução e monitoramento de aplicações. Ele permite iniciar, parar, reiniciar e monitorar aplicações Node.js de forma eficiente. Sobre oque projeto esta usando de configuração acesse o aruivo `ecosystem.config.js`.

## Rodando o projeto

### Pré-requisitos

- Docker
- Docker Compose

### Passos

1. Clone o repositório:

   ```bash
   git clone https://github.com/walber-vaz/wallet-finance.git
   ```

2. Navegue até o diretório do projeto:

   ```bash
   cd wallet-finance
   ```

3. Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente conforme necessário.
4. Inicie os containers do Docker:

   ```bash
   docker compose up -d --build
   ```

5. Acesse com seu navegador ou ferramenta de API preferida:

   - **Swagger**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
   - **Aplicação**: [http://localhost:3000](http://localhost:3000)

6. Para parar os containers, execute:

   ```bash
   docker compose down
   ```
