import asyncio
from playwright.async_api import async_playwright
import threading
import http.server
import socketserver
import time

PORT = 8005
DIRECTORY = "C:\\Users\\OnurÖzbişirici\\Desktop\\YALIN ÜRETİM\\smartpress-dashboard"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

async def main():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(2)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"Browser Console: {msg.type} {msg.text}"))
        
        url = f"http://localhost:{PORT}/"
        try:
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(1000)
            
            options = await page.evaluate("Array.from(document.getElementById('totalStrokeSelect').options).map(o => o.value)")
            print("Sayfa yuklendi. Options:", options)
            
            # Test 1: Opsiyonel 750mm Test (EH series default)
            print("--- Test 1: Opsiyonel Strok (750mm) ---")
            await page.select_option("#totalStrokeSelect", "750")
            await page.evaluate("document.getElementById('totalStrokeSelect').dispatchEvent(new Event('change'))")
            await page.wait_for_timeout(500)
            
            val_fast = await page.inner_text("#valFast")
            print(f"Hizli Yaklasma Beklenen: 660 mm, Gerceklesen: {val_fast}")
            
            # Test 2: Slider Steps and Auto-Calculation
            print("--- Test 2: Slider Etkilesimi ---")
            await page.fill("#pressStroke", "100")
            await page.evaluate("document.getElementById('pressStroke').dispatchEvent(new Event('input'))")
            await page.wait_for_timeout(500)
            val_fast = await page.inner_text("#valFast")
            print(f"Hizli Yaklasma Beklenen: 610 mm, Gerceklesen: {val_fast}")

            # Test 3: EM Series Semantic Rules
            print("--- Test 3: EM Serisi RPM Kurallari ---")
            await page.select_option("#seriesSelect", "SP-EM")
            await page.evaluate("document.getElementById('seriesSelect').dispatchEvent(new Event('change'))")
            await page.wait_for_timeout(500)
            
            max_rpm = await page.evaluate("document.getElementById('rpmSlider').max")
            print(f"EM Max RPM Beklenen: 5500, Gerceklesen: {max_rpm}")
            
            options = await page.evaluate("Array.from(document.getElementById('totalStrokeSelect').options).map(o => o.value)")
            print(f"EM Toplam Strok Secenekleri (750 olmamali): {options}")
            
        except Exception as e:
            await page.screenshot(path="error.png")
            print(f"Hata: {e}")
            
        await browser.close()

asyncio.run(main())
