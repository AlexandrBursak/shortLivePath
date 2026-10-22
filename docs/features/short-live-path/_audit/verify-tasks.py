#!/usr/bin/env python3
"""Validate provisional task artifacts; stdlib only, no runtime security approval."""
from pathlib import Path
import json
import re
from graphlib import TopologicalSorter

ROOT = Path(__file__).resolve().parents[4]
FEATURE = ROOT / 'docs/features/short-live-path'
EXPECTED_SECTIONS = [
    'Place in the sequence', 'Why (user story)', 'Inlined context',
    'Data delta', 'API contract', 'Acceptance criteria', 'Checklist',
    'Edge cases', 'Definition of Done',
]
JSON_KEYS = {'id', 'title', 'layer', 'deps', 'acs', 'dod', 'files_hint', 'file'}
LAYERS = {'migration', 'domain', 'infra', 'app', 'ports', 'ui', 'tests', 'wiring', 'docs'}


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def read_frontmatter(text):
    require(text.startswith('---\n'), 'missing frontmatter')
    header = text.split('---', 2)[1]
    result = {}
    for line in header.strip().splitlines():
        key, value = line.split(':', 1)
        result[key] = json.loads(value.split(' # justified:', 1)[0].strip())
    return result


def body_section(text, name):
    match = re.search(r'^## ' + re.escape(name) + r'\n(.*?)(?=^## |\Z)', text, re.M | re.S)
    require(match is not None, f'missing section {name}')
    return match.group(1).strip()


