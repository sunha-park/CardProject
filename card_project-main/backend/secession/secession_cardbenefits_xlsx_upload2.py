import pandas as pd
from sqlalchemy import create_engine
import re

def parse_annul_fee_split(text):
    if not isinstance(text, str):
        return 0, 0
    text = text.replace("원", "").replace(",", "")
    dom, foreign = 0, 0

    def parse_korean_fee(korean):
        num = 0
        if "만" in korean:
            parts = korean.split("만")
            num += int(parts[0]) * 10000
            if len(parts) > 1 and "천" in parts[1]:
                num += int(parts[1].replace("천", "")) * 1000
        elif "천" in korean:
            num += int(korean.replace("천", "")) * 1000
        elif korean.isdigit():
            num = int(korean)
        return num

    match_dom = re.search(r"국내\s*([0-9만천]+)", text)
    match_for = re.search(r"해외\s*([0-9만천]+)", text)

    if match_dom:
        dom = parse_korean_fee(match_dom.group(1))
    if match_for:
        foreign = parse_korean_fee(match_for.group(1))

    return dom, foreign

# 1. 엑셀 파일 불러오기
df1 = pd.read_excel("naver_cards_playwright.xlsx")
df2 = pd.read_excel("vip_members.xlsx")

# 2. MariaDB 연결 정보
DB_USER = 'card'
DB_PASSWORD = '1234'
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'card'

# annul_fee를 domestic, foreign으로 분리
df1[['annul_fee_domestic', 'annul_fee_foreign']] = df1['annul_fee'].apply(
    lambda x: pd.Series(parse_annul_fee_split(x))
)
df1 = df1.drop(columns=['annul_fee'])  # 원문 필요 없으면 삭제

# 3. SQLAlchemy 엔진 생성
engine = create_engine(
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

# 4. 테이블에 업로드 (덮어쓰기 or 이어붙이기 선택)
df1.to_sql(name='vip_cards', con=engine, if_exists='replace', index=False)
df2.to_sql(name='vip_members', con=engine, if_exists='replace', index=False)

# if_exists='replace': 기존 테이블 삭제 후 새로 생성
# if_exists='append': 기존 테이블 유지하고 뒤에 추가

print("✅ 엑셀 데이터를 MariaDB에 업로드 완료!")
