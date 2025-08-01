// Global state
let currentWorkflow = 'text-to-image';
let uploadedImage = null;
let uploadedImage2 = null;

// Global state for comment functionality
let lastGeneratedImage = null;
let lastGeneratedText = null;
let lastGeneratedAudio = null;
let selectedComment = null;
let commentImages = [];

// Navigation
function originalNavClick(btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.workflow').forEach(w => w.classList.remove('active'));
    document.getElementById(btn.dataset.workflow).classList.add('active');
    
    currentWorkflow = btn.dataset.workflow;
    
    if (btn.dataset.workflow === 'comment-to-x') {
        loadComments();
    }
}

// Override nav buttons
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        originalNavClick(btn);
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
        
        lastGeneratedImage = result.url;
        lastGeneratedText = `Text->Image "${prompt}"`;
        
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
        
        lastGeneratedAudio = result.url;
        lastGeneratedText = `Text->Speech "${text}"`;
        
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
        
        lastGeneratedText = `Image->Text "${completion.content}"`;
        
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
        
        lastGeneratedImage = newImage.url;
        lastGeneratedText = `Image->Text->Image "${analysis.content}"`;
        
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

async function combineImages() {
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
        
        lastGeneratedImage = combinedImage.url;
        lastGeneratedText = `Combine Images "${prompt}" | Description: "${cleanedPrompt}"`;
        
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

// Add the missing loadComments function
async function loadComments() {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '<div class="loading">Loading comments...</div>';
    
    try {
        const project = await window.websim.getCurrentProject();
        const response = await fetch(`/api/v1/projects/${project.id}/comments`);
        const data = await response.json();
        
        if (!data.comments || !data.comments.data || data.comments.data.length === 0) {
            commentsList.innerHTML = '<p>No comments found</p>';
            return;
        }
        
        commentsList.innerHTML = '';
        
        data.comments.data.forEach(({ comment }) => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item';
            commentDiv.dataset.commentId = comment.id;
            
            // Parse images from comment content using new format
            const imageUrls = extractImageUrlsFromMarkdown(comment.raw_content || '');
            
            let content = `
                <div class="comment-author">${comment.author.username}</div>
                <div class="comment-text">${comment.raw_content || 'No text content'}</div>
            `;
            
            if (imageUrls.length > 0) {
                content += '<div class="comment-images">';
                imageUrls.forEach(url => {
                    content += `<img src="${url}" alt="Comment image" />`;
                });
                content += '</div>';
            }
            
            commentDiv.innerHTML = content;
            
            commentDiv.addEventListener('click', () => {
                selectComment(comment, imageUrls);
            });
            
            commentsList.appendChild(commentDiv);
        });
        
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<p>Error loading comments</p>';
    }
}

// Comment functionality
async function commentResult(type) {
    let content = '';
    let images = [];
    
    switch(type) {
        case 'image':
            content = lastGeneratedText || 'AI generated image';
            if (lastGeneratedImage) {
                try {
                    console.log('Processing image for comment...');
                    const response = await fetch(lastGeneratedImage);
                    const blob = await response.blob();
                    const uploadedUrl = await websim.upload(blob);
                    const imageId = extractImageIdFromUrl(uploadedUrl);
                    content += `\n\n[Image:${imageId}]`;
                    images = [uploadedUrl];
                } catch (error) {
                    console.error('Error processing image:', error);
                    content += `\n\n[Image upload failed]`;
                }
            }
            break;
        case 'speech':
            content = lastGeneratedText || 'AI generated speech';
            if (lastGeneratedAudio) content += `\n\n[Audio:${lastGeneratedAudio}]`;
            break;
        case 'text':
            content = lastGeneratedText || 'AI generated text analysis';
            break;
        case 'chain':
            content = lastGeneratedText || 'AI chain workflow result';
            if (lastGeneratedImage) {
                try {
                    const response = await fetch(lastGeneratedImage);
                    const blob = await response.blob();
                    const uploadedUrl = await websim.upload(blob);
                    const imageId = extractImageIdFromUrl(uploadedUrl);
                    content += `\n\n[Image:${imageId}]`;
                    images = [uploadedUrl];
                } catch (error) {
                    console.error('Error processing chain image:', error);
                }
            }
            break;
        case 'combine':
            content = lastGeneratedText || 'AI combined images result';
            if (lastGeneratedImage) {
                try {
                    const response = await fetch(lastGeneratedImage);
                    const blob = await response.blob();
                    const uploadedUrl = await websim.upload(blob);
                    const imageId = extractImageIdFromUrl(uploadedUrl);
                    content += `\n\n[Image:${imageId}]`;
                    images = [uploadedUrl];
                } catch (error) {
                    console.error('Error processing combined image:', error);
                }
            }
            break;
        case 'comment-to-x':
            content = lastGeneratedText || 'Processed from comment';
            if (lastGeneratedImage) {
                try {
                    const response = await fetch(lastGeneratedImage);
                    const blob = await response.blob();
                    const uploadedUrl = await websim.upload(blob);
                    const imageId = extractImageIdFromUrl(uploadedUrl);
                    content += `\n\n[Image:${imageId}]`;
                    images = [uploadedUrl];
                } catch (error) {
                    console.error('Error processing comment-to-x image:', error);
                }
            }
            break;
    }
    
    if (!content) {
        alert('No result to comment');
        return;
    }
    
    try {
        await window.websim.postComment({
            content: content,
            images: images.slice(0, 4)
        });
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Could not post comment. Please try again.');
    }
}

