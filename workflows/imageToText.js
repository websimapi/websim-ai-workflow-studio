import { state } from '../state.js';
import { showLoading, showError } from '../utils.js';

export function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('uploadPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        state.uploadedImage = e.target.result;
        preview.innerHTML = `<img src="${state.uploadedImage}" alt="Uploaded image" />`;
        document.getElementById('analyzeBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

export async function analyzeImage() {
    if (!state.uploadedImage) return;
    
    const resultDiv = document.getElementById('textResult');
    showLoading(resultDiv);
    
    try {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Describe this image in detail. Include what's visible, the style, colors, mood, and any interesting elements."
                        },
                        {
                            type: "image_url",
                            image_url: { url: state.uploadedImage }
                        }
                    ]
                }
            ]
        });
        
        state.lastGeneratedText = `Image->Text "${completion.content}"`;
        
        resultDiv.innerHTML = `
            <h3>Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap;">${completion.content}</p>
        `;
        
        document.getElementById('commentTextBtn').style.display = 'inline-block';
    } catch (error) {
        showError(resultDiv, error.message);
        document.getElementById('commentTextBtn').style.display = 'none';
    }
}