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
    element.classList.add('loading');
}

function addToFavorites(videoUrl, videoTitle) {
    if (!favorites.some(fav => fav.url === videoUrl)) {
        favorites.push({ url: videoUrl, title: videoTitle });
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesList();
    }
}

function removeFromFavorites(videoUrl) {
    favorites = favorites.filter(fav => fav.url !== videoUrl);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList();
}

function updateFavoritesList() {
    const favoritesList = document.getElementById('favorites-list');
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

function hideLoading(element) {
    element.classList.remove('loading');
}

async function searchVideos() {
    const input = document.getElementById('video-search');
    const searchButton = document.querySelector('#video-container button');
    const query = input.value;
    input.value = '';

    showLoading(searchButton);
    try {
        const response = await axios.post('/search_videos', { query: query });
        displayVideos(response.data);
    } catch (error) {
        console.error('Error:', error);
        displayVideos([{ title: 'Error: Failed to search videos' }]);
    } finally {
        hideLoading(searchButton);
    }
}

function startVideoChat() {
    document.getElementById('toggle-switch').checked = true;
    toggleSummaryChat();
    const videoUrl = document.getElementById('main-video-url').value;
    document.getElementById('video-chat-container').scrollIntoView({ behavior: 'smooth' });
    // Clear previous chat messages
    document.getElementById('chat-messages').innerHTML = '';
    // Focus on the question input
    document.getElementById('video-chat-question').focus();
    // Ensure the video URL is set
    if (!videoUrl) {
        alert('Please enter a YouTube video URL first.');
        return;
    }
    // Load the video if not already loaded
    loadVideoAndThumbnail(videoUrl);
}

function displayVideos(videos) {
    const videoResults = document.getElementById('video-results');
    videoResults.innerHTML = '';

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
    const videoUrl = document.getElementById('main-video-url').value;
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
        summaryResult.innerHTML = 'Error: Failed to summarize video';
        progressBar.style.width = '0%';
    } finally {
        hideLoading(summarizeButton);
    }
}

async function askVideoQuestion(translate) {
    const videoUrl = document.getElementById('main-video-url').value;
    const question = document.getElementById('video-chat-question').value;
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
        const response = await axios.post('/video_chat', { video_url: videoUrl, question: question, translate: translate });
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
        aiMessage.textContent = 'Error: Failed to get an answer';
    } finally {
        hideLoading(askButton);
    }

    document.getElementById('video-chat-question').value = '';
}

function loadVideoAndThumbnail(videoUrl = null, videoTitle = null) {
    if (!videoUrl) {
        videoUrl = document.getElementById('main-video-url').value;
    }
    const videoId = videoUrl.split('v=')[1];
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
    
    const thumbnailContainer = document.getElementById('video-thumbnail');
    thumbnailContainer.innerHTML = `
        <img src="${thumbnailUrl}" alt="Video Thumbnail">
        <button onclick="addToFavorites('${videoUrl}', '${videoTitle || 'Untitled Video'}')">Add to Favorites</button>
    `;
    
    const videoPlayer = document.getElementById('video-player');
    videoPlayer.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    
    document.getElementById('main-video-url').value = videoUrl;
}

function toggleSummaryChat() {
    const summaryContainer = document.getElementById('summary-container');
    const chatContainer = document.getElementById('video-chat-container');
    const toggleLabel = document.getElementById('toggle-label');
    const isChecked = document.getElementById('toggle-switch').checked;

    if (isChecked) {
        summaryContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        toggleLabel.textContent = 'Chat';
    } else {
        summaryContainer.style.display = 'block';
        chatContainer.style.display = 'none';
        toggleLabel.textContent = 'Summary';
    }
}

function shareSummary() {
    const summaryText = document.getElementById('summary-result').innerText;
    const videoUrl = document.getElementById('main-video-url').value;
    
    if (navigator.share) {
        navigator.share({
            title: 'Video Summary',
            text: summaryText,
            url: videoUrl
        }).then(() => {
            console.log('Summary shared successfully');
        }).catch((error) => {
            console.error('Error sharing summary:', error);
        });
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
}
