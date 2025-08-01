// modules/workflows/index.js
import { initializeTextToImage } from './textToImage.js';
import { initializeTextToSpeech } from './textToSpeech.js';
import { initializeImageToText } from './imageToText.js';
import { initializeChain } from './chain.js';
import { initializeCombine } from './combine.js';

export function initializeWorkflows() {
    initializeTextToImage();
    initializeTextToSpeech();
    initializeImageToText();
    initializeChain();
    initializeCombine();
}