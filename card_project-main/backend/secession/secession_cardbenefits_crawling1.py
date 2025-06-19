from playwright.sync_api import sync_playwright
import pandas as pd
import time

card_data = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    page.goto("https://card-search.naver.com/list?sortMethod=ri&ptn=2&bizType=CPC")
    time.sleep(2)

    # ✅ 더보기 버튼 클릭 반복
    for i in range(100):  # 최대 100회 클릭
        try:
            button = page.query_selector("button.more")
            if button:
                print(f"🔄 더보기 클릭 {i+1}회")
                button.click()
                time.sleep(2.5)
            else:
                print("📌 더 이상 '더보기' 버튼 없음. 종료.")
                break
        except Exception as e:
            print("❌ 더보기 클릭 오류:", e)
            break

    # ✅ 카드 항목 추출
    cards = page.query_selector_all("li.item")
    print(f"총 카드 수집 수: {len(cards)}")

    for card in cards:
        try:
            name = card.query_selector("b.name").inner_text().strip()
            desc_tag = card.query_selector("p.desc")
            desc = desc_tag.inner_text().strip() if desc_tag else ""

            fee_tag = card.query_selector("i.annual_fee")
            fee = fee_tag.inner_text().strip() if fee_tag else ""

            # ✅ 이미지 경로 추출
            img_tag = card.query_selector("div.preview img")
            img_src = img_tag.get_attribute("src") if img_tag else ""

            card_data.append({
                "card_name": name,
                "benefits": desc,
                "annul_fee": fee,
                "image_url": img_src
            })

        except Exception as e:
            print("❌ 카드 추출 오류:", e)
            continue

    browser.close()

# ✅ 엑셀 저장
df = pd.DataFrame(card_data)
df.to_excel("naver_cards_playwright.xlsx", index=False)
print("✅ 엑셀 저장 완료: naver_cards_playwright.xlsx")
