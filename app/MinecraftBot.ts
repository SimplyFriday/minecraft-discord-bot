import { Discord, On, Client } from "@typeit/discord";
import AppConfig from './config.json'
import * as Path from 'path';
import { CLI, Shim } from 'clime';
import { Message, MessageEmbed } from 'discord.js';
import { DiscordShim } from './Services/discord-shim.js';

const ValidCommands = ["plot"];
const __Prefix: string = '%';

@Discord
export abstract class MinecraftBot {
    private static _client: Client;

    static start() {
        console.log("Starting Minecraft Helper bot with prefix '" + __Prefix + "'...");
        this._client = new Client();
        this._client.login( (<any> AppConfig).DiscordToken );

        this.populateServices();
    }
    
    static populateServices() {
    }


    @On("message")
    private onMessage(message: Message) {
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
                        let embed = shim.execute(cmd.split(" "));

                        embed.then(val => {
                            if (val.text) {
                                message.channel.send(val.text);
                            } else {
                                message.channel.send(val);
                            }
                        }); 
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
    }
}
    
MinecraftBot.start();