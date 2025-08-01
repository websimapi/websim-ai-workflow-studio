// Shared utilities and download helpers
export async function downloadImage(imageUrl, filename = 'ai-image.png') {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download the image:', error);
    alert('Could not download the image. See console for details.');
  }
}

export async function downloadAudio(audioUrl, filename = 'ai-audio.mp3') {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download the audio:', error);
    alert('Could not download the audio. See console for details.');
  }
}

export function extractImageUrlsFromMarkdown(content) {
    const urls = [];
    
    // Match the pattern [![](url)](url) or ![](url)
    const regex = /!\[.*?\]\((.*?)\)|\[!\[.*?\]\((.*?)\)\]\((.*?)\)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        // The actual image URL is either in group 1 (simple format) or group 2 (linked format)
        const url = match[1] || match[2] || match[3];
        if (url && !urls.includes(url)) {
            urls.push(url);
        }
    }
    
    return urls;
}

export function showLoading(container, text = 'Processing...') {
    container.innerHTML = `<div class="loading"></div><p>${text}</p>`;
}

export function showError(container, message) {
    container.innerHTML = `<p style="color: red;">Error: ${message}</p>`;
}

export function createResultImage(url, alt = 'Generated image') {
    return `
        <img src="${url}" alt="${alt}" />
        <button onclick="downloadImage('${url}', 'ai-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}

export function createAudioPlayer(url, filename = 'ai-audio.mp3') {
    return `
        <audio controls>
            <source src="${url}" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
        <button onclick="downloadAudio('${url}', '${filename}')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}