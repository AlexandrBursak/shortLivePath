import {SourceText,displayText} from './source_text';
interface Pending {start:number;end:number;type:string;data:string|null;display:string}
// Native listeners, not React's polyfilled onBeforeInput. Raw clipboard and
// composition source remain separate from normalized textarea presentation.
export function bindSourceText(node:HTMLTextAreaElement,model:SourceText,change:(raw:string)=>void,error:()=>void):()=>void{
 let pending:Pending|undefined,composition:{raw:string;start:number;end:number}|undefined;
 const publish=(caret?:number)=>{if(node.value!==model.display)node.value=model.display;if(caret!==undefined)node.setSelectionRange(caret,caret);change(model.value);};
 const edit=(start:number,end:number,data:string)=>{model.replace(start,end,data);publish(start+displayText(data).length);};
 const paste=(e:ClipboardEvent)=>{if(node.disabled || node.readOnly)return;e.preventDefault();edit(node.selectionStart,node.selectionEnd,e.clipboardData?.getData('text/plain')??'');};
 const copy=(e:ClipboardEvent)=>{if(!e.clipboardData)return;e.preventDefault();e.clipboardData.setData('text/plain',model.selection(node.selectionStart,node.selectionEnd));};
 const cut=(e:ClipboardEvent)=>{if(node.disabled || node.readOnly)return;copy(e);edit(node.selectionStart,node.selectionEnd,'');};
 const history=(redo:boolean)=>{if(redo)model.redo();else model.undo();publish(model.display.length);};
 const key=(e:KeyboardEvent)=>{
  if((e.ctrlKey || e.metaKey) && !e.altKey && ['z','y'].includes(e.key.toLowerCase()) && !node.disabled && !node.readOnly){e.preventDefault();history(e.key.toLowerCase()==='y' || e.shiftKey);}
 };
 const before=(e:InputEvent)=>{
  pending={start:node.selectionStart,end:node.selectionEnd,type:e.inputType,data:e.data,display:model.display};
  if(e.inputType==='historyUndo' || e.inputType==='historyRedo'){if(e.cancelable)e.preventDefault();history(e.inputType==='historyRedo');pending=undefined;return;}
  if(e.cancelable && !e.isComposing && !composition && (e.inputType==='insertText' && e.data!==null || e.inputType==='insertLineBreak' || e.inputType==='insertParagraph')){
   e.preventDefault();edit(node.selectionStart,node.selectionEnd,e.data??'\n');pending=undefined;
  }
 };
 const input=(e:InputEvent)=>{
  if(composition && e.data!==null){
   const next=new SourceText(composition.raw);next.replace(composition.start,composition.end,e.data);
   if(next.display===node.value){model.set(next.value);change(model.value);pending=undefined;return;}
  }
  if(!pending){if(node.value!==model.display){node.value=model.display;error();}return;}
  let {start,end}=pending;let insert=pending.data??'';
  if(pending.type.startsWith('delete')){
   insert='';if(start===end){if(pending.type.includes('Backward'))start=node.selectionStart;else end+=pending.display.length-node.value.length;}
  }else if(pending.type==='insertLineBreak' || pending.type==='insertParagraph')insert='\n';
  else if(pending.data===null){insert=node.value.slice(start,node.selectionStart);end=pending.display.length-(node.value.length-node.selectionStart);}
  if(pending.display.slice(0,start)+displayText(insert)+pending.display.slice(end)===node.value){model.replace(start,end,insert);change(model.value);}
  else{node.value=model.display;error();}
  pending=undefined;
 };
 const begin=()=>{composition={raw:model.value,start:node.selectionStart,end:node.selectionEnd};model.beginGroup();};
 const finish=()=>{model.endGroup();composition=undefined;pending=undefined;publish();};
 const events:[string,EventListener][]=[['paste',paste as EventListener],['copy',copy as EventListener],['cut',cut as EventListener],['keydown',key as EventListener],['beforeinput',before as EventListener],['input',input as EventListener],['compositionstart',begin],['compositionend',finish]];
 node.value=model.display;for(const [name,fn] of events)node.addEventListener(name,fn);
 return ()=>{for(const [name,fn] of events)node.removeEventListener(name,fn);};
}
