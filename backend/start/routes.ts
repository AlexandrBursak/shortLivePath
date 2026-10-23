import router from '@adonisjs/core/services/router'
import {readiness} from '#start/maintenance'
const CreateSecretController=()=>import('../app/controllers/create_secret_controller.js')
router.post('/api/v1/secrets',[CreateSecretController,'handle'])
const SecretStatusController=()=>import('../app/controllers/secret_status_controller.js')
router.get('/api/v1/secrets/:token/status',[SecretStatusController,'handle'])
const DiscloseSecretController=()=>import('../app/controllers/disclose_secret_controller.js')
router.post('/api/v1/secrets/:token/disclosures',[DiscloseSecretController,'handle'])
router.get('/health/live', () => ({ data: { live: true }, meta: {} }))
router.get('/health/ready', ({ response }) => {
 if(readiness?.ready)return {data:{ready:true},meta:{}}
 return response.status(503).send({
  error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', details: [] },
 })
})
