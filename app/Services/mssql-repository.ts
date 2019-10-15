import { RealmSettings } from '../Models/realm-settings';
import {ConnectionPool, Request, IResult, config} from "mssql";
import { ConfigHelper } from './config-helper';
export class MSSqlRepository
{    
    private configHelper:ConfigHelper;

    constructor ()
    {
        this.configHelper = new ConfigHelper();
    }

    public async getRealmSettings (discordServerId:number, realmName?:string):Promise<RealmSettings> {
        var settings = new RealmSettings;

        var result = 
            await this.executeStoredProcedure("dbo.GetRealmSettings",
                ["DiscordServerId",discordServerId],
                ["RealmName",realmName]);

        if (result.recordset) {
            result.recordset .forEach(item => {
                if (settings[item.Key]){
                    settings[item.Key] = item.Value;
                }
            });
        }

        return settings;
    }

    private async executeStoredProcedure(sprocName:string, ...args:[string,any][]):Promise<any> {
        var config:config = {
            server: this.configHelper.DatabaseSettings.Server,
            database: this.configHelper.DatabaseSettings.Database,
            user: this.configHelper.DatabaseSettings.UserName,
            password: this.configHelper.DatabaseSettings.Password,
            port: this.configHelper.DatabaseSettings.Port
        };

        var pool = new ConnectionPool(config);
        var result: IResult<any>;

        try {
            await pool.connect();

            var request = new Request(pool);
            
            args.forEach(element => {
                request = request.input(element[0], element[1]);
            });

            result = await request.execute(sprocName);
            console.log(result);

            return result; 
        } catch (ex) {
            console.error(ex);
        }
    }
}