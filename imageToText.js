import { analyzeImage } from './api.js';
import { setUploadedImage, setLastGenerated } from './state.js';

export function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('uploadPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        setUploadedImage(e.target.result);
        preview.innerHTML = `<img src="${e.target.result}" alt="Uploaded image" />`;
        document.getElementById('analyzeBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

export async function handleAnalyzeImage() {
    const uploadedImage = window.uploadedImage;
    if (!uploadedImage) return;
    
    const resultDiv = document.getElementById('textResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        const analysis = await analyzeImage({ 
            imageUrl: uploadedImage,
            prompt: "Describe this image in detail. Include what's visible, the style, colors, mood, and any interesting elements."
        });
        
        setLastGenerated({
            type: 'text',
            text: `Image->Text "${analysis.content}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap;">${analysis.content}</p>
        `;
        
        document.getElementById('commentTextBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentTextBtn').style.display = 'none';
    }
}

