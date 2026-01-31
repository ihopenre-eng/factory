import pandas as pd
import json
from datetime import datetime, date

def parse_date(val):
    """날짜 파싱"""
    if pd.isna(val):
        return None
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, date):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, str):
        # "7월23일" 형식 처리
        import re
        match = re.match(r'(\d+)월(\d+)일', val)
        if match:
            return f"2020-{int(match.group(1)):02d}-{int(match.group(2)):02d}"
    return None

def get_crane_type(sheet_name, title):
    """크레인 유형 판단"""
    title_lower = (title or '').lower()
    if 'hoist' in title_lower or 'jib' in title_lower:
        return '호이스트'
    if 'grab' in title_lower:
        return '갠트리크레인'
    if 'llc' in title_lower or '항만' in title_lower or 'port' in title_lower:
        return '갠트리크레인'
    return '천장크레인'

def parse_sheet(df, sheet_name, is_electric=False):
    """시트 파싱"""
    histories = []
    
    # 첫 행에서 제목 추출
    title = str(df.iloc[0, 0]) if not pd.isna(df.iloc[0, 0]) else sheet_name
    
    # 실제 데이터는 3행부터 시작 (0: 제목, 1: 날짜?, 2: 헤더)
    for i in range(3, len(df)):
        row = df.iloc[i]
        date_val = parse_date(row.iloc[0])
        content = str(row.iloc[1]) if not pd.isna(row.iloc[1]) else ''
        note = str(row.iloc[2]) if len(row) > 2 and not pd.isna(row.iloc[2]) else ''
        
        if date_val and content and content != 'nan':
            histories.append({
                'date': date_val,
                'description': content.strip(),
                'notes': note.strip() if note != 'nan' else '',
                'type': '전기수리' if is_electric else '기계수리'
            })
    
    return {
        'sheet_name': sheet_name,
        'title': title,
        'crane_type': get_crane_type(sheet_name, title),
        'histories': histories
    }

# 메인 처리
equipments = []
all_histories = []
equipment_id = 1
history_id = 1

# 크레인 기계 엑셀 파일 처리
print("크레인 기계(2026년도).xlsx 처리 중...")
xl_mech = pd.ExcelFile('크레인 기계(2026년도).xlsx')

for sheet in xl_mech.sheet_names:
    if sheet == '예비품':
        continue
    
    df = pd.read_excel(xl_mech, sheet, header=None)
    parsed = parse_sheet(df, sheet, is_electric=False)
    
    # 설비 정보 생성
    equipment = {
        'id': equipment_id,
        'name': parsed['title'].replace('기계 수리이력', '').replace('수리이력', '').strip(),
        'code': sheet.replace('(H)', ''),
        'type': parsed['crane_type'],
        'capacity': None,
        'location': '공장동',
        'manufacturer': '',
        'installDate': '2016-01-01',
        'status': '정상',
        'nextInspection': '2026-03-01',
        'notes': f'시트: {sheet}'
    }
    equipments.append(equipment)
    
    # 이력 정보 생성
    for h in parsed['histories']:
        history = {
            'id': history_id,
            'equipmentId': equipment_id,
            'date': h['date'],
            'type': '수리' if '수리' in h['description'] or '교체' in h['description'] else '정기점검',
            'technician': '정비팀',
            'description': h['description'],
            'result': '양호',
            'cost': 0,
            'notes': h['notes']
        }
        all_histories.append(history)
        history_id += 1
    
    equipment_id += 1

print(f"기계 엑셀: {len(equipments)}개 설비, {len(all_histories)}개 이력")

# 전기 엑셀 파일 처리 - 기존 설비에 이력 추가
print("\nPovim 크레인 전기(26년1월4주차).xlsx 처리 중...")
xl_elec = pd.ExcelFile('Povim 크레인 전기(26년1월4주차).xlsx')

for sheet in xl_elec.sheet_names:
    if sheet.startswith('Sheet'):
        continue
    
    df = pd.read_excel(xl_elec, sheet, header=None)
    parsed = parse_sheet(df, sheet, is_electric=True)
    
    # 기존 설비 찾기 (코드로 매칭)
    code = sheet.replace('(H)', '').strip()
    existing_eq = next((eq for eq in equipments if eq['code'] == code), None)
    
    if existing_eq:
        eq_id = existing_eq['id']
    else:
        # 새 설비 생성
        equipment = {
            'id': equipment_id,
            'name': parsed['title'].replace('전기 수리이력', '').replace('수리이력', '').strip(),
            'code': code,
            'type': parsed['crane_type'],
            'capacity': None,
            'location': '공장동',
            'manufacturer': '',
            'installDate': '2016-01-01',
            'status': '정상',
            'nextInspection': '2026-03-01',
            'notes': f'시트: {sheet} (전기)'
        }
        equipments.append(equipment)
        eq_id = equipment_id
        equipment_id += 1
    
    # 이력 추가
    for h in parsed['histories']:
        history = {
            'id': history_id,
            'equipmentId': eq_id,
            'date': h['date'],
            'type': '수리',
            'technician': '전기팀',
            'description': h['description'],
            'result': '양호',
            'cost': 0,
            'notes': h['notes']
        }
        all_histories.append(history)
        history_id += 1

print(f"총합: {len(equipments)}개 설비, {len(all_histories)}개 이력")

# JSON 파일로 저장
output = {
    'equipments': equipments,
    'histories': all_histories,
    'schedules': [
        {'id': 1, 'equipmentId': 1, 'date': '2026-02-15', 'type': '정기점검', 'technician': '정비팀', 'notes': '월간 정기점검'},
        {'id': 2, 'equipmentId': 2, 'date': '2026-02-20', 'type': '안전검사', 'technician': '안전팀', 'notes': '법정 안전검사'}
    ],
    'notifications': [],
    'exportDate': datetime.now().isoformat()
}

with open('crane_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅ crane_data.json 파일이 생성되었습니다!")
print(f"   - 설비: {len(equipments)}개")
print(f"   - 이력: {len(all_histories)}개")
