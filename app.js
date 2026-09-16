const express = require('express');
const prisma = require('./lib/prisma');

const app = express();

app.use(express.json());


app.post('/usuarios', async (req, res) => {
    try {
        const { nome, email } = req.body;

        const usuario = await prisma.usuario.create({
            data: {
                nome,
                email
            }
        });

        res.json(usuario);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar usuário'
        });
    }
});


app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany();

        res.json(usuarios);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao buscar usuários'
        });
    }
});


app.put('/usuarios/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, email } = req.body;

        const usuario = await prisma.usuario.update({
            where: {
                id: id
            },
            data: {
                nome: nome,
                email: email
            }
        });

        res.json(usuario);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao atualizar usuário'
        });
    }
});


app.delete('/usuarios/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const usuario = await prisma.usuario.delete({
            where: {
                id: id
            }
        });

        res.json(usuario);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao excluir usuário'
        });
    }
});


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});