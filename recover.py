import json
import os

log_path = r"C:\Users\Mathe\.gemini\antigravity\brain\51148a50-8def-41a1-a264-c13df8f6475d\.system_generated\logs\transcript.jsonl"
targets = ["qr-generator.js", "qr-view.js", "waiting.js", "released.js"]
recovered = {t: False for t in targets}

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    try:
        obj = json.loads(line)
        if 'tool_calls' in obj:
            for call in obj['tool_calls']:
                if call['name'] == 'default_api:write_to_file':
                    args = call.get('arguments', {})
                    target = args.get('TargetFile', '')
                    for t in targets:
                        if t in target and not recovered[t]:
                            content = args.get('CodeContent', '')
                            if content:
                                out_path = os.path.join("js", "modules", t)
                                with open(out_path, 'w', encoding='utf-8') as out_f:
                                    out_f.write(content)
                                recovered[t] = True
                                print(f"Recovered {t}")
    except Exception as e:
        pass

for t, status in recovered.items():
    if not status:
        print(f"Failed to recover {t}")
