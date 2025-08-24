const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        try {
            // Banir o usuário
            await interaction.guild.members.ban(target, { reason });
            
            // Responder com sucesso
            await interaction.reply({
                content: `✅ Successfully banned ${target.tag} for: ${reason}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Ban error:', error);
            await interaction.reply({ 
                content: '❌ Failed to ban the user!', 
                flags: MessageFlags.Ephemeral
            });
        }
    }
};