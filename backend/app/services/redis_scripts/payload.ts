export const publishPayloadLua = `
local kind = redis.call('TYPE', KEYS[1]).ok
if kind ~= 'none' and kind ~= 'zset' then return -2 end
if kind == 'zset' and redis.call('PTTL', KEYS[1]) ~= -1 then return -2 end
if redis.call('EXISTS', KEYS[2]) ~= 0 or redis.call('ZSCORE', KEYS[1], ARGV[1]) then return -2 end
if tonumber(ARGV[2]) <= tonumber(ARGV[3]) then return -2 end
if redis.call('ZCARD', KEYS[1]) >= 1000 then return -1 end
-- Registry FIRST: failures after this point consume capacity until immutable expiry.
redis.call('ZADD', KEYS[1], ARGV[2], ARGV[1])
local write = redis.pcall('HSET', KEYS[2], unpack(ARGV, 4))
if type(write) == 'table' and write.err then return -2 end
local expiry = redis.pcall('PEXPIREAT', KEYS[2], ARGV[2])
if (type(expiry) == 'table' and expiry.err) or expiry ~= 1 then redis.call('DEL', KEYS[2]); return -2 end
if redis.call('PEXPIRETIME', KEYS[2]) ~= tonumber(ARGV[2]) then return -2 end
return 1
`
export const readPayloadLua = `
local kind = redis.call('TYPE', KEYS[1]).ok
if kind == 'none' then return {} end
if kind ~= 'hash' then return {-2} end
if redis.call('PTTL', KEYS[2]) ~= -1 then return {-2} end
local score = redis.call('ZSCORE', KEYS[2], ARGV[1])
if not score or tonumber(score) ~= tonumber(ARGV[2]) then return {-2} end
-- Never enumerate recovered field names/values: even an unknown name can be huge.
local names = {'schema_version','lifecycle_id','address','login','credential','created_at_ms','expires_at_ms','integrity_digest'}
local limits = {1,36,65536,65536,65536,16,16,64}
local optional = redis.call('HEXISTS', KEYS[1], 'code_verifier')
if redis.call('HLEN', KEYS[1]) ~= #names + optional then return {-2} end
local textBytes = 0
for i, name in ipairs(names) do
 if redis.call('HEXISTS', KEYS[1], name) ~= 1 then return {-2} end
 local size = redis.call('HSTRLEN', KEYS[1], name)
 if size > limits[i] then return {-2} end
 if i >= 3 and i <= 5 then textBytes = textBytes + size end
end
if textBytes > 65536 then return {-2} end
if optional == 1 then
 if redis.call('HSTRLEN', KEYS[1], 'code_verifier') > 100 then return {-2} end
 table.insert(names, 'code_verifier')
end
local fields = redis.call('HMGET', KEYS[1], unpack(names))
local result = {redis.call('PEXPIRETIME', KEYS[1])}
for i, name in ipairs(names) do
 table.insert(result, name)
 table.insert(result, fields[i])
end
return result
`
