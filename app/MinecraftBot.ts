import { Discord, On, Client } from "@typeit/discord";
import * as Path from 'path';
import { CLI, Shim } from 'clime';
import { Message, MessageEmbed } from 'discord.js';
import { DiscordShim } from './Services/discord-shim.js';
import { ConfigHelper } from './Services/config-helper.js';

const ValidCommands = ['plot', 'settings'];
const __Prefix: string = '%';

@Discord
export abstract class MinecraftBot {
    private static _client: Client;

    static start() {
        console.log("Starting Minecraft Helper bot with prefix '" + __Prefix + "'...");
        this._client = new Client();
        var ch = new ConfigHelper();

        this._client.login( ch.DiscordToken );
        
        this.populateServices();
    }
    
    static populateServices() {
    }


    @On("message")
    private async onMessage(message: Message) {
        console.log(message.content);
        
        if (MinecraftBot._client.user &&
                message.author &&
                MinecraftBot._client.user.id !== message.author.id) {

            if (message.content.startsWith(__Prefix) && !message.author.bot) {
                var cmd = message.content.replace(__Prefix, "").toLowerCase().trim();
                var ioFirstSpace = cmd.indexOf(" ");
                var baseCmd = "";

                if (ioFirstSpace === -1){
                    baseCmd = cmd;
                    cmd = "";   
                } else{
                    baseCmd = cmd.substr(0, ioFirstSpace);
                    cmd = cmd.substr(ioFirstSpace + 1);
                }

                console.log("baseCmd='" + baseCmd + "'")

                if (ValidCommands.includes(baseCmd)) {
                    try {
                        
                        var cmdDir = Path.join(__dirname, 'commands', baseCmd);
                        let cli = new CLI(baseCmd, cmdDir);

                        let shim = new DiscordShim(cli, MinecraftBot._client,message);
                        let embed = await shim.execute(cmd);

                        if (embed.text) {
                            message.channel.send(embed.text);
                        } else {
                            message.channel.send(embed);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
    }
}
    
MinecraftBot.start();