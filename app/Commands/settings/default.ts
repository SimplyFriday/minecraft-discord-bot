import { Command, command, param, params, metadata, option, Options } from 'clime';
import { MessageEmbed, TextChannel } from 'discord.js';
import { MSSqlRepository } from '../../Services/mssql-repository';
import { DiscordCommandContext } from '../../Services/discord-command-context';
import { RealmSettings } from '../../Models/realm-settings';
import { SecurityLevel } from '../../Services/security-service';

export const brief = 'Manage settings';
export const description =
    'This is a set of commands relating to the management of realm settings';

export const minimumSecurityLevel = SecurityLevel.Moderator;

export class SettingsOptions extends Options {
    @option({
        flag: 'p',
        description: 'Player specific override, use id directly or mention the player',
    })
    playerId?: string;
}

@command()
export default class extends Command {
    async execute(
        @param({
            type: String,
            description: 'The setting to look up',
            required: false
        })
        key: string,
        @param({
            type: String,
            description: 'OPTIONAL, the name of the Realm',
            required: false
        })
        realmName: string,
        options: SettingsOptions,
        context: DiscordCommandContext
    ) {
        var embed = new MessageEmbed()
        embed.title = "Settings";

        var repo = new MSSqlRepository();

        console.log(context);

        if (context.message && context.message.guild) {
            var settings: RealmSettings

            if (!realmName && !options.playerId) {
                settings = context.realmSettings;
            } else {
                settings = await repo.getRealmSettings(context.message.guild.id, realmName, options.playerId);
            }

            if (key) {
                embed.fields.push({ name: key, value: settings[key],inline:false });
            } else {
                Object.keys(settings).forEach(property => {
                    embed.fields.push({ name: property, value: settings[property],inline:false });
                });
            }
        }

        return embed;
    }
}