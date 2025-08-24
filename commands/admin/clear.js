const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        // Verificar se o usuário tem permissão
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ 
                content: '❌ You need the "Manage Messages" permission to use this command!',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            // Deferir a resposta primeiro (para evitar timeouts)
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Limpar as mensagens
            const deletedMessages = await interaction.channel.bulkDelete(amount, true);
            
            // Responder com o resultado
            await interaction.editReply({
                content: `🧹 Successfully deleted ${deletedMessages.size} messages!`
            });

            // Opcional: Deletar a mensagem de confirmação após alguns segundos
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.log('Could not delete reply:', error);
                }
            }, 5000);

        } catch (error) {
            console.error('Error deleting messages:', error);
            
            // Verificar o tipo de erro
            if (error.code === 50034) {
                await interaction.reply({ 
                    content: '❌ Cannot delete messages older than 14 days!',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({ 
                    content: '❌ Failed to delete messages! Please try again.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};