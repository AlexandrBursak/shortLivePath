import type {ReactNode, Ref, InputHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes} from 'react';
export function ScreenFrame({title,children,headingRef}:{title:string;children:ReactNode;headingRef?:Ref<HTMLHeadingElement>}) {
 return <main className="screenFrame"><h1 ref={headingRef} tabIndex={headingRef?-1:undefined}>{title}</h1>{children}</main>;
}
type Field={id:string;label:string;help?:string;error?:string};
function description({id,help,error}:Field){return [help && `${id}-help`,error && `${id}-error`].filter(Boolean).join(' ') || undefined;}
function FieldNotes({id,help,error}:Field){return <>{help && <p id={`${id}-help`}>{help}</p>}{error && <p id={`${id}-error`} role="alert">{error}</p>}</>;}
export function TextField({label,help,error,id,...props}:Field & InputHTMLAttributes<HTMLInputElement>){
 const field={id,label,help,error};
 return <div className="field"><label htmlFor={id}>{label}</label><input {...props} id={id} aria-describedby={description(field)} aria-invalid={error ? true : undefined}/><FieldNotes {...field}/></div>;
}
export function ExactTextArea({label,help,error,id,...props}:Field & TextareaHTMLAttributes<HTMLTextAreaElement> & {ref?:Ref<HTMLTextAreaElement>}){
 const field={id,label,help,error};
 return <div className="field"><label htmlFor={id}>{label}</label><textarea autoComplete="off" autoCapitalize="off" spellCheck={false} {...props} id={id} aria-describedby={description(field)} aria-invalid={error ? true : undefined}/><FieldNotes {...field}/></div>;
}
export function ActionButton({busy=false,disabled,children,...props}:ButtonHTMLAttributes<HTMLButtonElement> & {busy?:boolean}){
 return <button type="button" {...props} disabled={disabled || busy} aria-busy={busy || undefined}>{children}</button>;
}
export function Notice({children,tone='status'}:{children:ReactNode;tone?:'status'|'error'}){
 return <p role={tone==='error'?'alert':'status'}>{children}</p>;
}
