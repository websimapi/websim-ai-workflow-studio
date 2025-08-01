import { state } from './state.js';
import { extractImageUrlsFromMarkdown, showLoading, showError } from './utils.js';

export async function loadComments() {
    const commentsDiv = document.getElementById('commentsList');
    
    try {
        const project = await window.websim.getCurrentProject();
        const response = await fetch(`/api/v1/projects/${project.id}/comments`);
        const data = await response.json();
        
        if (!data.comments?.data?.length) {
            commentsDiv.innerHTML = '<p style="text-align: center; color: #666;">No comments found</p>';
            return;
        }
        
        commentsDiv.innerHTML = '';
        
        data.comments.data.forEach(item => {
            const comment = item.comment;
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.dataset.commentId = comment.id;
            
            // Extract images from raw_content markdown
            let imageUrls = [];
            if (comment.raw_content) {
                imageUrls = extractImageUrlsFromMarkdown(comment.raw_content);
            }
            
            let content = `
                <div class="comment-author">${comment.author.username}</div>
                <div class="comment-text">${comment.raw_content || 'No text'}</div>
            `;
            
            if (imageUrls.length > 0) {
                content += '<div class="comment-images">';
                imageUrls.forEach(url => {
                    content += `<img src="${url}" alt="Comment image" />`;
                });
                content += '</div>';
            }
            
            content += `<div class="comment-meta">Posted ${new Date().toLocaleDateString()}</div>`;
            
            div.innerHTML = content;
            div.addEventListener('click', () => selectComment(comment, imageUrls));
            commentsDiv.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsDiv.innerHTML = '<p style="text-align: center; color: red;">Error loading comments</p>';
    }
}

function selectComment(comment, imageUrls) {
    // Clear previous selection
    document.querySelectorAll('.comment-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Select new comment
    document.querySelector(`[data-comment-id="${comment.id}"]`).classList.add('selected');
    
    state.selectedComment = comment;
    state.commentImages = imageUrls;
    
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

// Process functions for comment to X
async function processImageToText() {
    const resultDiv = document.getElementById('commentResult');
    
    try {
        const imageUrl = state.commentImages[0];
        
        // Re-upload the image to avoid CORS issues
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        
        const analysis = await websim.chat.completions.create({
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
                            image_url: { url: base64 }
                        }
                    ]
                }
            ]
        });
        
        state.lastGeneratedText = `Image->Text "${analysis.content}"`;
        
        resultDiv.innerHTML = `
            <h3>Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap;">${analysis.content}</p>
        `;
    } catch (error) {
        throw error;
    }
}

async function processTextToImage() {
    const prompt = state.selectedComment.raw_content || 'AI generated image from comment';
    const resultDiv = document.getElementById('commentResult');
    showLoading(resultDiv);
    
    try {
        const result = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: "16:9"
        });
        
        state.lastGeneratedImage = result.url;
        state.lastGeneratedText = `Text->Image "${prompt}"`;
        
        resultDiv.innerHTML = `
            <img src="${result.url}" alt="Generated from comment" />
            <button onclick="import('./utils.js').then(mod => mod.downloadImage('${result.url}', 'ai-comment-image.png'))" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

async function processTextToSpeech() {
    const text = state.selectedComment.raw_content || 'No text provided';
    const resultDiv = document.getElementById('commentResult');
    showLoading(resultDiv);
    
    try {
        const result = await websim.textToSpeech({
            text: text,
            voice: 'en-male'
        });
        
        state.lastGeneratedAudio = result.url;
        state.lastGeneratedText = `Text->Speech "${text}"`;
        
        resultDiv.innerHTML = `
            <audio controls>
                <source src="${result.url}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            <button onclick="import('./utils.js').then(mod => mod.downloadAudio('${result.url}', 'comment-audio.mp3'))" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

async function processChain() {
    const resultDiv = document.getElementById('commentResult');
    showLoading(resultDiv, 'Analyzing image...');
    
    try {
        const imageUrl = state.commentImages[0];
        
        // Re-upload the image to avoid CORS issues
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        
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
                            image_url: { url: base64 }
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
            <img src="${newImage.url}" alt="Generated from analysis" />
            <button onclick="import('./utils.js').then(mod => mod.downloadImage('${newImage.url}', 'ai-chain-comment-image.png'))" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

export async function processComment() {
    if (!state.selectedComment) {
        alert('Please select a comment first');
        return;
    }
    
    const processType = document.getElementById('commentProcessType').value;
    const resultDiv = document.getElementById('commentResult');
    showLoading(resultDiv);
    
    try {
        switch(processType) {
            case 'image-to-text':
                if (state.commentImages.length === 0) {
                    alert('No images found in comment for Image → Text processing');
                    return;
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
                if (state.commentImages.length === 0) {
                    alert('No images found in comment for Image → Text → Image processing');
                    return;
                }
                await processChain();
                break;
        }
        
        document.getElementById('commentOutputBtn').style.display = 'inline-block';
    } catch (error) {
        showError(resultDiv, error.message);
        document.getElementById('commentOutputBtn').style.display = 'none';
    }
}

// Export functions for global access
window.processComment = processComment;