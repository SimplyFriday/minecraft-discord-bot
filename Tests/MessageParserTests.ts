import {CLI, Shim} from 'clime';
import * as Path from 'path';


var cmdDir = Path.join(__dirname, '../app/commands/Sample');
let cli = new CLI('Sample', cmdDir);

console.log(cmdDir);

let shim = new Shim(cli);
shim.execute(['']); 