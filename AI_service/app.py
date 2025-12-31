from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled

def get_transcript(video_url_or_id):
    """
    Fetches the transcript for a given YouTube video ID or URL.
    """
    # 1. Extract the Video ID from the URL (if needed)
    video_id = video_url_or_id
    if 'watch?v=' in video_url_or_id:
        video_id = video_url_or_id.split('v=')[-1].split('&')[0]
    elif 'youtu.be/' in video_url_or_id:
        video_id = video_url_or_id.split('youtu.be/')[-1].split('?')[0]
    
    print(f"Attempting to fetch transcript for Video ID: {video_id}")

    try:
        # 2. **CORRECT CALL:** Use the imported object YouTubeTranscriptApi
        transcript_list = YouTubeTranscriptApi.get_transcript(
            video_id, 
            languages=['en', 'a.en'] 
        )
        
        # 3. Join all the 'text' values into a single string
        transcript_text = " ".join([item['text'] for item in transcript_list])
        
        return transcript_text

    except NoTranscriptFound:
        return "Error: No manually created or auto-generated transcript could be found for this video."
    except TranscriptsDisabled:
        return "Error: Transcripts are disabled for this video."
    except Exception as e:
        return f"A general error occurred: {type(e).__name__}: {e}"

# --- Example Usage ---
# NOTE: Replace this with your actual YouTube URL for testing
youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
transcript = get_transcript(youtube_url)

if "Error:" not in transcript:
    print("\n--- TRANSCRIPT SUCCESSFULLY FETCHED ---")
    print(transcript[:500] + "...") 
    print(f"\nTotal length: {len(transcript)} characters.")
else:
    print(transcript)