export const admissionLua = `
local now, threshold, deadline = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local submitted = now
local kind = redis.call('TYPE', KEYS[1]).ok
if kind ~= 'none' and kind ~= 'zset' then return -2 end
if kind == 'zset' and redis.call('PTTL', KEYS[1]) ~= -1 then return -2 end
local stateKind = redis.call('TYPE', KEYS[2]).ok
if stateKind ~= 'none' and stateKind ~= 'string' then return -2 end
if stateKind == 'string' and redis.call('STRLEN', KEYS[2]) > 2048 then return -2 end
local raw = redis.call('GET', KEYS[2])
local registered = redis.call('ZSCORE', KEYS[1], KEYS[2])
local events = {}
if raw then
 if not registered then return -2 end
 local ok, state = pcall(cjson.decode, raw)
 if not ok or type(state) ~= 'table' or state.version ~= 1 or type(state.last) ~= 'number' or type(state.events) ~= 'table' or type(state.expires) ~= 'number' then return -2 end
 if tonumber(registered) ~= state.expires or redis.call('PEXPIRETIME', KEYS[2]) ~= state.expires then return -2 end
 if state.last % 1 ~= 0 or state.last < 0 or state.expires % 1 ~= 0 or state.expires <= state.last or state.expires > state.last + 300000 then return -2 end
 local fieldCount = 0
 for key, _ in pairs(state) do
  if key ~= 'version' and key ~= 'last' and key ~= 'expires' and key ~= 'events' then return -2 end
  fieldCount = fieldCount + 1
 end
 if fieldCount ~= 4 or #state.events > threshold then return -2 end
 for key, _ in pairs(state.events) do
  if type(key) ~= 'number' or key % 1 ~= 0 or key < 1 or key > #state.events then return -2 end
 end
 now = math.max(now, state.last)
 deadline = math.max(deadline, state.expires)
 for _, timestamp in ipairs(state.events) do
  if type(timestamp) ~= 'number' or timestamp > state.last or timestamp % 1 ~= 0 then return -2 end
  if timestamp > now - 60000 then table.insert(events, timestamp) end
 end
elseif registered and tonumber(registered) > now then
 -- Missing active state is uncertainty, not a fresh allowance.
 return -2
elseif not registered and redis.call('ZCARD', KEYS[1]) >= 10000 then return -1 end
if deadline <= now then return -2 end
local allowed = #events < threshold
if ARGV[4] == 'event' then
 if submitted > now - 60000 then table.insert(events, submitted) end
 table.sort(events)
 while #events > threshold do table.remove(events, 1) end
end
-- Index first; OOM leaves either old intact history or a conservatively blocked orphan.
redis.call('ZADD', KEYS[1], deadline, KEYS[2])
local value = cjson.encode({version=1,last=now,expires=deadline,events=events})
local written = redis.pcall('SET', KEYS[2], value, 'PXAT', deadline)
if type(written) == 'table' and written.err then return -2 end
if ARGV[4] == 'event' or allowed then return 1 else return 0 end
`
