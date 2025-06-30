import loadImage from "$lib/helpers/loadImage.js";
import roomTexture1 from "$lib/assets/roomTextures/basic.png";
import roomTexture2 from "$lib/assets/roomTextures/dicey.png";
import roomTexture3 from "$lib/assets/roomTextures/octagon.png";
import roomTexture4 from "$lib/assets/roomTextures/barriers.png";
import roomTexture5 from "$lib/assets/roomTextures/stripes.png";

class Room {
    /** @type {"up" | "down" | "left" | "right" | "none"} */
    pointer = "right";
    anchorPoint = { x: 0, y: 0 };

    /**
     * Create new room
     * @param {"up" | "down" | "left" | "right" | "none"} pointer Direction of node's pointer
     * @param {{ x: number, y: number }} anchorPoint Coordinates of top-left corner of room
     */
    constructor(pointer, anchorPoint={ x: 0, y: 0 }) {
        this.pointer = pointer;
        this.anchorPoint = anchorPoint;
    }
}

export default class LevelGenerator {
    gridSize = 5;
    roomSize = 128;
    corridorWidth = 42;
    corridorLength = 24;

    /** @type {Array.<Array.<Room>>} */
    grid = [];

    /**
     * Create level data
     * @param {number} gridSize Number of rooms in each direction (rows, columns)
     * @param {number} roomSize Length/width of each room, in pixels
     * @param {number} corridorWidth Width of corridor (walking space), in pixels
     * @param {number} corridorLength Length of corridor (how long it is), in pixels
     */
    constructor(gridSize, roomSize, corridorWidth, corridorLength) {
        this.gridSize = gridSize;
        this.roomSize = roomSize;
        this.corridorWidth = corridorWidth;
        this.corridorLength = corridorLength;
    }

    /** @type {Array.<string>} */
    textureSrcs = [
        roomTexture1, roomTexture2, roomTexture3, roomTexture4, roomTexture5,
    ];
    /** @type {Array.<HTMLImageElement>} */
    textures = [];

    async loadTextures() {
        for (let src of this.textureSrcs) {
            let img = await loadImage(src);
            this.textures.push(img);
        }
    }

    createMaze(iterations = 10) {
        /** @type {[row: number, column: number]} */
        let originPos = [this.gridSize - 1, this.gridSize - 1];
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = new Room("right", { x: j * this.roomSize, y: i * this.roomSize });
                if (j == this.gridSize - 1) {
                    this.grid[i][j].pointer = "down";
                    if (i == this.gridSize - 1) {
                        this.grid[i][j].pointer = "none";
                        originPos = [i, j];
                    }
                }
            }
        }

        for (let i = 0; i < iterations; i++) {
            let availDirections = ["up", "down", "left", "right"];
            if (originPos[0] == 0) availDirections.splice(availDirections.indexOf("up"), 1);
            if (originPos[0] == this.gridSize - 1) availDirections.splice(availDirections.indexOf("down"), 1);
            if (originPos[1] == 0) availDirections.splice(availDirections.indexOf("left"), 1);
            if (originPos[1] == this.gridSize - 1) availDirections.splice(availDirections.indexOf("right"), 1);

            let direction = availDirections[Math.floor(Math.random() * availDirections.length)];
            switch (direction) {
                case "up":
                    this.grid[originPos[0]][originPos[1]].pointer = "up";
                    originPos[0]--;
                    this.grid[originPos[0]][originPos[1]].pointer = "none";
                    break;
                case "down":
                    this.grid[originPos[0]][originPos[1]].pointer = "down";
                    originPos[0]++;
                    this.grid[originPos[0]][originPos[1]].pointer = "none";
                    break;
                case "left":
                    this.grid[originPos[0]][originPos[1]].pointer = "left";
                    originPos[1]--;
                    this.grid[originPos[0]][originPos[1]].pointer = "none";
                    break;
                case "right":
                    this.grid[originPos[0]][originPos[1]].pointer = "right";
                    originPos[1]++;
                    this.grid[originPos[0]][originPos[1]].pointer = "none";
                    break;
            }
        }
    }

    getRandomTexture() {
        return this.textures[Math.floor(Math.random() * this.textures.length)];
    }

    render() {
        let canvas = document.createElement("canvas");
        canvas.width = this.roomSize * this.gridSize;
        canvas.height = this.roomSize * this.gridSize;
        /** @type {CanvasRenderingContext2D} */
        let ctx = canvas.getContext("2d");
        ctx.save();

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                let room = this.grid[i][j];
                ctx.translate(room.anchorPoint.x, room.anchorPoint.y);
                let texture = this.getRandomTexture();
                ctx.drawImage(texture, 0, 0, this.roomSize, this.roomSize);

                ctx.restore();
                ctx.save();
            }
        }

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                let room = this.grid[i][j];
                ctx.translate(room.anchorPoint.x, room.anchorPoint.y);
                switch (room.pointer) {
                    case "up":
                        ctx.clearRect(
                            this.roomSize / 2 - this.corridorWidth / 2,
                            0 - this.corridorLength / 2,
                            this.corridorWidth,
                            this.corridorLength,
                        );
                        break;
                    case "down":
                        ctx.clearRect(
                            this.roomSize / 2 - this.corridorWidth / 2,
                            this.roomSize - this.corridorLength / 2,
                            this.corridorWidth,
                            this.corridorLength,
                        );
                        break;
                    case "left":
                        ctx.clearRect(
                            0 - this.corridorLength / 2,
                            this.roomSize / 2 - this.corridorWidth / 2,
                            this.corridorLength,
                            this.corridorWidth,
                        );
                        break;
                    case "right":
                        ctx.clearRect(
                            this.roomSize - this.corridorLength / 2,
                            this.roomSize / 2 - this.corridorWidth / 2,
                            this.corridorLength,
                            this.corridorWidth,
                        );
                        break;
                }


                ctx.restore();
                ctx.save();
            }
        }

        return canvas;
    }

}