require('dotenv').config();
const express = require('express');
const criarCliente = require('./bot');
const { iniciarAgendamentos } = require('./cronJobs');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const horaAtual = new Date().toLocaleString('pt-BR', { timeZone: 'America/Bahia' });
    res.send(`🤖 Bot da Gabs está online! Última verificação: ${horaAtual}`);
});

app.listen(port, () => {
    console.log(`🌍 Servidor web rodando na porta ${port}`);
});

// Inicializa o banco de dados e depois o bot do WhatsApp
criarCliente().then((client) => {
    
    client.on('ready', () => {
        iniciarAgendamentos(client);
    });

    console.log('Iniciando conexão com o WhatsApp e o Supabase...');
    client.initialize();
    
}).catch(err => {
    console.error('❌ Erro ao inicializar o bot:', err);
});