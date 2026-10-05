Autenticação com JWT + Bcrypt
Guia passo a passo para migrar de autenticação via express-sessionpara JWT (JSON Web Token) , com hash de senhas usando bcrypt e leitura de token via cookie-parser .

1° Passo — Instalação das Dependências
Execute os comandos abaixo na raiz do projeto :

# Caso não tenham o node_modules
npm install express

# Responsável por gerar o hash da senha e comparar no login
npm install bcryptjs

# Caso haja algum erro nos métodos override
npm install method-override

# Leitura de cookies para obter o token no servidor
npm install cookie-parser

# Carregamento das variáveis de ambiente e suporte ao JWT
npm install bcrypt jsonwebtoken dotenv
2° Passo — Criando o arquivo.env
#O arquivo .env serve para salvar configurações e informações confidenciais do projeto fora do código principal.

Na pasta raiz do projeto, crie um arquivo chamado .enve adicione:

DATABASE_URL='file:./dev.db'
JWT_SECRET=uma_chave_muuito_secreta_aqui
JWT_EXPIRES_IN=1h
Variável	Descrição
DATABASE_URL	Localiza o banco de dados
JWT_SECRET	Chave secreta usada para verificar e validar os tokens
JWT_EXPIRES_IN	Tempo de expiração do token (ex.: 1h)
3° Passo — Ajustando a Tabela Usuariodo Prisma
Altere o modelo Usuarioadicionando o campo senha:

model Usuario {
  // [...]
  senha       String

  emprestimos Emprestimo[]
}
Depois, rode os comandos:

# Reinstalar o Prisma Client
npm install @prisma/client

# Caso o better-sqlite dê erro por conta da importação
npm install @prisma/adapter-better-sqlite3 better-sqlite3

# Gerar o Prisma
npx prisma generate

# Instalação do EJS
npm install ejs
4° Passo — Ajustes no app.js(criação e login)
Acima das rotas , garanta que o cadastro salve a senha com hash:

await prisma.usuario.create({ data: { nome, email, senha: hashed } }); #no projeto final não tem por algum motivo
No tryda rota/login , substitua a verificação antiga por:

try {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || usuario.senha !== senha) {
    return res.render('login.html', {
      erro: 'E-mail ou senha inválidos.',
      sucesso: null
    });
  }
}
5° Passo — Criando o middlewareauth.js
Crie o arquivo Middlewares/auth.jscom o conteúdo:

const jwt = require('jsonwebtoken');

function autenticarJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    const tokenFromHeader =
        authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;

    const token = tokenFromHeader || req.cookies?.token;

    if (!token) {
        return res.status(401).render('login.html', {
            erro: 'Autentique-se para continuar.', sucesso: null
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        return next();

    } catch (err) {
        console.error('Token inválido:', err.message);

        return res.status(401).render('login.html', {
            erro: 'Sessão inválida. Faça login novamente.',
            sucesso: null
        });
    }
}

function usuarioOpcional(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        req.user = null;
    }
    next();
}

module.exports = {
    autenticarJWT,
    usuarioOpcional
};
6° Passo — Removendo express-sessione configurando JWT
Remover do app.js:
const session = require('express-session');
E também:

app.use(session({
  secret: 'lyclari-biblioteca-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4h
}));
não app.js:
require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { autenticarJWT, usuarioOpcional } = require('./Middlewares/auth');
Logo apósconst port = 5000; , adicionar:

app.use(cookieParser());
Atualizar o bloco de middlewares:
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(logger);

app.use(usuarioOpcional);

app.use((req, res, next) => {
    res.locals.usuarioLogado = req.user || null;
    next();
});
7° Passo — Protegendo rotas e ajustando login/logout
Aplicar autenticarJWTnas rotas:
app.post('/emprestar',        autenticarJWT, async (req, res) => { /* ... */ });
app.post('/cadastrar-livro',  autenticarJWT, async (req, res) => { /* ... */ });
app.post('/devolver/:id',     autenticarJWT, async (req, res) => { /* ... */ });
Alterar a rota GET /login:
app.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/livros');
  }

  const sucesso = req.query.cadastro === 'ok'
    ? 'Conta criada com sucesso! Faça login para continuar.'
    : null;

  res.render('login.html', {
    erro: null,
    sucesso
  });
});
Alterar a rota GET /cadastro:
app.get('/cadastro', (req, res) => {
  if (req.user) {
    return res.redirect('/livros');
  }

  res.render('cadastro.html', {
    erro: null,
    sucesso: null
  });
});
Remover fazer POST /login:
req.session.usuario = {
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email
};
Em seu lugar, adicione:
if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) { /* ... */ }

const token = jwt.sign(
  {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email
  },
  process.env.JWT_SECRET,
  {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  }
);

res.cookie('token', token, {
  httpOnly: true, #Retirar Para Testar Token gerado utilizando *console.log(document.cookie)*
  secure: false
});

res.redirect('/livros');
promover a rota /logout:
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});
Afixar o POST /cadastrar-usuario:
// Cria o hash da senha antes de salvar no banco
const senhaHash = await bcrypt.hash(senha, 12);

await prisma.usuario.create({
  data: {
    nome,
    email,
    senha: senhaHash
  }
});

return res.redirect('/login?cadastro=ok');

} catch (erro) {
  console.error('Erro ao cadastrar usuário:', erro);

  return res.render('cadastro.html', {
    erro: 'Erro ao cadastrar usuário. Tente novamente.',
    sucesso: null
  });
}
});
8° Passo — (Opcional) Rehash de senhas antigas
Se já existirem usuários no banco com senhas em texto puro, crie o arquivo scripts/rehash-senhas.js:

require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

(async () => {
  const usuarios = await prisma.usuario.findMany();

  for (const u of usuarios) {
    if (!u.senha.startsWith('$2')) {
      const hashed = await bcrypt.hash(u.senha, 12);
      await prisma.usuario.update({
        where: { id: u.id },
        data: { senha: hashed }
      });
      console.log(`Re-hashed user ${u.id}`);
    }
  }

  console.log('Re-hash completo.');
  process.exit(0);
})();
Executar com:

node scripts/rehash-senhas.js
imprimir Tokern console.log(document.cookie)

Resumo do Fluxo
Instalar dependências ( bcryptjs, jsonwebtoken, cookie-parser, dotenv).
Configurar configurações de ambiente no .env.
Adicione campo senhano modelo Usuarioe regenerar o Prisma.
Criar o middleware auth.jscom autenticarJWTe usuarioOpcional.
Remover express-session e usar JWT via cookie .
Proteger rotas sensíveis com autenticarJWT.
Assinar o token no login e limpar o cookie no logout.
(Opcional) Rodar script de re-hash para senhas antigas.
Dica: mantenha o JWT_SECRETfora do versionamento (adicione .envao .gitignore) e, em produção, não use secure: truecookie (solicite HTTPS).
