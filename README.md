# YouTube Search and Analysis Application

This application provides YouTube video search and summarization capabilities. It offers a user-friendly interface for searching YouTube videos and generating summaries of video content.

## Features

1. YouTube Video Search: Search for YouTube videos directly from the application.
2. Video Summarization: Generate concise summaries of YouTube video content using AI.
3. Video Chat: Ask questions about specific YouTube videos and get AI-generated responses.

## Technologies Used

- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- APIs: YouTube Data API v3, OpenRouter API (for summarization and video chat)
- Additional Libraries: youtube-transcript-api

## Setup and Installation

1. Clone the repository to your local machine.
2. Install the required Python packages:
   ```
   pip install flask google-api-python-client python-dotenv youtube_transcript_api requests
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```
   Replace `your_youtube_api_key` and `your_openrouter_api_key` with your actual API keys.

## Running the Application

1. Navigate to the project directory in your terminal.
2. Run the Flask application:
   ```
   python app.py
   ```
3. Open a web browser and go to `http://localhost:5000` to access the application.

## Usage

- YouTube Search: Enter a search query in the video search field and click "Search" to find relevant YouTube videos.
- Video Summarization: Paste a YouTube video URL into the summarization input field and click "Summarize" to generate a summary of the video content.
- Video Chat: Paste a YouTube video URL and ask a question about the video to get AI-generated responses based on the video content.

## Note

Ensure that you have valid API keys for both YouTube Data API v3 and OpenRouter, and that you have sufficient quota and permissions to use these services.

## License

This project is open-source and available under the MIT License.
