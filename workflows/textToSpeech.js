import { state } from '../state.js';
import { createAudioPlayer, showLoading, showError } from '../utils.js';

export async function generateSpeech() {
    const text = document.getElementById('speechText').value;
    const voice = document.getElementById('voice').value;
    
    if (!text.trim()) {
        alert('Please enter text');
        return;
    }
    
    const resultDiv = document.getElementById('speechResult');
    showLoading(resultDiv);
    
    try {
        const result = await websim.textToSpeech({
            text: text,
            voice: voice
        });
        
        state.lastGeneratedAudio = result.url;
        state.lastGeneratedText = `Text->Speech "${text}"`;
        
        resultDiv.innerHTML = createAudioPlayer(result.url, `${text.substring(0, 20)}.mp3`);
        document.getElementById('commentSpeechBtn').style.display = 'inline-block';
    } catch (error) {
        showError(resultDiv, error.message);
        document.getElementById('commentSpeechBtn').style.display = 'none';
    }
}

