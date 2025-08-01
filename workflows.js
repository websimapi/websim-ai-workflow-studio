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

// Speech to Text functionality
export function startRecording() {
    const state = getAppState();
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
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
                finalTranscript += transcript.trim() + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        const textarea = document.getElementById('speechToTextResult');
        
        // Update textarea with interim results but keep final transcript
        if (finalTranscript) {
            textarea.value = finalTranscript.trim();
            updateAppState({ speechText: textarea.value.trim() });
            document.getElementById('processSpeechBtn').disabled = false;
            
            // Auto-process after final transcript
            setTimeout(() => {
                if (textarea.value.trim()) {
                    processSpeechText();
                }
            }, 1000);
        } else if (interimTranscript) {
            textarea.value = interimTranscript;
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('recordingStatus').textContent = `Error: ${event.error}`;
        stopRecording();
    };
    
    recognition.onend = () => {
        stopRecording();
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

// Enhanced processSpeechText with multi-step orchestration
export async function processSpeechText() {
    const text = document.getElementById('speechToTextResult').value;
    
    if (!text.trim()) {
        alert('Please speak some text first');
        return;
    }
    
    const resultDiv = document.getElementById('speechTextResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>AI analyzing your complex request...</p>';
    
    try {
        // Enhanced AI analysis for complex multi-step workflows
        const analysis = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI workflow orchestrator. Analyze user requests and determine the best sequence of AI operations.

Available workflows:
1. text-to-image: Generate image from text
2. image-to-text: Analyze image and describe it
3. text-to-speech: Convert text to audio
4. image-to-text-to-image: Analyze image, then generate new image from description
5. text-to-image-to-text: Generate image, then analyze it
6. chain: Complex multi-step processes

CRITICAL: Handle compound requests like "make X then do Y" by breaking into steps.

Return JSON format:
{
  "workflow": "workflow_name",
  "steps": ["step1", "step2", ...],
  "prompt": "main prompt",
  "context": "additional context"
}`
                },
                {
                    role: "user",
                    content: text
                }
            ]
        });
        
        let response;
        try {
            response = JSON.parse(analysis.content);
        } catch {
            // Fallback for non-JSON responses
            response = { workflow: "text-to-image", steps: ["text-to-image"], prompt: text };
        }
        
        await executeMultiStepWorkflow(response, text, resultDiv);
        
        document.getElementById('commentSpeechTextBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentSpeechTextBtn').style.display = 'none';
    }
}

async function executeMultiStepWorkflow(analysis, originalText, resultDiv) {
    const steps = analysis.steps || [analysis.workflow];
    let currentResult = null;
    let results = [];
    
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        resultDiv.innerHTML = `<div class="loading"></div><p>Step ${i+1}/${steps.length}: ${step.replace(/-/g, ' ')}...</p>`;
        
        try {
            switch(step) {
                case 'text-to-image':
                    currentResult = await generateImageFromText(analysis.prompt || originalText);
                    results.push({ type: 'image', url: currentResult.url });
                    break;
                    
                case 'image-to-text':
                    if (currentResult?.url) {
                        const description = await analyzeImageUrl(currentResult.url);
                        results.push({ type: 'text', content: description });
                        currentResult = description;
                    }
                    break;
                    
                case 'text-to-speech':
                    if (typeof currentResult === 'string') {
                        const audio = await generateSpeechFromText(currentResult);
                        results.push({ type: 'audio', url: audio.url });
                    }
                    break;
                    
                case 'image-to-text-to-image':
                    if (currentResult?.url) {
                        const description = await analyzeImageUrl(currentResult.url);
                        const newImage = await generateImageFromText(description);
                        results.push({ type: 'image', url: newImage.url });
                        currentResult = newImage;
                    }
                    break;
                    
                case 'text-to-image-to-text':
                    const image1 = await generateImageFromText(analysis.prompt || originalText);
                    const description1 = await analyzeImageUrl(image1.url);
                    results.push({ type: 'image', url: image1.url });
                    results.push({ type: 'text', content: description1 });
                    currentResult = description1;
                    break;
                    
                case 'chain':
                    // Handle complex chains
                    const finalResult = await handleComplexChain(originalText, results);
                    results.push(...finalResult);
                    break;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red;">Error in step ${i+1}: ${error.message}</p>`;
            return;
        }
    }
    
    // Display final results
    displayMultiStepResults(results, originalText, resultDiv);
}

async function generateImageFromText(prompt) {
    const result = await websim.imageGen({
        prompt: prompt,
        aspect_ratio: "16:9"
    });
    return result;
}

async function analyzeImageUrl(imageUrl) {
    const base64 = await convertImageToBase64(imageUrl);
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
                        image_url: { url: base64 }
                    }
                ]
            }
        ]
    });
    return analysis.content;
}

