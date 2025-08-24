const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to get info about')),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target') ?? interaction.user;
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) {
            return interaction.reply({
                content: '❌ User not found in this server.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${target.username}'s Information`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: 'Username', value: target.tag, inline: true },
                { name: 'ID', value: target.id, inline: true },
                { name: 'Bot', value: target.bot ? 'Yes' : 'No', inline: true },
                { name: 'Joined Discord', value: target.createdAt.toDateString(), inline: true },
                { name: 'Joined Server', value: member.joinedAt ? member.joinedAt.toDateString() : 'Unknown', inline: true },
                { name: 'Roles', value: member.roles.cache.map(r => r.toString()).join(' ') || 'None' }
            );
        
        await interaction.reply({ embeds: [embed] });
    }
};