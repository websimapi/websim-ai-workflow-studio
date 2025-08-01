import { analyzeImage, generateImage } from './api.js';
import { reuploadImageFromUrl } from './api.js';
import { setUploadedImage, setLastGenerated } from './state.js';

export function handleChainUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('chainPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        setUploadedImage(e.target.result);
        preview.innerHTML = `<img src="${e.target.result}" alt="Chain image" />`;
        document.getElementById('chainBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

export async function handleStartChain() {
    const uploadedImage = window.uploadedImage;
    if (!uploadedImage) return;
    
    const resultDiv = document.getElementById('chainResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing image...</p>';
    
    try {
        // Step 1: Analyze image
        const analysis = await analyzeImage({ 
            imageUrl: uploadedImage,
            prompt: "Describe this image in detail for the purpose of generating a new image. Focus on the key visual elements, style, and composition."
        });
        
        resultDiv.innerHTML = '<div class="loading"></div><p>Generating new image...</p>';
        
        // Step 2: Generate new image
        const newImage = await generateImage({ 
            prompt: analysis.content,
            aspectRatio: "16:9"
        });
        
        setLastGenerated({
            type: 'image',
            url: newImage.url,
            text: `Image->Text->Image "${analysis.content}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Original Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap; margin-bottom: 2rem;">${analysis.content}</p>
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

