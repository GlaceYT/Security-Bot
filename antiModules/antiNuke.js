const antiNuke = (client) => {
    console.log('\x1b[36m[ SECURITY ]\x1b[0m', '\x1b[32m💀 ULTRA-FAST Instant Bot Ban System Ready ✅\x1b[0m');

    client.on('raw', async (packet) => {
        const action = packet.t;
        if (!['CHANNEL_CREATE', 'CHANNEL_DELETE', 'ROLE_CREATE', 'ROLE_DELETE'].includes(action)) return;

        const guild = client.guilds.cache.get(packet.d.guild_id);
        if (!guild) return;

        try {
            // 🚀 Fetch the latest audit log entry instantly
            const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: mapAuditType(action) });
            const logEntry = auditLogs.entries.first();
            if (!logEntry) return;

            const { executor } = logEntry;
            if (!executor || executor.id === client.user.id) return; // Ignore the bot itself

            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            // 💀 INSTANTLY BAN BOT (NO DELAY)
            if (executor.bot) {
                console.log(`💀 ${executor.tag} **INSTANTLY BANNED** for ${action}`);
                await member.ban({ reason: `🚨 Auto-Ban: Malicious bot detected (${action})` }).catch(() => {});
                return;
            }

        } catch (error) {
            console.error(`❌ Error handling ${packet.t}:`, error);
        }
    });

    function mapAuditType(actionType) {
        return {
            CHANNEL_CREATE: 10,
            CHANNEL_DELETE: 12,
            ROLE_CREATE: 30,
            ROLE_DELETE: 32,
        }[actionType];
    }
};

module.exports = antiNuke;
