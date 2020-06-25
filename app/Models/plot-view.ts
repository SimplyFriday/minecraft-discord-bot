import { DiscordCommandContext } from '../Services/discord-command-context';

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
    dimension:string;
    coordinateDisplay?:string;

    constructor (centerX:number, centerY:number, notes:string, length:number, shape:string, dimension:string, ownerId?:string,id?:number,
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
        this.dimension = dimension;

        if (shape.toLowerCase() === "square") {
            var x1:number = +centerX - +length;
            var x2:number = +centerX + +length;
            var y1:number = +centerY - +length;
            var y2:number = +centerY + +length;

            this.coordinateDisplay = "" + x1 + ", " + y1 + " to " + x2 + ", " + y2;
        }
    }

    public getEmbedValue (context:DiscordCommandContext):string {
        var val = ""

        if (this.id) {
            val = val + "Id: " + this.id;
        }

        val = "Center: " + this.centerX + "," + this.centerY + "\nLength: " + this.length + "\nShape: " + this.shape;
        
        if (this.coordinateDisplay) {
            val = val + "\nCoord Range: " + this.coordinateDisplay
        }

        if (this.notes) {
            val = val + "\nNotes: " + this.notes;
        }

        if (this.ownerId) {
            var oIdNum = Number(this.ownerId);
            
            if (oIdNum && context.message.guild) {
                var users = context.message.guild.members.filter (mem =>{
                    return +mem.id == oIdNum;
                });

                if (users.size > 0){
                    var user = users.get(this.ownerId);
                    if (user) {
                        val = val + "\nOwner: " + user.displayName;
                    }
                }
            } else {
                val = val + "\nOwner: " + this.ownerId;
            }
        }
        
        if (this.dimension) {
            val = val + "\nDimension: " + this.dimension;
        }       

        return val;
    }
}