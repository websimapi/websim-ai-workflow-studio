// Comment functionality - posting and processing comments
import { extractImageUrlsFromMarkdown, convertImageToBase64 } from './utils.js';
import { getAppState, updateAppState } from './app.js';

// Post results as comments
export async function commentResult(type) {
    const state = getAppState();
    let content = '';
    let images = [];
    
    switch(type) {
        case 'image':
            content = state.lastGeneratedText || 'AI generated image';
            if (state.lastGeneratedImage) images = [state.lastGeneratedImage];
            break;
        case 'speech':
            content = state.lastGeneratedText || 'AI generated speech';
            if (state.lastGeneratedAudio) content += `\n\n[Audio: ${state.lastGeneratedAudio}]`;
            break;
        case 'text':
            content = state.lastGeneratedText || 'AI generated text analysis';
            if (state.lastGeneratedImage) images = [state.lastGeneratedImage];
            break;
        case 'chain':
            content = state.lastGeneratedText || 'AI chain workflow result';
            if (state.lastGeneratedImage) images = [state.lastGeneratedImage];
            break;
        case 'combine':
            content = state.lastGeneratedText || 'AI combined images result';
            if (state.lastGeneratedImage) images = [state.lastGeneratedImage];
            break;
        case 'comment-to-x':
            content = state.lastGeneratedText || 'AI processed comment result';
            if (state.lastGeneratedImage) images = [state.lastGeneratedImage];
            if (state.lastGeneratedAudio) content += `\n\n[Audio: ${state.lastGeneratedAudio}]`;
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

// Load comments for Comment -> X workflow
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

export function selectComment(comment, imageUrls) {
    // Clear previous selection
    document.querySelectorAll('.comment-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Select new comment
    document.querySelector(`[data-comment-id="${comment.id}"]`).classList.add('selected');
    
    updateAppState({
        selectedComment: comment,
        commentImages: imageUrls
    });
    
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

export async function processComment() {
    const { selectedComment, commentImages } = getAppState();
    if (!selectedComment) {
        alert('Please select a comment first');
        return;
    }
    
    const processType = document.getElementById('commentProcessType').value;
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        switch(processType) {
            case 'image-to-text':
                if (commentImages.length === 0) {
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
                if (commentImages.length === 0) {
                    alert('No images found in comment for Image → Text → Image processing');
                    return;
                }
                await processChain();
                break;
        }
        
        document.getElementById('commentOutputBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentOutputBtn').style.display = 'none';
    }
}

// Process functions for comment to X
async function processImageToText() {
    const { commentImages } = getAppState();
    const resultDiv = document.getElementById('commentResult');
    
    try {
        const imageUrl = commentImages[0];
        const base64 = await convertImageToBase64(imageUrl);
        
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
        
        updateAppState({
            lastGeneratedText: `Image->Text "${analysis.content}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Analysis:</h3>
            <p style="text-align: left; white-space: pre-wrap;">${analysis.content}</p>
        `;
    } catch (error) {
        throw error;
    }
}

async function processTextToImage() {
    const { selectedComment } = getAppState();
    const prompt = selectedComment.raw_content || 'AI generated image from comment';
    const resultDiv = document.getElementById('commentResult');
    
    try {
        const result = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: "16:9"
        });
        
        updateAppState({
            lastGeneratedImage: result.url,
            lastGeneratedText: `Text->Image "${prompt}"`
        });
        
        resultDiv.innerHTML = `
            <img src="${result.url}" alt="Generated from comment" />
            <button onclick="downloadImage('${result.url}', 'ai-comment-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

async function processTextToSpeech() {
    const { selectedComment } = getAppState();
    const text = selectedComment.raw_content || 'No text provided';
    const resultDiv = document.getElementById('commentResult');
    
    try {
        const result = await websim.textToSpeech({
            text: text,
            voice: 'en-male'
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
            <button onclick="downloadAudio('${result.url}', 'comment-audio.mp3')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

async function processChain() {
    const { commentImages } = getAppState();
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing image...</p>';
    
    try {
        const imageUrl = commentImages[0];
        const base64 = await convertImageToBase64(imageUrl);
        
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
            <button onclick="downloadImage('${newImage.url}', 'ai-chain-comment-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

// Make functions available globally for HTML onclick handlers
window.commentResult = commentResult;
window.loadComments = loadComments;
window.selectComment = selectComment;
window.processComment = processComment;