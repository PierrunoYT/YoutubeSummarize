# VideoVoyager: YouTube Search and Analysis Application

VideoVoyager is an innovative application that provides YouTube video search and summarization capabilities. It offers a user-friendly interface for exploring YouTube content, generating concise summaries, and engaging in AI-powered conversations about video content.

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
# VideoVoyager

VideoVoyager is an AI-powered YouTube video analysis tool that helps users better understand video content through summaries and interactive chat.

## Features

- YouTube video search and playback
- AI-powered video summarization
- Interactive Q&A chat about video content
- Bilingual support (English/German)
- Dark/Light mode
- Favorites system
- Responsive design

## Prerequisites

- Python 3.8+
- YouTube API key
- OpenRouter API key (using Claude 3.5 Sonnet)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/videovoyager.git
cd videovoyager
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.template` to `.env` and fill in your API keys:
```bash
cp .env.template .env
```

4. Run the application:
```bash
python app.py
```

## Environment Variables

Create a `.env` file with:
- `YOUTUBE_API_KEY`: Your YouTube Data API key
- `OPENROUTER_API_KEY`: Your OpenRouter API key

## Usage

1. Open http://localhost:5000 in your browser
2. Search for videos or paste a YouTube URL
3. Use the summarize or chat features to analyze video content
4. Save favorite videos for later reference

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
