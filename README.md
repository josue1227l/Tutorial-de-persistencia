# Tutorial de Persistência de Dados com Prisma e SQLite

## 1. Objetivo

Este tutorial apresenta a implementação da persistência de dados em uma aplicação Express, mostrando a evolução do armazenamento em memória, utilizando um array, para o armazenamento permanente com SQLite e Prisma.

O tutorial apresenta as alterações necessárias e explica resumidamente a função de cada etapa.

---

## 2. Situação inicial

Inicialmente, os usuários eram armazenados em um array:

    let usuarios = [
        { id: 1, nome: "Clara Araújo" },
        { id: 2, nome: "Lyvia Niedja" },
        { id: 23, nome: "Daniel prof gatão" }
    ];

Esse tipo de armazenamento funciona apenas enquanto o servidor está executando.

Quando o servidor é reiniciado, os dados adicionados são perdidos.

### Problema

    Array → memória temporária → reiniciou o servidor → dados perdidos

Para solucionar esse problema, foi utilizado um banco de dados.

---

## 3. Instalação das dependências

Primeiro, foram instaladas as dependências necessárias:

    npm.cmd install prisma@7.10.0 @prisma/client@7.10.0

Depois, foram instalados o SQLite e o adaptador utilizado pelo Prisma:

    npm.cmd install better-sqlite3 @prisma/adapter-better-sqlite3

### O que foi feito?

- `prisma`: ferramenta utilizada para trabalhar com o banco de dados.
- `@prisma/client`: permite utilizar o Prisma dentro do código JavaScript.
- `better-sqlite3`: permite a comunicação com o SQLite.
- `@prisma/adapter-better-sqlite3`: conecta o Prisma ao Better SQLite3.

---

## 4. Inicializando o Prisma

Foi utilizado o comando:

    npx.cmd prisma init --datasource-provider sqlite

Esse comando cria a estrutura inicial necessária para utilizar o Prisma.

Arquivos principais:

    prisma/
    └── schema.prisma

    .env

    prisma.config.ts

---

## 5. Configuração do banco de dados

No arquivo `.env`, foi configurado:

    DATABASE_URL="file:./dev.db"

### O que foi feito?

Essa configuração informa ao Prisma que o banco de dados utilizado será um arquivo SQLite chamado `dev.db`.

---

## 6. Criando o Schema

No arquivo:

    prisma/schema.prisma

foi definido o modelo `Usuario`:

    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "sqlite"
    }

    model Usuario {
      id    Int    @id @default(autoincrement())
      nome  String
      email String @unique
    }

### O que foi feito?

O `schema.prisma` define a estrutura dos dados que serão armazenados no banco.

Nesse caso, foi criado o modelo `Usuario`, contendo:

| Campo | Tipo | Função |
|---|---|---|
| `id` | `Int` | Identificador do usuário |
| `nome` | `String` | Nome do usuário |
| `email` | `String` | E-mail do usuário |

O campo `id` é gerado automaticamente e o `email` deve ser único.

---

## 7. Criando a Migration

Depois de configurar o `schema.prisma`, foi executado:

    npx.cmd prisma migrate dev --name inicial

A migration é responsável por aplicar no banco as alterações definidas no `schema.prisma`.

O Prisma cria uma estrutura semelhante a:

    prisma/
    └── migrations/
        └── 202..._inicial/
            └── migration.sql

### O que é a Migration?

A migration registra e aplica as alterações feitas na estrutura do banco de dados.

    schema.prisma
           ↓
       migration
           ↓
         SQLite

O arquivo `migration.sql` é gerado automaticamente pelo Prisma e normalmente não precisa ser editado manualmente.

---

## 8. Gerando o Prisma Client

Depois da migration, foi executado:

    npx.cmd prisma generate

Esse comando gera o Prisma Client que será utilizado no código JavaScript.

---

## 9. Criando a conexão com o Prisma

Foi criado o arquivo:

    lib/prisma.js

Com o seguinte código:

    require('dotenv').config();

    const { PrismaClient } = require('@prisma/client');
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

    const adapter = new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL
    });

    const prisma = new PrismaClient({
        adapter
    });

    module.exports = prisma;

### O que foi feito?

O arquivo `lib/prisma.js` configura o Prisma e sua conexão com o banco SQLite.

Depois, essa configuração é exportada para que o arquivo principal possa utilizar o Prisma.

---

## 10. Importando o Prisma

No arquivo `teste.js`, foi adicionado:

    const prisma = require('./lib/prisma');

### O que foi feito?

Essa linha importa a configuração do Prisma para que as rotas possam realizar operações no banco de dados.

---

## 11. CREATE — Cadastrar usuário

Antes, o usuário era adicionado ao array.

Agora, o usuário é cadastrado no banco utilizando o Prisma:

    app.post('/usuarios', async (req, res) => {
        try {
            const { nome, email } = req.body;

            const novoUsuario = await prisma.usuario.create({
                data: {
                    nome: nome,
                    email: email
                }
            });

            res.json(novoUsuario);
        } catch (error) {
            console.error(error);
        }
    });

### O que foi feito?

O método `create()` cria um novo registro na tabela `Usuario` do banco SQLite.

### Se o professor perguntar:

**Por que usamos `create()`?**

> Usamos o `create()` porque precisamos criar um novo registro no banco.

---

## 12. READ — Listar usuários

Antes, os usuários eram buscados no array.

Agora, os usuários são buscados diretamente no banco:

    app.get('/usuarios', async (req, res) => {
        const usuarios = await prisma.usuario.findMany();

        res.json(usuarios);
    });

