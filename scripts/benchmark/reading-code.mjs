import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fork } from 'node:child_process'
import { performance, monitorEventLoopDelay } from 'node:perf_hooks'
import { setTimeout as sleep } from 'node:timers/promises'
import os from 'node:os'

const require = createRequire(resolve('package.json'))
const native = require('argon2')
export const profile = Object.freeze({ version: 19, memoryCost: 65536, timeCost: 3, parallelism: 4, hashLength: 32 })

// Benchmark harness only, not an HTTP cancellation or production admission implementation.
export class WorkGate {
  active = 0
  maximum = 0
  async run(operation) {
    if (this.active >= 2) throw new Error('capacity_unavailable')
    this.active++
    this.maximum = Math.max(this.maximum, this.active)
    try { return await operation() } finally { this.active-- }
  }
}

function validCode(code, minimum) {
  return typeof code === 'string' && code.isWellFormed() &&
    [...code].length >= minimum && Buffer.byteLength(code) <= 1024
}
function validVerifier(encoded) {
  if (typeof encoded !== 'string' || encoded.length > 256) return false
  const match = /^\$argon2id\$v=19\$([^$]+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(encoded)
  if (!match) return false
  const costs = match[1].split(',').sort().join(',')
  if (costs !== 'm=65536,p=4,t=3') return false
  return [match[2], match[3]].every((value, index) => {
    const bytes = Buffer.from(value, 'base64')
    return bytes.length === [16, 32][index] && bytes.toString('base64').replace(/=+$/, '') === value
  })
}

export class Verifier {
  gate = new WorkGate()
  started = 0
  async hash(code) {
    if (!validCode(code, 6)) throw new Error('invalid_code')
    return this.gate.run(() => {
      this.started++
      return native.hash(code, { ...profile, type: native.argon2id, salt: randomBytes(16) })
    })
  }
  async verify(encoded, code) {
    if (!validVerifier(encoded)) throw new Error('invalid_verifier')
    if (!validCode(code, 0)) throw new Error('invalid_code')
    return this.gate.run(() => { this.started++; return native.verify(encoded, code) })
  }
}

function generatedCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let value = ''
  while (value.length < 20) {
    for (const byte of randomBytes(32)) {
      if (byte < 248 && value.length < 20) value += alphabet[byte % 62]
    }
  }
  return value
}
function summary(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const percentile = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? null
  return { samples: sorted.length, p50_ms: percentile(0.5), p95_ms: percentile(0.95), p99_ms: percentile(0.99), maximum_ms: sorted.at(-1) ?? null }
}
const readControl = (path) => {
  try { return readFileSync(path, 'utf8').trim() } catch { return null }
}

async function cold(operation, code, encoded) {
  const worker = fork(fileURLToPath(import.meta.url), ['--cold-worker'], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  })
  return new Promise((resolveResult, reject) => {
    let result
    const timer = setTimeout(() => worker.kill('SIGKILL'), 15000)
    worker.once('error', reject)
    worker.once('message', (message) => { result = message })
    worker.once('exit', (status) => {
      clearTimeout(timer)
      if (status === 0 && result && !result.error) resolveResult(result)
      else reject(new Error('cold_worker_failed'))
    })
    // Synthetic values/verifiers cross IPC only, never argv, output, files or labels.
    worker.send({ operation, code, encoded })
  })
}

async function series(verifier, operation, count, concurrency) {
  const times = []
  const start = performance.now()
  for (let index = 0; index < count; index += concurrency) {
    await Promise.all(Array.from({ length: Math.min(concurrency, count - index) }, async () => {
      const before = performance.now()
      await operation()
      times.push(performance.now() - before)
    }))
  }
  const elapsed = performance.now() - start
  return { ...summary(times), elapsed_ms: elapsed, completed_ops_per_second: times.length * 1000 / elapsed, concurrency, maximum_native_calls: verifier.gate.maximum }
}

async function openLoop(verifier, code, encoded, seconds) {
  const start = performance.now()
  const pending = new Set()
  const times = { hash: [], verify_correct: [] }
  const refused = { hash: 0, verify_correct: 0 }
  const lateness = []
  const failures = []
  for (let index = 0; index < seconds * 10; index++) {
    const target = start + index * 100
    await sleep(Math.max(0, target - performance.now()))
    const label = index % 2 === 0 ? 'hash' : 'verify_correct'
    const before = performance.now()
    lateness.push(Math.max(0, before - target))
    const job = (label === 'hash' ? verifier.hash(code) : verifier.verify(encoded, code))
      .then((value) => {
        if (label === 'verify_correct' && value !== true) throw new Error('unexpected_verification')
        times[label].push(performance.now() - before)
      }).catch((error) => {
        if (error.message === 'capacity_unavailable') refused[label]++
        else failures.push('native_or_harness_failure')
      }).finally(() => pending.delete(job))
    pending.add(job)
  }
  await Promise.all(pending)
  const drainedAt = performance.now()
  await sleep(Math.max(0, start + seconds * 1000 - drainedAt))
  const completed = Object.values(times).reduce((total, values) => total + values.length, 0)
  const elapsed = Math.max(seconds * 1000, drainedAt - start)
  return {
    duration_seconds: seconds, offered_ops_per_second: 10, offered_mix: { hash: seconds * 5, verify_correct: seconds * 5 },
    completed, refused, failures: failures.length,
    completed_ops_per_second: completed * 1000 / elapsed,
    hash: summary(times.hash), verify_correct: summary(times.verify_correct),
    dispatch_lateness: summary(lateness), maximum_native_calls: verifier.gate.maximum,
    budget_attained: completed === seconds * 10 && failures.length === 0 &&
      drainedAt <= start + seconds * 1000 &&
      Object.values(times).every((values) => summary(values).p95_ms <= 2000),
  }
}

