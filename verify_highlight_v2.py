import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1000, 'height': 800})

        import os
        file_path = "file://" + os.path.abspath("src/renderer/chat-window.html")
        await page.goto(file_path)

        await page.evaluate("document.body.classList.add('dark-mode')")

        await page.fill('#chatInput', '/test some arguments')
        await asyncio.sleep(0.5)

        await page.locator('.input-container').screenshot(path='highlight_check.png')

        backdrop_html = await page.inner_html('#inputBackdrop')
        print(f"Backdrop HTML: {backdrop_html}")

        await browser.close()

asyncio.run(run())
