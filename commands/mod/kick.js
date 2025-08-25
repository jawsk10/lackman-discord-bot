const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        try {
            // Expulsar o usuário
            await interaction.guild.members.kick(target, reason);
            
            // Responder com sucesso
            await interaction.reply({
                content: `✅ Successfully kicked ${target.tag} for: ${reason}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Kick error:', error);
            await interaction.reply({ 
                content: '❌ Failed to kick the user!', 
                flags: MessageFlags.Ephemeral
            });
        }
    }
};