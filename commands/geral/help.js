const { SlashCommandBuilder, EmbedBuilder, version, MessageFlags } = require('discord.js');
const fs = require('fs');
const { version: nodeVersion } = require('process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Command category')
                .addChoices(
                    { name: '👮 Admin', value: 'admin' },
                    { name: '🛠️ Utility', value: 'utility' },
                    { name: '🎮 Fun', value: 'fun' }
                )),
    
    async execute(interaction) {
        const category = interaction.options.getString('category');
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ 
                name: `${interaction.client.user.username} Help Menu`, 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        // Count total commands
        let totalCommands = 0;
        const categories = fs.readdirSync('./commands');
        categories.forEach(cat => {
            totalCommands += fs.readdirSync(`./commands/${cat}`).filter(file => file.endsWith('.js')).length;
        });

        embed.addFields(
            { name: '📊 Bot Statistics', value: [
                `⚡ **Total Commands:** ${totalCommands}`,
                `📚 **Discord.js:** v${version}`,
                `🤖 **Node.js:** ${nodeVersion}`,
                `👨‍💻 **Creator:** Jawsk`,
                `🏷️ **Bot Version:** 1.0.0`
            ].join('\n'), inline: false }
        );

        if (category) {
            const commandFiles = fs.readdirSync(`./commands/${category}`).filter(file => file.endsWith('.js'));
            const commands = commandFiles.map(file => {
                const command = require(`../${category}/${file}`);
                return `\`/${command.data.name}\` • ${command.data.description}`;
            });
            
            const categoryEmojis = {
                admin: '👮 Administration',
                utility: '🛠️ Utility',
                fun: '🎮 Fun'
            };

            embed.addFields({
                name: `${categoryEmojis[category]} Commands`,
                value: commands.join('\n') || 'No commands found.',
                inline: false
            });
        } else {
            categories.forEach(category => {
                const commandFiles = fs.readdirSync(`./commands/${category}`).filter(file => file.endsWith('.js'));
                const commands = commandFiles.map(file => {
                    const command = require(`../${category}/${file}`);
                    return `\`/${command.data.name}\``;
                });

                const categoryEmojis = {
                    admin: '👮 Administration',
                    utility: '🛠️ Utility',
                    fun: '🎮 Fun'
                };
                
                embed.addFields({
                    name: `${categoryEmojis[category]} Commands`,
                    value: commands.join(', ') || 'No commands found.',
                    inline: false
                });
            });
        }

        // Add usage tip
        embed.addFields({
            name: '💡 Tip',
            value: 'Use `/help <category>` to get detailed information about specific categories!',
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    }
};