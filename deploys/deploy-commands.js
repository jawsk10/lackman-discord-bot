const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Carregar .env da pasta raiz do projeto
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const commands = [];
const foldersPath = path.join(process.cwd(), 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Carregar todos os comandos
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Carregado comando: ${command.data.name}`);
        } else {
            console.log(`⚠️  Comando inválido em ${filePath}`);
        }
    }
}

// Configurar REST
const token = process.env.TOKEN || process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ ERRO CRÍTICO: Nenhum token encontrado!');
    console.error('📝 Verifique se TOKEN ou DISCORD_TOKEN está definido no arquivo .env');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('❌ ERRO CRÍTICO: CLIENT_ID não encontrado!');
    process.exit(1);
}

const rest = new REST().setToken(token);

async function deployCommands() {
    try {
        console.log('\n🔍 Verificando ambiente:');
        console.log('📁 Diretório:', process.cwd());
        console.log('🔑 Token:', token ? '*** (PRESENTE)' : 'NÃO ENCONTRADO');
        console.log('🆔 Client ID:', process.env.CLIENT_ID);
        console.log('📊 Comandos carregados:', commands.length);
        console.log('----------------------------------------');

        // PRIMEIRO: Limpar comandos antigos
        console.log('🧹 Limpando comandos antigos...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        console.log('✅ Comandos antigos removidos!');

        // DEPOIS: Registrar novos comandos
        console.log(`🔄 Registrando ${commands.length} comandos...`);
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`✅ ${data.length} comandos registrados com sucesso!`);
        
        // Listar comandos registrados
        console.log('\n📋 Comandos registrados:');
        data.forEach(cmd => console.log(`🔹 /${cmd.name}`));
        
        console.log('\n🎉 Deploy concluído! Use /help para testar.');
        
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:');
        console.error('📌 Mensagem:', error.message);
        
        if (error.code === 0) {
            console.error('🔑 Possível problema: Token inválido ou sem permissões');
        } else if (error.code === 10004) {
            console.error('🆔 Possível problema: CLIENT_ID incorreto');
        } else if (error.code === 50001) {
            console.error('🚫 Bot sem permissão para registrar comandos');
        }
        
        console.error('💡 Dica: Verifique se o bot está convidado para o servidor');
    }
}

// Executar deploy
deployCommands();