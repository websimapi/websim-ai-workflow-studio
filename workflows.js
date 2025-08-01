// Core workflow functionality
import { downloadImage, downloadAudio } from './utils.js';
import { getAppState, updateAppState } from './app.js';

// Text to Image Workflow
export async function generateImage() {
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
        
        updateAppState({
            lastGeneratedImage: result.url,
            lastGeneratedText: `Text->Image "${prompt}"`
        });
        
        resultDiv.innerHTML = `
            <img src="${result.url}" alt="Generated image" />
            <button onclick="downloadImage('${result.url}', 'ai-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
        
        document.getElementById('commentImageBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentImageBtn').style.display = 'none';
    }
}

// Text to Speech Workflow
export async function generateSpeech() {
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
        
        updateAppState({
            lastGeneratedAudio: result.url,
            lastGeneratedText: `Text->Speech "${text}"`
        });
        
        resultDiv.innerHTML = `
            <audio controls>
                <source src="${result.url}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            <button onclick="downloadAudio('${result.url}', '${text.substring(0, 20)}.mp3')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
        
        document.getElementById('commentSpeechBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentSpeechBtn').style.display = 'none';
    }
}

// Image to Text Workflow
export function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('uploadPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        updateAppState({ uploadedImage: e.target.result });
        preview.innerHTML = `<img src="${e.target.result}" alt="Uploaded image" />`;
        document.getElementById('analyzeBtn').disabled = false;
    };
    
    reader.readAsDataURL(file);
}

