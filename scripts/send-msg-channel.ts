import { Client, EmbedBuilder, GatewayIntentBits, TextChannel } from "discord.js";

const dotenv = require('dotenv');
dotenv.config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
})

async function sendMessage() {
    await client.login(process.env.TOKEN)
    const channel = await client.channels.fetch('917826929678250067') as TextChannel
    const titleEmbed = new EmbedBuilder()
        .setColor('#566573')
        .setTitle(`What is PSO Matchmaker ?`)
        .setTimestamp()
        .setDescription(`**PSO (Pro Soccer Online) Matchmaker** is a discord bot that is here to help you create your own **team** with your friends and challenge other **teams**. 
            Each **Team** can be a *competitive* team (with members that wish to compete in tournaments for example), or a *mix* team (with any PSO player mixed all together, like the :flag_eu: PSO EU team)`)

    const setupEmbed = new EmbedBuilder()
        .setColor('#566573')
        .setTitle(`How to configure the bot ?`)
        .setTimestamp()
        .addFields([
            { name: '1) Invite the bot on your discord', value: 'Click on the following link to invite the bot on your discord server: https://discord.com/api/oauth2/authorize?client_id=914818953707151420&permissions=2416077824&scope=bot%20applications.commands' },
            { name: '2) Create your team', value: 'Use the **/team_create** command anywhere on your discord server to create your team. Make sure you select the correct region.' },
            {
                name: '3) Create lineups',
                value: `
                            On any channel in you discord server, use one of the following command to configure a lineup and get ready to play and face other teams
                            **/lineup_create**: If you want to challenge other teams and mix
                            **/lineup_create_mix**: If you want to play with your community only (not facing any team or mix)
                            **/lineup_create_solo_queue**: Similar to **/lineup_create_mix**, but more anonymous. Players can't see who is signed in which position, and when the match starts, teams are shuffled based on each player rating
                            **/lineup_create_captains**: If you want a Pick Up Game (PUG) with snake draft
                            `
            },
            {
                name: '4) Command Permissions',
                value: `
                            The following commands require users to either be the server administrator or to have a role name '**PSO MM ADMIN**'
                            - **/team_create**
                            - **/team_manage**
                            - **/team_region**
                            - **/team_delete**
                            - **/teams**
                            - **/lineup_create**
                            - **/lineup_create_mix**
                            - **/lineup_create_solo_queue**
                            - **/lineup_create_captains**
                            - **/lineup_delete**
                            - **/match_manage**
                            - **/ban**
                            - **/unban**
                            - **/bans**
                            - **/account_info**
                            `
            },
            {
                name: '5) Official regional command permissions',
                value: `
                            The following commands can only be used on official regional discords. 
                            - **/team_manage** with the *team_id* optional parameter
                            - **/teams**
                            - **/lineup_create_mix** with the *ranked* optional paramter set to **true**
                            - **/lineup_create_solo_queue** with the *ranked* optional paramter set to **true**
                            - **/lineup_create_captains** with the *ranked* optional paramter set to **true**
                            - **/match_manage**
                            - **/account_info**
                            `
            }
        ])

    const matchmakingEmbed = new EmbedBuilder()
        .setColor('#566573')
        .setTitle(`How to use the matchmaking ?`)
        .setTimestamp()
        .addFields(
            [
                { name: 'Want to see the teams that are looking for a match ?', value: 'Use the **/challenges** command.' },
                { name: 'Want other teams to be aware that you are looking for a match ?', value: 'Use the **/search** command.' },
                { name: 'Want to hide your team from other teams ?', value: 'Use the **/stop_search** command.' },
                { name: 'Want to sign in your lineup or see its status ?', value: 'Use the **/status** command.' }
            ]
        )

    const otherEmbed = new EmbedBuilder()
        .setColor('#566573')
        .setTitle(`Other`)
        .setTimestamp()
        .addFields([{ name: 'Want to report a bug or suggest a feature ?', value: 'Send a direct message to grass#6639' }])

    await channel!.send({ embeds: [titleEmbed, setupEmbed, matchmakingEmbed, otherEmbed] })
}

sendMessage().finally(async () => {
    console.log("Message sent")
    client.destroy()
    process.exit()
})

