import { Client, GuildMember, Role } from "discord.js"
import { MERC_USER_ID, MIN_LINEUP_SIZE_FOR_RANKED } from "../constants"
import { IStats, ITeam, Stats, Team } from "../mongoSchema"
import { handle } from "../utils"
import { RankedStats, ROLE_ATTACKER, ROLE_DEFENDER, ROLE_GOAL_KEEPER, ROLE_MIDFIELDER, ROLE_MIX_CAPTAINS, TEAM_REGION_EU } from "./teamService"

class StatsService {
    getLevelEmojiFromMember(member: GuildMember): string {
        if (member.roles.cache.some((role: Role) => role.id === process.env.PSO_EU_DISCORD_VETERAN_ROLE_ID)) {
            return '🔴 '
        }
        if (member.roles.cache.some((role: Role) => role.id === process.env.PSO_EU_DISCORD_SENIOR_ROLE_ID)) {
            return '🟣 '
        }
        if (member.roles.cache.some((role: Role) => role.id === process.env.PSO_EU_DISCORD_REGULAR_ROLE_ID)) {
            return '🟠 '
        }
        if (member.roles.cache.some((role: Role) => role.id === process.env.PSO_EU_DISCORD_CASUAL_ROLE_ID)) {
            return '🟡 '
        }

        return ''
    }

    async countNumberOfPlayers(region?: string): Promise<number> {
        return (await Stats.distinct('userId', region ? { region } : {})).length
    }

    async countNumberOfTeams(region?: string): Promise<number> {
        return (await Team.count(region ? { region, verified: true } : { verified: true }))
    }

    async findPlayersStats(page: number, pageSize: number, region?: string): Promise<IStats[]> {
        let match: any = {}
        if (region) {
            match.region = region;
        }
        const pipeline = <any>[
            { $match: match },
            {
                $group: {
                    _id: '$userId',
                    numberOfRankedGames: {
                        $sum: '$numberOfRankedGames'
                    },
                    numberOfGames: {
                        $sum: '$numberOfGames'
                    },
                    numberOfRankedWins: {
                        $sum: '$numberOfRankedWins'
                    },
                    numberOfRankedDraws: {
                        $sum: '$numberOfRankedDraws'
                    },
                    numberOfRankedLosses: {
                        $sum: '$numberOfRankedLosses'
                    },
                    attackRating: {
                        $avg: '$attackRating'
                    },
                    midfieldRating: {
                        $avg: '$midfieldRating'
                    },
                    defenseRating: {
                        $avg: '$defenseRating'
                    },
                    goalKeeperRating: {
                        $avg: '$goalKeeperRating'
                    },
                    mixCaptainsRating: {
                        $avg: '$mixCaptainsRating'
                    }
                }
            },
            {
                $project: {
                    numberOfRankedGames: 1,
                    numberOfGames: 1,
                    numberOfRankedWins: 1,
                    numberOfRankedDraws: 1,
                    numberOfRankedLosses: 1,
                    rating: {
                        $avg: [
                            "$attackRating",
                            "$midfieldRating",
                            "$defenseRating",
                            "$goalKeeperRating",
                            "$mixCaptainsRating"
                        ]
                    }
                }
            },
            {
                $sort: { 'rating': -1 }
            },
            {
                $skip: page * pageSize
            },
            {
                $limit: pageSize
            }
        ]

        return Stats.aggregate(pipeline)
    }

