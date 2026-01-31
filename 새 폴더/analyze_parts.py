import json
from collections import Counter
import re

# JSON 데이터 로드
with open('crane_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 부품 키워드 목록 (영문/한글)
parts_keywords = {
    'Wire Rope': ['wire rope', 'wire', '와이어', '와이어로프'],
    'Motor': ['motor', '모터'],
    'Brake': ['brake', '브레이크'],
    'Bearing': ['bearing', 'brg', '베어링'],
    'Reducer': ['reducer', '감속기', '리듀서'],
    'Pump': ['pump', '펌프'],
    'Valve': ['valve', '밸브'],
    'Inverter': ['inverter', '인버터'],
    'Contactor': ['contactor', '접촉기', '콘탯타'],
    'Relay': ['relay', '릴레이', '계전기'],
    'Limit Switch': ['limit switch', 'limit', '리미트', '리밋'],
    'Cable': ['cable', '케이블', '케이블'],
    'Hose': ['hose', '호스'],
    'Wheel': ['wheel', '휠', '바퀴'],
    'Coupling': ['coupling', '커플링'],
    'Chain': ['chain', '체인'],
    'Hook': ['hook', '훅', '후크'],
    'Drum': ['drum', '드럼'],
    'Sheave': ['sheave', '시브'],
    'Fuse': ['fuse', '퓨즈'],
    'O-Ring': ['o-ring', 'oring', '오링'],
    'Oil': ['oil', '오일', '유압유'],
    'Filter': ['filter', '필터'],
    'Bolt': ['bolt', 'bolting', '볼트', '볼팅'],
    'Cylinder': ['cylinder', 'cyl', '실린더'],
    'Grab': ['grab', '그랩'],
    'Trolley': ['trolley', '트롤리'],
    'Rail': ['rail', '레일'],
    'Bus Bar': ['bus bar', 'busbar', '버스바'],
    'Panel': ['panel', '패널'],
    'Remote Control': ['remote', '리모콘', '리모컨', '원격'],
}

# 이력에서 부품 교체 횟수 집계
parts_count = Counter()
parts_details = {key: [] for key in parts_keywords.keys()}

for history in data['histories']:
    desc = history.get('description', '').lower()
    date = history.get('date', '')
    eq_id = history.get('equipmentId', 0)
    
    # 설비 이름 찾기
    eq_name = next((eq['name'] for eq in data['equipments'] if eq['id'] == eq_id), '알 수 없음')
    
    for part_name, keywords in parts_keywords.items():
        for keyword in keywords:
            if keyword.lower() in desc:
                # 교체 관련 키워드 확인
                if any(action in desc for action in ['교체', '교환', '신품', '수리', '점검', '취부', '취외']):
                    parts_count[part_name] += 1
                    parts_details[part_name].append({
                        'date': date,
                        'equipment': eq_name,
                        'description': history.get('description', '')[:100]
                    })
                break

# 결과 출력
print("=== 부품별 교체/수리 횟수 ===\n")
for part, count in parts_count.most_common(30):
    print(f"{part}: {count}회")

print("\n\n=== 상위 10개 부품 상세 ===\n")
for part, count in parts_count.most_common(10):
    print(f"\n{part} ({count}회):")
    for detail in parts_details[part][:3]:
        print(f"  - {detail['date']}: {detail['equipment']} - {detail['description'][:50]}...")
