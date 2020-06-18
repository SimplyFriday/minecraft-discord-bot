import { RealmSettings } from '../Models/realm-settings';
import {ConnectionPool, Request, IResult, config, BigInt, ISqlType, NVarChar, VarChar, Int} from "mssql";
import { ConfigHelper } from './config-helper';
import { error } from 'console';
import { ExpectedError } from 'clime';
import { PlotViewItem, PlotView } from '../Models/plot-view';
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
                if (settings.hasOwnProperty(item.Key)){
                    settings[item.Key] = item.Value;
                }
            });

            realmResults.forEach(item => {
                if (settings.hasOwnProperty(item.Key)){
                    settings[item.Key] = item.Value;
                }
            });

            if (playerId) {
                playerResults.forEach(item => {
                    if (settings.hasOwnProperty(item.Key)){
                        settings[item.Key] = item.Value;
                    }
                });
            }
        }

        return settings;
    }

    public async setRealmSettings(discordServerId:string, key:string, value:string, realmName?:string, PlayerId?:string) {
        var dummySettings:RealmSettings = new RealmSettings
        
        if (!dummySettings.hasOwnProperty(key)) {
            throw new ExpectedError ('"' + key + '" is not a valid key. All keys are case sensitive!');
        }
        
        if (!realmName) {
            if (RealmSettings.keyIsServerLevel(key)) {
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
                ["PlayerId", VarChar, PlayerId]);
    } 

    public async getPlotsByOwnerAndRealm ( discordServerId:string, 
                                           realmName:string, 
                                           ownerId:string ):Promise<PlotView> {
        var plotView = new PlotView();

        var result = 
            await this.executeStoredProcedure("dbo.GetPlotsByOwnerAndRealm",
                ["DiscordServerId", VarChar,discordServerId],
                ["RealmName", NVarChar,realmName],
                ["OwnerId", NVarChar,ownerId]);

        if (result.recordset) {       
            result.recordset.forEach(row => {
                var item = new PlotViewItem(row.CenterX, 
                                            row.CenterY, 
                                            row.Notes, 
                                            row.Length, 
                                            row.Shape, 
                                            row.Dimension, 
                                            undefined, 
                                            row.Id);

                plotView.items.push (item);
            });
        }

        return plotView;
    }

    public async getPlotsRealmAndCoordinates( discordServerId: string, 
                                              realmName: string, 
                                              xCoord:number, 
                                              yCoord:number, 
                                              radius:number,
                                              dimension:string ): Promise<PlotView> {
        var plotView = new PlotView();

        var result = 
            await this.executeStoredProcedure("dbo.GetPlotsByRealmAndCoordinates",
                ["DiscordServerId", VarChar,discordServerId],
                ["RealmName", NVarChar,realmName],
                ["XCoordinate", BigInt,xCoord],
                ["YCoordinate", BigInt,yCoord],
                ["Radius", Int,radius],
                ["Dimension", VarChar, dimension]);

        if (result.recordset) {       
            result.recordset.forEach(row => {
                var item = new PlotViewItem( row.CenterX, 
                                             row.CenterY, 
                                             row.Notes, 
                                             row.Length, 
                                             row.Shape,
                                             row.Dimension, 
                                             row.OwnerId);
                plotView.items.push (item);
            });
        }

        return plotView;
    }   

    public async checkForPlotIntersect( discordServerId:string, 
                                        realmName:string, 
                                        shape:string, 
                                        centerX:number, 
                                        centerY:number, 
                                        size:number,
                                        dimension:string ):Promise<boolean> 
    {
        if (shape.toLowerCase() === 'circle') {
            var result = 
                await this.executeStoredProcedure ("dbo.CheckForCirclePlotIntersect",
                    ["DiscordServerId", VarChar, discordServerId],
                    ["RealmName", NVarChar, realmName],
                    ["Size", NVarChar, size],
                    ["CenterX", BigInt, centerX],
                    ["CenterY", BigInt, centerY],
                    ["Dimension", VarChar, dimension]);

            return result.recordset.length != 0;
        } else if (shape.toLowerCase() === 'square') {
            var result = 
            await this.executeStoredProcedure ("dbo.CheckForSquarePlotIntersect",
                ["DiscordServerId", VarChar, discordServerId],
                ["RealmName", NVarChar, realmName],
                ["Size", NVarChar, size],
                ["CenterX", BigInt, centerX],
                ["CenterY", BigInt, centerY],
                ["Dimension", VarChar, dimension]);
                
            return result.recordset.length != 0;
        } else {
            throw new Error ("Shape not yet supported");
        }
    }

    public async insertPlot ( discordServerId:string, 
                              realmName:string, 
                              ownerId:string, 
                              centerX:number, 
                              centerY:number, 
                              shape:string, 
                              size:number, 
                              dimension:string,
                              notes?:string) 
    {
        if (shape.toLowerCase() === 'circle') {
            var result = 
                await this.executeStoredProcedure ("dbo.InsertCirclePlot",
                    ["DiscordServerId", VarChar, discordServerId],
                    ["RealmName", NVarChar, realmName],
                    ["Notes", NVarChar, notes],
                    ["Radius", NVarChar, size],
                    ["OwnerId", NVarChar, ownerId],
                    ["Dimension", VarChar, dimension],
                    ["CenterX", BigInt, centerX],
                    ["CenterY", BigInt, centerY]);
        } else if (shape.toLowerCase() === 'square') {
            var result = 
                await this.executeStoredProcedure ("dbo.InsertSquarePlot",
                    ["DiscordServerId", VarChar, discordServerId],
                    ["RealmName", NVarChar, realmName],
                    ["Notes", NVarChar, notes],
                    ["SideLength", NVarChar, size],
                    ["OwnerId", NVarChar, ownerId],
                    ["Dimension", VarChar, dimension],
                    ["CenterX", BigInt, centerX],
                    ["CenterY", BigInt, centerY]);
        } else {
            throw new Error ("Shape not yet supported");
        }
    }

    public async deletePlotById(discordServerId:string, realmName:string, id:number) {
        var plot = await this.getPlotById(id);
        
        if (plot){
            if (plot.realmName != realmName || plot.discordServerId != discordServerId) {
                throw new ExpectedError("You do not have permission to delete this plot.");
            }

            var result = 
                await this.executeStoredProcedure ("dbo.DeletePlotById",
                    ["PlotId", Int, id]);
        }
    }
    
    public async getPlotById(id: number):Promise<PlotViewItem> {
        var result =  await this.executeStoredProcedure ("dbo.GetPlotById",
                ["PlotId", Int, id]);
            
        var item:PlotViewItem | undefined = undefined;

        result.recordset.forEach(row => {
            item = new PlotViewItem(row.CenterX, 
                                    row.CenterY, 
                                    row.Notes, 
                                    row.Length, 
                                    row.Shape, 
                                    row.Dimension, 
                                    row.Id,
                                    row.DiscordServerId, 
                                    row.RealmName);
            return;
        });

        if (item) {
            return item;
        }

        throw new ExpectedError('The provided Id was not found.');
    }

    public async GetPlotsByRealm (discordServerId:string, realmName:string):Promise<PlotView> {
        var result =  await this.executeStoredProcedure ("dbo.GetPlotsByRealm",
                ["DiscordServerId", VarChar, discordServerId],
                ["RealmName", NVarChar, realmName]);
        
        var plotView = new PlotView();

        result.recordset.forEach(row => {
            var item = new PlotViewItem( row.CenterX, 
                                         row.CenterY, 
                                         row.Notes, 
                                         row.Length, 
                                         row.Shape, 
                                         row.Dimension,
                                         row.OwnerId, 
                                         row.Id,
                                         row.DiscordServerId, 
                                         row.RealmName);
            
            plotView.items.push(item);
        });

        return plotView;
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