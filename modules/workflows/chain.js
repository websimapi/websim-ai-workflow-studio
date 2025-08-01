// modules/workflows/chain.js
import { analyzeImage } from '../services/analysisService.js';
import { generateImage } from '../services/imageService.js';
import { commentResult } from '../services/commentService.js';

export function initializeChain() {
    const fileInput = document.getElementById('chainImageUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleChainUpload);
    }
    
    const chainBtn = document.getElementById('chainBtn');
    if (chainBtn) {
        chainBtn.addEventListener('click', handleStartChain);
    }
}

export function handleChainUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('chainPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        window.AppState.uploadedImage = e.target.result;
        preview.innerHTML = `<img src="${window.AppState.uploadedImage}" alt="Chain image" />`;
        document.getElementById('chainBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

export async function handleStartChain() {
    if (!window.AppState.uploadedImage) return;
    
    const resultDiv = document.getElementById('chainResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing image...</p>';
    
    try {
        // Step 1: Analyze image
        const analysis = await analyzeImage(window.AppState.uploadedImage, {
            context: 'for generating a new image',
            focus: 'key visual elements, style, and composition'
        });
        
        resultDiv.innerHTML = '<div class="loading"></div><p>Generating new image...</p>';
        
        // Step 2: Generate new image
        const newImage = await generateImage({
            prompt: analysis,
            aspectRatio: '16:9'
        });
        
        window.AppState.lastGeneratedImage = newImage.url;
        window.AppState.lastGeneratedText = `Image->Text->Image "${analysis}"`;
        
        resultDiv.innerHTML = `
            <h3>Original Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap; margin-bottom: 2rem;">${analysis}</p>
            <h3>Generated Image:</h3>
            <img src="${newImage.url}" alt="Generated from analysis" />
            <button onclick="downloadImage('${newImage.url}', 'ai-chain-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
        
        document.getElementById('commentChainBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentChainBtn').style.display = 'none';
    }
}