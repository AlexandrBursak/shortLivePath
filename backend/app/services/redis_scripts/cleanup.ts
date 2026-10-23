export const cleanupLua = `#!lua flags=allow-oom
-- Only deletion and bounded existing-marker cardinality updates are allowed
-- here. Publication/admission scripts retain normal noeviction/OOM refusal.
if ARGV[4] ~= '' then
 if redis.call('HGET', KEYS[2], 'generation') ~= ARGV[4] then return -2 end
 local field = ARGV[3] == 'payload' and 'payloads' or 'limiters'
 if redis.call('HGET', KEYS[2], field) ~= tostring(redis.call('ZCARD', KEYS[1])) then return -2 end
end
local kind = redis.call('TYPE', KEYS[1]).ok
if kind == 'none' then return {0, 0} end
if kind ~= 'zset' or redis.call('PTTL', KEYS[1]) ~= -1 then return -2 end
local members = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, 128)
local prefix, mode = ARGV[2], ARGV[3]
-- Validate the entire batch before deleting anything; no arbitrary-key deletion.
for _, member in ipairs(members) do
 if mode == 'payload' then
  if not string.match(member, '^%x%x%x%x%x%x%x%x%-%x%x%x%x%-4%x%x%x%-[89ab]%x%x%x%-%x%x%x%x%x%x%x%x%x%x%x%x$') then return -2 end
 else
  if string.sub(member, 1, #prefix) ~= prefix or not string.match(member, ':state$') then return -2 end
  local suffix = string.sub(member, #prefix + 1)
  if not string.match(suffix, '^creation:v1:[%w_-]+:state$') and not string.match(suffix, '^verification:[%x-]+:v1:[%w_-]+:state$') then return -2 end
 end
end
for _, member in ipairs(members) do
 local key = mode == 'payload' and prefix .. 'secret:' .. member .. ':payload' or member
 redis.call('DEL', key)
 redis.call('ZREM', KEYS[1], member)
end
if ARGV[4] ~= '' then
 local field = mode == 'payload' and 'payloads' or 'limiters'
 redis.call('HSET', KEYS[2], field, tostring(redis.call('ZCARD', KEYS[1])))
end
return {#members, redis.call('ZCOUNT', KEYS[1], '-inf', ARGV[1])}
`
