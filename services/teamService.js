const { Team } = require("../mongoSchema")

exports.deleteLineup = async (guildId, channelId) => {
    await Team.updateOne({ guildId }, { $pull: { 'lineups': { channelId }}})
}

exports.deleteTeam = async (guildId) => {
    await Team.deleteOne({ guildId })
}