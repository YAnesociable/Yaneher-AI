"""Video inspection server for Yaneher Community v12.

Runs FFmpeg through the full timeline (scene cuts, silence, loudness), sends the whole
file with audio to Gemini Files API (editing review + copyright-risk pre-check) and,
optionally, identifies music by audio fingerprint (Chromaprint + AcoustID).
Returns timecoded measurements. Never claims confirmed copyright violations.
Start: uvicorn worker:app --host 0.0.0.0 --port 8080
"""
import base64
import json
import math
import os
import re
import subprocess
import tempfile
import asyncio
import shutil
import httpx
from io import BytesIO
from pathlib import Path
from typing import Any
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageChops, ImageStat

MAX_BYTES = int(os.getenv("VIDEO_MAX_MB", "150")) * 1024 * 1024
MAX_SECONDS = int(os.getenv("VIDEO_MAX_DURATION", "600"))
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
SEGMENT_SECONDS = max(30, min(int(os.getenv("VIDEO_SEGMENT_SECONDS", "120")), 240))
ACOUSTID_API_KEY = os.getenv("ACOUSTID_API_KEY", "").strip()
FPCALC = shutil.which("fpcalc")
RISK_LEVELS = ("low", "medium", "high")
RISK_TYPES = ("music", "footage", "image", "logo", "voice", "other")
COPYRIGHT_DISCLAIMER = "Проверка ЯнеAI носит рекомендательный характер и не гарантирует отсутствие блокировок или ограничений после публикации."
ORIGINS = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "").split(",") if x.strip()]
app = FastAPI(title="YaneCLIBB Video Worker", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["POST", "GET"], allow_headers=["Authorization", "Content-Type"])


def run(args: list[str], timeout: float) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(504, "Время обработки FFmpeg истекло") from exc


def inspect_ffprobe(path: str) -> dict[str, Any]:
    r = run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", path], timeout=16)
    if r.returncode:
        raise HTTPException(422, "Файл не декодируется FFprobe")
    try:
        raw = json.loads(r.stdout)
        video = next(s for s in raw["streams"] if s.get("codec_type") == "video")
    except (KeyError, StopIteration, ValueError) as exc:
        raise HTTPException(422, "В файле нет распознаваемого видеопотока") from exc
    audio = next((s for s in raw.get("streams", []) if s.get("codec_type") == "audio"), None)
    fps_raw = video.get("avg_frame_rate", "0/1")
    try:
        n, d = fps_raw.split("/")
        fps = round(int(n) / int(d), 3) if int(d) else None
    except (ValueError, ZeroDivisionError):
        fps = None
    duration = float(raw.get("format", {}).get("duration") or video.get("duration") or 0)
    if not (0 < duration <= MAX_SECONDS):
        raise HTTPException(413, f"Допустимая длительность: до {MAX_SECONDS} секунд")
    return {
        "width": video.get("width"),
        "height": video.get("height"),
        "fps": fps,
        "duration": round(duration, 3),
        "videoCodec": video.get("codec_name"),
        "hasAudio": bool(audio),
        "audioCodec": audio.get("codec_name") if audio else None,
        "sampleStep": max(1, duration / 120),
    }


def get_scenes(path: str) -> list[float]:
    # This filter decodes frames across the entire video; not three screenshots.
    r = run(["ffmpeg", "-nostdin", "-hide_banner", "-i", path, "-vf", "select=gt(scene\\,0.28),showinfo", "-an", "-f", "null", "-"], timeout=110)
    vals = [float(v) for v in re.findall(r"pts_time:([0-9]+(?:\.[0-9]+)?)", r.stderr)]
    return sorted({round(v, 2) for v in vals})[:200]


