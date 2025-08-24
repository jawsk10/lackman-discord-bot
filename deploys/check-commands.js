const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Carregar .env da pasta raiz
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const rest = new REST().setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);

async function checkCommands() {
    try {
        console.log('🌍 Verificando comandos globais...');
        
        // Debug das variáveis
        console.log('🔑 Token:', process.env.TOKEN ? '***' : 'NÃO ENCONTRADO');
        console.log('🆔 Client ID:', process.env.CLIENT_ID || 'NÃO ENCONTRADO');
        
        const globalCommands = await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID)
        );
        
        console.log(`📊 ${globalCommands.length} comandos globais:`);
        globalCommands.forEach(cmd => console.log(`🔹 /${cmd.name} (ID: ${cmd.id})`));
        
    } catch (error) {
        console.error('❌ Erro ao verificar comandos:', error);
    }
}

checkCommands();