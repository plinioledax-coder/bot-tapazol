const cron = require('node-cron');

function iniciarAgendamentos(client) {
    const numeroNamorada = process.env.NUMERO_NAMORADA;

    // A expressão '0 22 * * *' significa: Todo dia, às 22:00:00
    cron.schedule('0 22 * * *', async () => {
        console.log('⏰ Dando 22h... Enviando lembrete!');
        
        try {
            const mensagem = 'Amor, 22h! 💊 Já tomou seu TAPAZOL hoje? (Responda "tomei" ou "adiar")';
            await client.sendMessage(numeroNamorada, mensagem);
            console.log('Lembrete enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar lembrete:', error);
        }
    }, {
        scheduled: true,
        timezone: "America/Bahia" 
    });

    console.log('📅 Agendamento das 22h configurado.');
}

module.exports = { iniciarAgendamentos };