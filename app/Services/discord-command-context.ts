import { Context, ContextOptions } from 'clime';
import { Message } from 'discord.js';
import { Client } from '@typeit/discord';

export class DiscordCommandContext extends Context {
    public message?:Message;
    public client?:Client;

    constructor (options:ContextOptions, contextExtension:Object) {
        super(options);

        Object.assign(this, contextExtension);
    }
}