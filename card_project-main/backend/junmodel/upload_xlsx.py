import pandas as pd
from sqlalchemy import create_engine
import time

# DB 연결 정보
DB_USER = 'wms'
DB_PASSWORD = '1234'
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'card'
TABLE_NAME = 'pre_vip'

# DB 엔진 생성
engine = create_engine(
    f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}',
    pool_recycle=3600,
    pool_pre_ping=True
)

# 엑셀 경로
excel_path = '/home/wms/card/backend/secession/upgraded_vip_members_with_sms.xlsx'
chunksize = 5000

start_time = time.time()

# 엑셀은 chunk 읽기 불가능하므로 전체 읽고 나서 chunk로 나눔
df = pd.read_excel(excel_path)
total_rows = len(df)

# chunk 단위로 나눠서 DB 업로드
for i in range(0, total_rows, chunksize):
    chunk = df.iloc[i:i+chunksize]
    chunk_start = time.time()

    chunk.to_sql(
        name=TABLE_NAME,
        con=engine,
        if_exists='replace' if i == 0 else 'append',
        index=False,
        method='multi'
    )

    chunk_duration = time.time() - chunk_start
    print(f"✅ 청크 {i//chunksize + 1} (총 {len(chunk)}개) 업로드 완료 - 소요 시간: {chunk_duration:.2f}초")

total_duration = time.time() - start_time
print(f"\n⏱️ 전체 업로드 완료 - 총 소요 시간: {total_duration:.2f}초")
