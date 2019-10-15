import AppConfig from '../config.json'

export class ConfigHelper
{
    public DiscordToken:string;
    public DatabaseSettings:DatabaseSettings;

    constructor ()
    {
        this.DiscordToken = (<any> AppConfig).DiscordToken;
        this.DatabaseSettings = new DatabaseSettings();
    }
}

export class DatabaseSettings {
    public Server:string;
    public Database:string;
    public Port:number;
    public UserName:string;
    public Password:string;
    
    constructor () {
        this.Server = (<any> AppConfig).DatabaseSettings.Server
        this.Database = (<any> AppConfig).DatabaseSettings.Database
        this.Port = (<any> AppConfig).DatabaseSettings.Port
        this.UserName = (<any> AppConfig).DatabaseSettings.UserName
        this.Password = (<any> AppConfig).DatabaseSettings.Password
    }
}