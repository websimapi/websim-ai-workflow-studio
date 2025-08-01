import { downloadImage, downloadAudio } from '../utils.js';
import { getAppState, updateAppState } from '../app.js';

// Speech to Text processing
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

// Enhanced processSpeechText with better handling
export async function processSpeechText() {
    const text = document.getElementById('speechToTextResult').value;
    
    if (!text.trim()) {
        alert('Please speak some text first');
        return;
    }
    
    const resultDiv = document.getElementById('speechTextResult');
    resultDiv.innerHTML = '<div class="loading"></div><p>AI analyzing your request...</p>';
    
    try {
        // AI determines what to do based on the spoken content
        const analysis = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Analyze the user's request and determine the best workflow. Consider:
1. Text-to-image: If they mention generating, creating, making, or want something visual
2. Text-to-speech: If they mention audio, voice, speaking, or want to hear something
3. Image-to-text: If they mention analyzing, describing, or have an image context
4. Chain: If they mention transforming or converting between modalities

Return ONLY the workflow name: text-to-image OR text-to-speech OR explain-not-supported`
                },
                {
                    role: "user",
                    content: text
                }
            ]
        });
        
        const determinedWorkflow = analysis.content.toLowerCase().trim();
        
        if (determinedWorkflow.includes('text-to-image')) {
            await processSpeechToImage(text);
        } else if (determinedWorkflow.includes('text-to-speech')) {
            await processSpeechToSpeech(text);
        } else if (determinedWorkflow.includes('explain-not-supported')) {
            resultDiv.innerHTML = '<p>Based on your request, please:</p><ul><li>Switch to Image tab to analyze images</li><li>Switch to Chain tab for image transformations</li><li>Or ask for text/image generation directly</li></ul>';
        } else {
            // Default to text-to-image
            await processSpeechToImage(text);
        }
        
        document.getElementById('commentSpeechTextBtn').style.display = 'inline-block';
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        document.getElementById('commentSpeechTextBtn').style.display = 'none';
    }
}

async function processSpeechToImage(text) {
    const resultDiv = document.getElementById('speechTextResult');
    
    try {
        const result = await websim.imageGen({
            prompt: text,
            aspect_ratio: "16:9"
        });
        
        updateAppState({
            lastGeneratedImage: result.url,
            lastGeneratedText: `Speech->Text->Image "${text}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Generated from speech:</h3>
            <p style="font-style: italic; color: #666; margin-bottom: 1rem;">"${text}"</p>
            <img src="${result.url}" alt="Generated from speech" />
            <button onclick="downloadImage('${result.url}', 'ai-speech-image.png')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

async function processSpeechToSpeech(text) {
    const resultDiv = document.getElementById('speechTextResult');
    
    try {
        const result = await websim.textToSpeech({
            text: text,
            voice: 'en-male'
        });
        
        updateAppState({
            lastGeneratedAudio: result.url,
            lastGeneratedText: `Speech->Text->Speech "${text}"`
        });
        
        resultDiv.innerHTML = `
            <h3>Speech converted to text, then back to speech:</h3>
            <p style="font-style: italic; color: #666; margin-bottom: 1rem;">"${text}"</p>
            <audio controls>
                <source src="${result.url}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            <button onclick="downloadAudio('${result.url}', 'ai-speech-conversion.mp3')" class="primary-btn" style="display: inline-block; margin-top: 1rem;">Download</button>
        `;
    } catch (error) {
        throw error;
    }
}

// Make available globally
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.processSpeechText = processSpeechText;