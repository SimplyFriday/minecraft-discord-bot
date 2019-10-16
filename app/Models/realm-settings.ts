export class RealmSettings {
    maximumPlayerPlots:number = 1;
    defaultPlotShape:string = "square";
    
    // These entries should only ever exist once per discord server,
    // more than that will break other logic (enforced in repo);
    defaultRealmName:string = "MyRealm";
    serverIsConfigured:boolean = false;
    serverModeratorRoleName:string = "Moderator";
    serverAdminRoleName:string = "Admin";

    static serverSettings:string[] = ['defaultRealmName','serverIsConfigured', 'serverModeratorRoleName', 'serverAdminRoleName'];

    static keyIsServerLevel(key: string):boolean {
        return RealmSettings.serverSettings.some(set => { 
            return set === key; 
        });
    }
}