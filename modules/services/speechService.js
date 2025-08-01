// modules/services/speechService.js
export async function generateSpeech({ text, voice }) {
    return await websim.textToSpeech({
        text,
        voice
    });
}

