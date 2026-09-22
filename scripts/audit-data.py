"""只读扫描 canonical JSON，生成字段/空值/身份冲突证据。"""
import argparse
import collections
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True)
args = parser.parse_args()
root = Path(args.source).resolve()
out = Path(__file__).resolve().parents[1] / 'docs'
names = 'formats franchises franchises_draft historical_archive historical_player_meta pair_win player_attribution player_icon_cache player_library player_season_stats players seasons'.split()
docs = {n: json.loads((root / 'data/processed' / (n + '.json')).read_text(encoding='utf-8')) for n in names}
lines = ['# Canonical 数据字段实测', '', '自动生成；数组 []、动态键 {} 合并统计全部值，missing 是该对象层缺字段次数。空字符串与 null 分别计数。', '']
for name, doc in docs.items():
    rows = {}
    def walk(values, prefix='$', depth=0):
        kinds = collections.Counter(type(v).__name__ for v in values)
        scalars = [v for v in values if not isinstance(v, (dict, list))]
        sample = json.dumps(scalars[0], ensure_ascii=False)[:100] if scalars else ''
        rows[prefix] = [','.join(kinds), len(values), sum(v is None for v in values), sum(v == '' for v in values), 0, sample]
        if depth > 12:
            return
        objects = [v for v in values if isinstance(v, dict)]
        if objects:
            keys = set().union(*(v.keys() for v in objects))
            dynamic = len(keys) > 80 or (prefix in ('$.icons', '$.records') and name in ('player_icon_cache', 'historical_player_meta')) or (name == 'pair_win' and prefix != '$') or prefix.endswith(('.teams', '.names_by_season')) or (name == 'formats' and prefix == '$.seasons')
            if dynamic:
                walk([x for v in objects for x in v.values()], prefix + '{}', depth+1)
            else:
                for key in sorted(keys):
                    child = prefix + '.' + key
                    walk([v[key] for v in objects if key in v], child, depth+1)
                    rows[child][4] = sum(key not in v for v in objects)
        arrays = [x for v in values if isinstance(v, list) for x in v]
        if arrays:
            walk(arrays, prefix + '[]', depth+1)
    walk([doc])
    digest = hashlib.sha256((root / 'data/processed' / (name+'.json')).read_bytes()).hexdigest()
    lines += [f'## {name}.json', '', f'SHA256: `{digest}`', '', '| 字段 | 类型 | 样本数 | null | 空串 | missing | 示例 |', '| --- | --- | ---: | ---: | ---: | ---: | --- |']
    for key, row in rows.items():
        lines.append('| ' + ' | '.join(str(v).replace('|', '\\|').replace('\n', ' ') for v in [key, *row]) + ' |')
    lines.append('')
players = docs['players']['players']
names_index = collections.defaultdict(list)
for p in players:
    names_index[p['name']].append(p['player_id'])
duplicate_names = {k: v for k, v in names_index.items() if len(v)>1}
ids = collections.Counter(p['player_id'] for p in players)
seasons = {s['season_id'] for s in docs['seasons']['seasons']}
stats = docs['player_season_stats']['records']
keys = collections.Counter((s['player_id'],s['season_id']) for s in stats)
attr = docs['player_attribution']['records']
conflicts = []
by_name = {p['name']: p for p in players if len(names_index[p['name']]) == 1}
for a in attr:
    p = by_name.get(a['player_name'])
    if p and p['teams'].get(a['season_id']) not in (None,a['team_franchise']):
        conflicts.append({'player_id':p['player_id'], 'name':p['name'], 'season':a['season_id'], 'players_team':p['teams'][a['season_id']], 'attribution_team':a['team_franchise']})
report = {'counts': {n: {k:len(v) for k,v in d.items() if isinstance(v,(dict,list))} for n,d in docs.items()}, 'duplicate_player_ids':{k:v for k,v in ids.items() if v>1}, 'duplicate_names':duplicate_names, 'duplicate_player_season_keys':[list(k)+[v] for k,v in keys.items() if v>1], 'unknown_stats_players': sorted({s['player_id'] for s in stats}-set(ids)), 'unknown_stats_seasons':sorted({s['season_id'] for s in stats}-seasons), 'unambiguous_attribution_conflicts':conflicts, 'missing_cached_icons':[v for v in docs['player_icon_cache']['icons'].values() if not (root/'app'/v).is_file()]}
(out/'DATA_SCHEMA_OBSERVED.md').write_text('\n'.join(lines),encoding='utf-8')
(out/'DATA_AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:len(v) for k,v in report.items() if k!='counts'},ensure_ascii=False))
