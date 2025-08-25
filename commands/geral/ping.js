const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    
    async execute(interaction) {
        // Método 1: Simples e eficaz
        const startTime = Date.now();
        
        await interaction.reply({ 
            content: 'Pinging...', 
            flags: MessageFlags.Ephemeral
        });
        
        const latency = Date.now() - startTime;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        await interaction.editReply(`🏓 Pong! \n📡 Latency: ${latency}ms \n🌐 API: ${apiLatency}ms`);
    }
};