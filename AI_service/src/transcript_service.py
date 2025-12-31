'''
    This file will use the video url from cloud to download the video file.
    Then, fast whisper will be utilized to load the transcript from the video file.
'''

import os 
import requests
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from .models import GenerateLessonQuizCommand
import logging

DOWNLOAD_PATH = "downloads"
os.makedirs(DOWNLOAD_PATH, exist_ok=True)

#Load model once at startup
model = "distil-whisper-large-v3"
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model,
    torch_dtype=dtype,
    low_cpu_mem_usage=True,
    use_safetensors=True,
)

processor = AutoProcessor.from_pretrained(model_name=model)
pipe = pipeline(
    "automatic-speech-recognition",
    model = model,
    tokenizer = processor.tokenizer,
    feature_extractor = processor.feature_extractor,
    device = 0 if device == "cuda" else -1,
)

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
    result = pipe(
        video_path,
        chunk_length_s=30,
        stride_length_s=5,
        batch_size=16,
        generate_kwargs={
            "language": language,
            "task": "transcribe",
            "beam_size": 1,  
        },
    )
    return result["text"]
