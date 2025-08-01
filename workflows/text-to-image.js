import { downloadImage } from '../utils.js';
import { getAppState, updateAppState } from '../app.js';

// Text to Image Workflow
export async function generateImage() {
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
        const result = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: aspectRatio,
            transparent: transparent
        });
        
        updateAppState({
            lastGeneratedImage: result.url,
            lastGeneratedText: `Text->Image "${prompt}"`
        });
        
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

// Make available globally
window.generateImage = generateImage;

