import {CLI} from 'clime';
import { Client } from '@typeit/discord';
import { Message, MessageEmbed } from 'discord.js';

export class DiscordShim {
    constructor(public cli: CLI, public client: Client, public message: Message) {}

    async execute(args:string): Promise<any> {
        try {
            var argArr = args.match(/\w+|"(?:\\"|[^"])+"/g);
            console.log (argArr);
            if (!argArr){
                argArr = [];
            }

            return await this.cli.execute(argArr);
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
