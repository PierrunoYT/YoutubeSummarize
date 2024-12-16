# VideoVoyager: YouTube Search and Analysis Application

VideoVoyager is an innovative application that provides YouTube video search and summarization capabilities. It offers a user-friendly interface for exploring YouTube content, generating concise summaries, and engaging in AI-powered conversations about video content.

## Features

1. YouTube Video Search: Advanced search functionality with rate limiting (200 requests per day, 50 per hour)
2. Video Summarization: AI-powered summarization of video content using OpenRouter API
3. Interactive Video Chat: Ask questions about video content and get AI-generated responses
4. Bilingual Support: Built-in English to German translation capability
5. Error Handling: Robust error handling for API failures and invalid inputs
6. Caching: Efficient transcript caching for improved performance

## Technologies Used

- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- APIs:
  - YouTube Data API v3 (for video search and metadata)
  - OpenRouter API (for AI-powered summarization and chat)
  - youtube-transcript-api (for video transcripts)
- Additional Features:
  - Flask-Limiter for rate limiting
  - LRU caching for performance optimization
  - Logging system for debugging

## Setup and Installation

1. Clone the repository to your local machine.
2. Install the required Python packages:
   ```
   pip install -r requirements.txt
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

1. Video Search:
   - Enter your search query in the search field
   - Results are limited to 50 requests per hour
   - Click on a video to view more details

2. Video Summarization:
   - Paste a YouTube video URL
   - Click "Summarize" to generate an AI-powered summary
   - View key points and main takeaways

3. Video Chat:
   - Paste a YouTube video URL
   - Ask specific questions about the video content
   - Get AI-generated responses with relevant timestamps

4. Language Support:
   - Toggle between English and German translations
   - Automatic translation of summaries and responses

## API Rate Limits

- Daily limit: 200 requests per day
- Hourly limit: 50 requests per hour
- These limits apply to all API endpoints

## Error Handling

The application includes comprehensive error handling for:
- Invalid YouTube URLs
- Missing or disabled video transcripts
- API failures
- Rate limit exceeded scenarios

## License

This project is open-source and available under the MIT License.

---
Last updated: December 16, 2024
