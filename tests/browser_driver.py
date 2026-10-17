"""Small stdlib-only Chrome DevTools driver for real-time navigation tests."""
import base64
import json
import os
import socket
import struct
import subprocess
import time
import urllib.request
from urllib.parse import urlsplit

def login_flow(chrome, url, profile, log_path, result_id='auth-flow-result', viewport=None):
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0))
        debug_port = probe.getsockname()[1]
    log = log_path.open('w', encoding='utf-8')
    process = subprocess.Popen([chrome, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', f'--remote-debugging-port={debug_port}', f'--user-data-dir={profile}', 'about:blank' if viewport else url], stdout=log, stderr=log, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    channel = None
    try:
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{debug_port}/json/list', timeout=1) as response:
                    pages = json.load(response)
                target = next(page for page in pages if page['type'] == 'page')
                break
            except (OSError, StopIteration):
                time.sleep(.1)
        else:
            raise RuntimeError('Chrome debugging endpoint did not start.')
        address = urlsplit(target['webSocketDebuggerUrl'])
        channel = socket.create_connection((address.hostname, address.port), timeout=5)
        key = base64.b64encode(os.urandom(16)).decode()
        channel.sendall(f'GET {address.path} HTTP/1.1\r\nHost: {address.netloc}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode())
        handshake = b''
        while b'\r\n\r\n' not in handshake:
            handshake += channel.recv(1)
        if b' 101 ' not in handshake:
            raise RuntimeError('Chrome refused the debugging connection.')
        sequence = 0
        def read_exact(count):
            data = b''
            while len(data) < count:
                part = channel.recv(count - len(data))
                if not part: raise EOFError('Chrome debugging connection closed.')
                data += part
            return data
        def send(method, params=None, wait=True):
            nonlocal sequence
            sequence += 1
            payload = json.dumps({'id': sequence, 'method': method, 'params': params or {}}).encode()
            mask = os.urandom(4)
            size = len(payload)
            frame = bytes([0x81, 0x80 | size]) if size < 126 else bytes([0x81, 0xFE]) + struct.pack('!H', size)
            channel.sendall(frame + mask + bytes(byte ^ mask[i % 4] for i, byte in enumerate(payload)))
            if not wait: return
            while True:
                first, second = read_exact(2)
                length = second & 127
                if length == 126: length = struct.unpack('!H', read_exact(2))[0]
                elif length == 127: length = struct.unpack('!Q', read_exact(8))[0]
                incoming_mask = read_exact(4) if second & 128 else None
                data = read_exact(length)
                if incoming_mask:
                    data = bytes(byte ^ incoming_mask[i % 4] for i, byte in enumerate(data))
                if first & 15 == 8: raise EOFError('Chrome closed the debugging connection.')
                if first & 15 != 1: continue
                message = json.loads(data)
                if message.get('id') == sequence: return message
        def evaluate(expression):
            response = send('Runtime.evaluate', {'expression': expression, 'returnByValue': True})
            return response.get('result', {}).get('result', {}).get('value', '')
        if viewport:
            send('Emulation.setDeviceMetricsOverride', {'width': viewport[0], 'height': viewport[1], 'deviceScaleFactor': 1, 'mobile': True})
            send('Page.navigate', {'url': url})
        result = ''
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            try:
                result = evaluate('document.getElementById(' + json.dumps(result_id) + ')?.textContent || ""')
                if result: break
            except (OSError, EOFError):
                raise
            time.sleep(.1)
        html = evaluate('document.documentElement.outerHTML')
        send('Browser.close', wait=False)
        return result, html
    finally:
        if channel: channel.close()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.terminate()
            process.wait(timeout=5)
        log.close()
