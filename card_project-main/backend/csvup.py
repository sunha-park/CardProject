import pandas as pd
import mysql.connector

# ✅ 1. CSV 파일 목록 (로컬에 있는 월별 CSV 파일 경로)
csv_files = [
    './202411cu.csv',
    './202412cu.csv',
    './202501cu.csv',
    './202502cu.csv',
    './202503cu.csv',
    './202504cu.csv'
]

# ✅ 2. pandas 타입을 MySQL 타입으로 변환
def map_dtype(dtype):
    if 'int' in str(dtype):
        return 'INT'
    elif 'float' in str(dtype):
        return 'BIGINT'
    else:
        return 'VARCHAR(255)'

# ✅ 3. MySQL 연결
conn = mysql.connector.connect(
    host='localhost',
    user='card',
    password='1234',
    database='card'
)
cursor = conn.cursor()

# ✅ 4. 첫 번째 CSV 파일을 기준으로 테이블 스키마 구성
first_df = pd.read_csv(csv_files[0], encoding='utf-8-sig')
columns = first_df.columns
dtypes = first_df.dtypes
table_name = 'collection_list'

# ✅ 5. 테이블 삭제 후 재생성
cursor.execute(f"DROP TABLE IF EXISTS {table_name};")

create_table_sql = f"CREATE TABLE {table_name} (\n"
for col, dtype in zip(columns, dtypes):
    sql_type = map_dtype(dtype)
    create_table_sql += f"  `{col}` {sql_type},\n"
create_table_sql = create_table_sql.rstrip(',\n') + '\n);'

cursor.execute(create_table_sql)
print(f"✅ 테이블 {table_name} 생성 완료")

# ✅ 6. CSV 파일들 반복하여 삽입
placeholders = ','.join(['%s'] * len(columns))
insert_sql = f"INSERT INTO {table_name} ({','.join(columns)}) VALUES ({placeholders})"

for csv_path in csv_files:
    print(f"📥 삽입 중: {csv_path}")
    df = pd.read_csv(csv_path, encoding='utf-8-sig')
    for _, row in df.iterrows():
        cursor.execute(insert_sql, tuple(row))

# ✅ 7. 커밋 및 연결 종료
conn.commit()
cursor.close()
conn.close()

print("🎉 모든 CSV 파일이 MySQL 테이블에 성공적으로 업로드되었습니다!")