// Helper function to extract image ID from websim URL
function extractImageIdFromUrl(url) {
    // Extract the UUID from websim blob URLs
    const match = url.match(/blobs\/([a-f0-9-]+)/);
    return match ? match[1] : url;
}

// Updated image extraction for markdown format
function extractImageUrlsFromMarkdown(content) {
    const urls = [];
    
    // Handle new [Image:ID] format
    const newFormatRegex = /\[Image:([a-f0-9-]+)\]/g;
    let newMatch;
    while ((newMatch = newFormatRegex.exec(content)) !== null) {
        const imageId = newMatch[1];
        const imageUrl = `http://api.websim.com/blobs/${imageId}`;
        urls.push(imageUrl);
    }
    
    // Handle legacy markdown format for backwards compatibility
    const legacyRegex = /!\[.*?\]\((.*?)\)|\[!\[.*?\]\((.*?)\)\]\((.*?)\)/g;
    let legacyMatch;
    while ((legacyMatch = legacyRegex.exec(content)) !== null) {
        const url = legacyMatch[1] || legacyMatch[2] || legacyMatch[3];
        if (url && !urls.includes(url)) {
            // Convert external URLs to blob format if needed
            if (url.includes('page-images.websim.com')) {
                const filename = url.split('/').pop();
                const blobUrl = `http://api.websim.com/blobs/${filename}`;
                urls.push(blobUrl);
            } else if (url.includes('api.websim.com/blobs/')) {
                urls.push(url);
            } else {
                urls.push(url);
            }
        }
    }
    
    return urls;
}

function selectComment(comment, imageUrls) {
    // Clear previous selection
    document.querySelectorAll('.comment-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Select new comment
    document.querySelector(`[data-comment-id="${comment.id}"]`).classList.add('selected');
    
    selectedComment = comment;
    commentImages = imageUrls;
    
    // Show selected comment preview
    document.getElementById('commentSelected').style.display = 'block';
    document.getElementById('commentContent').innerHTML = `
        <strong>Selected Comment:</strong>
        <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 5px;">
            ${comment.raw_content || 'No text content'}
        </div>
    `;
    
    const imagesDiv = document.getElementById('commentImages');
    imagesDiv.innerHTML = '';
    if (imageUrls.length > 0) {
        imagesDiv.innerHTML = '<strong>Images in comment:</strong>';
        imageUrls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '150px';
            img.style.margin = '0.5rem';
            imagesDiv.appendChild(img);
        });
    }
}

async function processComment() {
    if (!selectedComment) {
        alert('Please select a comment first');
        return;
    }
    
    const processType = document.getElementById('commentProcessType').value;
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    console.log('Starting comment processing with type:', processType);
    console.log('Selected comment:', selectedComment);
    console.log('Comment images:', commentImages);
    
    try {
        switch(processType) {
            case 'image-to-text':
                if (commentImages.length === 0) {
                    throw new Error('No images found in comment for Image → Text processing');
                }
                await processImageToText();
                break;
                
            case 'text-to-image':
                await processTextToImage();
                break;
                
            case 'text-to-speech':
                await processTextToSpeech();
                break;
                
            case 'chain':
                if (commentImages.length === 0) {
                    throw new Error('No images found in comment for Image → Text → Image processing');
                }
                await processChain();
                break;
        }
        
        document.getElementById('commentOutputBtn').style.display = 'inline-block';
        console.log('Comment processing completed successfully');
    } catch (error) {
        console.error('Error in processComment:', error);
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentOutputBtn').style.display = 'none';
    }
}

