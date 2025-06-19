/**
 * Helper class for manipulating pixels on a canvas
 */
class PixelManipulator {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    ctx;
    /** @type {ImageData} */
    imageData;

    /**
     * Constructs a PixelManipulator
     * @param {HTMLCanvasElement} canvas canvas to manipulate
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get color of pixel at x, y
     * @param {number} x x-coordinate of pixel
     * @param {number} y y-coordinate of pixel
     * @returns {[red: number, green: number, blue: number, alpha: number]} red, green, blue, alpha
     */
    getPixel(x, y) {
        // ensure integer positions
        x = Math.floor(x); y = Math.floor(y);

        let redPosition = (y * this.canvas.width + x) * 4;
        return [
            this.imageData.data[redPosition],
            this.imageData.data[redPosition + 1],
            this.imageData.data[redPosition + 2],
            this.imageData.data[redPosition + 3],
        ];
    }

    /**
     * Manipulate pixel at x, y
     * @param {number} x 
     * @param {number} y 
     * @param {[red: number, green: number, blue: number, alpha: number]} rgba
     * @returns {boolean} true if successful, false if out of bounds
     */
    setPixel(x, y, rgba=[0, 0, 0, 255]) {
        // ensure integer positions
        x = Math.floor(x); y = Math.floor(y);

        let redPosition = (y * this.canvas.width + x) * 4;
        if (redPosition > this.imageData.data.length || redPosition < 0) {
            return false;
        }
        for (let i = 0; i < rgba.length; i++) {
            this.imageData.data[redPosition + i] = rgba[i];
        }
        return true;
    }

    /**
     * Render changes to canvas
     */
    renderChanges() {
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}

export default PixelManipulator;