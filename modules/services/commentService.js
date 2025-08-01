// modules/services/commentService.js
import { generateImage } from './imageService.js';
import { generateSpeech } from './speechService.js';
import { analyzeImage } from './analysisService.js';
import { combineImages } from './combinationService.js';

export async function commentResult(type) {
    let content = '';
    let images = [];
    
    switch(type) {
        case 'image':
            content = window.AppState.lastGeneratedText || 'AI generated image';
            if (window.AppState.lastGeneratedImage) images = [window.AppState.lastGeneratedImage];
            break;
        case 'speech':
            content = window.AppState.lastGeneratedText || 'AI generated speech';
            if (window.AppState.lastGeneratedAudio) content += `\n\n[Audio: ${window.AppState.lastGeneratedAudio}]`;
            break;
        case 'text':
            content = window.AppState.lastGeneratedText || 'AI generated text analysis';
            if (window.AppState.lastGeneratedImage) images = [window.AppState.lastGeneratedImage];
            break;
        case 'chain':
            content = window.AppState.lastGeneratedText || 'AI chain workflow result';
            if (window.AppState.lastGeneratedImage) images = [window.AppState.lastGeneratedImage];
            break;
        case 'combine':
            content = window.AppState.lastGeneratedText || 'AI combined images result';
            if (window.AppState.lastGeneratedImage) images = [window.AppState.lastGeneratedImage];
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

export async function processImageToText(imageUrl) {
    // Re-upload the image to avoid CORS issues
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
    
    return await analyzeImage(base64);
}

export async function processTextToImage(prompt) {
    return await generateImage({
        prompt: prompt,
        aspect_ratio: "16:9"
    });
}

export async function processTextToSpeech(text) {
    return await generateSpeech({
        text: text,
        voice: 'en-male'
    });
}

export async function processChain(imageUrl) {
    const analysis = await processImageToText(imageUrl);
    const newImage = await generateImage({
        prompt: analysis,
        aspect_ratio: "16:9"
    });
    
    return {
        analysis,
        imageUrl: newImage.url
    };
}