// Global state
let currentWorkflow = 'text-to-image';
let uploadedImage = null;
let uploadedImage2 = null;

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.workflow').forEach(w => w.classList.remove('active'));
        document.getElementById(btn.dataset.workflow).classList.add('active');
        
        currentWorkflow = btn.dataset.workflow;
    });
});

// Text to Image
async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value;
    const aspectRatio = document.getElementById('aspectRatio').value;
    const transparent = document.getElementById('transparentBg').checked;
    
    if (!prompt.trim()) {
        alert('Please enter a prompt');
        return;
    }
    
    const resultDiv = document.getElementById('imageResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        const result = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: aspectRatio,
            transparent: transparent
        });
        
        resultDiv.innerHTML = `
            <img src="${result.url}" alt="Generated image" />
            <button onclick="downloadImage('${result.url}', 'ai-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Text to Speech
async function generateSpeech() {
    const text = document.getElementById('speechText').value;
    const voice = document.getElementById('voice').value;
    
    if (!text.trim()) {
        alert('Please enter text');
        return;
    }
    
    const resultDiv = document.getElementById('speechResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        const result = await websim.textToSpeech({
            text: text,
            voice: voice
        });
        
        resultDiv.innerHTML = `
            <audio controls>
                <source src="${result.url}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            <button onclick="downloadAudio('${result.url}', '${text.substring(0, 20)}.mp3')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Image to Text
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('uploadPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        preview.innerHTML = `<img src="${uploadedImage}" alt="Uploaded image" />`;
        document.getElementById('analyzeBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

async function analyzeImage() {
    if (!uploadedImage) return;
    
    const resultDiv = document.getElementById('textResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
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
                            image_url: { url: uploadedImage }
                        }
                    ]
                }
            ]
        });
        
        resultDiv.innerHTML = `
            <h3>Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap;">${completion.content}</p>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Chain Workflow
function handleChainUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('chainPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        preview.innerHTML = `<img src="${uploadedImage}" alt="Chain image" />`;
        document.getElementById('chainBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

async function startChain() {
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
        
        resultDiv.innerHTML = `
            <h3>Original Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap; margin-bottom: 2rem;">${analysis.content}</p>
            <h3>Generated Image:</h3>
            <img src="${newImage.url}" alt="Generated from analysis" />
            <button onclick="downloadImage('${newImage.url}', 'ai-chain-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Combine Images
function handleCombineUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        if (index === 1) {
            uploadedImage = e.target.result;
            document.getElementById('preview1').innerHTML = `<img src="${uploadedImage}" alt="Image 1" />`;
        } else {
            uploadedImage2 = e.target.result;
            document.getElementById('preview2').innerHTML = `<img src="${uploadedImage2}" alt="Image 2" />`;
        }
        
        if (uploadedImage && uploadedImage2) {
            document.getElementById('combineBtn').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// Add weight slider functionality
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('weightSlider');
    const display = document.getElementById('weightDisplay');
    
    if (slider) {
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            display.textContent = `${value}% Image 1 / ${100-value}% Image 2`;
        });
    }
});

async function combineImages() {
    if (!uploadedImage || !uploadedImage2) return;
    
    const prompt = document.getElementById('combinePrompt').value || "Combine these two images in a creative way";
    const weight1 = document.getElementById('weightSlider')?.value || 50;
    const weight2 = 100 - weight1;
    
    const resultDiv = document.getElementById('combineResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing images in detail...</p>';
    
    try {
        // Enhanced analysis with separate detailed descriptions
        const analysis = await websim.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `I need to combine these two images based on this prompt: "${prompt}". 
                            
Please provide a DETAILED technical analysis for each image and create a final English description using only alphanumeric characters and spaces.

**Image 1 Analysis (Weight: ${weight1}%):**
1. Main subject and objects
2. Color palette and dominant colors
3. Lighting and mood
4. Style and composition
5. Background elements

**Image 2 Analysis (Weight: ${weight2}%):**
1. Main subject and objects
2. Color palette and dominant colors
3. Lighting and mood
4. Style and composition
5. Background elements

**Final Description:**
Create a single paragraph description in plain English using only alphanumeric characters and spaces. This description should guide the creation of a new image that combines both source images according to the specified weights while maintaining all important visual details.`
                        },
                        {
                            type: "image_url",
                            image_url: { url: uploadedImage }
                        },
                        {
                            type: "image_url",
                            image_url: { url: uploadedImage2 }
                        }
                    ]
                }
            ]
        });
        
        resultDiv.innerHTML = '<div class="loading"></div><p>Creating sophisticated combined image...</p>';
        
        // Clean the prompt to ensure only English alphanumeric characters
        const cleanedPrompt = analysis.content
            .replace(/[^a-zA-Z0-9\s.,]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Generate combined image with cleaned prompt
        const combinedImage = await websim.imageGen({
            prompt: cleanedPrompt,
            aspect_ratio: "16:9"
        });
        
        resultDiv.innerHTML = `
            <h3>Analysis & Cleaned Description:</h3>
            <div style="text-align: left; white-space: pre-wrap; max-height: 150px; overflow-y: auto; background: #f5f5f5; padding: 1rem; border-radius: 10px; margin-bottom: 2rem;">
                ${cleanedPrompt}
            </div>
            <h3>Combined Result (${weight1}% Image 1 / ${weight2}% Image 2):</h3>
            <img src="${combinedImage.url}" alt="Combined image" style="max-width: 100%; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);" />
            <button onclick="downloadImage('${combinedImage.url}', 'ai-combined-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Download utilities
async function downloadImage(imageUrl, filename = 'ai-image.png') {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download the image:', error);
    alert('Could not download the image. See console for details.');
  }
}

async function downloadAudio(audioUrl, filename = 'ai-audio.mp3') {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download the audio:', error);
    alert('Could not download the audio. See console for details.');
  }
}