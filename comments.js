import { analyzeImage, generateImage, generateSpeech, getProjectComments, reuploadImageFromUrl, postComment } from './api.js';
import { setLastGenerated, getLastGenerated } from './state.js';

let selectedComment = null;
let commentImages = [];

export function extractImageUrlsFromMarkdown(content) {
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

export async function loadComments() {
    const commentsDiv = document.getElementById('commentsList');
    
    try {
        const comments = await getProjectComments();
        
        if (!comments.length) {
            commentsDiv.innerHTML = '<p style="text-align: center; color: #666;">No comments found</p>';
            return;
        }
        
        commentsDiv.innerHTML = '';
        
        comments.forEach(item => {
            const comment = item.comment;
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.dataset.commentId = comment.id;
            
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
        document.getElementById('commentsList').innerHTML = '<p style="text-align: center; color: red;">Error loading comments</p>';
    }
}

function selectComment(comment, imageUrls) {
    document.querySelectorAll('.comment-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.querySelector(`[data-comment-id="${comment.id}"]`).classList.add('selected');
    
    selectedComment = comment;
    commentImages = imageUrls;
    
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
                await processImageToText();
                break;
            case 'text-to-image':
                await processTextToImage();
                break;
            case 'text-to-speech':
                await processTextToSpeech();
                break;
            case 'chain':
                await processChain();
                break;
        }
        
        document.getElementById('commentOutputBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentOutputBtn').style.display = 'none';
    }
}

async function processImageToText() {
    const resultDiv = document.getElementById('commentResult');
    
    if (commentImages.length === 0) {
        throw new Error('No images found in comment for Image → Text processing');
    }
    
    const imageUrl = commentImages[0];
    const base64 = await reuploadImageFromUrl(imageUrl);
    
    const analysis = await analyzeImage({ 
        imageUrl: base64,
        prompt: "Describe this image in detail. Include what's visible, the style, colors, mood, and any interesting elements."
    });
    
    setLastGenerated({
        type: 'text',
        text: `Image->Text "${analysis.content}"`
    });
    
    resultDiv.innerHTML = `
        <h3>Analysis:</h3>
        <p style="text-align: left; white-space: pre-wrap;">${analysis.content}</p>
    `;
}

async function processTextToImage() {
    const prompt = selectedComment.raw_content || 'AI generated image from comment';
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    const result = await generateImage({ 
        prompt: prompt,
        aspectRatio: "16:9"
    });
    
    setLastGenerated({
        type: 'image',
        url: result.url,
        text: `Text->Image "${prompt}"`
    });
    
    resultDiv.innerHTML = `
        <img src="${result.url}" alt="Generated from comment" />
        <button onclick="downloadImage('${result.url}', 'ai-comment-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}

async function processTextToSpeech() {
    const text = selectedComment.raw_content || 'No text provided';
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    const result = await generateSpeech({ 
        text: text,
        voice: 'en-male'
    });
    
    setLastGenerated({
        type: 'audio',
        url: result.url,
        text: `Text->Speech "${text}"`
    });
    
    resultDiv.innerHTML = `
        <audio controls>
            <source src="${result.url}" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
        <button onclick="downloadAudio('${result.url}', 'comment-audio.mp3')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}

async function processChain() {
    const resultDiv = document.getElementById('commentResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>Analyzing image...</p>';
    
    if (commentImages.length === 0) {
        throw new Error('No images found in comment for Image → Text → Image processing');
    }
    
    const imageUrl = commentImages[0];
    const base64 = await reuploadImageFromUrl(imageUrl);
    
    // Step 1: Analyze image
    const analysis = await analyzeImage({ 
        imageUrl: base64,
        prompt: "Describe this image in detail for the purpose of generating a new image. Focus on the key visual elements, style, and composition."
    });
    
    resultDiv.innerHTML = '<div class="loading"></div><p>Generating new image...</p>';
    
    // Step 2: Generate new image
    const newImage = await generateImage({ 
        prompt: analysis.content,
        aspectRatio: "16:9"
    });
    
    setLastGenerated({
        type: 'image',
        url: newImage.url,
        text: `Image->Text->Image "${analysis.content}"`
    });
    
    resultDiv.innerHTML = `
        <h3>Original Analysis:</h3>
        <p style="text-align: left; white-space: pre-wrap; margin-bottom: 2rem;">${analysis.content}</p>
        <h3>Generated Image:</h3>
        <img src="${newImage.url}" alt="Generated from analysis" />
        <button onclick="downloadImage('${newImage.url}', 'ai-chain-comment-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
    `;
}

export async function handleComment(type) {
    const lastGenerated = getLastGenerated();
    
    if (!lastGenerated.text) {
        alert('No result to comment');
        return;
    }
    
    try {
        await postComment({
            content: lastGenerated.text,
            images: lastGenerated.type === 'image' ? [lastGenerated.url] : []
        });
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Could not post comment. Please try again.');
    }
}