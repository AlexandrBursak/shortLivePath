import router from '@adonisjs/core/services/router'
import {readiness,metricsSampler} from '#start/maintenance'
import {performance} from 'node:perf_hooks'
import {aggregateMetrics as metrics} from '../app/services/aggregate_metrics_service.js'
import {hashWork} from '../app/services/reading_code_service.js'
const CreateSecretController=()=>import('../app/controllers/create_secret_controller.js')
router.post('/api/v1/secrets',[CreateSecretController,'handle'])
const SecretStatusController=()=>import('../app/controllers/secret_status_controller.js')
router.get('/api/v1/secrets/:token/status',[SecretStatusController,'handle'])
const DiscloseSecretController=()=>import('../app/controllers/disclose_secret_controller.js')
router.post('/api/v1/secrets/:token/disclosures',[DiscloseSecretController,'handle'])
// Private API network only; the existing public ^~ /health exclusion applies.
router.get('/health/metrics',({response})=>{
 metrics.set('ready',readiness?.ready?1:0);metrics.set('hash_active',hashWork.active)
 metrics.set('sample_age_seconds',metricsSampler?.age??1e9)
 const r=readiness?.metrics
 metrics.set('cleanup_age_seconds',r?.lastSweep?(performance.now()-r.lastSweep)/1000:1e9)
 metrics.set('cleanup_exhaustions',r?.cleanupExhaustions??0);metrics.set('recovery_failures',r?.recoveryFailures??0)
 metrics.set('recovery_seconds',r?.recoverySeconds??0)
 return response.header('Content-Type','text/plain; version=0.0.4').send(metrics.render())
})
router.get('/health/live', () => ({ data: { live: true }, meta: {} }))
router.get('/health/ready', ({ response }) => {
 if(readiness?.ready)return {data:{ready:true},meta:{}}
 return response.status(503).send({
  error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', details: [] },
 })
})