def get_audio(path: str, has_audio: bool) -> dict[str, Any]:
    if not has_audio:
        return {"available": False, "silences": [], "integratedLufs": None}
    r = run(["ffmpeg", "-nostdin", "-hide_banner", "-i", path, "-vn", "-af", "silencedetect=noise=-32dB:d=0.45,ebur128", "-f", "null", "-"], timeout=110)
    starts = [float(v) for v in re.findall(r"silence_start:\s*([0-9.]+)", r.stderr)]
    ends = [float(v) for v in re.findall(r"silence_end:\s*([0-9.]+)", r.stderr)]
    silences = [{"start": round(s, 2), "end": round(ends[i], 2)} for i, s in enumerate(starts) if i < len(ends) and ends[i] > s][:60]
    # FFmpeg ebur128 summary: avoid reporting arbitrary loudness as speech intelligibility.
    matches = re.findall(r"Integrated loudness:\s*I:\s*([-+]?\d+(?:\.\d+)?) LUFS", r.stderr)
    lufs = float(matches[-1]) if matches else None
    return {"available": True, "silences": silences, "integratedLufs": lufs,
            "note": "Уровни и тишина обнаружены технически; качество речи и музыка не распознаны."}


def analyze_frames(path: str, folder: str, duration: float, step: float) -> dict[str, Any]:
    pattern = str(Path(folder) / "s%04d.jpg")
    rate = f"fps=1/{step:.5f},scale=240:-1"
    r = run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-i", path,
             "-vf", rate, "-frames:v", "121", "-q:v", "6", pattern], timeout=110)
    if r.returncode:
        return {"samples": [], "events": [], "representativeFrames": []}
    files = sorted(Path(folder).glob('s*.jpg'))
    readings = []
    prev = None
    for i, file in enumerate(files):
        with Image.open(file) as image:
            image = image.convert('L').resize((32, 32))
            avg = float(ImageStat.Stat(image).mean[0])
            dif = float(ImageStat.Stat(ImageChops.difference(image, prev)).mean[0]) if prev else 0
            readings.append({"time": round(min(duration, i * step), 2), "brightness": round(avg, 1), "difference": round(dif, 1)})
            prev = image.copy()
    events = []
    for s in readings:
        if s['brightness'] < 26:
            events.append({"time": s['time'], "type": "dark", "note": "Очень тёмный кадр; проверь детали и субтитры."})
        elif s['brightness'] > 235:
            events.append({"time": s['time'], "type": "bright", "note": "Возможный пересвет; проверь видимость деталей."})
        if s['difference'] < 2 and s['time'] > 0 and step >= 1:
            events.append({"time": s['time'], "type": "static", "note": "Почти неизменная картинка между выборками; возможно, пауза."})
    frames = []
    limit = min(20, len(files))
    for i in range(limit):
        idx = round(i*(len(files)-1)/max(1,limit-1))
        data = files[idx].read_bytes()
        frames.append({"time": readings[idx]['time'], "image": "data:image/jpeg;base64,"+base64.b64encode(data).decode('ascii')})
    return {"samples": readings, "events": events[:90], "representativeFrames": frames}



