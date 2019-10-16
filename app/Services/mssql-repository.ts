import { RealmSettings } from '../Models/realm-settings';
import {ConnectionPool, Request, IResult, config, BigInt, ISqlType, NVarChar, VarChar} from "mssql";
import { ConfigHelper } from './config-helper';
import { error } from 'console';
import { ExpectedError } from 'clime';
export class MSSqlRepository
{   
    private configHelper:ConfigHelper;

    constructor ()
    {
        this.configHelper = new ConfigHelper();
    }

    public async getRealmSettings (discordServerId:string, realmName?:string, playerId?:string):Promise<RealmSettings> {
        var settings = new RealmSettings;

        var result = 
            await this.executeStoredProcedure("dbo.GetRealmSettings",
                ["DiscordServerId", VarChar,discordServerId]);

        if (result.recordset) {            
            var serverResults = 
                result.recordset.filter ((record) => {
                    return record.RealmName === "";
                });
            
            // If no realm name was passed in, we're trying to fetch the default.
            if (!realmName) {
                var realmNameRecord = serverResults.filter ((record) => {
                    return record.Key === "defaultRealmName";
                });

                if (realmNameRecord.length > 0) {
                    realmName = realmNameRecord[0].Value
                }

                if (!realmName) {
                    realmName = settings.defaultRealmName;
                }
            }

            var realmResults = 
                result.recordset.filter ((record) => {
                    return record.RealmName === realmName && !record.PlayerId;
                });
            
            var playerResults;
                
            if (playerId) {
                playerResults = 
                    result.recordset.filter ((record) => {
                        return record.RealmName === realmName && record.PlayerId === playerId;
                    });
            }

            serverResults.forEach(item => {
                if (settings[item.Key]){
                    settings[item.Key] = item.Value;
                }
            });

            realmResults.forEach(item => {
                if (settings[item.Key]){
                    settings[item.Key] = item.Value;
                }
            });

            if (playerId) {
                playerResults.forEach(item => {
                    if (settings[item.Key]){
                        settings[item.Key] = item.Value;
                    }
                });
            }
        }

        return settings;
    }

    public async setRealmSettings(discordServerId:string, key:string, value:string, realmName?:string, playerId?:string) {
        var dummySettings:RealmSettings = new RealmSettings
        
        if (!dummySettings[key]) {
            throw new ExpectedError ('"' + key + '" is not a valid key. All keys are case sensitive!');
        }
        
        if (!realmName) {
            if (key === 'defaultRealmName') {
                realmName = '';
            } else {
                var settings = await this.getRealmSettings(discordServerId);
                realmName = settings.defaultRealmName;
            }
        }
        
        var result = 
            await this.executeStoredProcedure ("dbo.SetRealmSetting",
                ["DiscordServerId", VarChar, discordServerId],
                ["RealmName", NVarChar, realmName],
                ["Key", VarChar, key],
                ["Value", NVarChar, value],
                ["PlayerId", VarChar, playerId]);
    } 

    private async executeStoredProcedure(sprocName:string, ...args:[string,ISqlType | (() => ISqlType),any][]):Promise<any> {
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
                request = request.input(element[0], element[1], element[2]);
            });

            result = await request.execute(sprocName);
            console.log(result);

            return result; 
        } catch (ex) {
            console.error(ex);

            throw new error ("Something went quite wrong!")
        }
    }
}