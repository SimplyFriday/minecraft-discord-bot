import { Command, command, param, params } from 'clime';
import { MessageEmbed } from 'discord.js';
import { SecurityLevel, SecurityService } from '../../Services/security-service';
import { PlotClaimOptions } from './default';
import { DiscordCommandContext } from '../../Services/discord-command-context';
import { MSSqlRepository } from '../../Services/mssql-repository';

export const brief = 'Delete Plots';
export const description =
    'Delete a plot.';

export const minimumSecurityLevel = SecurityLevel.Moderator;

@command()
export default class extends Command {
    async execute(
        @param({
            type: String,
            description: 'Plot Id to delete (use %plot to get a list)',
            required: true
        })
        id: number,
        @param({
            type: String,
            description: 'Optional, Realm name',
            required: false
        })
        realmName: string,
        context:DiscordCommandContext
    ) {
        var embed = new MessageEmbed()
        embed.title = "Delete Plot";

        var repo = new MSSqlRepository();

        if (context.message.guild){
            if (!realmName) {
                realmName = context.realmSettings.defaultRealmName;
            }

            await repo.deletePlotById(context.message.guild.id, realmName, id);
            embed.fields.push({name:"Result",value:"Success!"});
        } else {
            throw new Error ("This wasn't sent from a server... ghosts maybe?");
        }
        
        return embed;
    }
}