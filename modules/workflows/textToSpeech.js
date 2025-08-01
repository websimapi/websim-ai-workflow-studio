// modules/workflows/textToSpeech.js
import { generateSpeech } from '../services/speechService.js';
import { commentResult } from '../services/commentService.js';

export function initializeTextToSpeech() {
    const generateBtn = document.querySelector('#text-to-speech .primary-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateSpeech);
    }
}

async function handleGenerateSpeech() {
    const text = document.getElementById('speechText').value;
    const voice = document.getElementById('voice').value;
    
    if (!text.trim()) {
        alert('Please enter text');
        return;
    }
    
    const resultDiv = document.getElementById('speechResult');
    resultDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        const result = await generateSpeech({ text, voice });
        
        window.AppState.lastGeneratedAudio = result.url;
        window.AppState.lastGeneratedText = `Text->Speech "${text}"`;
        
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

