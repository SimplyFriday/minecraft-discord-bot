import {Command, command, param, params} from 'clime';
import { MessageEmbed } from 'discord.js';
import { SecurityLevel } from '../../Services/discord-cli';

export const brief = 'List Plots';
export const description =
  'List all plots for the specified user.';

export const minimumSecurityLevel = SecurityLevel.Everyone;

@command()
export default class extends Command {
  async execute(
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