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

    constructor (centerX:number, centerY:number, notes:string, length:number, shape:string, ownerId?:string){
        this.centerX = centerX;
        this.centerY = centerY;
        this.notes = notes;
        this.length = length;
        this.shape = shape;
        this.ownerId = ownerId;
    }
}