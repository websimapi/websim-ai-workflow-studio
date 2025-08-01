// Export all workflow functions from a single entry point
export { generateImage } from './text-to-image.js';
export { generateSpeech } from './text-to-speech.js';
export { handleImageUpload, analyzeImage } from './image-to-text.js';
export { handleChainUpload, startChain } from './chain-workflow.js';
export { handleCombineUpload, combineImages } from './combine-images.js';
export { startRecording, stopRecording, processSpeechText } from './speech-processing.js';