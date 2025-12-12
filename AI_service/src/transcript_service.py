'''
    This file will use the video url from cloud to download the video file.
    Then, fast whisper will be utilized to load the transcript from the video file.
'''

import os 
import requests
from faster_whisper import WhisperModel
from .models import GenerateLessonQuizCommand
import logging

DOWNLOAD_PATH = "downloads"
os.makedirs(DOWNLOAD_PATH, exist_ok=True)

#Load model once at startup
model = WhisperModel("base", device="cpu", compute_type="int8")

def download_video(video_url: str, filename_hint: str | None = None) -> str:
    if filename_hint:
        safe_name = filename_hint.replace(" ", "_")
    print (video_url)

    local_filename = os.path.join(DOWNLOAD_PATH, f"{safe_name}.mp4")

    with requests.get(video_url, stream=True, timeout=120) as resp:
        resp.raise_for_status()
        with open(local_filename, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

    return local_filename

'''
    Delete video file after transcription to save space.
'''

def delete_video(file_path: str) -> None:
    if not os.path.exists(file_path):
        return
    os.remove(file_path)


def transcribe_video(video_path: str, language: str = "en") -> str:
    segments, info = model.transcribe(video_path, language=language)
    full_text = " ".join(seg.text for seg in segments)
    return full_text