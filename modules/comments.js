// modules/comments.js
import { 
    processImageToText, 
    processTextToImage, 
    processTextToSpeech, 
    processChain 
} from './services/commentService.js';

export function initializeComments() {
    // Make loadComments available globally
    window.loadComments = loadComments;
    window.selectComment = selectComment;
    window.processComment = processComment;
}

async function loadComments() {
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
            
            const imageUrls = extractImageUrlsFromMarkdown(comment.raw_content || '');
            
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

function extractImageUrlsFromMarkdown(content) {
    const urls = [];
    const regex = /!\[.*?\]\((.*?)\)|\[!\[.*?\]\((.*?)\)\]\((.*?)\)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const url = match[1] || match[2] || match[3];
        if (url && !urls.includes(url)) {
            urls.push(url);
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
    document.querySelector(`[data-comment-id="${comment.id}"]`)?.classList.add('selected');
    
    window.AppState.selectedComment = comment;
    window.AppState.commentImages = imageUrls;
    
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
    if (!window.AppState.selectedComment) {
        alert('Please select a comment first');
        return;
    }
    
    const processType = document.getElementById('commentProcessType').value;
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        switch(processType) {
            case 'image-to-text':
                if (window.AppState.commentImages.length === 0) {
                    alert('No images found in comment for Image → Text processing');
                    return;
                }
                await processCommentImageToText();
                break;
                
            case 'text-to-image':
                await processCommentTextToImage();
                break;
                
            case 'text-to-speech':
                await processCommentTextToSpeech();
                break;
                
            case 'chain':
                if (window.AppState.commentImages.length === 0) {
                    alert('No images found in comment for Image → Text → Image processing');
                    return;
                }
                await processCommentChain();
                break;
        }
        
        document.getElementById('commentOutputBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentOutputBtn').style.display = 'none';
    }
}

async function processCommentImageToText() {
    const imageUrl = window.AppState.commentImages[0];
    const analysis = await processImageToText(imageUrl);
    
    window.AppState.lastGeneratedText = `Image->Text "${analysis}"`;
    
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = `
        <h3>Analysis:</h3>
        <p style="text-align: left; white-space: pre-wrap;">${analysis}</p>
    `;
}

async function processCommentTextToImage() {
    const text = window.AppState.selectedComment.raw_content || 'AI generated image from comment';
    const result = await processTextToImage(text);
    
    window.AppState.lastGeneratedImage = result.url;
    window.AppState.lastGeneratedText = `Text->Image "${text}"`;
    
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = `
        <img src="${result.url}" alt="Generated from comment" />
        <button onclick="downloadImage('${result.url}', 'ai-comment-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}

async function processCommentTextToSpeech() {
    const text = window.AppState.selectedComment.raw_content || 'No text provided';
    const result = await processTextToSpeech(text);
    
    window.AppState.lastGeneratedAudio = result.url;
    window.AppState.lastGeneratedText = `Text->Speech "${text}"`;
    
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = `
        <audio controls>
            <source src="${result.url}" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
        <button onclick="downloadAudio('${result.url}', 'comment-audio.mp3')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}

async function processCommentChain() {
    const imageUrl = window.AppState.commentImages[0];
    const { analysis, imageUrl: newImageUrl } = await processChain(imageUrl);
    
    window.AppState.lastGeneratedImage = newImageUrl;
    window.AppState.lastGeneratedText = `Image->Text->Image "${analysis}"`;
    
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = `
        <h3>Original Analysis:</h3>
        <p style="text-align: left; white-space: pre-wrap; margin-bottom: 2rem;">${analysis}</p>
        <h3>Generated Image:</h3>
        <img src="${newImageUrl}" alt="Generated from analysis" />
        <button onclick="downloadImage('${newImageUrl}', 'ai-chain-comment-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}