import { 
    generateImage, 
    generateSpeech, 
    handleImageUpload, 
    analyzeImage, 
    handleChainUpload, 
    startChain, 
    handleCombineUpload, 
    combineImages,
    startRecording,
    stopRecording,
    processSpeechText
} from './workflows/index.js';

import { downloadImage, downloadAudio } from './utils.js';

// Re-export for backward compatibility
window.generateImage = generateImage;
window.generateSpeech = generateSpeech;
window.handleImageUpload = handleImageUpload;
window.analyzeImage = analyzeImage;
window.handleChainUpload = handleChainUpload;
window.startChain = startChain;
window.handleCombineUpload = handleCombineUpload;
window.combineImages = combineImages;
window.downloadImage = downloadImage;
window.downloadAudio = downloadAudio;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.processSpeechText = processSpeechText;