async function processImageToText() {
    console.log('Starting Image→Text processing...');
    const imageUrl = commentImages[0]; // Use first image
    
    try {
        console.log('Processing Image→Text with URL:', imageUrl);
        
        // Ensure we're using blob format
        let processedUrl = imageUrl;
        if (imageUrl.includes('page-images.websim.com')) {
            const filename = imageUrl.split('/').pop();
            processedUrl = `http://api.websim.com/blobs/${filename}`;
        }
        
        const resultDiv = document.getElementById('commentResult');
        resultDiv.innerHTML = '<div class="loading"></div><p>Processing image...</p>';
        
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
                            image_url: { url: processedUrl }
                        }
                    ]
                }
            ]
        });
        
        console.log('Image analysis complete:', completion);
        
        resultDiv.innerHTML = `
            <h3>Image Analysis:</h3>
            <img src="${imageUrl}" alt="Comment image" style="max-width: 300px; margin: 1rem 0;" />
            <p style="text-align: left; white-space: pre-wrap;">${completion.content}</p>
        `;
        
        lastGeneratedText = `Comment Image→Text "${completion.content}"`;
        lastGeneratedImage = imageUrl;
    } catch (error) {
        console.error('Error in Image→Text processing:', error);
        console.error('Full error details:', {
            error: error.message,
            stack: error.stack,
            imageUrl: imageUrl
        });
        throw new Error(`Image analysis failed: ${error.message}`);
    }
}

async function processTextToImage() {
    const text = selectedComment.raw_content;
    
    try {
        console.log('Processing Text→Image with text:', text);
        
        // Remove image references from text for the prompt
        const cleanText = text.replace(/\[Image:[a-f0-9-]+\]/g, '').replace(/!\[.*?\]\(.*?\)/g, '').trim();
        
        if (!cleanText) {
            throw new Error('No text content found in comment');
        }
        
        const image = await websim.imageGen({
            prompt: cleanText,
            aspect_ratio: "16:9"
        });
        
        console.log('Image generated:', image);
        
        const resultDiv = document.getElementById('commentResult');
        resultDiv.innerHTML = `
            <h3>Generated from Comment:</h3>
            <img src="${image.url}" alt="Generated from comment" style="max-width: 400px;" />
            <p style="margin-top: 1rem;"><strong>Prompt:</strong> ${cleanText}</p>
        `;
        
        lastGeneratedText = `Comment Text→Image "${cleanText}"`;
        lastGeneratedImage = image.url;
    } catch (error) {
        console.error('Error in Text→Image processing:', error);
        throw new Error(`Image generation failed: ${error.message}`);
    }
}

async function processTextToSpeech() {
    const text = selectedComment.raw_content || 'AI generated speech';
    
    try {
        console.log('Processing Text→Speech with text:', text);
        
        const speech = await websim.textToSpeech({
            text: text,
            voice: 'en-male'
        });
        
        console.log('Speech generated:', speech);
        
        const resultDiv = document.getElementById('commentResult');
        resultDiv.innerHTML = `
            <h3>Speech from Comment:</h3>
            <audio controls>
                <source src="${speech.url}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            <p style="margin-top: 1rem;"><strong>Text:</strong> ${text}</p>
        `;
        
        lastGeneratedText = `Comment Text→Speech "${text}"`;
        lastGeneratedAudio = speech.url;
    } catch (error) {
        console.error('Error in Text→Speech processing:', error);
        console.error('Full error details:', {
            error: error.message,
            stack: error.stack,
            text: text
        });
        throw new Error(`Speech generation failed: ${error.message}`);
    }
}

async function processChain() {
    console.log('Starting Image→Text→Image processing...');
    const imageUrl = commentImages[0]; // Use first image
    
    try {
        // Ensure we're using blob format
        let processedUrl = imageUrl;
        if (imageUrl.includes('page-images.websim.com')) {
            const filename = imageUrl.split('/').pop();
            processedUrl = `http://api.websim.com/blobs/${filename}`;
        }
        
        const resultDiv = document.getElementById('commentResult');
        resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing image...</p>';
        
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
                            image_url: { url: processedUrl }
                        }
                    ]
                }
            ]
        });
        
        console.log('Image analysis complete:', analysis);
        
        resultDiv.innerHTML = '<div class="loading"></div><p>Generating new image...</p>';
        
        // Step 2: Generate new image
        const newImage = await websim.imageGen({
            prompt: analysis.content,
            aspect_ratio: "16:9"
        });
        
        console.log('New image generated:', newImage);
        
        resultDiv.innerHTML = `
            <h3>Chain Process Results:</h3>
            <img src="${imageUrl}" alt="Comment image" style="max-width: 200px; margin: 0.5rem;" />
            <img src="${newImage.url}" alt="Generated from analysis" style="max-width: 200px; margin: 0.5rem;" />
            <h4>Analysis:</h4>
            <p style="text-align: left; white-space: pre-wrap; margin-bottom: 1rem;">${analysis.content}</p>
        `;
        
        lastGeneratedText = `Comment Image→Text→Image "${analysis.content}"`;
        lastGeneratedImage = newImage.url;
    } catch (error) {
        console.error('Full error in Image→Text→Image processing:', {
            error: error.message,
            stack: error.stack,
            imageUrl: imageUrl,
            processedUrl: processedUrl
        });
        throw error;
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