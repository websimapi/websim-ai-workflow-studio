import { analyzeImage, generateImage } from './api.js';
import { setUploadedImage, setUploadedImage2, setLastGenerated } from './state.js';

export function handleCombineUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        if (index === 1) {
            setUploadedImage(e.target.result);
            document.getElementById('preview1').innerHTML = `<img src="${e.target.result}" alt="Image 1" />`;
        } else {
            setUploadedImage2(e.target.result);
            document.getElementById('preview2').innerHTML = `<img src="${e.target.result}" alt="Image 2" />`;
        }
        
        if (window.uploadedImage && window.uploadedImage2) {
            document.getElementById('combineBtn').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

export async function handleCombineImages() {
    const uploadedImage = window.uploadedImage;
    const uploadedImage2 = window.uploadedImage2;
    
    if (!uploadedImage || !uploadedImage2) return;
    
    const prompt = document.getElementById('combinePrompt').value || "Combine these two images in a creative way";
    const weight1 = document.getElementById('weightSlider')?.value || 50;
    const weight2 = 100 - weight1;
    
    const resultDiv = document.getElementById('combineResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing images in detail...</p>';
    
    try {
        const analysis = await analyzeImage({ 
            imageUrl: uploadedImage,
            prompt: `I need to combine these two images based on this specific instruction: "${prompt}". Analyze each image carefully and create a detailed description for generating a combined image.`
        });
        
        resultDiv.innerHTML = '<div class="loading"></div><p>Creating sophisticated combined image...</p>';
        
        const cleanedPrompt = analysis.content
            .replace(/[^a-zA-Z0-9\s.,!?']/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\.{2,}/g, '.')
            .replace(/,{2,}/g, ',')
            .trim();
        
        const combinedImage = await generateImage({ 
            prompt: cleanedPrompt,
            aspectRatio: "16:9"
        });
        
        setLastGenerated({
            type: 'image',
            url: combinedImage.url,
            text: `Combine Images "${prompt}" | Description: "${cleanedPrompt}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Enhanced Description:</h3>
            <div style="text-align: left; white-space: pre-wrap; max-height: 200px; overflow-y: auto; background: #f5f5f5; padding: 1rem; border-radius: 10px; margin-bottom: 2rem;">
                ${cleanedPrompt}
            </div>
            <h3>Combined Result (${weight1}% Image 1 / ${weight2}% Image 2):</h3>
            <img src="${combinedImage.url}" alt="Combined image" />
            <button onclick="downloadImage('${combinedImage.url}', 'ai-enhanced-combined-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
        
        document.getElementById('commentCombineBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentCombineBtn').style.display = 'none';
    }
}