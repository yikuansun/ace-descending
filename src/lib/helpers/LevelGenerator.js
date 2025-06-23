import loadImage from "$lib/helpers/loadImage.js";

class Room {
    /** @type {"up" | "down" | "left" | "right" | "none"} */
    pointer = "right";

    /**
     * Create new room
     * @param {"up" | "down" | "left" | "right" | "none"} pointer Direction of node's pointer
     */
    constructor(pointer) {
        this.pointer = pointer;
    }
}

export default class LevelGenerator {
    gridSize = 5;
    roomSize = 128;
    corridorWidth = 32;
    corridorLength = 32;

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

    createMaze(iterations = 10) {
        /** @type {[row: number, column: number]} */
        let originPos = [this.gridSize - 1, this.gridSize - 1];
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = new Room("right");
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

}