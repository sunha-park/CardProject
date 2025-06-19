import pandas as pd

# 파일 경로
vip_07_path = '/home/wms/csv/dummy_data 1.csv'
vip_08_path = '/home/wms/csv/vip_08.csv'
member_path = '/home/wms/csv/card_approvedsales_07.csv'

# 사용할 컬럼 목록 정의
use_columns_member = [
    '발급회원번호',
    '이용금액_쇼핑',
    '이용금액_요식',
    '이용금액_교통',
    '이용금액_의료',
    '이용금액_납부',
    '이용금액_교육',
    '이용금액_여유생활',
    '이용금액_사교활동',
    '이용금액_일상생활',
    '이용금액_해외'
]

# CSV 파일 읽기 (필요한 컬럼만)
vip07 = pd.read_csv(vip_07_path, usecols=['발급회원번호', '예측등급'])
vip08 = pd.read_csv(vip_08_path, usecols=['발급회원번호', '예측값'])
member = pd.read_csv(member_path, usecols=use_columns_member)

vip07_code_dist = vip07['예측등급'].value_counts()
vip08_code_dist = vip08['예측값'].value_counts()

print("🔍 7월 등급 코드 분포:\n", vip07_code_dist)
print("🔍 8월 등급 코드 분포:\n", vip08_code_dist)

# 컬럼명 구분을 위해 명시적 변경
vip07.rename(columns={'예측등급': 'VIP등급코드_07'}, inplace=True)
vip08.rename(columns={'예측값': 'VIP등급코드_08'}, inplace=True)

# 회원번호 기준 병합
merged = pd.merge(vip07, vip08, on='발급회원번호')
print(merged.columns)

# 등급 코드 컬럼을 숫자로 변환 (오류 방지용 옵션 포함)
merged['VIP등급코드_07'] = pd.to_numeric(merged['VIP등급코드_07'], errors='coerce')
merged['VIP등급코드_08'] = pd.to_numeric(merged['VIP등급코드_08'], errors='coerce')

# 등급 차이 계산
merged['등급차이'] = abs(merged['VIP등급코드_08'] - merged['VIP등급코드_07'])

# 등급이 상승한 고객 필터링
upgraded = merged[merged['등급차이'].isin([1, 2])]

print("전체 병합 결과 개수:", len(merged))
print("등급차이 1 또는 2인 고객 수:", len(upgraded))
print(merged['등급차이'].value_counts())

member['발급회원번호'] = member['발급회원번호'].str.strip()
vip07['발급회원번호'] = vip07['발급회원번호'].str.strip()
vip08['발급회원번호'] = vip08['발급회원번호'].str.strip()

# member 정보 조인 (다양한 이용금액 컬럼 포함)
final = pd.merge(upgraded, member, on='발급회원번호', how='left')

# 컬럼명 영문으로 변경
column_rename_map = {
    'VIP등급코드_07': 'vip_07',
    'VIP등급코드_08': 'vip_08',
    '등급차이': 'vip_diff',
    '발급회원번호': 'vip_id',
    '이용금액_쇼핑': 'shopping_amount',
    '이용금액_요식': 'dining_amount',
    '이용금액_교통': 'transport_amount',
    '이용금액_의료': 'medical_amount',
    '이용금액_납부': 'payment_amount',
    '이용금액_교육': 'education_amount',
    '이용금액_여유생활': 'leisure_amount',
    '이용금액_사교활동': 'social_amount',
    '이용금액_일상생활': 'daily_amount',
    '이용금액_해외': 'overseas_amount'
}

final.rename(columns=column_rename_map, inplace=True)

print(upgraded['발급회원번호'].isin(member['발급회원번호']).sum())

# 결과 저장
final.to_csv('upgraded_vip_members.csv', index=False)

# 결과 확인
print(final.head())