export async function analyzeImage() {
    const { uploadedImage } = getAppState();
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
        
        updateAppState({
            lastGeneratedText: `Image->Text "${completion.content}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap;">${completion.content}</p>
        `;
        
        document.getElementById('commentTextBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentTextBtn').style.display = 'none';
    }
}

// Chain Workflow
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

// Combine Images Workflow
export function handleCombineUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const state = getAppState();
        if (index === 1) {
            updateAppState({ uploadedImage: e.target.result });
            document.getElementById('preview1').innerHTML = `<img src="${e.target.result}" alt="Image 1" />`;
        } else {
            updateAppState({ uploadedImage2: e.target.result });
            document.getElementById('preview2').innerHTML = `<img src="${e.target.result}" alt="Image 2" />`;
        }
        
        const currentState = getAppState();
        if (currentState.uploadedImage && currentState.uploadedImage2) {
            document.getElementById('combineBtn').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

export async function combineImages() {
    const { uploadedImage, uploadedImage2 } = getAppState();
    if (!uploadedImage || !uploadedImage2) return;
    
    const prompt = document.getElementById('combinePrompt').value || "Combine these two images in a creative way";
    const weight1 = document.getElementById('weightSlider')?.value || 50;
    const weight2 = 100 - weight1;
    
    const resultDiv = document.getElementById('combineResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing images in detail...</p>';
    
    try {
        // Enhanced analysis with explicit focus on user-specified details
        const analysis = await websim.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `I need to combine these two images based on this specific instruction: "${prompt}". 

CRITICAL: Identify and emphasize any specific details mentioned by the user. If they mention "face", "shirt", "color", "pattern", "texture", "lighting", "expression", "style", or any other specific element - these MUST be described with EXTREME precision and detail in your final description. These user-specified elements should dominate the narrative.

Analyze each image carefully and extract the following with exact detail:
- Any faces: describe facial features, expression, skin tone, hair style/color, eye color, makeup
- Clothing: describe fabric texture, color patterns, fit, style details, buttons, seams, accessories
- Colors: describe exact color values, gradients, saturation, how colors interact
- Patterns: describe pattern type, scale, repetition, color combinations
- Lighting: describe direction, intensity, shadows, highlights, color temperature
- Background elements: describe what's visible, depth, atmosphere

Now create a flowing narrative description that:
1. Starts by establishing the overall scene composition
2. Gives PRIMARY emphasis to any elements specifically mentioned in the user's prompt
3. Balances Image 1 (${weight1}%) and Image 2 (${weight2}%) as specified
4. Uses only English alphanumeric characters and spaces
5. Reads like a detailed artistic description
6. Preserves all important visual details, especially user-specified ones

Write as if you're a photographer describing a scene to another artist who needs to recreate it exactly.`
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
        
        // Ultra-clean the prompt to ensure only English alphanumeric characters
        const cleanedPrompt = analysis.content
            .replace(/[^a-zA-Z0-9\s.,!?']/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\.{2,}/g, '.')
            .replace(/,{2,}/g, ',')
            .trim();
        
        // Generate combined image with enhanced description
        const combinedImage = await websim.imageGen({
            prompt: cleanedPrompt,
            aspect_ratio: "16:9"
        });
        
        updateAppState({
            lastGeneratedImage: combinedImage.url,
            lastGeneratedText: `Combine Images "${prompt}" | Description: "${cleanedPrompt}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Enhanced Description (focused on user-specified details):</h3>
            <div style="text-align: left; white-space: pre-wrap; max-height: 200px; overflow-y: auto; background: #f5f5f5; padding: 1rem; border-radius: 10px; margin-bottom: 2rem; line-height: 1.6;">
                ${cleanedPrompt}
            </div>
            <h3>Combined Result (${weight1}% Image 1 / ${weight2}% Image 2):</h3>
            <img src="${combinedImage.url}" alt="Combined image with enhanced detail preservation" style="max-width: 100%; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);" />
            <button onclick="downloadImage('${combinedImage.url}', 'ai-enhanced-combined-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
        
        document.getElementById('commentCombineBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentCombineBtn').style.display = 'none';
    }
}

// Enhanced AI processing for complex chained requests
export async function processSpeechText() {
    const text = document.getElementById('speechToTextResult').value;
    
    if (!text.trim()) {
        alert('Please speak some text first');
        return;
    }
    
    const resultDiv = document.getElementById('speechTextResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>AI analyzing your request...</p>';
    
    try {
        // Enhanced AI that can handle complex chained workflows
        const analysis = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Analyze the user's spoken request and determine the EXACT workflow sequence needed. You can handle complex multi-step requests.

Return JSON with the workflow plan. Examples:
- "make a dragon image then describe it and make it again" → {"steps": ["text-to-image", "image-to-text", "text-to-image"], "prompts": ["dragon", "describe dragon image", "dragon based on description"], "descriptions": ["Generate initial dragon image", "Analyze the dragon image", "Recreate dragon from description"]}
- "create a cat then turn it into text then make a new cat image" → {"steps": ["text-to-image", "image-to-text", "text-to-image"], "prompts": ["cat", "describe cat image", "cat based on description"]}
- "make a picture of a sunset" → {"steps": ["text-to-image"], "prompts": ["sunset"]}
- "analyze this image" → {"steps": ["image-to-text"]}

Always return valid JSON with keys: steps (array), prompts (array), descriptions (array)`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            json: true
        });
        
        const workflowPlan = JSON.parse(analysis.content);
        await executeSpeechWorkflow(workflowPlan, text);
        
        document.getElementById('commentSpeechTextBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentSpeechTextBtn').style.display = 'none';
    }
}

// Execute complex speech workflows
async function executeSpeechWorkflow(plan, originalText) {
    const resultDiv = document.getElementById('speechTextResult');
    let currentImage = null;
    let currentText = null;
    
    // Clear previous results
    resultDiv.innerHTML = '';
    const resultsContainer = document.createElement('div');
    resultsContainer.style.cssText = 'text-align: left; margin: 1rem 0;';
    resultDiv.appendChild(resultsContainer);
    
    for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        const prompt = plan.prompts[i] || '';
        const description = plan.descriptions?.[i] || '';
        
        const stepDiv = document.createElement('div');
        stepDiv.style.cssText = 'margin: 1rem 0; padding: 1rem; background: #f5f5f5; border-radius: 10px;';
        
        switch(step) {
            case 'text-to-image':
                const imageResult = await websim.imageGen({
                    prompt: prompt,
                    aspect_ratio: "16:9"
                });
                currentImage = imageResult.url;
                
                stepDiv.innerHTML = `
                    <h4>Step ${i+1}: Text → Image</h4>
                    <p><em>Prompt:</em> ${prompt}</p>
                    <img src="${imageResult.url}" alt="Generated image" style="max-width: 100%; border-radius: 5px; margin: 0.5rem 0;" />
                `;
                break;
                
            case 'image-to-text':
                if (!currentImage) {
                    stepDiv.innerHTML = `<p>Error: No image available for analysis</p>`;
                    break;
                }
                
                const analysis = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Describe this image in detail for the purpose of recreating it. Include all key visual elements, style, colors, and composition details."
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: currentImage }
                                }
                            ]
                        }
                    ]
                });
                currentText = analysis.content;
                
                stepDiv.innerHTML = `
                    <h4>Step ${i+1}: Image → Text Analysis</h4>
                    <p><em>Description:</em> ${analysis.content}</p>
                    <img src="${currentImage}" alt="Image being analyzed" style="max-width: 100px; border-radius: 5px; margin: 0.5rem 0;" />
                `;
                break;
                
            case 'text-to-speech':
                const speechResult = await websim.textToSpeech({
                    text: prompt || currentText || originalText,
                    voice: 'en-male'
                });
                
                stepDiv.innerHTML = `
                    <h4>Step ${i+1}: Text → Speech</h4>
                    <p><em>Text:</em> ${prompt || currentText || originalText}</p>
                    <audio controls style="margin: 0.5rem 0;">
                        <source src="${speechResult.url}" type="audio/mpeg">
                    </audio>
                `;
                break;
                
            case 'chain':
                // Special handling for image -> text -> image
                if (!currentImage) {
                    stepDiv.innerHTML = `<p>Error: No image available for chaining</p>`;
                    break;
                }
                
                const chainAnalysis = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Describe this image in detail for recreation"
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: currentImage }
                                }
                            ]
                        }
                    ]
                });
                
                const chainImage = await websim.imageGen({
                    prompt: chainAnalysis.content,
                    aspect_ratio: "16:9"
                });
                currentImage = chainImage.url;
                
                stepDiv.innerHTML = `
                    <h4>Step ${i+1}: Image → Text → Image</h4>
                    <p><em>Analysis:</em> ${chainAnalysis.content}</p>
                    <img src="${chainImage.url}" alt="Chained result" style="max-width: 100%; border-radius: 5px; margin: 0.5rem 0;" />
                `;
                break;
        }
        
        resultsContainer.appendChild(stepDiv);
    }
    
    // Update final state
    updateAppState({
        lastGeneratedImage: currentImage,
        lastGeneratedText: originalText,
        lastGeneratedAudio: null
    });
}

