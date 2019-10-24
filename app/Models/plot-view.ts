export class PlotView {
    items:PlotViewItem[] = [];
}

export class PlotViewItem {
    centerX:number;
    centerY:number;
    notes?:string;
    length:number;
    shape:string;
    ownerId?:string;
    id?:number;
    realmName?:string;
    discordServerId?:string;

    constructor (centerX:number, centerY:number, notes:string, length:number, shape:string, ownerId?:string,id?:number,
        discordServerId?:string, realmName?:string){
        this.centerX = centerX;
        this.centerY = centerY;
        this.notes = notes;
        this.length = length;
        this.shape = shape;
        this.ownerId = ownerId;
        this.id = id;
        this.discordServerId = discordServerId;
        this.realmName = realmName;
    }
}