async function main() {
  const verifier = new Verifier()
  const histogram = monitorEventLoopDelay({ resolution: 10 })
  histogram.enable()
  const vectors = [
    ['six_ascii', 'aaaaaa'], ['generated_twenty', generatedCode()],
    ['maximum_utf8_bytes', 'x'.repeat(1024)], ['six_multibyte', '🔐'.repeat(6)],
    ['whitespace_sensitive', '  code  '], ['normalization_sensitive', 'e\u0301abcd'],
  ]
  const measurements = []
  for (const [label, code] of vectors) {
    const encoded = await verifier.hash(code)
    for (const operation of ['hash', 'verify_correct', 'verify_incorrect']) {
      const job = operation === 'hash' ? () => verifier.hash(code)
        : async () => {
          const result = await verifier.verify(encoded, operation === 'verify_correct' ? code : '')
          if (result !== (operation === 'verify_correct')) throw new Error('unexpected_verification')
        }
      const coldSample = await cold(operation, code, encoded)
      const warm = await series(verifier, job, 5, 1)
      measurements.push({ vector: label, code_points: [...code].length, utf8_bytes: Buffer.byteLength(code), operation, cold: coldSample, warm })
    }
  }
  const code = vectors[1][1]
  const encoded = await verifier.hash(code)
  const concurrent = {}
  for (const operation of ['hash', 'verify_correct', 'verify_incorrect']) {
    concurrent[operation] = await series(verifier, async () => {
      if (operation === 'hash') await verifier.hash(code)
      else if (await verifier.verify(encoded, operation === 'verify_correct' ? code : '') !== (operation === 'verify_correct')) throw new Error('unexpected_verification')
    }, 20, 2)
  }
  const overloadStart = performance.now()
  const overloadResults = await Promise.allSettled([
    verifier.hash(code), verifier.verify(encoded, code), verifier.hash(code),
  ])
  const overload = {
    offered: overloadResults.length,
    completed: overloadResults.filter((result) => result.status === 'fulfilled').length,
    refused: overloadResults.filter((result) => result.status === 'rejected' && result.reason.message === 'capacity_unavailable').length,
    elapsed_ms: performance.now() - overloadStart,
    maximum_native_calls: verifier.gate.maximum,
  }
  if (overload.completed !== 2 || overload.refused !== 1) throw new Error('overload_invariant_failed')
  await openLoop(verifier, code, encoded, 5)
  histogram.reset()
  const workload = await openLoop(verifier, code, encoded, 30)
  histogram.disable()
  return {
    scope: 'AC-06/AC-07 isolated native-work calibration; not HTTPS/browser/store NFR-01 or production security evidence',
    profile, queue_capacity: 0, maximum_native_calls: verifier.gate.maximum,
    runtime: { node: process.version, argon2: require('argon2/package.json').version, platform: process.platform, arch: process.arch, kernel: os.release(), visible_cpus: os.cpus().length, cpu_model: os.cpus()[0]?.model, load_average: os.loadavg(), cpu_max: readControl('/sys/fs/cgroup/cpu.max'), memory_max: readControl('/sys/fs/cgroup/memory.max'), container_memory_peak_bytes: readControl('/sys/fs/cgroup/memory.peak') },
    cold_definition: 'first native operation after module import in a new process; process startup excluded',
    warm_samples_per_vector_and_operation: 5, measurements, concurrent,
    workload, overload, peak_main_process_rss_kib: process.resourceUsage().maxRSS,
    workload_event_loop_delay: { mean_ms: histogram.mean / 1e6, p95_ms: histogram.percentile(95) / 1e6, maximum_ms: histogram.max / 1e6 },
    disposition: workload.budget_attained ? 'starting_profile_retained_for_end_to_end_verification' : 'review_required_before_T20',
  }
}

if (process.argv.includes('--cold-worker')) {
  process.once('message', async ({ operation, code, encoded }) => {
    try {
      const verifier = new Verifier()
      const start = performance.now()
      const result = operation === 'hash' ? await verifier.hash(code)
        : await verifier.verify(encoded, operation === 'verify_correct' ? code : '')
      if (operation !== 'hash' && result !== (operation === 'verify_correct')) throw new Error('unexpected_verification')
      process.send({ elapsed_ms: performance.now() - start, peak_rss_kib: process.resourceUsage().maxRSS }, () => process.exit(0))
    } catch { process.send({ error: true }, () => process.exit(1)) }
  })
} else if (process.argv.includes('--run')) {
  main().then((report) => console.log(JSON.stringify(report, null, 2))).catch(() => {
    console.error('benchmark_failed')
    process.exitCode = 1
  })
}
