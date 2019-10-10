import {Command, command, param, params} from 'clime';
import { MessageEmbed } from 'discord.js';

export const brief = 'List Plots';
export const description =
  'List all plots for the specified user.';

@command()
export default class extends Command {
  execute(
    @param({
      type: String,
      description: 'X coord',
      required: true
    })
    xCoord: number,
    @param({
      type: String,
      description: 'Z coord',
      required: true
    })
    zCoord: number
  ) {
    var embed = new MessageEmbed()
    embed.title = "Claim Plot";
    embed.fields.push({name:"Coordinates",value:"X: " + xCoord + ", Z: " + zCoord});
    
    return embed;
  }
}