### O que foi feito?

O método `findMany()` busca vários registros da tabela `Usuario`.

### Se o professor perguntar:

**Por que usamos `findMany()`?**

> O `findMany()` é utilizado para buscar vários registros da tabela.

---

## 13. UPDATE — Atualizar usuário

A rota de atualização passou a utilizar o método `update()`:

    app.put('/usuarios/:id', async (req, res) => {
        const id = parseInt(req.params.id);

        const usuario = await prisma.usuario.update({
            where: {
                id: id
            },
            data: {
                nome: req.body.nome,
                email: req.body.email
            }
        });

        res.json(usuario);
    });

### O que foi feito?

O `update()` localiza o usuário pelo ID e altera os dados informados.

O `where` indica qual registro será alterado.

O `data` informa quais dados serão modificados.

### Se o professor perguntar:

**Qual a função do `where`?**

> O `where` indica qual registro será localizado para realizar a alteração.

---

## 14. DELETE — Excluir usuário

A rota de exclusão passou a utilizar o método `delete()`:

    app.delete('/usuarios/:id', async (req, res) => {
        const id = parseInt(req.params.id);

        const usuario = await prisma.usuario.delete({
            where: {
                id: id
            }
        });

        res.json(usuario);
    });

### O que foi feito?

O `delete()` remove do banco o registro correspondente ao ID informado.

### Se o professor perguntar:

**Como o usuário é localizado?**

> O ID recebido pela URL é utilizado no `where` para localizar o usuário que será excluído.

---

## 15. Resumo do CRUD

| Operação | Método Prisma | Função |
|---|---|---|
| CREATE | `create()` | Criar usuário |
| READ | `findMany()` | Listar usuários |
| UPDATE | `update()` | Alterar usuário |
| DELETE | `delete()` | Excluir usuário |

---

## 16. Testando com o Thunder Client

### Cadastrar usuário

Método:

    POST

URL:

    http://localhost:3001/usuarios

Body:

    {
        "nome": "João",
        "email": "joao@email.com"
    }

### Listar usuários

Método:

    GET

URL:

    http://localhost:3001/usuarios

### Atualizar usuário

Método:

    PUT

URL:

    http://localhost:3001/usuarios/1

Body:

    {
        "nome": "João Silva",
        "email": "joaosilva@email.com"
    }

### Excluir usuário

Método:

    DELETE

URL:

    http://localhost:3001/usuarios/1

---

## 17. Teste de Persistência

Para verificar se a persistência está funcionando:

1. Cadastre um usuário pelo `POST /usuarios`.
2. Verifique os usuários pelo `GET /usuarios`.
3. Encerre o servidor.
4. Inicie o servidor novamente.
5. Faça novamente o `GET /usuarios`.

Se o usuário continuar aparecendo, significa que os dados foram armazenados no banco.

### Antes

    Thunder Client
          ↓
        Express
          ↓
      usuarios[]
          ↓
       Memória

Ao reiniciar o servidor:

    Dados perdidos

### Depois

    Thunder Client
          ↓
        Express
          ↓
        Prisma
          ↓
        SQLite
          ↓
       dev.db

Ao reiniciar o servidor:

    Dados continuam disponíveis

---

## 18. Arquivos utilizados

    tutorial_persistencia/
    │
    ├── lib/
    │   └── prisma.js
    │
    ├── prisma/
    │   ├── migrations/
    │   │   └── ..._inicial/
    │   │       └── migration.sql
    │   │
    │   └── schema.prisma
    │
    ├── .env
    ├── prisma.config.ts
    ├── teste.js
    ├── package.json
    └── dev.db

| Arquivo | Função |
|---|---|
| `schema.prisma` | Define a estrutura dos dados |
| `migration.sql` | Registra a alteração aplicada ao banco |
| `.env` | Define a localização do banco |
| `prisma.config.ts` | Configura o Prisma |
| `lib/prisma.js` | Configura a conexão do Prisma |
| `teste.js` | Contém as rotas da aplicação |
| `dev.db` | Banco de dados SQLite |

---

## 19. Principais conceitos

### Persistência

É a capacidade de manter os dados mesmo depois que a aplicação é encerrada.

### Banco de dados

É responsável por armazenar os dados de forma permanente.

### SQLite

É o banco de dados utilizado neste projeto.

### Prisma

É a ferramenta utilizada para facilitar a comunicação entre a aplicação e o banco de dados.

### ORM

O Prisma funciona como um ORM, permitindo trabalhar com o banco utilizando JavaScript.

### Migration

É o processo utilizado para aplicar alterações da estrutura definida no `schema.prisma` ao banco de dados.

### Schema

É a definição da estrutura dos dados que serão armazenados.

---

## 20. Fluxo final

    Usuário
       ↓
    Thunder Client
       ↓
    Express
       ↓
    Rotas
       ↓
    Prisma
       ↓
    SQLite
       ↓
    dev.db

Dessa forma, a aplicação deixou de armazenar os usuários somente em memória e passou a utilizar um banco de dados, permitindo que os dados permaneçam disponíveis mesmo após o encerramento e reinício do servidor.

---

## 21. Conclusão

A implementação da persistência permitiu substituir o armazenamento temporário em um array pelo armazenamento permanente utilizando Prisma e SQLite.

Com isso, as operações de cadastro, consulta, atualização e exclusão passaram a ser realizadas diretamente no banco de dados através dos métodos:

    create()
    findMany()
    update()
    delete()

O principal resultado foi garantir que os dados dos usuários não sejam perdidos quando o servidor é reiniciado.
