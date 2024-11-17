"""
VideoVoyager - AI-powered YouTube video analysis tool.

This module provides the backend functionality for the VideoVoyager application,
including video search, summarization, and interactive chat features.
"""

from flask import Flask, render_template, request, jsonify
import os
import re
import requests
import logging
from typing import Dict, List, Optional, Union
from functools import lru_cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from googleapiclient.discovery import build
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Set up rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# YouTube API key
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

# Validate required API keys
if not YOUTUBE_API_KEY or not OPENROUTER_API_KEY:
    raise ValueError("Missing required API keys. Please check your .env file.")

# YouTube API client
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# Global variable to store the current video transcript
current_video_transcript = ""

def error_response(message: str, status_code: int) -> tuple:
    """
    Create a standardized error response.
    
    Args:
        message (str): Error message
        status_code (int): HTTP status code
        
    Returns:
        tuple: JSON response with error details and status code
    """
    return jsonify({"error": message, "status": status_code}), status_code

def validate_youtube_url(url: str) -> bool:
    """
    Validate YouTube URL format.
    
    Args:
        url (str): YouTube URL to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    pattern = r'^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$'
    return bool(re.match(pattern, url))

@lru_cache(maxsize=100)
def get_video_transcript(video_id: str) -> str:
    """
    Get video transcript with caching.
    
    Args:
        video_id (str): YouTube video ID
        
    Returns:
        str: Combined transcript text
        
    Raises:
        TranscriptsDisabled: If video has no transcript
    """
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    return ' '.join([entry['text'] for entry in transcript])

def translate_to_german(text: str) -> str:
    """
    Translate English text to German using the OpenRouter API.
    
    Args:
        text (str): The English text to translate
        
    Returns:
        str: The German translation or error message
    """
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "anthropic/claude-3.5-sonnet",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant that translates English to German. Provide only the translated text without any additional comments or prefixes."},
                    {"role": "user", "content": f"Translate the following text to German:\n\n{text}"}
                ]
            }
        )
        
        if response.status_code != 200:
            raise ValueError(f"Translation API error: {response.status_code}")
            
        translation = response.json()['choices'][0]['message']['content']
        # Remove any potential prefixes
        translation = translation.replace("Here's the German translation:", "").replace("Here's the translation of that text into German:", "").strip()
        return translation
    except Exception as e:
        app.logger.error(f"Translation error: {str(e)}")
        return "Error: Failed to translate"

@app.route('/')
def index() -> str:
    """Render the main page."""
    return render_template('index.html')

@app.route('/search_videos', methods=['POST'])
@limiter.limit("30/minute")
def search_videos() -> tuple:
    """
    Search YouTube videos based on query.
    
    Returns:
        tuple: JSON response containing video information or error message
    """
    query = request.json.get('query')
    if not query:
        return error_response("Search query is required", 400)
    
    try:
        search_response = youtube.search().list(
            q=query,
            type='video',
            part='id,snippet',
            maxResults=5
        ).execute()

        videos = []
        for search_result in search_response.get('items', []):
            video = {
                'title': search_result['snippet']['title'],
                'description': search_result['snippet']['description'],
                'thumbnail': search_result['snippet']['thumbnails']['default']['url'],
                'video_id': search_result['id']['videoId']
            }
            videos.append(video)

        return jsonify(videos)
    except Exception as e:
        app.logger.error(f"Search error: {str(e)}")
        return error_response(str(e), 500)

@app.route('/summarize_video', methods=['POST'])
@limiter.limit("10/minute")
def summarize_video() -> tuple:
    """
    Generate a summary of a YouTube video using its transcript.
    
    Returns:
        tuple: JSON response containing summary and key points or error message
    """
    video_url = request.json.get('video_url')
    translate = request.json.get('translate', False)
    
    if not video_url:
        return error_response("Video URL is required", 400)
        
    if not validate_youtube_url(video_url):
        return error_response("Invalid YouTube URL format", 400)
    
    try:
        video_id = video_url.split('v=')[1]
        
        try:
            full_text = get_video_transcript(video_id)
        except TranscriptsDisabled:
            return error_response("This video has no transcript available", 400)
        except Exception as e:
            return error_response(f"Failed to get video transcript: {str(e)}", 500)
        
        # Use OpenRouter API to summarize the transcript
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "anthropic/claude-3.5-sonnet",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant that provides detailed summaries of YouTube video transcripts. Your summaries should be comprehensive and cover all major points discussed in the video. Provide a flowing text summary followed by a list of key points."},
                    {"role": "user", "content": f"Please provide a detailed summary of the following YouTube video transcript. The summary should include:\n1. A flowing text summary (about 3-5 sentences) of the main content without numbers or bullet points.\n2. A list of key points covering the main ideas and topics presented in the video.\n\nFormat your response as follows:\nSummary: [Your flowing text summary here]\n\nKey Points:\n- [First key point]\n- [Second key point]\n- [And so on...]\n\nHere's the transcript:\n\n{full_text}"}
                ]
            }
        )
        
        if response.status_code != 200:
            return error_response("Failed to get summary from OpenRouter", 500)
            
        content = response.json()['choices'][0]['message']['content']
        
        # Split the content into summary and key points
        parts = content.split('\n\n', 1)
        summary = parts[0].strip()
        key_points = parts[1].strip() if len(parts) > 1 else ""
        
        if translate:
            summary = translate_to_german(summary)
            key_points = translate_to_german(key_points)
        
        return jsonify({"summary": summary, "key_points": key_points})
    except Exception as e:
        app.logger.error(f"Error in summarize_video: {str(e)}")
        return error_response(str(e), 500)

@app.route('/video_chat', methods=['POST'])
@limiter.limit("20/minute")
def video_chat() -> tuple:
    """
    Answer questions about a YouTube video using its transcript.
    
    Returns:
        tuple: JSON response containing answer summary, facts, and timestamps or error message
    """
    global current_video_transcript
    video_url = request.json.get('video_url')
    question = request.json.get('question')
    translate = request.json.get('translate', False)

    if not question:
        return error_response("Question is required", 400)

    if video_url:
        if not validate_youtube_url(video_url):
            return error_response("Invalid YouTube URL format", 400)
            
        try:
            video_id = video_url.split('v=')[1]
            try:
                current_video_transcript = get_video_transcript(video_id)
            except TranscriptsDisabled:
                return error_response("This video has no transcript available", 400)
        except Exception as e:
            app.logger.error(f"Error fetching video transcript: {str(e)}")
            return error_response(f"Failed to fetch video transcript: {str(e)}", 500)

    if not current_video_transcript:
        return error_response("No video transcript available. Please load a video first.", 400)

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "anthropic/claude-3.5-sonnet",
                "messages": [
                    {"role": "system", "content": "You are an AI assistant that answers specific questions about YouTube video content based on the provided transcript. Your response should include two parts: 1) A brief summary (2-3 sentences) directly addressing the user's question, without any numbering. 2) A list of key points with relevant information from the transcript that helps answer the question."},
                    {"role": "user", "content": f"Here's the transcript of a YouTube video:\n\n{current_video_transcript}\n\nPlease answer the following question about this video: {question}\n\nProvide your response in the following format:\nSummary: [Your summary here, without any numbering]\n\nKey Points:\n- [First key point]\n- [Second key point]\n- [And so on...]"}
                ]
            }
        )

        if response.status_code != 200:
            return error_response("Failed to get answer from OpenRouter", 500)

        content = response.json()['choices'][0]['message']['content']
        
        # Split the content into summary and key points
        parts = content.split('Key Points:', 1)
        
        # Extract summary
        summary = parts[0].replace("Summary:", "").strip()
        
        # Extract key points
        facts = []
        if len(parts) > 1:
            key_points = parts[1].strip()
            lines = key_points.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-'):
                    facts.append(line.lstrip('- ').strip())
        
        # Timestamps are not applicable in this case
        timestamps = []

        if translate:
            summary = translate_to_german(summary)
            facts = [translate_to_german(fact) for fact in facts]

        return jsonify({
            "summary": summary,
            "facts": facts,
            "timestamps": timestamps
        })
    except Exception as e:
        app.logger.error(f"Error in video_chat: {str(e)}")
        return error_response(str(e), 500)

if __name__ == '__main__':
    app.run(debug=True)
