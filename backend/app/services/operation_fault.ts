export type FaultCode = 'invalid_request' | 'service_unavailable' | 'capacity_unavailable'
export class OperationFault extends Error {
 constructor(public readonly code:FaultCode){super(code);this.name='OperationFault'}
}
