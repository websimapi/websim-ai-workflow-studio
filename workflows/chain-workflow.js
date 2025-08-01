import { downloadImage } from '../utils.js';
import { getAppState, updateAppState } from '../app.js';

// Chain Workflow (Image → Text → Image)
export function handleChainUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('chainPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        updateAppState({ uploadedImage: e.target.result });
        preview.innerHTML = `<img src="${e.target.result}" alt="Chain image" />`;
        document.getElementById('chainBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

export async function startChain() {
    const { uploadedImage } = getAppState();
    if (!uploadedImage) return;
    
    const resultDiv = document.getElementById('chainResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing image...</p>';
    
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
                            image_url: { url: uploadedImage }
                        }
                    ]
                }
            ]
        });
        
        resultDiv.innerHTML = '<div class="loading"></div><p>Generating new image...</p>';
        
        // Step 2: Generate new image
        const newImage = await websim.imageGen({
            prompt: analysis.content,
            aspect_ratio: "16:9"
        });
        
        updateAppState({
            lastGeneratedImage: newImage.url,
            lastGeneratedText: `Image->Text->Image "${analysis.content}"`
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

// Make available globally
window.handleChainUpload = handleChainUpload;
window.startChain = startChain;