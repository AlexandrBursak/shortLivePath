'use client';
import {ActionButton} from '@/shared/ui';
import {SourceTextArea} from '@/shared/ui/SourceTextArea';
import {generateCode} from '@/entities/short_live_path/create_rules';
export function ReadingCodeControl({enabled,code,onEnabled,onCode,disabled,error}:{enabled:boolean;code:string;onEnabled:(enabled:boolean)=>void;onCode:(code:string)=>void;disabled?:boolean;error?:string}){
 return <fieldset disabled={disabled}><legend>Optional protection</legend><label><input type="checkbox" checked={enabled} onChange={e=>onEnabled(e.target.checked)}/> Require a separate Reading code</label>{enabled && <><SourceTextArea id="reading-code" label="Reading code" value={code} onValue={onCode} rows={2} disabled={disabled} error={error} help="At least 6 Unicode code points, up to 1024 UTF-8 bytes. Case, spaces and line breaks matter. Any composition is allowed."/><ActionButton onClick={()=>onCode(generateCode())}>Generate 20-character code</ActionButton><p>A generated code is recommended. Short or predictable codes can be guessed. This guidance does not block otherwise valid codes. Send the code separately from the Share link.</p></>}</fieldset>;
}
