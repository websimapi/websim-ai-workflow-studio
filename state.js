let lastGenerated = {
    type: null,
    url: null,
    text: null
};

export function setLastGenerated({ type, url, text }) {
    lastGenerated = { type, url, text };
}

export function getLastGenerated() {
    return lastGenerated;
}

// Export global variables for compatibility
export let uploadedImage = null;
export let uploadedImage2 = null;

export function setUploadedImage(image) {
    uploadedImage = image;
    window.uploadedImage = image;
}

export function setUploadedImage2(image) {
    uploadedImage2 = image;
    window.uploadedImage2 = image;
}

