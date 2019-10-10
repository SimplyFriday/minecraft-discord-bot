import {CLI, isPrintable, Context} from 'clime';
import { Client } from '@typeit/discord';
import { Message, MessageEmbed } from 'discord.js';
import through2 = require('through2');

export class DiscordShim {
    constructor(public cli: CLI, public client: Client, public message: Message) {}

    async execute(args:string[]): Promise<any> {
        try {
            return await this.cli.execute(args);
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
