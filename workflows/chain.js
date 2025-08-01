import { state } from '../state.js';
import { createResultImage, showLoading, showError } from '../utils.js';

export function handleChainUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('chainPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        state.uploadedImage = e.target.result;
        preview.innerHTML = `<img src="${state.uploadedImage}" alt="Chain image" />`;
        document.getElementById('chainBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

export async function startChain() {
    if (!state.uploadedImage) return;
    
    const resultDiv = document.getElementById('chainResult');
    showLoading(resultDiv, 'Analyzing image...');
    
    try {
        // Step 1: Analyze image
        const analysis = await websim.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Describe this image in detail for the purpose of generating a new image. Focus on the key visual elements, style, and composition."
                        },
                        {
                            type: "image_url",
                            image_url: { url: state.uploadedImage }
                        }
                    ]
                }
            ]
        });
        
        showLoading(resultDiv, 'Generating new image...');
        
        // Step 2: Generate new image
        const newImage = await websim.imageGen({
            prompt: analysis.content,
            aspect_ratio: "16:9"
        });
        
        state.lastGeneratedImage = newImage.url;
        state.lastGeneratedText = `Image->Text->Image "${analysis.content}"`;
        
        resultDiv.innerHTML = `
            <h3>Original Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap; margin-bottom: 2rem;">${analysis.content}</p>
            <h3>Generated Image:</h3>
            ${createResultImage(newImage.url, 'Generated from analysis')}
        `;
        
        document.getElementById('commentChainBtn').style.display = 'inline-block';
    } catch (error) {
        showError(resultDiv, error.message);
        document.getElementById('commentChainBtn').style.display = 'none';
    }
}