def main():
    model = json.loads((FEATURE / 'tasks.json').read_text())
    require(set(model) == {'slug', 'tasks'}, 'root JSON keys')
    require(model['slug'] == 'short-live-path', 'slug')
    tasks = model['tasks']
    # Product Owner explicitly requested a separate post-scaffold benchmark.
    # Preserve T1..T20 identifiers rather than folding unrelated scopes together.
    require(8 <= len(tasks) <= 21, 'task count outside approved range')
    if len(tasks) == 21:
        benchmark = next((t for t in tasks if t['id'] == 'T21'), None)
        require(benchmark is not None and benchmark['deps'] == ['T3'],
                'approved extra task must be the post-scaffold T21 benchmark')
        require('T21' in next(t for t in tasks if t['id'] == 'T20')['deps'],
                'final performance gate must require T21')
    ids = {t['id'] for t in tasks}
    require(len(ids) == len(tasks), 'duplicate task ID')
    spec = (FEATURE / 'spec.md').read_text()
    criteria = {m.group(1): m.group(2).strip() for m in re.finditer(
        r'^### (AC-\d+b?) [^\n]+\n+(.*?)(?=^### |^## |\Z)', spec, re.M | re.S)}
    stories = {m.group(1): m.group(2).strip() for m in re.finditer(
        r'^### (US-\d+):[^\n]+\n+(.*?)(?=^### |^## |\Z)', spec, re.M | re.S)}
    covered = set()
    paths = []
    budgets = []
    total_hours = 0
    inverse = {i: [t['id'] for t in tasks if i in t['deps']] for i in ids}
    graph = {t['id']: set(t['deps']) for t in tasks}
    order = list(TopologicalSorter(graph).static_order())
    require(set(order) == ids, 'dependency references absent IDs')
    docs_gate = {'T1', 'T2'}
    ancestors = {}
    for ident in order:
        ancestors[ident] = set(graph[ident])
        for dep in graph[ident]:
            ancestors[ident].update(ancestors[dep])
    tracker = (FEATURE / 'tasks/tracker.md').read_text()
    for t in tasks:
        ident = t['id']
        require(set(t) == JSON_KEYS, f'{ident}: JSON field contract')
        require(t['layer'] in LAYERS, f'{ident}: layer')
        require(t['deps'] == list(dict.fromkeys(t['deps'])), f'{ident}: duplicate deps')
        require(t['acs'] and set(t['acs']) <= set(criteria), f'{ident}: invalid AC')
        require(t['files_hint'] and t['dod'], f'{ident}: empty DoD/files_hint')
        require(t['file'].startswith('docs/features/short-live-path/tasks/'), f'{ident}: file pointer')
        path = ROOT / t['file']
        require(path.is_file(), f'{ident}: task body missing')
        paths.append(path.resolve())
        text = path.read_text()
        fm = read_frontmatter(text)
        for field in ['id', 'title', 'layer', 'deps', 'acs', 'files_hint']:
            require(fm[field] == t[field], f'{ident}: JSON/markdown {field} drift')
        require(fm['blocks'] == inverse[ident], f'{ident}: blocks inverse')
        require(fm['owner'], f'{ident}: owner')
        hours = int(fm['estimate'].removesuffix('h'))
        require(0 < hours <= 8, f'{ident}: estimate exceeds a day')
        total_hours += hours
        headings = re.findall(r'^## (.+)$', text, re.M)
        require(headings == EXPECTED_SECTIONS, f'{ident}: section contract')
        for heading in EXPECTED_SECTIONS:
            require(body_section(text, heading), f'{ident}: empty {heading}')
        require(t['dod'] in body_section(text, 'Definition of Done'), f'{ident}: DoD drift')
        why = body_section(text, 'Why (user story)')
        unquoted_why = '\n'.join(line.removeprefix('> ') for line in why.splitlines())
        require(any(story in unquoted_why for story in stories.values()), f'{ident}: story not verbatim')
        ac_section = body_section(text, 'Acceptance criteria')
        require(set(re.findall(r'^### (AC-\d+b?)$', ac_section, re.M)) == set(t['acs']), f'{ident}: AC mirror')
        unquoted_ac = '\n'.join(line.removeprefix('> ') for line in ac_section.splitlines())
        for ac in t['acs']:
            require(criteria[ac] in unquoted_ac, f'{ident}: {ac} not verbatim')
            require(f'spec.md §5, {ac}, verbatim' in ac_section, f'{ident}: AC provenance')
        for block in re.findall(r'(?:^>.*\n)+', text, re.M):
            require(re.search(r'> — `[^`]+§[^`]+, (?:verbatim|abridged)`', block), f'{ident}: unsigned quote')
            signature = re.search(r'> — `(.+?) §[^`]+, (verbatim|abridged)`', block)
            if signature and signature.group(2) == 'verbatim':
                source = (FEATURE / signature.group(1)).read_text()
                for line in block.splitlines():
                    if line.startswith('> ') and not line.startswith('> —'):
                        require(line[2:] in source, f'{ident}: verbatim source line differs')
        context = text[text.index('## Why (user story)'):text.index('## Checklist')]
        lines = sum(bool(line.strip()) for line in context.splitlines())
        budget = fm['context_budget']
        require(budget in {'S', 'M', 'L'}, f'{ident}: invalid context budget')
        require(budget != 'S' or lines <= 40, f'{ident}: S over budget')
        require(budget != 'M' or lines <= 120, f'{ident}: M over budget')
        require(budget != 'L' or '# justified:' in text.split('---', 2)[1], f'{ident}: unjustified L')
        budgets.append({'id': ident, 'nonempty_context_lines': lines, 'context_budget': budget})
        for link in re.findall(r'\]\(([^)]+)\)', text):
            if not link.startswith(('https:', 'http:', '#')):
                require((path.parent / link.split('#')[0]).exists(), f'{ident}: broken source link {link}')
        if ident not in docs_gate:
            require(docs_gate <= ancestors[ident], f'{ident}: bypasses DM-OQ gate')
            require(fm['status'] == 'blocked', f'{ident}: provisional task must be blocked')
        require(ident in tracker and t['title'] in tracker, f'{ident}: tracker missing')
        covered.update(t['acs'])
    for artifact in paths + [FEATURE / 'tasks.json', FEATURE / 'tasks/_epic.md', FEATURE / 'tasks/tracker.md']:
        content = artifact.read_text()
        require(content.endswith('\n'), f'{artifact}: missing final newline')
        require(all(line == line.rstrip() for line in content.splitlines()), f'{artifact}: trailing whitespace')
    require(len(set(paths)) == len(paths), 'duplicate file pointers')
    require(covered == set(criteria), 'AC coverage gap')
    task_files = {p.resolve() for p in (FEATURE / 'tasks').glob('*.md')} - {
        (FEATURE / 'tasks/_epic.md').resolve(), (FEATURE / 'tasks/tracker.md').resolve()}
    require(task_files == set(paths), 'orphan/missing task file')
    require(graph['T3'] == graph['T4'] and not any(
        a == b or (a.endswith('/') and b.startswith(a)) or (b.endswith('/') and a.startswith(b))
        for a in next(t for t in tasks if t['id'] == 'T3')['files_hint']
        for b in next(t for t in tasks if t['id'] == 'T4')['files_hint']), 'no real parallel scaffold branch')
    epic = (FEATURE / 'tasks/_epic.md').read_text()
    diagrams = re.findall(r'```mermaid\n(.*?)```', epic, re.S)
    require(len(diagrams) == 1 and diagrams[0].startswith('flowchart LR\n'), 'Mermaid fences/type')
    declared = set()
    actual_edges = set()
    for line in diagrams[0].splitlines()[1:]:
        node = re.fullmatch(r'\s*(T\d+)\["([^"\[\]{}()<>]+)"\]', line)
        edge = re.fullmatch(r'\s*(T\d+) --> (T\d+)', line)
        require(node or edge, f'unrecognized Mermaid line: {line}')
        if node:
            declared.add(node.group(1))
        if edge:
            require(set(edge.groups()) <= declared, 'Mermaid edge before declaration')
            actual_edges.add(edge.groups())
    require(declared == ids, 'Mermaid nodes differ from JSON')
    require(actual_edges == {(d, t['id']) for t in tasks for d in t['deps']}, 'Mermaid edges differ from JSON')
    result = {
        'result': 'PASS', 'scope': 'provisional documentation only; runtime readiness remains BLOCKED',
        'tasks': len(tasks), 'covered_acs': sorted(covered), 'total_hours': total_hours,
        'person_days_at_8h': total_hours / 8, 'acyclic': True, 'inverse_blocks': True,
        'json_markdown_mirror': True, 'verbatim_ac_and_story': True,
        'mermaid_structural_lint': 'PASS', 'context_budgets': budgets,
    }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
