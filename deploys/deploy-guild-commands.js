const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Carregar .env da pasta raiz do projeto
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const commands = [];
// Caminho CORRETO para a pasta commands (na raiz do projeto)
const foldersPath = path.join(process.cwd(), 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Carregar comandos
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Carregado comando: ${command.data.name}`);
        }
    }
}

// Configurar REST com token correto
const token = process.env.TOKEN || process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ ERRO: Nenhum token encontrado no .env');
    process.exit(1);
}

const rest = new REST().setToken(token);
const GUILD_ID = process.env.GUILD_ID;

async function deployGuildCommands() {
    if (!GUILD_ID) {
        console.log('❌ GUILD_ID não definido no .env');
        console.log('📝 Adicione: GUILD_ID=seu_id_do_servidor no arquivo .env');
        return;
    }

    try {
        console.log(`🔄 Registrando ${commands.length} comandos no servidor...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log(`✅ ${data.length} comandos registrados no servidor!`);
        
        console.log('\n📋 Comandos registrados:');
        data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
        
    } catch (error) {
        console.error('❌ Erro ao registrar comandos no servidor:', error);
    }
}

deployGuildCommands();