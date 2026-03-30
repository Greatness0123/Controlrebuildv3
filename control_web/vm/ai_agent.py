import asyncio
import base64
import json
import logging
import os
import time
from typing import Dict, Any
import pyautogui
from websockets.server import serve
from PIL import Image
import io
import mss
from supabase import create_client, Client

pyautogui.FAILSAFE = False
os.environ['DISPLAY'] = ':1'

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VM-Agent")

class VMAgent:
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_KEY")
        self.vm_id = os.environ.get("VM_ID")
        self.client: Client = None
        self.channel = None
        self.is_streaming = False
        self.sct = mss.mss()

        if self.supabase_url and self.supabase_key:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
                logger.info(f"Connected to Supabase for VM {self.vm_id}")
            except Exception as e:
                logger.error(f"Failed to connect to Supabase: {e}")

    async def start_signaling(self):
        if not self.client or not self.vm_id:
            logger.warning("Signaling disabled: Supabase config missing")
            return

        channel_name = f"vm_control:{self.vm_id}"
        self.channel = self.client.channel(channel_name)

        def on_broadcast(payload):
            event = payload.get('event')
            data = payload.get('payload', {})
            logger.info(f"Signaling event: {event}")

            if event == 'request_stream':
                self.is_streaming = True
            elif event == 'stop_stream':
                self.is_streaming = False
            elif event == 'action':
                asyncio.create_task(self.handle_action(data))

        self.channel.on('broadcast', {'event': '*'}, on_broadcast).subscribe()
        logger.info(f"Subscribed to channel: {channel_name}")

        while True:
            if self.is_streaming:
                await self.send_screen_update()
            await asyncio.sleep(0.1) # 10 FPS

    async def send_screen_update(self):
        try:
            # Capture using mss for speed
            monitor = self.sct.monitors[1]
            img = self.sct.grab(monitor)
            pil_img = Image.frombytes("RGB", img.size, img.bgra, "raw", "BGRX")

            # Compress for transit
            buffer = io.BytesIO()
            pil_img.save(buffer, format="JPEG", quality=70)
            encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')

            if self.channel:
                self.channel.send({
                    "type": "broadcast",
                    "event": "screen_update",
                    "payload": {"image": f"data:image/jpeg;base64,{encoded}"}
                })
        except Exception as e:
            logger.error(f"Failed to send screen update: {e}")

    async def handle_action(self, data):
        action_type = data.get('type')
        if action_type == 'mouse_move':
            await self.execute('mouse_move', data)
        elif action_type == 'click':
            await self.execute('click', data)
        elif action_type == 'key_press':
            await self.execute('key', data)

    async def handle_client(self, websocket):
        logger.info("New connection to VM Agent via WebSocket")
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get('type')
                    
                    if msg_type == 'command':
                        cmd_data = data.get('data', {})
                        command = cmd_data.get('command')
                        params = cmd_data.get('parameters', {})
                        
                        logger.info(f"Executing local command: {command}")
                        result = await self.execute(command, params)
                        
                        await websocket.send(json.dumps({
                            "type": "result",
                            "data": result
                        }))
                    elif msg_type == 'ping':
                        await websocket.send(json.dumps({"type": "pong"}))
                except Exception as e:
                    logger.error(f"Error processing websocket message: {e}")
                    await websocket.send(json.dumps({
                        "type": "error",
                        "data": {"error": str(e)}
                    }))
        except Exception as e:
            logger.info(f"WebSocket connection closed: {e}")

    async def execute(self, command: str, params: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if command == "screenshot":
                shot = pyautogui.screenshot()
                img_byte_arr = io.BytesIO()
                shot.save(img_byte_arr, format='PNG')
                encoded = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
                return {"success": True, "screenshot": encoded}

            elif command == "click":
                x_norm, y_norm = params.get('x'), params.get('y')
                if x_norm is not None and y_norm is not None:
                    screen_width, screen_height = pyautogui.size()
                    x = int((x_norm / 1000.0) * screen_width)
                    y = int((y_norm / 1000.0) * screen_height)
                    pyautogui.click(x, y)
                    return {"success": True}
                return {"success": False, "error": "Missing coordinates"}

            elif command == "mouse_move":
                x_norm, y_norm = params.get('x'), params.get('y')
                if x_norm is not None and y_norm is not None:
                    screen_width, screen_height = pyautogui.size()
                    x = int((x_norm / 1000.0) * screen_width)
                    y = int((y_norm / 1000.0) * screen_height)
                    pyautogui.moveTo(x, y)
                    return {"success": True}
                return {"success": False, "error": "Missing coordinates"}

            elif command == "type":
                text = params.get('text', '')
                pyautogui.write(text)
                return {"success": True}

            elif command == "key":
                key = params.get('key', '')
                pyautogui.press(key)
                return {"success": True}

            elif command == "scroll":
                direction = params.get('direction', 'down')
                amount = 10 if direction == 'down' else -10
                pyautogui.scroll(amount)
                return {"success": True}

            return {"success": False, "error": f"Unknown command: {command}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

async def main():
    agent = VMAgent()
    logger.info("Starting VM Agent on port 8080...")

    # Start signaling task
    asyncio.create_task(agent.start_signaling())

    async with serve(agent.handle_client, "0.0.0.0", 8080):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
