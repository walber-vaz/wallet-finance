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
