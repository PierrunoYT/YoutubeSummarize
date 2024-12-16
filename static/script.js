let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

// Check for saved dark mode preference and initialize the toggle
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
    }
    
    // Add event listener to the toggle
    darkModeToggle.addEventListener('change', toggleDarkMode);
}

// Call initializeDarkMode when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeDarkMode);

function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.disabled = true;
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('#main-search'));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function addToFavorites(videoUrl, videoTitle) {
    if (!videoUrl || !videoTitle) {
        showError('Invalid video information');
        return;
    }
    
    if (!favorites.some(fav => fav.url === videoUrl)) {
        favorites.push({ url: videoUrl, title: videoTitle });
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesList();
    }
}

function removeFromFavorites(videoUrl) {
    if (!videoUrl) {
        showError('Invalid video URL');
        return;
    }
    
    favorites = favorites.filter(fav => fav.url !== videoUrl);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList();
}

function updateFavoritesList() {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;
    
    favoritesList.innerHTML = '';
    favorites.forEach(fav => {
        const favElement = document.createElement('div');
        favElement.innerHTML = `
            <a href="${fav.url}" target="_blank">${fav.title}</a>
            <button onclick="removeFromFavorites('${fav.url}')">Remove</button>
        `;
        favoritesList.appendChild(favElement);
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', updateFavoritesList);

async function searchVideos() {
    const input = document.getElementById('video-search');
    const searchButton = document.querySelector('#video-container button');
    const query = input.value.trim();
    
    if (!query) {
        showError('Please enter a search query');
        return;
    }
    
    input.value = '';
    showLoading(searchButton);
    
    try {
        const response = await axios.post('/search_videos', { query: query });
        if (!response.data) {
            throw new Error('Empty response from server');
        }
        displayVideos(response.data);
    } catch (error) {
        console.error('Error:', error);
        showError(error.response?.data?.error || 'Failed to search videos');
        displayVideos([]);
    } finally {
        hideLoading(searchButton);
    }
}

function startVideoChat() {
    const videoUrl = document.getElementById('main-video-url').value.trim();
    if (!videoUrl) {
        showError('Please enter a YouTube video URL first');
        return;
    }
    
    document.getElementById('toggle-switch').checked = true;
    toggleSummaryChat();
    document.getElementById('video-chat-container').scrollIntoView({ behavior: 'smooth' });
    // Clear previous chat messages
    document.getElementById('chat-messages').innerHTML = '';
    // Focus on the question input
    document.getElementById('video-chat-question').focus();
    // Load the video if not already loaded
    loadVideoAndThumbnail(videoUrl);
}

function displayVideos(videos) {
    const videoResults = document.getElementById('video-results');
    if (!videoResults) return;
    
    videoResults.innerHTML = '';
    
    if (!videos.length) {
        videoResults.innerHTML = '<p>No videos found</p>';
        return;
    }

    videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.innerHTML = `
            <h3>${video.title}</h3>
            <img src="${video.thumbnail}" alt="${video.title}" onclick="loadVideoAndThumbnail('https://www.youtube.com/watch?v=${video.video_id}')">
            <p>${video.description}</p>
            <a href="https://www.youtube.com/watch?v=${video.video_id}" target="_blank">Watch Video</a>
            <button onclick="loadVideoAndThumbnail('https://www.youtube.com/watch?v=${video.video_id}')">Load Video</button>
        `;
        videoResults.appendChild(videoElement);
    });
}

async function summarizeVideo(translate) {
    const videoUrl = document.getElementById('main-video-url').value.trim();
    if (!videoUrl) {
        showError('Please enter a YouTube video URL first');
        return;
    }
    
    const summaryResult = document.getElementById('summary-result');
    const progressBar = document.getElementById('summary-progress');
    const summarizeButton = document.querySelector('#summary-container button');

    summaryResult.innerHTML = 'Summarizing video...';
    progressBar.style.width = '0%';
    showLoading(summarizeButton);

    try {
        const response = await axios.post('/summarize_video', { 
            video_url: videoUrl, 
            translate: translate 
        }, {
            onUploadProgress: progressEvent => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                progressBar.style.width = percentCompleted + '%';
            }
        });
        
        if (!response.data) {
            throw new Error('Empty response from server');
        }
        
        const { summary, key_points } = response.data;
        let summaryHtml = `<h3>${translate ? 'Fließende Textzusammenfassung' : 'Flowing Text Summary'}:</h3><p>${summary}</p>`;
        
        if (key_points.trim() !== '') {
            summaryHtml += `<h3>${translate ? 'Hauptpunkte' : 'Key Points'}:</h3><ul>`;
            key_points.split('\n').forEach(point => {
                if (point.trim() !== '') {
                    // Remove the leading dash if present and skip "Kernpunkte:" entry
                    let cleanPoint = point.trim().replace(/^[-•]\s*/, '');
                    if (cleanPoint.toLowerCase() !== 'kernpunkte:') {
                        summaryHtml += `<li>${cleanPoint}</li>`;
                    }
                }
            });
            summaryHtml += '</ul>';
        }
        summaryResult.innerHTML = summaryHtml;
        progressBar.style.width = '100%';
    } catch (error) {
        console.error('Error:', error);
        showError(error.response?.data?.error || 'Failed to summarize video');
        summaryResult.innerHTML = '';
        progressBar.style.width = '0%';
    } finally {
        hideLoading(summarizeButton);
    }
}

