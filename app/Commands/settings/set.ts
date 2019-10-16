import {Command, command, param, params, metadata, Options, option} from 'clime';
import { MessageEmbed } from 'discord.js';
import { MSSqlRepository } from '../../Services/mssql-repository';
import { Cipher } from 'crypto';
import { DiscordCommandContext } from '../../Services/discord-command-context';
import { SettingsOptions } from './default';
import { SecurityLevel } from '../../Services/discord-cli';
import { RealmSettings } from '../../Models/realm-settings';

export const brief = 'Update setting';
export const description =
  'Use this subcommand to update a setting';

export const minimumSecurityLevel = SecurityLevel.Admin;

@command()
export default class extends Command { 
  async execute(
    @param({
        type: String,
        description: 'The setting to update',
        required: true
      })
      key: string,
      @param({
        type: String,
        description: 'New value, use quotes for multi-word strings',
        required: true
      })
      value: string,
      @param({
        type: String,
        description: 'Realm name',
        required: false
      })
      realmName: string,
      options:SettingsOptions,
      context:DiscordCommandContext
  ) {
    var embed = new MessageEmbed()
    embed.title = "Settings";
    
    var repo = new MSSqlRepository();
    
    if (context.message.guild) { 
      if (!realmName && !RealmSettings.keyIsServerLevel(key)) {
        // Some settings needs to have a realmName of '', but
        // anything else would get the default realm when not specified.
        // The repo fetches from the database if necessary, but since
        // we have already fetched it once (and that setting is server 
        // wide), we should re-use it here to prevent more db calls.
        realmName = context.realmSettings.defaultRealmName;
      }

      await repo.setRealmSettings(context.message.guild.id, key, value, realmName, options.playerId);
      embed.description = "Success!"
    }

    return embed;
  }
}