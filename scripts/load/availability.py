"""Minute probe and UTC calendar-month aggregation. Output contains aggregates only."""
import argparse
import datetime as dt
import json
import re
import secrets
import ssl
import time
import urllib.parse
import urllib.request


def month_bounds(month):
    start = dt.datetime.strptime(month, '%Y-%m').replace(tzinfo=dt.timezone.utc)
    end = (start.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
    return int(start.timestamp()), int(end.timestamp())


def next_minute(now):
    return (int(now) // 60 + 1) * 60


def aggregate(month, rows, now):
    start, end = month_bounds(month)
    seen, duplicates = {}, 0
    for row in rows:
        if set(row) != {'minute', 'available'} or type(row['minute']) is not int or row['minute'] % 60 or type(row['available']) is not bool:
            raise ValueError('Invalid sanitized sample')
        if start <= row['minute'] < end:
            if row['minute'] in seen:
                duplicates += 1
                seen[row['minute']] = False  # duplicates never improve availability
            else:
                seen[row['minute']] = row['available']
    expected = (end - start) // 60
    observed, success = len(seen), sum(seen.values())
    missing = expected - observed
    return {'expected': expected, 'observed': observed, 'available': success,
            'unavailable': observed - success, 'missing': missing, 'duplicates': duplicates,
            'observed_availability': success / observed if observed else None,
            'calendar_lower_bound': success / expected,
            'certified': now >= end and missing == 0 and duplicates == 0 and success / expected >= .995}


def probe(origin, ca):
    # This implementation handle is deliberately local-only, not a production installer.
    parsed = urllib.parse.urlsplit(origin)
    if parsed.scheme != 'https' or parsed.hostname not in ('localhost', '127.0.0.1') or parsed.path not in ('', '/') or parsed.query or parsed.fragment or parsed.username:
        raise ValueError('Isolated loopback HTTPS origin required')
    origin = origin.rstrip('/')
    context = ssl.create_default_context(cafile=ca)
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            return None
    opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=context), NoRedirect())
    def post(path, body, status):
        request = urllib.request.Request(origin + path, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
        with opener.open(request, timeout=10) as response:
            if response.status != status:
                raise ValueError('Probe failed')
            raw = response.read(1048577)
            if len(raw) > 1048576:
                raise ValueError('Probe failed')
            return json.loads(raw)
    # Values, link and code live only on this stack; no logs, files, or retries.
    value, code = secrets.token_hex(16), secrets.token_hex(16)
    try:
        created = post('/api/v1/secrets', {'credential': value, 'reading_code': code, 'lifetime_minutes': 1}, 201)
        link = urllib.parse.urlsplit(created['data']['share_url'])
        token = link.path.removeprefix('/s/')
        if link.scheme != parsed.scheme or link.netloc != parsed.netloc or not re.fullmatch(r'[A-Za-z0-9_-]{43}', token):
            return False
        result = post('/api/v1/secrets/' + token + '/disclosures', {'reading_code': code}, 200)
        return result['data']['secret'] == {'address': '', 'login': '', 'credential': value}
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--month')
    parser.add_argument('--samples')
    parser.add_argument('--probe-origin')
    parser.add_argument('--ca')
    parser.add_argument('--minutes', type=int, default=1)
    args = parser.parse_args()
    if args.month:
        with open(args.samples, encoding='utf8') as stream:
            rows = [json.loads(line) for line in stream if line.strip()]
        print(json.dumps(aggregate(args.month, rows, time.time())))
    elif args.probe_origin and args.ca and 1 <= args.minutes <= 44640:
        for _ in range(args.minutes):
            minute = next_minute(time.time())
            time.sleep(max(0, minute - time.time()))
            if time.time() - minute > 5:
                continue  # missed starts remain missing, not backfilled or retried
            available = probe(args.probe_origin, args.ca)
            if time.time() >= minute + 60:
                available = False
            print(json.dumps({'minute': minute, 'available': available}), flush=True)
    else:
        parser.error('Specify aggregate inputs or an isolated probe origin and CA')


if __name__ == '__main__':
    main()
