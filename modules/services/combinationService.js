// modules/services/combinationService.js
import { generateImage } from './imageService.js';
import { analyzeImage } from './analysisService.js';

export async function combineImages({ image1, image2, prompt, weight1, weight2 }) {
    const analysis = await websim.chat.completions.create({
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `I need to combine these two images based on this specific instruction: "${prompt}". 

CRITICAL: Identify and emphasize any specific details mentioned by the user. If they mention "face", "shirt", "color", "pattern", "texture", "lighting", "expression", "style", or any other specific element - these MUST be described with EXTREME precision and detail in your final description. These user-specified elements should dominate the narrative.

Analyze each image carefully and extract the following with exact detail:
- Any faces: describe facial features, expression, skin tone, hair style/color, eye color, makeup
- Clothing: describe fabric texture, color patterns, fit, style details, buttons, seams, accessories
- Colors: describe exact color values, gradients, saturation, how colors interact
- Patterns: describe pattern type, scale, repetition, color combinations
- Lighting: describe direction, intensity, shadows, highlights, color temperature
- Background elements: describe what's visible, depth, atmosphere

Now create a flowing narrative description that:
1. Starts by establishing the overall scene composition
2. Gives PRIMARY emphasis to any elements specifically mentioned in the user's prompt
3. Balances Image 1 (${weight1}%) and Image 2 (${weight2}%) as specified
4. Uses only English alphanumeric characters and spaces
5. Reads like a detailed artistic description
6. Preserves all important visual details, especially user-specified ones

Write as if you're a photographer describing a scene to another artist who needs to recreate it exactly.`
                    },
                    {
                        type: "image_url",
                        image_url: { url: image1 }
                    },
                    {
                        type: "image_url",
                        image_url: { url: image2 }
                    }
                ]
            }
        ]
    });
    
    const cleanedPrompt = analysis.content
        .replace(/[^a-zA-Z0-9\s.,!?']/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\.{2,}/g, '.')
        .replace(/,{2,}/g, ',')
        .trim();
    
    const newImage = await generateImage({
        prompt: cleanedPrompt,
        aspect_ratio: "16:9"
    });
    
    return {
        imageUrl: newImage.url,
        cleanedPrompt,
        description: `Combine Images "${prompt}" | Description: "${cleanedPrompt}"`
    };
}