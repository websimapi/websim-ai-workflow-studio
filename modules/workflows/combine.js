// modules/workflows/combine.js
import { combineImages } from '../services/combinationService.js';
import { commentResult } from '../services/commentService.js';
import { downloadImage } from '../services/downloadService.js';

export function initializeCombine() {
    const fileInputs = ['image1', 'image2'];
    fileInputs.forEach((id, index) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', (e) => handleCombineUpload(e, index + 1));
        }
    });
    
    const combineBtn = document.getElementById('combineBtn');
    if (combineBtn) {
        combineBtn.addEventListener('click', handleCombineImages);
    }
    
    // Initialize weight slider
    const slider = document.getElementById('weightSlider');
    const display = document.getElementById('weightDisplay');
    if (slider) {
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            display.textContent = `${value}% Image 1 / ${100 - value}% Image 2`;
        });
    }
}

function handleCombineUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        if (index === 1) {
            window.AppState.uploadedImage = e.target.result;
            document.getElementById('preview1').innerHTML = `<img src="${window.AppState.uploadedImage}" alt="Image 1" />`;
        } else {
            window.AppState.uploadedImage2 = e.target.result;
            document.getElementById('preview2').innerHTML = `<img src="${window.AppState.uploadedImage2}" alt="Image 2" />`;
        }
        
        if (window.AppState.uploadedImage && window.AppState.uploadedImage2) {
            document.getElementById('combineBtn').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

async function handleCombineImages() {
    if (!window.AppState.uploadedImage || !window.AppState.uploadedImage2) return;
    
    const prompt = document.getElementById('combinePrompt').value || "Combine these two images in a creative way";
    const weight1 = document.getElementById('weightSlider')?.value || 50;
    const weight2 = 100 - weight1;
    
    const resultDiv = document.getElementById('combineResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing images in detail...</p>';
    
    try {
        const result = await combineImages({
            image1: window.AppState.uploadedImage,
            image2: window.AppState.uploadedImage2,
            prompt,
            weight1,
            weight2
        });
        
        window.AppState.lastGeneratedImage = result.imageUrl;
        window.AppState.lastGeneratedText = result.description;
        
        resultDiv.innerHTML = `
            <h3>Enhanced Description (focused on user-specified details):</h3>
            <div style="text-align: left; white-space: pre-wrap; max-height: 200px; overflow-y: auto; background: #f5f5f5; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; line-height: 1.6;">
                ${result.cleanedPrompt}
            </div>
            <h3>Combined Result (${weight1}% Image 1 / ${weight2}% Image 2):</h3>
            <img src="${result.imageUrl}" alt="Combined image with enhanced detail preservation" />
            <button onclick="downloadImage('${result.imageUrl}', 'ai-enhanced-combined-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
        
        document.getElementById('commentCombineBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentCombineBtn').style.display = 'none';
    }
}