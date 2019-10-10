import {Command, command, param, params, metadata} from 'clime';
import { MessageEmbed } from 'discord.js';

export const brief = 'Plot tools';
export const description =
  'This is a set of commands relating to the management and lookup of plots. Calling without any arguments is the same as calling "plot list {currentUser}"';

@command()
export default class extends Command { 
  execute(
    @param({
      type: String,
      description: 'The user to look up',
      required: true
    })
    user: string
  ) {
    var embed = new MessageEmbed()
    embed.title = "Plot";
    embed.fields.push({name:"Player",value:"Sample data"});
    
    return embed;
  }
}