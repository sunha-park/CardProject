def preprocess_feature(data):
    print("preprocess 실행")
    data['VIP등급코드'] = data['VIP등급코드'].str.replace("_","0").astype(int)
    data['연령'] = data['연령'].str.replace('대|이상','',regex=True).astype(int)
    # 이용건수 합치기 예시
    data['이용건수_B0M'] = data[['이용건수_일시불_B0M', '이용건수_체크_B0M', '이용건수_할부_B0M']].sum(axis=1)
 
    # 이용금액 합치기 예시
    data['이용금액_B0M'] = data[['이용금액_일시불_B0M', '이용금액_체크_B0M', '이용금액_할부_B0M']].sum(axis=1)
 
    # 이용개월수 합치기 예시
    data['이용개월수_R12M'] = data[['이용개월수_일시불_R12M', '이용개월수_할부_R12M', '이용개월수_체크_R12M']].sum(axis=1)
 
    # 유효카드수 합치기 예시
    data['유효카드수_총합'] = data[['유효카드수_신용체크', '유효카드수_신용', '유효카드수_체크']].sum(axis=1)
 
    # 최종 이용일자 최신값 선택 (datetime이라 .max()가 정확히 동작함)
    data['최종이용일자_종합'] = data[['최종이용일자_일시불', '최종이용일자_체크', '최종이용일자_할부']].max(axis=1)
 
    # 필요 없는 원본 컬럼 제거 (존재하는 컬럼만)
    cols_to_drop = [
        '이용건수_일시불_B0M', '이용건수_체크_B0M', '이용건수_할부_B0M',
        '이용금액_일시불_B0M', '이용금액_체크_B0M', '이용금액_할부_B0M',
        '이용개월수_일시불_R12M', '이용개월수_할부_R12M', '이용개월수_체크_R12M',
        '유효카드수_신용체크', '유효카드수_신용', '유효카드수_체크',
        '최종이용일자_일시불', '최종이용일자_체크', '최종이용일자_할부','발급회원번호'
    ]
    drop_cols = [col for col in cols_to_drop if col in data.columns]
    data.drop(columns=drop_cols, inplace=True)
    print("전처리끝")
    return data