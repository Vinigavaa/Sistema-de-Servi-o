# Prisma Migrations

## Adicionar nova coluna

1. Editar `prisma/schema.prisma`:
```prisma
model Servico {
  // ... campos existentes
  sql String?  // nova coluna
}
```

2. Criar migration:
```bash
npx prisma migrate dev --name adiciona_campo_sql
```

3. Gerar cliente:
```bash
npx prisma generate
```

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npx prisma migrate dev` | Cria e aplica migration (dev) |
| `npx prisma migrate deploy` | Aplica migrations (produção) |
| `npx prisma migrate reset` | Reseta banco e reaplica todas |
| `npx prisma db push` | Sincroniza schema sem migration |
| `npx prisma generate` | Gera cliente Prisma |
| `npx prisma studio` | Abre interface visual do banco |

## Fluxo completo

```bash
# 1. Editar schema.prisma
# 2. Criar migration
npx prisma migrate dev --name descricao_da_mudanca

# 3. Commit
git add prisma/
git commit -m "migration: descricao_da_mudanca"
```
