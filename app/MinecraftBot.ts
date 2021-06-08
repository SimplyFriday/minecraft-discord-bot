import * as Path from 'path';
import { CLI, Shim } from 'clime';
import { Message, MessageEmbed } from 'discord.js';
import { DiscordShim } from './Services/discord-shim.js';
import { ConfigHelper } from './Services/config-helper.js';
import { DiscordCli } from './Services/discord-cli.js';
import { Client, Discord, On } from '@typeit/discord';

const ValidCommands = ['help', 'plot', 'settings'];
const __Prefix: string = '%';

@Discord()
export abstract class MinecraftBot {
    private static _client: Client;

    static start() {
        console.log("Starting Minecraft Helper bot with prefix '" + __Prefix + "'...");
        this._client = new Client();
        var ch = new ConfigHelper();

        this.startLoginLoop(ch);
    }

    static startLoginLoop(ch: ConfigHelper) {
        try {
            this._client.login(ch.DiscordToken);
        } catch {
            console.log("Failed to log in");
            this.startLoginLoop(ch);
        }
    }

    @On("message")
    private async onMessage(messages: Message[]) {
        messages.forEach(async message => {
            if (MinecraftBot._client.user &&
                message.author &&
                MinecraftBot._client.user.id !== message.author.id) {

                if (message.content.startsWith(__Prefix) && !message.author.bot) {
                    var cmd = this.sanitizeInput(message.content);
                    var ioFirstSpace = cmd.indexOf(" ");
                    var baseCmd = "";

                    if (ioFirstSpace === -1) {
                        baseCmd = cmd.toLowerCase();
                        cmd = "";
                    } else {
                        baseCmd = cmd.substr(0, ioFirstSpace).toLowerCase();
                        cmd = cmd.substr(ioFirstSpace + 1);
                    }

                    console.log("baseCmd='" + baseCmd + "'")

                    try {
                        if (baseCmd === 'help') {
                            var helpText = "```\nValid commands:\n\n";

                            ValidCommands.forEach(command => {
                                helpText = helpText + ' - ' + command + '\n';
                            });

                            helpText = helpText + '\nAll commands accept the "--help" parameter, which will cause the command to print usage info.```\n'
                                + 'For more info check out https://github.com/josh-greenlaw/minecraft-discord-bot';

                            message.channel.send(helpText);
                        } else if (ValidCommands.includes(baseCmd)) {
                            var cmdDir = Path.join(__dirname, 'Commands', baseCmd);
                            let cli = new DiscordCli(baseCmd, cmdDir);

                            let shim = new DiscordShim(cli, MinecraftBot._client, message);
                            let result = await shim.execute(cmd);

                            if (result.text) {
                                // Remove all control characters
                                var cleanText = result.text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
                                message.channel.send("```\n" + cleanText + "\n```");
                            } else {
                                if (result instanceof MessageEmbed) {
                                    result.type = "rich";
                                    // Footer is required because embeds on android are dumb (adding a long footer
                                    // coerces a minimum width). 
                                    // https://www.reddit.com/r/discordapp/comments/co8f2x/uh_any_way_to_fix_this_it_happens_using_any_form/
                                    result.footer = { text: "Plot Bot | A helper for Realms with strict ownership" };
                                }

                                message.channel.send(result);
                            }
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        });
    }

    sanitizeInput(content: string): string {
        return content
            .replace(__Prefix, "")              // Remove prefix from command
            .replace(/[\u2018\u2019]/g, "'")    // Curly single quote to regular
            .replace(/[\u201C\u201D]/g, '"')    // Curly double quote to regular
            .trim()
    }
}

MinecraftBot.start();

