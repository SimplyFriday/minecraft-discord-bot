import { Command, command, param } from 'clime';
import { MessageEmbed } from 'discord.js';
import { SecurityLevel } from '../../Services/security-service';
import { DiscordCommandContext } from '../../Services/discord-command-context';
import { MSSqlRepository } from '../../Services/mssql-repository';
import { PlotView, PlotViewItem } from '../../Models/plot-view';

export const brief = 'Search for Plots';
export const description =
    'Search for plots.';

export const minimumSecurityLevel = SecurityLevel.Player;

@command()
export default class extends Command {
    async execute(
        @param({
            type: Number,
            description: 'How far to look in meters',
            required: true
        })
        radius: number,
        @param({
            type: Number,
            description: 'The X coordinate of the center of the search area.',
            required: true
        })
        xcoord: number,
        @param({
            type: Number,
            description: 'The Z coordinate of the center of the search area.',
            required: true
        })
        zcoord: number,
        @param({
            type: String,
            description: 'The dimension to look in, (e=End, n=Nether, o=Overworld)',
            required: false
        })
        dimension: string,
        @param({
            type: Number,
            description: 'The realm to look in, if the name has spaces in it, then surround it with quotation marks (")',
            required: false
        })
        realm: string,
        context: DiscordCommandContext
    ) {
        var embed = new MessageEmbed()
        embed.title = "Plots";

        if (context.message.guild && context.message.member) {
            var plotView:PlotView;
            var repo = new MSSqlRepository();
            
            if (!realm){
                realm = context.realmSettings.defaultRealmName; 
            }

            switch (dimension) {
                case 'e':
                case 'E':
                case 'end':
                    dimension = 'End';
                    break;
                case 'o':
                case 'O':
                case 'overworld':
                    dimension = 'Overworld';
                    break;
                case 'n':
                case 'N':
                case 'nether':
                    dimension = 'Nether';
                    break;
                default:
                    dimension = 'Overworld';            
            }

            plotView = await repo.getPlotsRealmAndCoordinates (
                context.message.guild.id,
                realm,
                xcoord,
                zcoord,
                radius,
                dimension);
        
            if (plotView.items.length > 0){
                plotView.items.forEach(plot => {
                    var val = plot.getEmbedValue(context);
                    embed.fields.push({ name: "Plot Details", value: val,inline:false }); 
                });
            } else {
                embed.fields.push({ name: "Plot Details", value: "No claimed plots",inline:false }); 
            }
        } else {
            embed.fields.push({ name: "Error", value: "Somehow this message wasn't sent from a server or a person...",inline:false });
        }
        return embed;
    }
}