import {CLI, ContextOptions, ExpectedError} from 'clime';
import { Client, Message, MessageEmbed } from 'discord.js';
import { DiscordCommandContext } from './discord-command-context';
import { MSSqlRepository } from './mssql-repository';
import { RealmSettings } from '../Models/realm-settings';
import { DiscordCli } from './discord-cli';

export class DiscordShim {
    constructor(public cli: DiscordCli, public client: Client, public message: Message) {}

    async execute(args:string): Promise<any> {
        try {
            var argArr = args.match(/[a-zA-Z0-9_-]+|"(?:\\"|[^"])+"/g);
            console.log (argArr);
            
            if (!argArr){
                argArr = [];
            }

            for (let i = 0; i < argArr.length; i++) {
                if (argArr[i].startsWith('"') && argArr[i].endsWith('"')) {
                    argArr[i] = argArr[i].substr(1, argArr[i].length - 2);
                }                
            }

            var options:ContextOptions = {
                commands: argArr,
                cwd: ""
            };

            var repo = new MSSqlRepository();
            var settings: RealmSettings;

            if (this.message.guild)
            {
                settings = await repo.getRealmSettings (this.message.guild.id);
            } else {
                throw new Error("Huh, guild.id was missing. This shouldn't be possible, yet here we are.");
            }

            var context = new DiscordCommandContext(options, {message:this.message, client:this.client, realmSettings: settings} );

            return await this.cli.executeWithSecurity(argArr, context);
        } catch (error) {
            console.error(error);

            if(error.message){
                return error.message;
            }
        }

        var error = new MessageEmbed ()
        error.description = "An error occurred"
        error.title = "ERROR"

        return error;
    } 
}
