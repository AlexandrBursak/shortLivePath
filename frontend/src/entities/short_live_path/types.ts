export interface SecretText {address:string;login:string;credential:string}
export interface CreateInput {credential:string;address?:string;login?:string;lifetime_minutes?:number;reading_code?:string}
export interface ShareLink {share_url:string;expires_at:string}
export interface Disclosure {secret:SecretText;expires_at:string}
export type NeutralGate={state:'available';reading_code_required:boolean;expires_at:string}|{state:'expired'|'early_unavailable';expires_at:string}|{state:'unknown'};
export type FailureCode='invalid_request'|'request_too_large'|'unsupported_media_type'|'creation_limited'|'verification_limited'|'capacity_unavailable'|'service_unavailable'|'code_required'|'code_incorrect'|'link_unavailable'|'link_expired';