async def authorize_and_claim(authorization: str | None) -> str:
    """Validate Supabase JWT, bans/mutes and the 15-second YaneAI limit, entirely server-side."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not GEMINI_API_KEY:
        raise HTTPException(503, 'Сервер анализа видео не настроен: нужны ключи Supabase и Gemini')
    if not authorization or not authorization.startswith('Bearer ') or len(authorization) > 5000:
        raise HTTPException(401, 'Сначала войди в аккаунт')
    headers = {'apikey': SUPABASE_ANON_KEY, 'Authorization': authorization}
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(SUPABASE_URL + '/auth/v1/user', headers=headers)
            if res.status_code != 200 or not res.json().get('id'):
                raise HTTPException(401, 'Сессия Supabase не подтверждена')
            claim = await client.post(SUPABASE_URL + '/rest/v1/rpc/v11_claim_ai', headers=headers, json={})
            if claim.status_code != 200:
                try:
                    message = str(claim.json().get('message') or '')
                except ValueError:
                    message = ''
                if message.startswith('SANCTION:'):
                    raise HTTPException(403, message.replace('SANCTION:', '', 1).strip()[:240])
                raise HTTPException(403, 'Доступ к ЯнеИИ ограничен. Проверь роль или блокировку.')
            remaining = int(claim.json())
            if remaining > 0:
                raise HTTPException(429, f'Подожди {remaining} с перед следующим запросом ЯнеИИ')
            return res.json()['id']
        except httpx.HTTPError as ex:
            raise HTTPException(503, 'Не удалось связаться с Supabase для проверки аккаунта') from ex


def _seconds(value: Any, lo: float, hi: float) -> float | None:
    """Accept seconds (number) or 'MM:SS' / 'HH:MM:SS'; clamp into the analysed segment."""
    try:
        if isinstance(value, str) and ':' in value:
            parts = [float(p) for p in value.strip().split(':')]
            total = 0.0
            for p in parts:
                total = total * 60 + p
            value = total
        num = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(num):
        return None
    return round(min(hi, max(lo, num)), 2)


def normalize_risks(raw: Any, lo: float, hi: float) -> list[dict[str, Any]]:
    """Validate model output. Model findings are ALWAYS marked as assumptions, never as confirmed violations."""
    out: list[dict[str, Any]] = []
    if not isinstance(raw, list):
        return out
    for item in raw[:25]:
        if not isinstance(item, dict):
            continue
        start = _seconds(item.get('start'), lo, hi)
        end = _seconds(item.get('end'), lo, hi)
        if start is None:
            continue
        if end is None or end < start:
            end = start
        level = str(item.get('level', '')).lower()
        rtype = str(item.get('type', '')).lower()
        out.append({
            'start': start, 'end': end,
            'level': level if level in RISK_LEVELS else 'medium',
            'type': rtype if rtype in RISK_TYPES else 'other',
            'description': str(item.get('description') or '')[:400],
            'reason': str(item.get('reason') or '')[:400],
            'recommendation': str(item.get('recommendation') or '')[:400],
            'certainty': 'uncertain' if str(item.get('certainty', '')).lower() != 'likely' else 'likely',
            'source': 'gemini',
        })
    return out


def fingerprint_music(path: str, duration: float, has_audio: bool, folder: str) -> dict[str, Any]:
    """Optional real music identification: Chromaprint fingerprints of 30 s windows -> AcoustID lookup.
    A missing match does NOT prove absence of copyrighted music; a match does NOT reveal license status."""
    info: dict[str, Any] = {'enabled': bool(ACOUSTID_API_KEY and FPCALC), 'checkedWindows': 0, 'matches': []}
    if not info['enabled']:
        info['note'] = 'Распознавание музыки по аудиоотпечатку не подключено (ACOUSTID_API_KEY и fpcalc). Музыка оценивается только моделью.'
        return info
    if not has_audio:
        info['note'] = 'В видео нет аудиодорожки.'
        return info
    window = 30.0
    starts = [i * window for i in range(int(min(duration, 600) // window) + 1) if i * window < duration - 5][:20]
    with httpx.Client(timeout=12.0) as client:
        for start in starts:
            wav = str(Path(folder) / f'fp_{int(start)}.wav')
            cut = run(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-ss', f'{start:.2f}', '-t', f'{window:.2f}',
                       '-i', path, '-vn', '-ac', '1', '-ar', '11025', '-y', wav], timeout=40)
            if cut.returncode or not Path(wav).exists():
                continue
            fp = run([FPCALC, '-json', wav], timeout=30)
            Path(wav).unlink(missing_ok=True)
            try:
                data = json.loads(fp.stdout)
                fingerprint, fp_duration = data['fingerprint'], int(float(data['duration']))
            except (ValueError, KeyError, TypeError):
                continue
            info['checkedWindows'] += 1
            try:
                r = client.post('https://api.acoustid.org/v2/lookup', data={
                    'client': ACOUSTID_API_KEY, 'meta': 'recordings', 'duration': str(fp_duration), 'fingerprint': fingerprint})
                payload = r.json()
            except (httpx.HTTPError, ValueError):
                info['note'] = 'AcoustID временно недоступен; проверка отпечатков неполная.'
                break
            for res in (payload.get('results') or [])[:2]:
                score = float(res.get('score') or 0)
                recs = res.get('recordings') or []
                if score < 0.6 or not recs:
                    continue
                rec = recs[0]
                artists = ', '.join(a.get('name', '') for a in rec.get('artists', []) if a.get('name'))
                info['matches'].append({'start': round(start, 2), 'end': round(min(duration, start + window), 2),
                                        'score': round(score, 2), 'title': str(rec.get('title') or 'Без названия')[:160],
                                        'artist': artists[:160] or 'Неизвестный исполнитель', 'recordingId': rec.get('id')})
                break
            run(['sleep', '0.35'], timeout=3)  # AcoustID allows ~3 requests/second
    return info


async def analyze_with_gemini(path: str, mime: str, metadata: dict, cuts: list[float], audio: dict, language: str = 'ru',
                              question: str = '', mode: str = 'both', emit=None) -> dict[str, Any]:
    """Upload the entire file (including sound) to Google Files API, analyze every segment.

    Gemini chooses its own internal frame sampling; scanning each actual video frame
    is separately performed by FFmpeg get_scenes(). Claims must reflect this.
    """
    async def progress(stage: str, value: float, label: str) -> None:
        if emit:
            await emit({'type': 'stage', 'stage': stage, 'progress': round(value, 3), 'label': label})

    size = os.path.getsize(path)
    host = 'https://generativelanguage.googleapis.com'
    key_headers = {'x-goog-api-key': GEMINI_API_KEY}
    filename = None
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=20, read=120, write=240, pool=15), follow_redirects=False) as client:
        try:
            await progress('gemini_upload', 0.42, 'Передача файла со звуком в Gemini Files API')
            initial = await client.post(host + '/upload/v1beta/files', headers={
                **key_headers,
                'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': str(size), 'X-Goog-Upload-Header-Content-Type': mime,
                'Content-Type': 'application/json',
            }, json={'file': {'display_name': 'YaneCLIBB video analysis'}})
            if initial.status_code not in (200, 201):
                raise HTTPException(502, 'Gemini Files API: ' + str(initial.status_code) + ' ' + initial.text[:200])
            upload_url = initial.headers.get('X-Goog-Upload-URL', '')
            if not upload_url.startswith('https://') or not (httpx.URL(upload_url).host or '').endswith('.googleapis.com'):
                raise HTTPException(502, 'Gemini не предоставил безопасный URL для загрузки')

            async def data_chunks():
                with open(path, 'rb') as handle:
                    while True:
                        block = handle.read(1024 * 1024)
                        if not block:
                            break
                        yield block
            uploaded = await client.post(upload_url, headers={'Content-Length': str(size),
                'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize'}, content=data_chunks())
            if uploaded.status_code not in (200, 201):
                raise HTTPException(502, 'Gemini не принял видео: ' + str(uploaded.status_code) + ' ' + uploaded.text[:200])
            info = uploaded.json().get('file') or {}
            filename = info.get('name')
            uri = info.get('uri')
            if not filename or not uri:
                raise HTTPException(502, 'Gemini не вернул имя загруженного видео')
            await progress('gemini_processing', 0.5, 'Gemini подготавливает видео к анализу')
            for _ in range(45):
                if str(info.get('state') or '').upper() == 'ACTIVE':
                    break
                if str(info.get('state') or '').upper() == 'FAILED':
                    raise HTTPException(502, 'Gemini не смог обработать видеофайл')
                await asyncio.sleep(3)
                check = await client.get(host + '/v1beta/' + filename, headers=key_headers)
                if check.status_code != 200:
                    raise HTTPException(502, 'Gemini Files API status: ' + str(check.status_code))
                info = check.json()
                if 'file' in info:
                    info = info['file']
            else:
                raise HTTPException(504, 'Gemini слишком долго обрабатывает видео')
            duration = float(metadata['duration'])
            total_segments = max(1, math.ceil(duration / SEGMENT_SECONDS))
            segments = []
            current = 0.0
            index = 0
            lang_label = {'ru': 'русском', 'uk': 'украинском', 'en': 'английском'}.get(language, 'русском')
            while current < duration:
                end = min(duration, current + SEGMENT_SECONDS)
                if end - current < 0.1:
                    break
                index += 1
                await progress('gemini_segment', 0.52 + 0.43 * (index - 1) / total_segments,
                               f'Анализ фрагмента {index} из {total_segments} ({current:.0f}–{end:.0f} с)')
                relevant_cuts = [x for x in cuts if current <= x <= end][:80]
                silences = [x for x in audio.get('silences', []) if current <= x['start'] <= end][:30]
                focus = {
                    'copyright': 'Главная задача — предварительная проверка авторских рисков. Блок оценок монтажа можно заполнить кратко.',
                    'full': 'Главная задача — разбор монтажа. Авторские риски укажи только при явных признаках.',
                }.get(mode, 'Сделай и разбор монтажа, и предварительную проверку авторских рисков.')
                prompt = (
                    'Отвечай на ' + lang_label + ' языке, если пользователь явно не попросил другой. '
                    'Запрос пользователя: ' + question[:2000] + '\n'
                    'Ты эксперт по нарезкам стримов, видеомонтажу и правилам платформ (YouTube, TikTok). Получено НАСТОЯЩЕЕ '
                    'видео со всей аудиодорожкой. Анализируй ТОЛЬКО данный временной диапазон, '
                    f'от {current:.2f} до {end:.2f} сек (таймкоды АБСОЛЮТНЫЕ, в секундах от начала видео). ' + focus + ' '
                    'Рассмотри речь, музыку, голос, шумы, эффекты, склейки, субтитры, композицию. '
                    'Авторские риски: фоновая или наложенная музыка (особенно узнаваемые треки), фрагменты чужих видео, '
                    'телепередач, фильмов, клипов, чужие изображения, логотипы и водяные знаки, чужой голос. '
                    'НЕ утверждай, что трек или видео точно принадлежат правообладателю, и НЕ называй исполнителя, '
                    'если не уверен. Если источник или лицензию определить нельзя — так и напиши в reason. '
                    'Не выдумывай речь, музыку или нарушения, которых нет. Технические склейки FFmpeg (вероятные): '
                    f'{relevant_cuts}. Технические интервалы тишины: {silences}. '
                    f'Интегральная громкость: {audio.get("integratedLufs")} LUFS. '
                    'Ответь структурированным JSON: '
                    '{"summary":"...","speech":"...","music":"...",'
                    '"findings":[{"time":"00:03–00:05","category":"Звук/Монтаж/...","observation":"...","recommendation":"..."}],'
                    '"scores":{"editing":{"score":0,"reason":"..."},"pacing":{"score":0,"reason":"..."},'
                    '"sound":{"score":0,"reason":"..."},"effects":{"score":0,"reason":"..."},"picture":{"score":0,"reason":"..."}},'
                    '"copyrightRisks":[{"start":12.5,"end":30,"level":"low|medium|high","type":"music|footage|image|logo|voice|other",'
                    '"description":"что именно слышно/видно","reason":"почему это может вызвать претензию; явно укажи неопределённость",'
                    '"recommendation":"как снизить риск","certainty":"likely|uncertain"}]}. '
                    'Если рисков нет — copyrightRisks: []. Оценка 0–10 только при наличии оснований; иначе score:null. '
                    'Не утверждай, что рассмотрел каждый кадр — возможна выборка моделью.'
                )
                content = {'contents': [{'role': 'user', 'parts': [
                    {'fileData': {'mimeType': mime, 'fileUri': uri},
                     'videoMetadata': {'startOffset': f'{current:.2f}s', 'endOffset': f'{end:.2f}s'}},
                    {'text': prompt}]}],
                    'generationConfig': {'maxOutputTokens': 8192, 'responseMimeType': 'application/json'}}
                r = await client.post(host + '/v1beta/models/' + GEMINI_MODEL + ':generateContent',
                                      headers={**key_headers, 'content-type': 'application/json'}, json=content)
                if r.status_code != 200:
                    raise HTTPException(502, 'Gemini video segment HTTP ' + str(r.status_code) + ': ' + r.text[:260])
                raw = '\n'.join(part.get('text', '') for c in r.json().get('candidates', [])
                                for part in c.get('content', {}).get('parts', []) if 'text' in part)
                try:
                    parsed = json.loads(raw)
                except (ValueError, TypeError):
                    parsed = {'summary': raw[:12000]}
                if not isinstance(parsed, dict):
                    parsed = {'summary': str(parsed)[:12000]}
                parsed['copyrightRisks'] = normalize_risks(parsed.get('copyrightRisks'), round(current, 2), round(end, 2))
                segments.append({'start': round(current, 2), 'end': round(end, 2), 'analysis': parsed})
                current = end
            return {'segments': segments, 'fullFileUploaded': True, 'audioProvided': bool(metadata['hasAudio']),
                    'segmentSeconds': SEGMENT_SECONDS}
        except httpx.HTTPError as ex:
            raise HTTPException(503, 'Ошибка соединения с Gemini Files API: ' + str(ex)[:150]) from ex
        finally:
            if filename and filename.startswith('files/'):
                try:
                    await client.delete(host + '/v1beta/' + filename, headers=key_headers, timeout=15)
                except Exception:
                    pass


def build_copyright(semantic: dict[str, Any], fingerprints: dict[str, Any]) -> dict[str, Any]:
    risks: list[dict[str, Any]] = []
    for seg in semantic.get('segments', []):
        risks.extend(seg.get('analysis', {}).get('copyrightRisks') or [])
    for m in fingerprints.get('matches', []):
        risks.append({'start': m['start'], 'end': m['end'], 'level': 'high', 'type': 'music',
                      'description': f"Совпадение аудиоотпечатка: {m['artist']} — {m['title']} (сходство {m['score']:.2f})",
                      'reason': 'Запись найдена в базе AcoustID/MusicBrainz. Наличие у вас лицензии или разрешения система проверить не может.',
                      'recommendation': 'Замените трек на музыку из библиотеки платформы или используйте лицензированную версию.',
                      'certainty': 'fingerprint', 'source': 'acoustid'})
    risks.sort(key=lambda r: (r['start'], -RISK_LEVELS.index(r['level'])))
    overall = 'low'
    for r in risks:
        if RISK_LEVELS.index(r['level']) > RISK_LEVELS.index(overall):
            overall = r['level']
    return {'risks': risks[:80], 'overall': overall if risks else 'low', 'fingerprint': fingerprints,
            'disclaimer': COPYRIGHT_DISCLAIMER,
            'method': 'Gemini анализирует видео и звук; при подключении AcoustID музыка дополнительно сверяется по аудиоотпечатку. '
                      'Совпадения модели — предположения, а не подтверждённые нарушения.'}


@app.get('/health')
def health():
    return {'status': 'ready', 'fullTimeline': True, 'audioMetadata': True, 'videoAndAudioAI': bool(GEMINI_API_KEY),
            'copyrightCheck': bool(GEMINI_API_KEY), 'musicFingerprint': bool(ACOUSTID_API_KEY and FPCALC),
            'streamingProgress': True, 'authRequired': True}


async def run_pipeline(path: str, folder: str, mime: str, meta: dict[str, Any], language: str, question: str, mode: str, emit) -> dict[str, Any]:
    await emit({'type': 'stage', 'stage': 'scenes', 'progress': 0.08, 'label': 'FFmpeg проходит весь таймлайн: поиск склеек'})
    scenes = await asyncio.to_thread(get_scenes, path)
    await emit({'type': 'stage', 'stage': 'audio', 'progress': 0.2, 'label': 'Измерение громкости и тишины по всей аудиодорожке'})
    audio = await asyncio.to_thread(get_audio, path, meta['hasAudio'])
    await emit({'type': 'stage', 'stage': 'frames', 'progress': 0.28, 'label': 'Технический анализ кадров'})
    frames = await asyncio.to_thread(analyze_frames, path, folder, meta['duration'], meta['sampleStep'])
    fingerprints: dict[str, Any] = {'enabled': False, 'matches': [], 'checkedWindows': 0}
    if mode in ('copyright', 'both'):
        await emit({'type': 'stage', 'stage': 'fingerprint', 'progress': 0.34, 'label': 'Проверка музыки по аудиоотпечаткам'})
        fingerprints = await asyncio.to_thread(fingerprint_music, path, meta['duration'], meta['hasAudio'], folder)
    semantic = await analyze_with_gemini(path, mime, meta, scenes, audio, language, question, mode, emit)
    await emit({'type': 'stage', 'stage': 'report', 'progress': 0.97, 'label': 'Сборка отчёта'})
    tech = {'metadata': meta, 'sceneCuts': scenes, 'audio': audio, 'visual': frames}
    return {**tech, 'semantic': semantic, 'copyright': build_copyright(semantic, fingerprints), 'mode': mode, 'model': GEMINI_MODEL,
            'limitations': 'Весь файл со звуком отправлен Gemini; технический анализ FFmpeg проходит полный таймлайн. '
                           'Модель может выбирать кадры внутри видео и ошибаться. Оценки не являются гарантией просмотров. ' + COPYRIGHT_DISCLAIMER}


@app.post('/analyze')
async def analyze(file: UploadFile = File(...), authorization: str | None = Header(default=None),
                  question: str = Form(default=''), language: str = Form(default='ru'),
                  mode: str = Form(default='full'), stream: str = Form(default='0')):
    await authorize_and_claim(authorization)
    if file.content_type not in ('video/mp4', 'video/webm', 'video/quicktime'):
        raise HTTPException(415, 'Поддерживаются MP4, WebM и MOV')
    mode = mode if mode in ('full', 'copyright', 'both') else 'full'
    language = language if language in ('ru', 'uk', 'en') else 'ru'
    folder = tempfile.mkdtemp(prefix='yane_worker_')
    try:
        path = str(Path(folder) / 'upload.bin')
        size = 0
        with open(path, 'wb') as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_BYTES:
                    raise HTTPException(413, 'Файл слишком большой')
                output.write(chunk)
        if not size:
            raise HTTPException(400, 'Пустой файл')
        meta = await asyncio.to_thread(inspect_ffprobe, path)
    except BaseException:
        shutil.rmtree(folder, ignore_errors=True)
        raise

    if stream != '1':
        async def no_emit(_event):
            return None
        try:
            return await run_pipeline(path, folder, file.content_type, meta, language, question, mode, no_emit)
        finally:
            shutil.rmtree(folder, ignore_errors=True)

    # Real staged progress as NDJSON: every stage is emitted when it actually starts.
    queue: asyncio.Queue = asyncio.Queue()

    async def emit(event):
        await queue.put(event)

    async def job():
        try:
            result = await run_pipeline(path, folder, file.content_type, meta, language, question, mode, emit)
            await queue.put({'type': 'result', 'data': result})
        except HTTPException as ex:
            await queue.put({'type': 'error', 'status': ex.status_code, 'detail': str(ex.detail)[:400]})
        except Exception:
            await queue.put({'type': 'error', 'status': 500, 'detail': 'Внутренняя ошибка видеосервера'})
        finally:
            await queue.put(None)

    async def events():
        task = asyncio.create_task(job())
        try:
            yield (json.dumps({'type': 'stage', 'stage': 'received', 'progress': 0.05, 'label': 'Файл получен и проверен FFprobe',
                               'metadata': meta}, ensure_ascii=False) + '\n').encode()
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                except asyncio.TimeoutError:
                    yield b'{"type":"ping"}\n'
                    continue
                if event is None:
                    break
                yield (json.dumps(event, ensure_ascii=False) + '\n').encode()
        finally:
            if not task.done():
                task.cancel()
            shutil.rmtree(folder, ignore_errors=True)

    return StreamingResponse(events(), media_type='application/x-ndjson', headers={'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no'})
