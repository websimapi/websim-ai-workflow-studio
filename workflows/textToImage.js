import { state } from '../state.js';
import { createResultImage, showLoading, showError } from '../utils.js';

export async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value;
    const aspectRatio = document.getElementById('aspectRatio').value;
    const transparent = document.getElementById('transparentBg').checked;
    
    if (!prompt.trim()) {
        alert('Please enter a prompt');
        return;
    }
    
    const resultDiv = document.getElementById('imageResult');
    showLoading(resultDiv);
    
    try {
        const result = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: aspectRatio,
            transparent: transparent
        });
        
        state.lastGeneratedImage = result.url;
        state.lastGeneratedText = `Text->Image "${prompt}"`;
        
        resultDiv.innerHTML = createResultImage(result.url, 'Generated image');
        document.getElementById('commentImageBtn').style.display = 'inline-block';
    } catch (error) {
        showError(resultDiv, error.message);
        document.getElementById('commentImageBtn').style.display = 'none';
    }
}

