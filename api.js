export async function generateImage({ prompt, aspectRatio = '1:1', transparent = false }) {
    return await websim.imageGen({
        prompt: prompt,
        aspect_ratio: aspectRatio,
        transparent: transparent
    });
}

export async function generateSpeech({ text, voice = 'en-male' }) {
    return await websim.textToSpeech({
        text: text,
        voice: voice
    });
}

export async function analyzeImage({ imageUrl, prompt = "Describe this image in detail..." }) {
    return await websim.chat.completions.create({
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageUrl } }
                ]
            }
        ]
    });
}

export async function getProjectComments() {
    const project = await window.websim.getCurrentProject();
    const response = await fetch(`/api/v1/projects/${project.id}/comments`);
    const data = await response.json();
    return data.comments?.data || [];
}

export async function reuploadImageFromUrl(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

export async function downloadFile(url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Failed to download:', error);
        alert('Could not download the file. See console for details.');
    }
}

export async function postComment({ content, images = [] }) {
    return await window.websim.postComment({
        content: content,
        images: images.slice(0, 4)
    });
}