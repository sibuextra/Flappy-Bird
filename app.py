import os
import re
import json
from flask import Flask, render_template, request, jsonify, send_file, abort, make_response
import yt_dlp
from urllib.parse import urlparse, parse_qs
import tempfile
import uuid

app = Flask(__name__)
app.config['TEMP_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp')

# Create temporary folder if it doesn't exist
if not os.path.exists(app.config['TEMP_FOLDER']):
    os.makedirs(app.config['TEMP_FOLDER'])

def clean_filename(filename):
    """Clean the filename to remove invalid characters"""
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def get_video_id(url):
    """Extract the video ID from a YouTube URL"""
    parsed_url = urlparse(url)
    if parsed_url.netloc == 'youtu.be':
        return parsed_url.path[1:]
    if parsed_url.netloc in ('www.youtube.com', 'youtube.com'):
        if parsed_url.path == '/watch':
            return parse_qs(parsed_url.query)['v'][0]
        if parsed_url.path[:7] == '/embed/':
            return parsed_url.path.split('/')[2]
        if parsed_url.path[:3] == '/v/':
            return parsed_url.path.split('/')[2]
    return None

def is_valid_youtube_url(url):
    """Check if the URL is a valid YouTube URL"""
    video_id = get_video_id(url)
    return video_id is not None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    data = request.get_json()
    url = data.get('url', '')
    
    if not url or not is_valid_youtube_url(url):
        return jsonify({
            'success': False,
            'error': 'Invalid YouTube URL'
        }), 400
    
    try:
        # yt-dlp options to extract video information
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best',  # Default format
            'extract_flat': True,
            'skip_download': True,
            'force_generic_extractor': False
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Get formats with more details
            formats = []
            
            # Group formats by resolution and type
            video_formats = {}
            audio_formats = []
            
            for f in info.get('formats', []):
                format_id = f.get('format_id')
                ext = f.get('ext')
                format_note = f.get('format_note', '')
                
                # Get filesize if available
                filesize = f.get('filesize')
                if filesize:
                    filesize = round(filesize / (1024 * 1024), 2)  # Convert to MB
                    filesize_str = f"{filesize} MB"
                else:
                    filesize_str = "Unknown"
                
                # Check if it's video or audio
                if f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                    resolution = f.get('height')
                    if resolution:
                        if resolution not in video_formats:
                            video_formats[resolution] = {
                                'format_id': format_id,
                                'ext': ext,
                                'resolution': f"{resolution}p",
                                'note': format_note,
                                'filesize': filesize_str
                            }
                
                # Audio-only formats
                elif f.get('vcodec') == 'none' and f.get('acodec') != 'none':
                    audio_formats.append({
                        'format_id': format_id,
                        'ext': ext,
                        'note': f"Audio {format_note}",
                        'filesize': filesize_str
                    })
            
            # Add sorted video formats to the result
            for height in sorted(video_formats.keys(), reverse=True):
                formats.append(video_formats[height])
            
            # Add audio formats
            formats.extend(audio_formats)
            
            result = {
                'success': True,
                'id': info.get('id'),
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'uploader': info.get('uploader'),
                'formats': formats
            }
            
            return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/download', methods=['POST'])
def download_video():
    data = request.get_json()
    url = data.get('url', '')
    format_id = data.get('format_id', '')
    
    if not url or not is_valid_youtube_url(url) or not format_id:
        return jsonify({
            'success': False,
            'error': 'Invalid input parameters'
        }), 400
    
    try:
        # Create a unique temporary directory for this download
        temp_dir = os.path.join(app.config['TEMP_FOLDER'], str(uuid.uuid4()))
        os.makedirs(temp_dir, exist_ok=True)
        
        # yt-dlp options for downloading
        ydl_opts = {
            'format': format_id,
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'force_generic_extractor': False
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            # Get the downloaded file path
            if 'entries' in info:
                # Playlist
                info = info['entries'][0]
            
            title = clean_filename(info.get('title', 'video'))
            ext = info.get('ext', 'mp4')
            filename = f"{title}.{ext}"
            downloaded_file = os.path.join(temp_dir, filename)
            
            if not os.path.exists(downloaded_file):
                # Try to find any file in the directory
                files = os.listdir(temp_dir)
                if files:
                    downloaded_file = os.path.join(temp_dir, files[0])
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Failed to download the file'
                    }), 500
            
            # Create download URL for the frontend
            download_id = os.path.basename(temp_dir)
            return jsonify({
                'success': True,
                'download_id': download_id,
                'filename': filename
            })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/download-file/<download_id>/<filename>', methods=['GET'])
def download_file(download_id, filename):
    # Validate download_id to prevent directory traversal
    if not re.match(r'^[0-9a-f-]+$', download_id):
        abort(404)
    
    temp_dir = os.path.join(app.config['TEMP_FOLDER'], download_id)
    file_path = os.path.join(temp_dir, filename)
    
    if not os.path.exists(file_path):
        abort(404)
    
    try:
        # Stream the file to the user and then delete it
        response = make_response(send_file(file_path, as_attachment=True))
        
        # Clean up the temp directory after sending the file
        @response.call_on_close
        def cleanup():
            try:
                os.remove(file_path)
                os.rmdir(temp_dir)
            except:
                pass
        
        return response
    
    except Exception as e:
        abort(500)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 