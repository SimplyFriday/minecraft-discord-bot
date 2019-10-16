export class PlotView {
    items:PlotViewItem[] = [];
}

export class PlotViewItem {
    centerX:number;
    centerY:number;
    notes?:string;

    constructor (centerX:number, centerY:number, notes:string){
        this.centerX = centerX;
        this.centerY = centerY;
        this.notes = notes;
    }
}