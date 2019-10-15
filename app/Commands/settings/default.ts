import {Command, command, param, params, metadata} from 'clime';
import { MessageEmbed } from 'discord.js';
import { MSSqlRepository } from '../../Services/mssql-repository';
import { Cipher } from 'crypto';

export const brief = 'Manage settings';
export const description =
  'This is a set of commands relating to the management of realm settings';

@command()
export default class extends Command { 
  async execute(
    @param({
      type: String,
      description: 'The setting to look up',
      required: false
    })
    key: string
  ) {
    var embed = new MessageEmbed()
    embed.title = "Settings";
    
    var repo = new MSSqlRepository();
    var settings = await repo.getRealmSettings(0)

    if (key) {
      embed.fields.push({name:key,value:settings[key]});
    } else {
      Object.keys(settings).forEach(property => {
        embed.fields.push({name:property,value:settings[property]});
      });
    }

    return embed;
  }
}