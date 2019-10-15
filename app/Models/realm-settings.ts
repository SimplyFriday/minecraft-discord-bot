export class RealmSettings {
    maximumPlayerPlots:number = 1;
    realmModeratorRoleName:string = "Moderator";
    realmAdminRoleName:string = "Admin";
    realmIsConfigured:boolean = false;
    
    // These entries should only ever exist once per discord server,
    // more than that will break other logic (enforced in repo);
    defaultRealmName:string = "MyRealm";
}