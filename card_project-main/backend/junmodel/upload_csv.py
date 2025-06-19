import pandas as pd
from sqlalchemy import create_engine
import time

# DB 연결 정보
DB_USER = 'wms'
DB_PASSWORD = '1234'  # 실제 비밀번호 입력
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'card'
TABLE_NAME = 'pre_vip' #테이블 이름 수정

# DB 엔진 생성
engine = create_engine(
    f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}',
    pool_recycle=3600,     # 1시간마다 연결 재활용
    pool_pre_ping=True     # 연결이 살아있는지 사전 체크
)

# CSV 경로
csv_path = '/home/wms/card/backend/secession/upgraded_vip_members.csv' # 파일명 수정

chunksize = 5000  # 청크 갯수 수정

start_time = time.time()  # 전체 시작 시간 기록
'''
# 한 번만 10,000개 읽어서 업로드
for chunk in pd.read_csv(csv_path, chunksize=chunksize):
    chunk_start = time.time()

    chunk.to_sql(
        name=TABLE_NAME,
        con=engine,
        if_exists='replace',  # 새로 생성
        index=False,
        method='multi'
    )

    chunk_duration = time.time() - chunk_start

# CSV를 청크 단위로 읽고, 각 청크를 DB에 삽입
for chunk in pd.read_csv(csv_path, chunksize=chunksize):
    chunk.to_sql(
        name=TABLE_NAME,
        con=engine,
        if_exists='replace' if first_chunk else 'append',
        index=False,
        method='multi'
    )
    first_chunk = False
'''
# 최대 i번만 반복 (총 i만개 업로드) 
for i, chunk in enumerate(pd.read_csv(csv_path, chunksize=chunksize, encoding='utf-8')):
    if i >= 20: #i 수정
        break  # 반복 5번 넘어가면 종료

    chunk_start = time.time()  # 청크 시작 시간

    chunk.to_sql(
        name=TABLE_NAME,
        con=engine,
        if_exists='replace' if i == 0 else 'append',
        index=False,
        method='multi'
    )

    chunk_duration = time.time() - chunk_start
    print(f"✅ 청크 {i+1} (총 {len(chunk)}개) 업로드 완료 - 소요 시간: {chunk_duration:.2f}초")

total_duration = time.time() - start_time
print(f"\n⏱️ 전체 업로드 완료 - 총 소요 시간: {total_duration:.2f}초")
