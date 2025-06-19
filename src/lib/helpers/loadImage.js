/**
 * Load an image from a URL
 * @param {string} url URL of image to load
 * @returns {Promise<HTMLImageElement>} Promise that resolves to the image
 */
export default function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}