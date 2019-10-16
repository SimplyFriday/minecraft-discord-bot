import {CLI, ContextOptions} from 'clime';
import { Client } from '@typeit/discord';
import { Message, MessageEmbed } from 'discord.js';
import { DiscordCommandContext } from './discord-command-context';

export class DiscordShim {
    constructor(public cli: CLI, public client: Client, public message: Message) {}

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

            var context = new DiscordCommandContext(options, {message:this.message, client:this.client} )

            return await this.cli.execute(argArr, context);
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