async function askVideoQuestion(translate) {
    const videoUrl = document.getElementById('main-video-url').value.trim();
    const question = document.getElementById('video-chat-question').value.trim();
    
    if (!question) {
        showError('Please enter a question');
        return;
    }
    
    const chatMessages = document.getElementById('chat-messages');
    const askButton = document.querySelector('#video-chat-container button');

    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.textContent = question;
    chatMessages.appendChild(userMessage);

    const aiMessage = document.createElement('div');
    aiMessage.className = 'ai-message';
    aiMessage.textContent = 'Processing your question...';
    chatMessages.appendChild(aiMessage);

    showLoading(askButton);
    try {
        const response = await axios.post('/video_chat', { 
            video_url: videoUrl, 
            question: question, 
            translate: translate 
        });
        
        if (!response.data) {
            throw new Error('Empty response from server');
        }
        
        const { facts, summary, timestamps } = response.data;
        
        let html = '';
        
        if (summary) {
            html += `<h3>${translate ? 'Zusammenfassung' : 'Summary'}:</h3><p>${summary}</p>`;
        }
        
        if (facts && facts.length > 0) {
            html += `<h3>${translate ? 'Hauptpunkte' : 'Key Points'}:</h3><ul>`;
            facts.forEach(fact => {
                html += `<li>${fact}</li>`;
            });
            html += '</ul>';
        }
        
        if (timestamps && timestamps.length > 0) {
            html += `<h3>${translate ? 'Relevante Zeitstempel' : 'Relevant Timestamps'}:</h3><ul>`;
            timestamps.forEach(timestamp => {
                html += `<li>${timestamp}</li>`;
            });
            html += '</ul>';
        }

        if (!facts.length && !summary && !timestamps.length) {
            html += `<p>${translate ? 'Keine strukturierten Informationen gefunden. Hier ist die Rohausgabe:' : 'No structured information found. Here\'s the raw response:'}</p>`;
            html += `<p>${summary}</p>`;
        }
        
        aiMessage.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        showError(error.response?.data?.error || 'Failed to get an answer');
        aiMessage.textContent = 'Error: Failed to get an answer';
    } finally {
        hideLoading(askButton);
        document.getElementById('video-chat-question').value = '';
    }
}

function loadVideoAndThumbnail(videoUrl = null, videoTitle = null) {
    if (!videoUrl) {
        videoUrl = document.getElementById('main-video-url').value.trim();
    }
    
    if (!videoUrl) {
        showError('Please enter a YouTube video URL');
        return;
    }
    
    try {
        const videoId = videoUrl.split('v=')[1];
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }
        
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
        
        const thumbnailContainer = document.getElementById('video-thumbnail');
        thumbnailContainer.innerHTML = `
            <img src="${thumbnailUrl}" alt="Video Thumbnail">
            <button onclick="addToFavorites('${videoUrl}', '${videoTitle || 'Untitled Video'}')">Add to Favorites</button>
        `;
        
        const videoPlayer = document.getElementById('video-player');
        videoPlayer.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        
        document.getElementById('main-video-url').value = videoUrl;
    } catch (error) {
        console.error('Error:', error);
        showError('Invalid YouTube URL format');
    }
}

function switchMode(mode) {
    const summaryContainer = document.getElementById('summary-container');
    const chatContainer = document.getElementById('video-chat-container');
    const summaryBtn = document.getElementById('summary-btn');
    const chatBtn = document.getElementById('chat-btn');

    if (mode === 'summary') {
        summaryContainer.style.display = 'block';
        chatContainer.style.display = 'none';
        summaryBtn.classList.add('active');
        chatBtn.classList.remove('active');
    } else {
        summaryContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        chatBtn.classList.add('active');
        summaryBtn.classList.remove('active');
    }
}

async function shareSummary() {
    const summaryText = document.getElementById('summary-result').innerText;
    const videoUrl = document.getElementById('main-video-url').value;
    
    if (!summaryText) {
        showError('No summary available to share');
        return;
    }
    
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Video Summary',
                text: summaryText,
                url: videoUrl
            });
            console.log('Summary shared successfully');
        } else {
            // Fallback for browsers that don't support the Web Share API
            const tempInput = document.createElement('textarea');
            tempInput.value = `Video Summary for ${videoUrl}:\n\n${summaryText}`;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('Summary copied to clipboard!');
        }
    } catch (error) {
        console.error('Error sharing summary:', error);
        showError('Failed to share summary');
    }
}
