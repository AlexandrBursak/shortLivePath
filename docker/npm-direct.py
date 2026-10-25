"""Render only nonsecret NPM Advanced server configuration; never load env files."""
import argparse
import ipaddress
from pathlib import Path
import re


def private_ip(value):
    # Explicit RFC1918/ULA/loopback only; no hostnames, scopes or whitespace.
    if value != value.strip() or '%' in value:
        raise argparse.ArgumentTypeError('expected literal private IP')
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        raise argparse.ArgumentTypeError('expected literal private IP') from None
    allowed = ('10.0.0.0/8','172.16.0.0/12','192.168.0.0/16','127.0.0.0/8') if ip.version == 4 else ('fc00::/7','::1/128')
    if not any(ip in ipaddress.ip_network(n) for n in allowed):
        raise argparse.ArgumentTypeError('IP must be RFC1918, ULA or loopback, never wildcard/public/link-local')
    return str(ip)


def port(value):
    if not re.fullmatch(r'[0-9]{1,5}',value) or not 1 <= int(value) <= 65535:
        raise argparse.ArgumentTypeError('port must be integer 1..65535')
    return str(int(value))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--upstream-ip', required=True, type=private_ip)
    parser.add_argument('--api-port', default='3333', type=port)
    parser.add_argument('--web-port', default='3000', type=port)
    args = parser.parse_args()
    if args.api_port == args.web_port:
        parser.error('API and web published ports must differ')
    address = '['+args.upstream_ip+']' if ':' in args.upstream_ip else args.upstream_ip
    template = Path(__file__).with_name('npm-direct.conf.template').read_text()
    print(template.replace('@UPSTREAM@', address).replace('@API_PORT@', args.api_port).replace('@WEB_PORT@', args.web_port), end='')


if __name__ == '__main__':
    main()
