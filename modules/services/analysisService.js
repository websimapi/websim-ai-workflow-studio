// modules/services/analysisService.js
export async function analyzeImage(imageUrl, options = {}) {
    const { context = '', focus = '' } = options;
    
    const query = context 
        ? `Describe this image ${context}. ${focus ? `Focus on ${focus}.` : ''}`
        : "Describe this image in detail. Include what's visible, the style, colors, mood, and any interesting elements.";
    
    const completion = await websim.chat.completions.create({
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: query },
                    { type: "image_url", image_url: { url: imageUrl } }
                ]
            }
        ]
    });
    
    return completion.content;
}

