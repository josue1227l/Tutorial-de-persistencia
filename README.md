# Persistência de Dados com Prisma + SQLite

Guia passo a passo para implementar persistência de dados em uma aplicação **Node.js + Express**, mostrando a diferença entre armazenar dados em memória utilizando um array e armazená-los de forma permanente utilizando **SQLite + Prisma**.

---

## 1° Passo — Instalação das Dependências

Execute os comandos abaixo na raiz do projeto:

```bash
# Instalação do Prisma e do Prisma Client
npm install prisma@7.10.0 @prisma/client@7.10.0

# Driver do SQLite e adaptador utilizado pelo Prisma
npm install better-sqlite3 @prisma/adapter-better-sqlite3
Para que serve cada dependência?
Dependência	Função
prisma	Ferramenta ORM utilizada para trabalhar com o banco de dados
@prisma/client	Permite realizar operações no banco através do código JavaScript
better-sqlite3	Driver utilizado para comunicação com o SQLite
@prisma/adapter-better-sqlite3	Adaptador que conecta o Prisma ao Better SQLite3
2° Passo — Inicializando o Prisma

Execute:

npx prisma init --datasource-provider sqlite

Esse comando cria a estrutura inicial necessária para utilizar o Prisma com SQLite.

Após a inicialização, teremos arquivos como:

prisma/
 └── schema.prisma

.env
prisma7.config.ts
3° Passo — Configurando o banco de dados

No arquivo .env, configure a URL do banco:

DATABASE_URL="file:./dev.db"

O arquivo .env armazena configurações utilizadas pela aplicação.

Nesse projeto, DATABASE_URL informa onde está localizado o banco SQLite.

4° Passo — Criando o Schema

No arquivo:

prisma/schema.prisma

Defina o modelo Usuario:

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
Estrutura do modelo
Campo	Tipo	Função
id	Int	Identificador do usuário
nome	String	Nome do usuário
email	String	E-mail do usuário
Propriedades importantes
@id

Define o campo como identificador principal.

@default(autoincrement())

Faz o ID ser gerado automaticamente.

@unique

Impede que dois usuários tenham o mesmo e-mail.

5° Passo — Criando a Migration

Depois de definir o modelo, execute:

npx prisma migrate dev --name inicial

A migration pega a estrutura definida no schema.prisma e aplica essa estrutura no banco de dados.

Ela também mantém um histórico das alterações realizadas no banco.

Depois disso, será criado o banco SQLite:

dev.db
6° Passo — Gerando o Prisma Client

Execute:

npx prisma generate

O comando gera o Prisma Client, que será utilizado no código para realizar operações no banco.

Com ele podemos utilizar métodos como:

create()
findMany()
update()
delete()
7° Passo — Criando a conexão com o Prisma

Crie o arquivo:

lib/prisma.js

Com o seguinte conteúdo:

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
O que foi feito?

Esse arquivo configura a conexão entre a aplicação, o Prisma e o banco SQLite.

Depois, o objeto prisma é exportado para ser utilizado no teste.js.

8° Passo — Alterando o teste.js

Inicialmente, os usuários eram armazenados em um array:

let usuarios = [
    {
        id: 1,
        nome: "Clara Araújo"
    },
    {
        id: 2,
        nome: "Lyvia Niedja"
    },
    {
        id: 23,
        nome: "Daniel prof gatão"
    }
];

Esse tipo de armazenamento funciona apenas enquanto o servidor está executando.

Ao desligar o servidor, os dados adicionados são perdidos.

Por isso, substituímos o armazenamento no array pelo banco de dados utilizando Prisma.

9° Passo — Importando o Prisma

No início do teste.js, adicionamos:

const prisma = require('./lib/prisma');

Essa linha importa a configuração do Prisma para que o teste.js possa acessar o banco de dados.

10° Passo — CREATE: Cadastrar usuário

A rota POST /usuarios passou a utilizar o Prisma:

app.post('/usuarios', async (req, res) => {
    try {
        const { nome, email } = req.body;

        const novoUser = await prisma.usuario.create({
            data: {
                nome,
                email
            }
        });

        res.json(novoUser);

    } catch (error) {
        console.error(error);
    }
});

O método:

create()

é utilizado para criar um novo registro no banco.

Resumo

Antes:

POST → array

Depois:

POST → Prisma → SQLite
11° Passo — READ: Listar usuários

A rota GET /usuarios passou a buscar os dados no banco:

app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany();

        res.json(usuarios);

    } catch (error) {
        console.error(error);
    }
});

O método:

findMany()

é utilizado para buscar vários registros.

Resumo

O GET deixou de consultar o array e passou a consultar diretamente o banco de dados.

12° Passo — UPDATE: Atualizar usuário

A rota PUT /usuarios/:id utiliza:

app.put('/usuarios/:id', async (req, res) => {
    try {
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

    } catch (error) {
        console.error(error);
    }
});

O método:

update()

altera um registro existente.

O where indica qual usuário será alterado e o data informa os novos dados.

13° Passo — DELETE: Excluir usuário

A rota DELETE /usuarios/:id utiliza:

app.delete('/usuarios/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const usuario = await prisma.usuario.delete({
            where: {
                id: id
            }
        });

        res.json(usuario);

    } catch (error) {
        console.error(error);
    }
});

O método:

delete()

remove um registro do banco.

14° Passo — Resumo do CRUD
Operação	HTTP	Prisma	Função
Criar	POST	create()	Cadastrar usuário
Ler	GET	findMany()	Listar usuários
Atualizar	PUT	update()	Alterar usuário
Excluir	DELETE	delete()	Remover usuário
15° Passo — Testando com Thunder Client

As rotas podem ser testadas utilizando o Thunder Client.

Cadastrar usuário
POST http://localhost:3001/usuarios

Body:

{
    "nome": "João",
    "email": "joao@email.com"
}
Listar usuários
GET http://localhost:3001/usuarios
Atualizar usuário
PUT http://localhost:3001/usuarios/1

Body:

{
    "nome": "João Atualizado",
    "email": "joaoatualizado@email.com"
}
Excluir usuário
DELETE http://localhost:3001/usuarios/1
16° Passo — Testando a Persistência

Para verificar se o banco realmente está mantendo os dados:

Inicie o servidor.
Cadastre um usuário.
Consulte os usuários pelo GET.
Encerre o servidor.
Inicie o servidor novamente.
Faça novamente o GET /usuarios.

O usuário continuará cadastrado.

Isso acontece porque agora os dados estão sendo armazenados no SQLite e não somente na memória da aplicação.

17° Passo — Comparação
Antes do Prisma
Thunder Client
      ↓
   Express
      ↓
Array usuarios[]

Os dados ficavam apenas na memória.

Ao reiniciar o servidor:

Dados perdidos
Com Prisma
Thunder Client
      ↓
   Express
      ↓
   Prisma
      ↓
   SQLite
      ↓
   dev.db

Os dados ficam armazenados no banco.

Ao reiniciar o servidor:

Dados continuam salvos
18° Passo — Principais conceitos
Prisma

Ferramenta utilizada para facilitar a comunicação entre a aplicação e o banco de dados.

Prisma Client

Permite realizar operações no banco através do código JavaScript.

SQLite

Banco de dados utilizado neste projeto para armazenar os usuários.

Migration

Processo que aplica no banco as alterações definidas no schema.prisma.

Schema

Arquivo que define a estrutura dos dados que serão armazenados.

Driver

O better-sqlite3 funciona como driver para permitir a comunicação com o SQLite.

Resumo do fluxo
1. Instalar dependências
        ↓
2. Inicializar Prisma
        ↓
3. Configurar .env
        ↓
4. Criar schema.prisma
        ↓
5. Executar migration
        ↓
6. Gerar Prisma Client
        ↓
7. Configurar lib/prisma.js
        ↓
8. Alterar as rotas do teste.js
        ↓
9. Testar CRUD
        ↓
10. Testar persistência
Conclusão

Neste tutorial foi apresentada a evolução do armazenamento de dados de uma aplicação Express.

Inicialmente, os usuários eram armazenados em um array, fazendo com que os dados fossem perdidos quando o servidor era reiniciado.

Com a utilização do Prisma + SQLite, os dados passaram a ser armazenados de forma persistente, permitindo realizar as operações de criação, leitura, atualização e exclusão (CRUD) diretamente no banco de dados.


**Eu acho que esse formato combina bem com o README do Grupo 1**, porque mantém a idei
