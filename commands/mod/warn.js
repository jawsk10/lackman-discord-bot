const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Arquivo para armazenar as advertências
const WARN_FILE = path.join(__dirname, '..', 'data', 'warnings.json');

// Garantir que o diretório data existe
if (!fs.existsSync(path.dirname(WARN_FILE))) {
    fs.mkdirSync(path.dirname(WARN_FILE), { recursive: true });
}

// Carregar advertências do arquivo
function loadWarnings() {
    try {
        if (fs.existsSync(WARN_FILE)) {
            return JSON.parse(fs.readFileSync(WARN_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Erro ao carregar advertências:', error);
    }
    return {};
}

// Salvar advertências no arquivo
function saveWarnings(warnings) {
    try {
        fs.writeFileSync(WARN_FILE, JSON.stringify(warnings, null, 4));
        return true;
    } catch (error) {
        console.error('Erro ao salvar advertências:', error);
        return false;
    }
}

// Adicionar advertência
function addWarning(guildId, userId, reason, moderatorId) {
    const warnings = loadWarnings();
    
    if (!warnings[guildId]) {
        warnings[guildId] = {};
    }
    
    if (!warnings[guildId][userId]) {
        warnings[guildId][userId] = [];
    }
    
    const warning = {
        id: Date.now(),
        reason: reason || 'Sem motivo especificado',
        moderator: moderatorId,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    warnings[guildId][userId].push(warning);
    
    return saveWarnings(warnings) ? warning : null;
}

// Obter advertências de um usuário
function getUserWarnings(guildId, userId) {
    const warnings = loadWarnings();
    return warnings[guildId]?.[userId] || [];
}

// Remover advertência específica
function removeWarning(guildId, userId, warningId) {
    const warnings = loadWarnings();
    
    if (warnings[guildId]?.[userId]) {
        warnings[guildId][userId] = warnings[guildId][userId].filter(w => w.id !== warningId);
        return saveWarnings(warnings);
    }
    
    return false;
}

// Limpar todas as advertências de um usuário
function clearUserWarnings(guildId, userId) {
    const warnings = loadWarnings();
    
    if (warnings[guildId]?.[userId]) {
        delete warnings[guildId][userId];
        return saveWarnings(warnings);
    }
    
    return false;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Sistema de advertências')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Advertir um usuário')
                .addUserOption(option =>
                    option.setName('usuário')
                        .setDescription('Usuário a ser advertido')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('motivo')
                        .setDescription('Motivo da advertência')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Listar advertências de um usuário')
                .addUserOption(option =>
                    option.setName('usuário')
                        .setDescription('Usuário para ver as advertências')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remover uma advertência específica')
                .addUserOption(option =>
                    option.setName('usuário')
                        .setDescription('Usuário para remover advertência')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('ID da advertência a ser removida')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Limpar todas as advertências de um usuário')
                .addUserOption(option =>
                    option.setName('usuário')
                        .setDescription('Usuário para limpar advertências')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('usuário');
        const member = interaction.guild.members.cache.get(user.id);

        // Verificar se o usuário existe no servidor
        if (!member) {
            return await interaction.reply({
                content: '❌ Usuário não encontrado neste servidor.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Verificar se não está tentando se auto-advertir
        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: '❌ Você não pode se auto-advertir.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Verificar hierarquia (não pode advertir alguém com cargo igual ou superior)
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return await interaction.reply({
                content: '❌ Você não pode advertir alguém com cargo igual ou superior ao seu.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            switch (subcommand) {
                case 'add': {
                    const reason = interaction.options.getString('motivo') || 'Sem motivo especificado';
                    
                    // Adicionar advertência
                    const warning = addWarning(
                        interaction.guild.id,
                        user.id,
                        reason,
                        interaction.user.id
                    );

                    if (!warning) {
                        return await interaction.reply({
                            content: '❌ Erro ao salvar advertência.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    // Embed de confirmação
                    const warnEmbed = new EmbedBuilder()
                        .setColor(0xFFA500) // Laranja
                        .setTitle('⚠️ Advertência Aplicada')
                        .setDescription(`Usuário: ${user.tag} (${user.id})`)
                        .addFields(
                            { name: 'Motivo', value: reason, inline: false },
                            { name: 'Moderador', value: interaction.user.tag, inline: true },
                            { name: 'ID da Advertência', value: warning.id.toString(), inline: true },
                            { name: 'Total de Advertências', value: getUserWarnings(interaction.guild.id, user.id).length.toString(), inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: `Sistema de Advertências • ${interaction.guild.name}` });

                    await interaction.reply({ embeds: [warnEmbed] });

                    // Tentar enviar DM para o usuário advertido
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor(0xFFA500)
                            .setTitle('⚠️ Você recebeu uma advertência')
                            .setDescription(`Servidor: **${interaction.guild.name}**`)
                            .addFields(
                                { name: 'Motivo', value: reason, inline: false },
                                { name: 'Moderador', value: interaction.user.tag, inline: true },
                                { name: 'ID da Advertência', value: warning.id.toString(), inline: true }
                            )
                            .setTimestamp();

                        await user.send({ embeds: [dmEmbed] });
                    } catch (dmError) {
                        console.log(`Não foi possível enviar DM para ${user.tag}`);
                    }
                    break;
                }

                case 'list': {
                    const warnings = getUserWarnings(interaction.guild.id, user.id);
                    
                    if (warnings.length === 0) {
                        return await interaction.reply({
                            content: `✅ ${user.tag} não possui advertências.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`📋 Advertências de ${user.tag}`)
                        .setDescription(`Total: **${warnings.length}** advertência(s)`)
                        .setThumbnail(user.displayAvatarURL());

                    warnings.forEach((warn, index) => {
                        embed.addFields({
                            name: `⚠️ Advertência #${index + 1} (ID: ${warn.id})`,
                            value: `**Motivo:** ${warn.reason}\n**Data:** <t:${Math.floor(new Date(warn.date).getTime() / 1000)}:F>\n**Moderador:** <@${warn.moderator}>`,
                            inline: false
                        });
                    });

                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    break;
                }

                case 'remove': {
                    const warningId = interaction.options.getInteger('id');
                    const warnings = getUserWarnings(interaction.guild.id, user.id);
                    const warningToRemove = warnings.find(w => w.id === warningId);

                    if (!warningToRemove) {
                        return await interaction.reply({
                            content: '❌ Advertência não encontrada para este usuário.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    if (removeWarning(interaction.guild.id, user.id, warningId)) {
                        await interaction.reply({
                            content: `✅ Advertência #${warningId} removida de ${user.tag}.`,
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ Erro ao remover advertência.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    break;
                }

                case 'clear': {
                    const warningsCount = getUserWarnings(interaction.guild.id, user.id).length;
                    
                    if (warningsCount === 0) {
                        return await interaction.reply({
                            content: `✅ ${user.tag} não possui advertências para limpar.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    if (clearUserWarnings(interaction.guild.id, user.id)) {
                        await interaction.reply({
                            content: `✅ ${warningsCount} advertência(s) removida(s) de ${user.tag}.`,
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ Erro ao limpar advertências.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Erro no comando warn:', error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao executar este comando.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};