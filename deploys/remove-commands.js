const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Carregar .env da pasta raiz do projeto
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

// Verifica se o token está disponível
const token = process.env.TOKEN || process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ ERRO: Nenhum token encontrado no .env');
    console.error('📝 Verifique se TOKEN ou DISCORD_TOKEN está definido no arquivo .env');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('❌ CLIENT_ID não encontrado no arquivo .env');
    process.exit(1);
}

const rest = new REST().setToken(token);

async function deleteAllCommands() {
    try {
        console.log('🗑️  Deletando todos os comandos globais...');
        
        // Debug das variáveis
        console.log('🔑 Token:', token ? '***' : 'NÃO ENCONTRADO');
        console.log('🆔 Client ID:', process.env.CLIENT_ID || 'NÃO ENCONTRADO');

        // Deletar todos os comandos globais do bot
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        
        console.log('✅ Todos os comandos globais foram deletados!');
        console.log(`📊 Comandos removidos: ${data.length}`);
        
    } catch (error) {
        console.error('❌ Erro ao deletar comandos:', error);
    }
}

deleteAllCommands();