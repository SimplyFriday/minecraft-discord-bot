import { Discord, On, Client } from "@typeit/discord";
import * as Path from 'path';
import { CLI, Shim } from 'clime';
import { Message, MessageEmbed } from 'discord.js';
import { DiscordShim } from './Services/discord-shim.js';
import { ConfigHelper } from './Services/config-helper.js';
import { DiscordCli } from './Services/discord-cli.js';

const ValidCommands = ['help', 'plot', 'settings'];
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
                var cmd = message.content.replace(__Prefix, "").trim();
                var ioFirstSpace = cmd.indexOf(" ");
                var baseCmd = "";

                if (ioFirstSpace === -1){
                    baseCmd = cmd.toLowerCase();
                    cmd = "";   
                } else{
                    baseCmd = cmd.substr(0, ioFirstSpace).toLowerCase();
                    cmd = cmd.substr(ioFirstSpace + 1);
                }

                console.log("baseCmd='" + baseCmd + "'")
                    
                if (baseCmd === 'help') {
                    var helpText = "```\nValid commands:\n\n";

                    ValidCommands.forEach(command => {
                        helpText = helpText + ' - ' + command +  '\n';
                    });

                    helpText = helpText + '\nAll commands accept the "--help" parameter, which will cause the command to print usage info.```\n'
                                        + 'For more info check out https://github.com/josh-greenlaw/minecraft-discord-bot!';

                    message.channel.send(helpText);
                } else  if (ValidCommands.includes(baseCmd)) {
                    try {
                        
                        var cmdDir = Path.join(__dirname, 'Commands', baseCmd);
                        let cli = new DiscordCli(baseCmd, cmdDir);

                        let shim = new DiscordShim(cli, MinecraftBot._client,message);
                        let result = await shim.execute(cmd);

                        if (result.text) {
                            message.channel.send("```\n" + result.text + "\n```");
                        } else {
                            if (result instanceof MessageEmbed) {
                                result.type = "rich";
                                // Footer is required because embeds on android are dumb (adding a long footer
                                // coerces a minimum width). 
                                // https://www.reddit.com/r/discordapp/comments/co8f2x/uh_any_way_to_fix_this_it_happens_using_any_form/
                                result.footer = {text:"Plot Bot | A helper for Realms with strict ownership"};
                            }

                            message.channel.send(result);
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