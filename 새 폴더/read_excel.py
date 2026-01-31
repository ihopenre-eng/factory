import pandas as pd
import json

output = []

# 크레인 기계 엑셀 파일 읽기
xl = pd.ExcelFile('크레인 기계(2026년도).xlsx')
output.append("=== 크레인 기계(2026년도).xlsx ===")
output.append(f"시트 목록: {xl.sheet_names}")

for sheet in xl.sheet_names[:3]:
    output.append(f"\n\n=== 시트: {sheet} ===")
    df = pd.read_excel(xl, sheet, header=None)
    output.append(f"컬럼 수: {len(df.columns)}, 행 수: {len(df)}")
    output.append("\n처음 20행:")
    output.append(df.head(20).to_string())

# 전기 엑셀 파일도 확인
output.append("\n\n\n=== Povim 크레인 전기(26년1월4주차).xlsx ===")
xl2 = pd.ExcelFile('Povim 크레인 전기(26년1월4주차).xlsx')
output.append(f"시트 목록: {xl2.sheet_names}")

for sheet in xl2.sheet_names[:2]:
    output.append(f"\n\n=== 시트: {sheet} ===")
    df = pd.read_excel(xl2, sheet, header=None)
    output.append(f"컬럼 수: {len(df.columns)}, 행 수: {len(df)}")
    output.append("\n처음 20행:")
    output.append(df.head(20).to_string())

with open('excel_analysis.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print("분석 결과가 excel_analysis.txt에 저장되었습니다.")
