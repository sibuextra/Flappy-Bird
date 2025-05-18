# YouTube Video Downloader

A clean and responsive web application to download YouTube videos in various formats and resolutions. Built with Flask and yt-dlp.

## Features

- Clean, responsive UI built with Bootstrap
- Supports various video resolutions (144p, 360p, 720p, 1080p, etc.)
- Audio-only download options
- Shows video thumbnails, duration, and other metadata
- Displays file sizes for each format
- Error handling for invalid URLs
- Fast downloads with direct streaming

## Installation

1. Clone or download this repository:

```bash
git clone <repository-url>
cd youtube-downloader
```

2. Create and activate a virtual environment (recommended):

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install the required packages:

```bash
pip install -r requirements.txt
```

## Usage

1. Start the Flask application:

```bash
python app.py
```

2. Open your web browser and navigate to:

```
http://127.0.0.1:5000
```

3. Paste a YouTube URL into the input field and click "Fetch Video"
4. Select your desired format and click "Download"

## Dependencies

- Flask: Web framework
- yt-dlp: YouTube video downloader library
- Bootstrap: Frontend styling

## Important Note

This application is for personal use only. Please respect YouTube's terms of service and copyright laws when downloading videos.

## License

This project is for educational purposes only. Use responsibly. 