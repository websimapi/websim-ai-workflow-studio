// modules/workflows/imageToText.js
import { analyzeImage } from '../services/analysisService.js';
import { commentResult } from '../services/commentService.js';

export function initializeImageToText() {
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
    }
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyzeImage);
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('uploadPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        window.AppState.uploadedImage = e.target.result;
        preview.innerHTML = `<img src="${window.AppState.uploadedImage}" alt="Uploaded image" />`;
        document.getElementById('analyzeBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

async function handleAnalyzeImage() {
    if (!window.AppState.uploadedImage) return;
    
    const resultDiv = document.getElementById('textResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        const analysis = await analyzeImage(window.AppState.uploadedImage);
        
        window.AppState.lastGeneratedText = `Image->Text "${analysis}"`;
        
        resultDiv.innerHTML = `
            <h3>Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap;">${analysis}</p>
        `;
        
        document.getElementById('commentTextBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentTextBtn').style.display = 'none';
    }
}