    async updateStats(client: Client, region: string, lineupSize: number, userIds: string[]): Promise<void> {
        const nonMercUserIds = userIds.filter(userId => userId !== MERC_USER_ID)
        if (nonMercUserIds.length === 0) {
            return
        }

        const bulks = nonMercUserIds.map(userId => ({
            updateOne: {
                filter: {
                    region,
                    userId
                },
                update: {
                    $inc: {
                        numberOfGames: 1,
                        numberOfRankedGames: lineupSize >= MIN_LINEUP_SIZE_FOR_RANKED ? 1 : 0
                    },
                    $setOnInsert: {
                        userId,
                        region
                    },
                },
                upsert: true
            }
        }))
        await Stats.bulkWrite(bulks)

        if (region === TEAM_REGION_EU && lineupSize >= MIN_LINEUP_SIZE_FOR_RANKED) {
            const psoEuGuild = await client.guilds.fetch(process.env.PSO_EU_DISCORD_GUILD_ID as string)
            const usersStats = await this.findUsersStats(nonMercUserIds, region)

            await Promise.all(usersStats.map(async (userStats: IStats) => {
                const levelingRoleId = this.getLevelingRoleIdFromStats(userStats)
                const [member] = await handle(psoEuGuild.members.fetch(userStats._id.toString()))
                if (member instanceof GuildMember) {
                    await handle(member.roles.add(levelingRoleId))
                    if (levelingRoleId === process.env.PSO_EU_DISCORD_REGULAR_ROLE_ID) {
                        await handle(member.roles.remove(process.env.PSO_EU_DISCORD_CASUAL_ROLE_ID as string))
                    } else if (levelingRoleId === process.env.PSO_EU_DISCORD_SENIOR_ROLE_ID) {
                        await handle(member.roles.remove(process.env.PSO_EU_DISCORD_REGULAR_ROLE_ID as string))
                    } else if (levelingRoleId === process.env.PSO_EU_DISCORD_VETERAN_ROLE_ID) {
                        await handle(member.roles.remove(process.env.PSO_EU_DISCORD_SENIOR_ROLE_ID as string))
                    }
                }
            }))
        }
    }

    async findUsersStats(userIds: string[], region?: string): Promise<IStats[]> {
        let match: any = { userId: { $in: userIds } }
        if (region) {
            match.region = region;
        }

        return Stats.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: '$userId',
                    numberOfGames: {
                        $sum: '$numberOfGames',
                    },
                    numberOfRankedGames: {
                        $sum: '$numberOfRankedGames',
                    },
                    numberOfRankedWins: {
                        $sum: '$numberOfRankedWins'
                    },
                    numberOfRankedDraws: {
                        $sum: '$numberOfRankedDraws'
                    },
                    numberOfRankedLosses: {
                        $sum: '$numberOfRankedLosses'
                    },
                    attackRating: {
                        $avg: '$attackRating'
                    },
                    midfieldRating: {
                        $avg: '$midfieldRating'
                    },
                    defenseRating: {
                        $avg: '$defenseRating'
                    },
                    goalKeeperRating: {
                        $avg: '$goalKeeperRating'
                    },
                    mixCaptainsRating: {
                        $avg: '$mixCaptainsRating'
                    }
                }
            }
        ])
    }

    async findUserStats(userId: string, region: string): Promise<IStats | null> {
        return Stats.findOne({ userId, region })
    }

    async updatePlayerRating(userId: string, region: string, newRating: RankedStats): Promise<IStats | null> {
        let ratingField
        switch (newRating.role.type) {
            case ROLE_ATTACKER:
                ratingField = 'attackRating'
                break
            case ROLE_DEFENDER:
                ratingField = 'defenseRating'
                break
            case ROLE_MIDFIELDER:
                ratingField = 'midfieldRating'
                break
            case ROLE_GOAL_KEEPER:
                ratingField = 'goalKeeperRating'
                break
            case ROLE_MIX_CAPTAINS:
                ratingField = 'mixCaptainsRating'
                break
        }
        return Stats.findOneAndUpdate(
            { userId, region },
            {
                $set: {
                    numberOfRankedWins: newRating.wins,
                    numberOfRankedDraws: newRating.draws,
                    numberOfRankedLosses: newRating.losses,
                    [`${ratingField}`]: newRating.rating
                }
            },
            { upsert: true }
        )
    }

    async findTeamsStats(page: number, pageSize: number, region?: string): Promise<ITeam[] | null> {
        let match: any = { verified: true }
        if (region) {
            match.region = region;
        }

        return Team.aggregate([
            { $match: match },
            { $sort: { 'rating': -1 }, },
            { $skip: page * pageSize },
            { $limit: pageSize }
        ])
    }

    private getLevelingRoleIdFromStats(userStats: IStats): string {
        if (userStats.numberOfRankedGames >= 800) {
            return process.env.PSO_EU_DISCORD_VETERAN_ROLE_ID as string
        }
        if (userStats.numberOfRankedGames >= 250) {
            return process.env.PSO_EU_DISCORD_SENIOR_ROLE_ID as string
        }
        if (userStats.numberOfRankedGames >= 25) {
            return process.env.PSO_EU_DISCORD_REGULAR_ROLE_ID as string
        }

        return process.env.PSO_EU_DISCORD_CASUAL_ROLE_ID as string
    }
}

export const statsService = new StatsService()