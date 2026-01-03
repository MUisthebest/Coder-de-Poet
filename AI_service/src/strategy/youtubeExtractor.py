'''

    This file will use the youtube_transcript_api to extract metadata, including transcript from youtube video link.
    Inherits IQuizExtractor interface
'''

from .IExtractor import IQuizExtractor
from abc import ABC, abstractmethod
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from ..models import GenerateLessonQuizCommand
from typing import Optional
from ..quiz.quiz_service import generate_quiz_from_transcript


class YoutubeExtractor (IQuizExtractor):
    cmd : GenerateLessonQuizCommand
    async def extract(self, cmd) -> dict:
        # Metadata: category + tags
        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "noplaylist": True,
            "cookies": "/run/secrets/youtube_cookies.txt"
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            video_url = str(cmd.video_url)
            info_dict = ydl.extract_info(video_url, download=False)
        
        video_id = info_dict.get("id", None)

        #category + tag
        category = info_dict.get("categories", [])
        tags = info_dict.get("tags", [])

        # Transcript
        transcript_text = None
        try:
            apiYoutube = YouTubeTranscriptApi()
            transcripts = apiYoutube.fetch(video_id = video_id)
            transcript_text = " ".join([t.text for t in transcripts])
        except (TranscriptsDisabled, NoTranscriptFound):
            Warning("Transcript not available for this video.")
            transcript_text = ""
        
        if transcript_text:
            #Generate quiz from transcript
            quiz_gen = await generate_quiz_from_transcript(transcript_text,cmd)
        
        #Call 
        return {
            "source": "youtube",
            "video_id": video_id,
            "category": category[0] if category else None,
            "tags": tags,
            "quiz":quiz_gen,
            "transcript": transcript_text
        }
    