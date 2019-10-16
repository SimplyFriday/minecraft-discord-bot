import {Command, command, param, params, metadata} from 'clime';
import { MessageEmbed } from 'discord.js';
import { SecurityLevel } from '../../Services/discord-cli';

export const brief = 'Plot tools';
export const description =
  'This is a set of commands relating to the management and lookup of plots. Calling without any arguments will return your current plots';

export const minimumSecurityLevel = SecurityLevel.Everyone;

@command()
export default class extends Command { 
  async execute(
    @param({
      type: String,
      description: 'The user to look up',
      required: true
    })
    user: string
  ) {
    var embed = new MessageEmbed()
    embed.title = "Plot";
    embed.fields.push({name:"Player",value:"user: " + user});
    
    return embed;
  }
}