// modules/services/imageService.js
export async function generateImage({ prompt, aspectRatio, transparent }) {
    return await websim.imageGen({
        prompt,
        aspect_ratio: aspectRatio,
        transparent
    });
}

