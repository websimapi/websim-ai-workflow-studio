// modules/workflows/textToImage.js
import { generateImage } from '../services/imageService.js';
import { commentResult } from '../services/commentService.js';

export function initializeTextToImage() {
    const generateBtn = document.querySelector('#text-to-image .primary-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateImage);
    }
}

export async function handleGenerateImage() {
    const prompt = document.getElementById('imagePrompt').value;
    const aspectRatio = document.getElementById('aspectRatio').value;
    const transparent = document.getElementById('transparentBg').checked;
    
    if (!prompt.trim()) {
        alert('Please enter a prompt');
        return;
    }
    
    const resultDiv = document.getElementById('imageResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        const result = await generateImage({
            prompt,
            aspectRatio,
            transparent
        });
        
        window.AppState.lastGeneratedImage = result.url;
        window.AppState.lastGeneratedText = `Text->Image "${prompt}"`;
        
        resultDiv.innerHTML = `
            <img src="${result.url}" alt="Generated image" />
            <button onclick="downloadImage('${result.url}', 'ai-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
        
        document.getElementById('commentImageBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentImageBtn').style.display = 'none';
    }
}

