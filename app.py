"""
VideoVoyager - AI-powered YouTube video analysis tool.

This module provides the backend functionality for the VideoVoyager application,
including video search, summarization, and interactive chat features.
"""

from flask import Flask, render_template, request, jsonify
import os
import requests
import logging
from googleapiclient.discovery import build
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# YouTube API key
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

# YouTube API client
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# Global variable to store the current video transcript
current_video_transcript = ""

def translate_to_german(text: str) -> str:
    """
    Translate English text to German using the OpenRouter API.
    
    Args:
        text (str): The English text to translate
        
    Returns:
        str: The German translation or error message
    """
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
    
    if response.status_code == 200:
        translation = response.json()['choices'][0]['message']['content']
        # Remove any potential prefixes like "Here's the German translation:" or "Here's the translation of that text into German:"
        translation = translation.replace("Here's the German translation:", "").replace("Here's the translation of that text into German:", "").strip()
        return translation
    else:
        app.logger.error(f"Translation API error: {response.status_code} - {response.text}")
        return "Error: Failed to translate"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search_videos', methods=['POST'])
def search_videos():
    """
    Search YouTube videos based on query.
    
    Returns:
        JSON response containing video information or error message
    """
    query = request.json['query']
    
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
        return jsonify({"error": str(e)}), 500

@app.route('/summarize_video', methods=['POST'])
def summarize_video():
    """
    Generate a summary of a YouTube video using its transcript.
    
    Returns:
        JSON response containing summary and key points or error message
    """
    video_url = request.json['video_url']
    translate = request.json.get('translate', False)
    video_id = video_url.split('v=')[1]
    
    try:
        # Fetch the transcript
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        full_text = ' '.join([entry['text'] for entry in transcript])
        
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
        
        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content']
            
            # Split the content into summary and key points
            parts = content.split('\n\n', 1)
            summary = parts[0].strip()
            key_points = parts[1].strip() if len(parts) > 1 else ""
            
            if translate:
                summary = translate_to_german(summary)
                key_points = translate_to_german(key_points)
            
            return jsonify({"summary": summary, "key_points": key_points})
        else:
            app.logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
            return jsonify({"error": "Failed to get summary from OpenRouter"}), 500
    except Exception as e:
        app.logger.error(f"Error in summarize_video: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/video_chat', methods=['POST'])
def video_chat():
    """
    Answer questions about a YouTube video using its transcript.
    
    Returns:
        JSON response containing answer summary, facts, and timestamps or error message
    """
    global current_video_transcript
    video_url = request.json.get('video_url')
    question = request.json.get('question')
    translate = request.json.get('translate', False)

    if not current_video_transcript or video_url:
        try:
            video_id = video_url.split('v=')[1]
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            current_video_transcript = ' '.join([entry['text'] for entry in transcript])
        except Exception as e:
            app.logger.error(f"Error fetching video transcript: {str(e)}")
            return jsonify({"error": f"Failed to fetch video transcript: {str(e)}"}), 500

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

        if response.status_code == 200:
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
            
            # Timestamps are not applicable in this case, so we'll leave it empty
            timestamps = []

            if translate:
                summary = translate_to_german(summary)
                facts = [translate_to_german(fact) for fact in facts]

            return jsonify({
                "summary": summary,
                "facts": facts,
                "timestamps": timestamps
            })
        else:
            app.logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
            return jsonify({"error": "Failed to get answer from OpenRouter"}), 500
    except Exception as e:
        app.logger.error(f"Error in video_chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
