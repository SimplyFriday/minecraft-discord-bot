import { CLI, Command, ExpectedError } from 'clime';
import { DiscordCommandContext } from './discord-command-context';

// This class really only exists to inject the security stuff
export class DiscordCli extends CLI {
    public async executeWithSecurity (argv: string[], contextExtension:DiscordCommandContext, cwd?: string | undefined): Promise<any> {
        if (contextExtension instanceof DiscordCommandContext) {
            var shouldRun:boolean = false;
            
            if (!contextExtension.realmSettings.serverIsConfigured) {
                shouldRun = true;
            }

            var {
                module
            } = await (<any>this).preProcessArguments(argv);
            
            if (module && !shouldRun) {
                var targetCommand = module.default;
                var secLvl:SecurityLevel = SecurityLevel.Everyone;

                if (targetCommand && targetCommand.prototype instanceof Command) {
                    if (contextExtension.message.member) {

                        contextExtension.message.member.roles.forEach (role => {
                            if (role.name.toLowerCase() === contextExtension.realmSettings.serverAdminRoleName.toLowerCase()) {
                                secLvl = SecurityLevel.Admin
                            } else if (role.name.toLowerCase() === contextExtension.realmSettings.serverModeratorRoleName.toLowerCase() 
                                       && secLvl < SecurityLevel.Admin) {
                                secLvl = SecurityLevel.Moderator;
                            }                            
                        });

                        let reqLvl = module.minimumSecurityLevel | 0;

                        if ( reqLvl <= secLvl) {
                            shouldRun = true;
                        }
                    }
                }
            }

            if (shouldRun) {
                return await super.execute(argv,contextExtension, cwd);
            } else {
                throw new ExpectedError ("You do not have permission to run this command");
            }

        } else {
            throw new Error ("executeWithSecurity must be called using a DiscordCommandContext object");
        }
    }
}

export enum SecurityLevel {
    Everyone = 0,
    Moderator = 1,
    Admin = 2
}