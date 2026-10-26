export function displayText(raw:string){return raw.replace(/\r\n?/g,'\n');}
export function sourceOffsets(raw:string):number[]{const map=[0];for(let i=0;i<raw.length;){i+=raw[i]==='\r' && raw[i+1]==='\n'?2:1;map.push(i);}return map;}
export class SourceText {
 private history:string[];
 private cursor=0;
 private draft:string|undefined;
 constructor(raw=''){this.history=[raw];}
 get value(){return this.draft??this.history[this.cursor];}
 get display(){return displayText(this.value);}
 set(raw:string){if(raw===this.value)return;if(this.draft!==undefined){this.draft=raw;return;}this.history=this.history.slice(0,this.cursor+1);this.history.push(raw);this.cursor++;}
 beginGroup(){this.draft=this.value;}
 endGroup(){const raw=this.draft;this.draft=undefined;if(raw!==undefined)this.set(raw);}
 replace(start:number,end:number,insert:string){
  const map=sourceOffsets(this.value);
  if(!Number.isInteger(start) || !Number.isInteger(end) || start<0 || end<start || end>=map.length)throw new Error('Invalid source range');
  this.set(this.value.slice(0,map[start])+insert+this.value.slice(map[end]));
 }
 selection(start:number,end:number){const map=sourceOffsets(this.value);return this.value.slice(map[start],map[end]);}
 undo(){if(this.cursor>0)this.cursor--;return this.value;}
 redo(){if(this.cursor+1<this.history.length)this.cursor++;return this.value;}
 reset(raw:string){this.history=[raw];this.cursor=0;}
}
