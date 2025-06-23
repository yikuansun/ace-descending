<script>
    import { onMount } from "svelte";
    import PixelManipulator from "$lib/helpers/PixelManipulator";
    import loadImage from "$lib/helpers/loadImage";
    import LevelGenerator from "$lib/helpers/LevelGenerator";

    import levelMap from "$lib/levels/test.png";

    export let screenWidth = 960, screenHeight = 540;

    let player = {
        x: 64,
        y: 64,
        angle: 0,
        angularVelocity: 2,
        linearVelocity: 60,
    };

    /** @type {{
     * width: number,
     * height: number,
     * data: PixelManipulator,
     * image: HTMLImageElement | HTMLCanvasElement,
    }} */
    let stage;

    /**
     * @property {number} aov AOV (angle of view)
     * @property {number} resolution number of lines to render
     * @property {number} maxDepth maximum distance player can see
     * @property {[width: number, height: number]} viewport viewport size
     */
    let camera = {
        aov: Math.PI / 4,
        resolution: 200,
        maxDepth: 300,
        viewport: [screenWidth, screenHeight],
    };
    /** @type {Array.<{
     * x: number,
     * y: number,
     * angle: number,
     * distance: number,
     * color: [red: number, green: number, blue: number, alpha: number]}
     * >} */
    let visiblePoints = [];

    /** @type {Array.<{
     * x: number,
     * y: number,
    }>} */
    let entities = [
        { x: 200, y: 256 },
    ];
    /** @type {Array.<{
     * type: "wall" | "entity",
     * angle: number,
     * distance: number,
     * color: [red: number, green: number, blue: number, alpha: number],
    }>} */
    let drawingStack = [];

    let minimap = {
        size: 0.25,
        margin: 15,
    }

    /** @type {Object.<string, boolean>} */
    let keysPressed = {};

    let lastTime = (new Date()).getTime();
    let deltaTime = 0;
    function gameLoop() {
        // adjust speeds to be in pixels per second
        let startTime = (new Date()).getTime();
        deltaTime = (startTime - lastTime) / 1000;
        lastTime = startTime;

        if (keysPressed["["]) {
            player.angle -= deltaTime * player.angularVelocity;
        }
        if (keysPressed["]"]) {
            player.angle += deltaTime * player.angularVelocity;
        }
        player.angle = player.angle % (2 * Math.PI);

        let movementX = 0, movementY = 0;
        if (keysPressed["w"]) {
            movementX = deltaTime * player.linearVelocity * Math.cos(player.angle);
            movementY = deltaTime * player.linearVelocity * Math.sin(player.angle);
        }
        if (keysPressed["s"]) {
            movementX = deltaTime * player.linearVelocity * Math.cos(player.angle) * (-1);
            movementY = deltaTime * player.linearVelocity * Math.sin(player.angle) * (-1);
        }
        if (keysPressed["a"]) {
            movementX = deltaTime * player.linearVelocity * Math.sin(player.angle);
            movementY = deltaTime * player.linearVelocity * Math.cos(player.angle) * (-1);
        }
        if (keysPressed["d"]) {
            movementX = deltaTime * player.linearVelocity * Math.sin(player.angle) * (-1);
            movementY = deltaTime * player.linearVelocity * Math.cos(player.angle);
        }

        if (stage.data.getPixel(player.x, player.y)[3] === 0) {
            player.x += movementX;
            if (stage.data.getPixel(player.x, player.y)[3] > 0) {
                // collision on x-axis
                player.x -= movementX;
            }
            player.y += movementY;
            if (stage.data.getPixel(player.x, player.y)[3] > 0) {
                // collision on y-axis
                player.y -= movementY;
            }
        }

        visiblePoints = [];
        for (let angle = 0 - camera.aov / 2; angle < camera.aov / 2; angle += camera.aov / camera.resolution) {
            for (let rayLength = 0; rayLength < camera.maxDepth; rayLength++) {
                let rayX = player.x + rayLength * Math.cos(player.angle + angle);
                let rayY = player.y + rayLength * Math.sin(player.angle + angle);
                let rayColor = stage.data.getPixel(rayX, rayY);
                if (rayColor[3] > 0) {
                    visiblePoints = [...visiblePoints, {
                        x: rayX,
                        y: rayY,
                        angle: angle,
                        distance: rayLength,
                        color: rayColor,
                    }];
                    break;
                }
            }
        }

        let entitiesToDraw = [];
        for (let entity of entities) {
            entitiesToDraw.push({
                angle: ((Math.atan2(entity.y - player.y, entity.x - player.x) - player.angle) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI,
                distance: Math.sqrt(Math.pow(player.x - entity.x, 2) + Math.pow(player.y - entity.y, 2)),
                color: [0, 0, 255, 1],
            });
        }

        // use a copy to prevent svelte from updating every time the array is modified
        /**
         * @type {Array.<{
         * type: "wall" | "entity",
         * angle: number,
         * distance: number,
         * color: [red: number, green: number, blue: number, alpha: number],
         * }>}
         */
        let drawingStackTemp = [];
        for (let point of visiblePoints) {
            drawingStackTemp.push({
                type: "wall",
                angle: point.angle,
                distance: point.distance,
                color: point.color,
            });
        }
        for (let entity of entitiesToDraw) {
            drawingStackTemp.push({
                type: "entity",
                angle: entity.angle,
                distance: entity.distance,
                color: [0, 0, 255, 1],
            });
        }
        drawingStack = drawingStackTemp.toSorted((a, b) => b.distance - a.distance);

        requestAnimationFrame(gameLoop);
    }

    let stageImageSrc = levelMap;
    async function initStage() {
        let levelGen = new LevelGenerator(5, 128, 42, 24);
        await levelGen.loadTextures();
        levelGen.createMaze(200);
        let canvas = levelGen.render();
        stage = {
            width: levelGen.roomSize * levelGen.gridSize,
            height: levelGen.roomSize * levelGen.gridSize,
            data: new PixelManipulator(canvas),
            image: canvas,
        };
        stageImageSrc = canvas.toDataURL();
    }

    onMount(async () => {
        /*const img = await loadImage(levelMap);
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        stage = {
            width: img.width,
            height: img.height,
            data: new PixelManipulator(canvas),
            image: img,
        };*/
        await initStage();

        window.addEventListener("keydown", (e) => {
            keysPressed[e.key] = true;
        });
        window.addEventListener("keyup", (e) => {
            keysPressed[e.key] = false;
        });

        lastTime = (new Date()).getTime();
        requestAnimationFrame(gameLoop);
    });
</script>

<defs>
    <linearGradient id="bgGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="grey" />
        <stop offset="50%" stop-color="black" />
        <stop offset="100%" stop-color="grey" />
    </linearGradient>
    <clipPath id="screenClip">
        <rect width={camera.viewport[0]} height={camera.viewport[1]} x="0" y="0" />
    </clipPath>
</defs>
<g clip-path="url(#screenClip)">
    <rect width={camera.viewport[0]} height={camera.viewport[1]} fill="url(#bgGradient)" />
    {#each drawingStack as item}
        {#if item.type == "wall"}
            {@const point = item}
            {@const x2d = (point.angle + camera.aov / 2) / camera.aov * camera.viewport[0]}
            {@const height2d = 20000 / point.distance}
            {@const colorFoggy = [
                point.color[0] * (1 - point.distance / camera.maxDepth),
                point.color[1] * (1 - point.distance / camera.maxDepth),
                point.color[2] * (1 - point.distance / camera.maxDepth),
            ]}
            {@const thickness = (camera.viewport[0] / camera.resolution)}
            <line x1={x2d} y1={camera.viewport[1] / 2 - height2d / 2} x2={x2d} y2={camera.viewport[1] / 2 + height2d / 2}
                stroke="rgb({colorFoggy[0]}, {colorFoggy[1]}, {colorFoggy[2]})" stroke-width={thickness} />
        {/if}
        {#if item.type == "entity"}
            {@const entity = item}
            {@const x2d = (entity.angle + camera.aov / 2) / camera.aov * camera.viewport[0]}
            {@const size2d = 5000 / entity.distance}
            <circle cx={x2d} cy={camera.viewport[1] / 2} r={size2d / 2} fill="blue" filter="brightness({1 - entity.distance / camera.maxDepth})" />
        {/if}
    {/each}

    <g transform="translate({minimap.margin}, {minimap.margin}) scale({minimap.size})">
        <image href={stageImageSrc} x="0" y="0" />
        <circle cx={player.x} cy={player.y} r="12" fill="red" />
        <line x1={player.x} y1={player.y} x2={player.x + 12 * Math.cos(player.angle)} y2={player.y + 12 * Math.sin(player.angle)}
            stroke="black" stroke-width="5" />
        {#each visiblePoints as point}
            <line x1={player.x} y1={player.y} x2={point.x} y2={point.y}
                stroke="orange" stroke-width="5" />
            <circle cx={point.x} cy={point.y} r="5" fill="yellow" />
        {/each}
        {#each entities as entity}
            <circle cx={entity.x} cy={entity.y} r="12" fill="blue" />
        {/each}
    </g>
</g>

<foreignObject x="0" y="0" width="100%" height="100%">
    <p style:position="fixed" style:top="0" style:right="0" style:padding="10px"
        style:background-color="rgba(0, 0, 0, 0.5)" style:color="white" style:margin="0">
        FPS:
        <span style:color={(1 / deltaTime > 50) ? "darkgreen" : ((1 / deltaTime > 25) ? "darkyellow" : "darkred")}>
            {(1 / deltaTime).toFixed(0)}
        </span>
        <br />
        Resolution:
        <input type="range" min="50" max="400" bind:value={camera.resolution} />
        <input type="number" bind:value={camera.resolution} style:width="50px" />
        <br />
    </p>
</foreignObject>