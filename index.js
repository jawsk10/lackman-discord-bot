require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Configuração do cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Coleção para armazenar comandos
client.commands = new Collection();
const commands = [];

// Função para carregar comandos recursivamente
function loadCommands(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            loadCommands(fullPath); // Carrega subpastas recursivamente
        } else if (file.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                
                if (!command.data || !command.execute) {
                    console.warn(`⚠️  O comando em ${fullPath} está faltando propriedades necessárias (data ou execute)`);
                    continue;
                }
                
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                console.log(`✅ Comando carregado: ${command.data.name}`);
            } catch (error) {
                console.error(`❌ Erro ao carregar comando ${fullPath}:`, error.message);
            }
        }
    }
}

// Carregar todos os comandos
console.log('📂 Carregando comandos...');
loadCommands(path.join(__dirname, 'commands'));
console.log(`📊 Total de comandos carregados: ${commands.length}`);

// Configuração do REST para registro de comandos
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Evento quando o bot fica online
client.once('clientReady', async () => {
    console.log(`🤖 Bot logado como: ${client.user.tag}`);
    console.log(`🌐 Conectado em ${client.guilds.cache.size} servidores`);
    console.log(`👥 Total de usuários: ${client.users.cache.size}`);
    
    // Registrar comandos slash
    try {
        console.log('🔄 Registrando comandos slash...');
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log('✅ Comandos slash registrados com sucesso!');
        console.log('🎉 Bot está online e funcionando!');
        
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
});

// Evento de interação (comandos slash)
client.on('interactionCreate', async interaction => {
    // Lidar com comandos slash
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            console.warn(`⚠️  Comando não encontrado: ${interaction.commandName}`);
            return;
        }
        
        try {
            console.log(`🔧 Executando comando: ${interaction.commandName} por ${interaction.user.tag}`);
            await command.execute(interaction);
            
        } catch (error) {
            console.error(`❌ Erro ao executar comando ${interaction.commandName}:`, error);
            
            // Responder com mensagem de erro
            const errorMessage = {
                content: '❌ Ocorreu um erro ao executar este comando!',
                flags: 64 // Ephemeral
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
    
    // Lidar com outros tipos de interação (botões, menus, etc)
    else if (interaction.isButton()) {
        // Implementar lógica para botões se necessário
    }
});

// Eventos de erro e warnings
client.on('error', error => {
    console.error('❌ Erro do cliente Discord:', error);
});

client.on('warn', warning => {
    console.warn('⚠️  Warning do Discord:', warning);
});

process.on('unhandledRejection', error => {
    console.error('❌ Rejeição não tratada:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Exceção não capturada:', error);
    process.exit(1);
});

// Login do bot
console.log('🔑 Iniciando login...');
client.login(process.env.TOKEN)
    .then(() => console.log('✅ Login realizado com sucesso!'))
    .catch(error => {
        console.error('❌ Erro no login:', error);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Desligando bot graciosamente...');
    client.destroy();
    console.log('👋 Bot desligado. Até mais!');
    process.exit(0);
});