async function generateSpeechFromText(text) {
    const result = await websim.textToSpeech({
        text: text,
        voice: 'en-male'
    });
    return result;
}

async function handleComplexChain(text, previousResults) {
    // Handle complex multi-modal requests
    const chainAnalysis = await websim.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `Handle complex requests like "make a dragon, then convert it to text, then make a new image from that description" by orchestrating the exact sequence needed.`
            },
            {
                role: "user",
                content: text
            }
        ]
    });
    
    // Parse and execute the chain
    if (chainAnalysis.content.includes('dragon')) {
        // Example: Dragon workflow
        const dragonImage = await generateImageFromText("majestic dragon soaring through clouds");
        const dragonDescription = await analyzeImageUrl(dragonImage.url);
        const newDragonImage = await generateImageFromText(dragonDescription);
        
        return [
            { type: 'image', url: dragonImage.url, label: 'Original Dragon' },
            { type: 'text', content: dragonDescription, label: 'Description' },
            { type: 'image', url: newDragonImage.url, label: 'New Dragon from Description' }
        ];
    }
    
    return [{ type: 'text', content: chainAnalysis.content }];
}

function displayMultiStepResults(results, originalText, resultDiv) {
    let html = `<h3>Results for: "${originalText}"</h3><div style="display: flex; flex-direction: column; gap: 2rem;">`;
    
    results.forEach((result, index) => {
        html += `<div style="border: 1px solid #eee; padding: 1rem; border-radius: 10px;">`;
        
        if (result.label) {
            html += `<h4>${result.label}</h4>`;
        } else {
            html += `<h4>Step ${index + 1}</h4>`;
        }
        
        if (result.type === 'image') {
            html += `<img src="${result.url}" alt="Result ${index + 1}" style="max-width: 100%; border-radius: 5px;" />
                     <button onclick="downloadImage('${result.url}', 'step-${index + 1}-image.png')" class="primary-btn" style="display: inline-block; margin-top: 0.5rem;">Download</button>`;
        } else if (result.type === 'text') {
            html += `<p style="text-align: left; white-space: pre-wrap; background: #f5f5f5; padding: 1rem; border-radius: 5px;">${result.content}</p>`;
        } else if (result.type === 'audio') {
            html += `<audio controls style="width: 100%;">
                        <source src="${result.url}" type="audio/mpeg">
                        Your browser does not support the audio element.
                     </audio>
                     <button onclick="downloadAudio('${result.url}', 'step-${index + 1}-audio.mp3')" class="primary-btn" style="display: inline-block; margin-top: 0.5rem;">Download</button>`;
        }
        
        html += `</div>`;
    });
    
    html += `</div>`;
    
    // Update global state with final result
    const finalResult = results[results.length - 1];
    if (finalResult.type === 'image') {
        updateAppState({ lastGeneratedImage: finalResult.url });
    } else if (finalResult.type === 'text') {
        updateAppState({ lastGeneratedText: finalResult.content });
    } else if (finalResult.type === 'audio') {
        updateAppState({ lastGeneratedAudio: finalResult.url });
    }
    
    resultDiv.innerHTML = html;
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

// Make new functions available globally
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.processSpeechText = processSpeechText;