// Improved speech recognition
export function startRecording() {
    const state = getAppState();
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        updateAppState({ isRecording: true });
        document.getElementById('startRecording').style.display = 'none';
        document.getElementById('stopRecording').style.display = 'inline-block';
        document.getElementById('recordingStatus').textContent = 'Listening...';
    };
    
    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        const textarea = document.getElementById('speechToTextResult');
        textarea.value = finalTranscript || interimTranscript;
        updateAppState({ speechText: textarea.value.trim() });
        
        // Auto-process after 2 seconds of silence
        if (finalTranscript) {
            setTimeout(() => {
                if (!getAppState().isRecording) {
                    processSpeechText();
                }
            }, 2000);
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('recordingStatus').textContent = `Error: ${event.error}`;
    };
    
    recognition.onend = () => {
        // Don't clear text on end
        document.getElementById('recordingStatus').textContent = 'Processing...';
        setTimeout(() => {
            stopRecording();
            processSpeechText();
        }, 500);
    };
    
    updateAppState({ speechRecognizer: recognition });
    recognition.start();
}

export function stopRecording() {
    const { speechRecognizer, isRecording } = getAppState();
    
    if (!isRecording || !speechRecognizer) return;
    
    speechRecognizer.stop();
    updateAppState({ isRecording: false, speechRecognizer: null });
    
    document.getElementById('startRecording').style.display = 'inline-block';
    document.getElementById('stopRecording').style.display = 'none';
    document.getElementById('recordingStatus').textContent = 'Processing...';
}

// Make functions available globally for HTML onclick handlers
window.generateImage = generateImage;
window.generateSpeech = generateSpeech;
window.handleImageUpload = handleImageUpload;
window.analyzeImage = analyzeImage;
window.handleChainUpload = handleChainUpload;
window.startChain = startChain;
window.handleCombineUpload = handleCombineUpload;
window.combineImages = combineImages;
window.downloadImage = downloadImage;
window.downloadAudio = downloadAudio;

// Make enhanced functions available globally
window.processSpeechText = processSpeechText;
window.startRecording = startRecording;