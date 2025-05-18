document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const videoForm = document.getElementById('videoForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const fetchBtn = document.getElementById('fetchBtn');
    const loadingEl = document.getElementById('loading');
    const videoInfoEl = document.getElementById('videoInfo');
    const thumbnailEl = document.getElementById('thumbnail');
    const videoTitleEl = document.getElementById('videoTitle');
    const videoUploaderEl = document.getElementById('videoUploader');
    const videoDurationEl = document.getElementById('videoDuration');
    const formatsListEl = document.getElementById('formatsList');
    const videoFormatsListEl = document.getElementById('videoFormatsList');
    const audioFormatsListEl = document.getElementById('audioFormatsList');
    const errorContainerEl = document.getElementById('errorContainer');
    const errorMessageEl = document.getElementById('errorMessage');
    
    // Modal elements
    const downloadModal = new bootstrap.Modal(document.getElementById('downloadModal'));
    
    // Store current video URL and info
    let currentVideoUrl = '';
    let currentVideoInfo = null;
    
    // Event listeners
    videoForm.addEventListener('submit', handleFormSubmit);
    
    // Form submission handler
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const videoUrl = videoUrlInput.value.trim();
        
        if (!videoUrl) {
            showError('Please enter a YouTube URL');
            return;
        }
        
        // Reset previous data
        resetUI();
        currentVideoUrl = videoUrl;
        
        // Show loading state
        loadingEl.classList.remove('d-none');
        fetchBtn.disabled = true;
        
        // Fetch video information
        fetchVideoInfo(videoUrl);
    }
    
    // Function to fetch video information
    function fetchVideoInfo(url) {
        fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        })
        .then(response => response.json())
        .then(data => {
            loadingEl.classList.add('d-none');
            fetchBtn.disabled = false;
            
            if (!data.success) {
                showError(data.error || 'Failed to fetch video information');
                return;
            }
            
            // Store current video info
            currentVideoInfo = data;
            
            // Display video information
            displayVideoInfo(data);
        })
        .catch(error => {
            loadingEl.classList.add('d-none');
            fetchBtn.disabled = false;
            showError('Error: ' + error.message);
        });
    }
    
    // Function to display video information
    function displayVideoInfo(info) {
        // Set video metadata
        thumbnailEl.src = info.thumbnail;
        videoTitleEl.textContent = info.title;
        videoUploaderEl.textContent = info.uploader || 'Unknown';
        videoDurationEl.textContent = formatDuration(info.duration);
        
        // Show video info card
        videoInfoEl.classList.remove('d-none');
        
        // Sort and display formats
        displayFormats(info.formats);
    }
    
    // Function to display available formats
    function displayFormats(formats) {
        // Clear previous formats
        videoFormatsListEl.innerHTML = '';
        audioFormatsListEl.innerHTML = '';
        
        let hasVideoFormats = false;
        let hasAudioFormats = false;
        
        // Process each format
        formats.forEach(format => {
            const formatRow = document.createElement('tr');
            
            if (format.resolution) {
                // Video format
                hasVideoFormats = true;
                
                formatRow.innerHTML = `
                    <td>${format.resolution}</td>
                    <td>${format.ext.toUpperCase()}</td>
                    <td>${format.filesize}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-download" 
                                data-format-id="${format.format_id}">
                            <i class="fas fa-download me-1"></i> Download
                        </button>
                    </td>
                `;
                
                videoFormatsListEl.appendChild(formatRow);
            } else {
                // Audio format
                hasAudioFormats = true;
                
                formatRow.innerHTML = `
                    <td>${format.note || format.ext.toUpperCase()} Audio</td>
                    <td>${format.filesize}</td>
                    <td>
                        <button class="btn btn-sm btn-success btn-download" 
                                data-format-id="${format.format_id}">
                            <i class="fas fa-download me-1"></i> Download
                        </button>
                    </td>
                `;
                
                audioFormatsListEl.appendChild(formatRow);
            }
        });
        
        // Show formats list
        formatsListEl.classList.remove('d-none');
        
        // Add event listeners to download buttons
        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', function() {
                const formatId = this.getAttribute('data-format-id');
                downloadVideo(currentVideoUrl, formatId);
            });
        });
    }
    
    // Function to download video
    function downloadVideo(url, formatId) {
        // Show download modal
        downloadModal.show();
        
        fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url, format_id: formatId })
        })
        .then(response => response.json())
        .then(data => {
            downloadModal.hide();
            
            if (!data.success) {
                showError(data.error || 'Failed to initiate download');
                return;
            }
            
            // Trigger file download
            const downloadUrl = `/api/download-file/${data.download_id}/${encodeURIComponent(data.filename)}`;
            window.location.href = downloadUrl;
        })
        .catch(error => {
            downloadModal.hide();
            showError('Error: ' + error.message);
        });
    }
    
    // Helper function to format duration
    function formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${padZero(minutes)}:${padZero(secs)}`;
        }
        
        return `${minutes}:${padZero(secs)}`;
    }
    
    // Helper function to pad zero
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    // Function to show error message
    function showError(message) {
        errorMessageEl.textContent = message;
        errorContainerEl.classList.remove('d-none');
    }
    
    // Function to reset UI
    function resetUI() {
        errorContainerEl.classList.add('d-none');
        videoInfoEl.classList.add('d-none');
        formatsListEl.classList.add('d-none');
        loadingEl.classList.add('d-none');
    }
}); 