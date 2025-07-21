<script>
    import { onMount } from "svelte";
    import { onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import PixelManipulator from "$lib/helpers/PixelManipulator";
    import loadImage from "$lib/helpers/loadImage";
    import LevelGenerator from "$lib/helpers/LevelGenerator";

    import levelMap from "$lib/levels/test.png";
    import { fly, fade } from "svelte/transition";

    export let screenWidth = 960, screenHeight = 540;

    let usrSettings = {
        controlScheme: "mouse",
        forwardKey: "w",
        backwardKey: "s",
        leftKey: "a",
        rightKey: "d",
        cameraLeftKey: "[",
        cameraRightKey: "]",
        resolution: 200,
        angularVelocity: 2,
        mouseSensitivity: 1,
    };

    let player = {
        x: 128,
        y: 128,
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
        maxDepth: 600,
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
    let entities = [];
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

    let lastTime = Date.now();
    let deltaTime = 0;
    /** @type {number} */
    let animationFrameId = -1;
    function gameLoop() {
        // adjust speeds to be in pixels per second
        let startTime = Date.now();
        deltaTime = (startTime - lastTime) / 1000;
        lastTime = startTime;

        if (usrSettings.controlScheme == "keyboard") {
            if (keysPressed[usrSettings.cameraLeftKey]) {
                player.angle -= deltaTime * player.angularVelocity;
            }
            if (keysPressed[usrSettings.cameraRightKey]) {
                player.angle += deltaTime * player.angularVelocity;
            }
        }
        player.angle = player.angle % (2 * Math.PI);

        let movementX = 0, movementY = 0;
        if (keysPressed[usrSettings.forwardKey]) {
            movementX += deltaTime * player.linearVelocity * Math.cos(player.angle);
            movementY += deltaTime * player.linearVelocity * Math.sin(player.angle);
        }
        if (keysPressed[usrSettings.backwardKey]) {
            movementX += deltaTime * player.linearVelocity * Math.cos(player.angle) * (-1);
            movementY += deltaTime * player.linearVelocity * Math.sin(player.angle) * (-1);
        }
        if (keysPressed[usrSettings.leftKey]) {
            movementX += deltaTime * player.linearVelocity * Math.sin(player.angle);
            movementY += deltaTime * player.linearVelocity * Math.cos(player.angle) * (-1);
        }
        if (keysPressed[usrSettings.rightKey]) {
            movementX += deltaTime * player.linearVelocity * Math.sin(player.angle) * (-1);
            movementY += deltaTime * player.linearVelocity * Math.cos(player.angle);
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

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    let wallHeight = 30000;

    let stageImageSrc = levelMap;
    async function initStage() {
        let levelGen = new LevelGenerator(4, 256, 84, 50);
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

        for (let r = 0; r < levelGen.gridSize; r++) {
            for (let c = 0; c < levelGen.gridSize; c++) {
                let x = levelGen.roomSize * c;
                let y = levelGen.roomSize * r;
                entities = [...entities, {
                    x: x + levelGen.roomSize / 2,
                    y: y + levelGen.roomSize / 2,
                }];
            }
        }
    }

    let pauseMenuVisible = false;

    /** @type {Touch | null} used for mobile camera rotation (bc there is no movementX) */
    let previousTouch = null;

    onMount(async () => {
        if (localStorage.getItem("usrSettings")) {
            let _usrSettings = JSON.parse(localStorage.getItem("usrSettings") || "{}");
            if (typeof _usrSettings == "object") {
                for (let key in _usrSettings) usrSettings[key] = _usrSettings[key];
            }
        }

        camera.resolution = usrSettings.resolution;
        player.angularVelocity = usrSettings.angularVelocity;
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

        lastTime = Date.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    });

    onDestroy(() => {
        if (animationFrameId !== -1) {
            cancelAnimationFrame(animationFrameId);
        }
    });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:window
    on:keydown={(e) => {
        keysPressed[e.key] = true;

        if (e.key == "p") {
            pauseMenuVisible = !pauseMenuVisible;
            if (pauseMenuVisible) {
                if (animationFrameId !== -1) cancelAnimationFrame(animationFrameId);
                animationFrameId = -1;
                if (usrSettings.controlScheme == "mouse") document.exitPointerLock();
            }
            else {
                if (animationFrameId === -1) {
                    lastTime = Date.now();
                    animationFrameId = requestAnimationFrame(gameLoop);
                }
                if (usrSettings.controlScheme == "mouse") document.body.requestPointerLock();
            }
        }
    }}
    on:keyup={(e) => {
        keysPressed[e.key] = false;
    }}
    on:mousemove={(e) => {
        if (usrSettings.controlScheme == "mouse" && document.pointerLockElement === document.body) {
            player.angle += (e.movementX / 1000 * usrSettings.mouseSensitivity) * player.angularVelocity;
        }
    }}
/>

<defs>
    <linearGradient id="bgGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="grey" />
        <stop offset="50%" stop-color="black" />
        <stop offset="100%" stop-color="grey" />
    </linearGradient>
</defs>

<rect width={camera.viewport[0]} height={camera.viewport[1]} fill="url(#bgGradient)" />
{#each drawingStack as item}
    {#if item.type == "wall"}
        {@const point = item}
        {@const x2d = (point.angle + camera.aov / 2) / camera.aov * camera.viewport[0]}
        {@const height2d = wallHeight / point.distance}
        {@const colorFoggy = [
            point.color[0] * (1 - point.distance / camera.maxDepth),
            point.color[1] * (1 - point.distance / camera.maxDepth),
            point.color[2] * (1 - point.distance / camera.maxDepth),
        ]}
        {@const thickness = (camera.viewport[0] / camera.resolution)}
        <line x1={x2d} y1={camera.viewport[1] / 2 - height2d / 2} x2={x2d} y2={camera.viewport[1] / 2 + height2d / 2}
            stroke="rgb({colorFoggy[0]}, {colorFoggy[1]}, {colorFoggy[2]})" stroke-width={thickness} />
    {/if}
    {#if item.type == "entity" && item.distance < camera.maxDepth}
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
    <!--{#each visiblePoints as point}
        <line x1={player.x} y1={player.y} x2={point.x} y2={point.y}
            stroke="orange" stroke-width="5" />
        <circle cx={point.x} cy={point.y} r="5" fill="yellow" />
    {/each}-->
    {#each entities as entity}
        <circle cx={entity.x} cy={entity.y} r="12" fill="blue" />
    {/each}
</g>

{#if usrSettings.controlScheme == "mouse"}
    <!-- enable mouse controls -->
    <foreignObject x="0" y="0" width="100%" height="100%">
        <button style:width="100%" style:height="100%" style:opacity="0"
            on:click={async () => {
                await document.body.requestPointerLock();
            }}>Enable Mouse Controls</button>
    </foreignObject>
{/if}

{#if usrSettings.controlScheme == "mobile"}
    <rect x="0" y="0" width="100%" height="100%" opacity="0"
        on:touchstart={(e) => {
            e.preventDefault();
            previousTouch = e.targetTouches[0];
        }} on:touchmove={(e) => {
            e.preventDefault();
            let touch = e.targetTouches[0];
            let movementX = 0;
            if (previousTouch) movementX = touch.clientX - previousTouch.clientX;
            previousTouch = touch;
            player.angle -= (movementX / screenWidth * usrSettings.mouseSensitivity) * player.angularVelocity;
        }} on:touchend={() => {
            previousTouch = null;
        }} />
    <g transform="translate(150, {screenHeight - 150})">
        <circle cx={0} cy={0} r="120" fill="#252525" opacity="0.5" stroke="black" stroke-width="5" stroke-opacity="0.75"
            on:touchstart={(e) => {
                e.preventDefault();
                let cx = e.currentTarget.getBoundingClientRect().x + e.currentTarget.getBoundingClientRect().width / 2;
                let cy = e.currentTarget.getBoundingClientRect().y + e.currentTarget.getBoundingClientRect().height / 2;
                if (e.targetTouches[0].clientX < cx - 20) keysPressed[usrSettings.leftKey] = true;
                else keysPressed[usrSettings.leftKey] = false;
                if (e.targetTouches[0].clientX > cx + 20) keysPressed[usrSettings.rightKey] = true;
                else keysPressed[usrSettings.rightKey] = false;
                if (e.targetTouches[0].clientY < cy - 20) keysPressed[usrSettings.forwardKey] = true;
                else keysPressed[usrSettings.forwardKey] = false;
                if (e.targetTouches[0].clientY > cy + 20) keysPressed[usrSettings.backwardKey] = true;
                else keysPressed[usrSettings.backwardKey] = false;
            }} on:touchmove={(e) => {
                let cx = e.currentTarget.getBoundingClientRect().x + e.currentTarget.getBoundingClientRect().width / 2;
                let cy = e.currentTarget.getBoundingClientRect().y + e.currentTarget.getBoundingClientRect().height / 2;
                if (e.targetTouches[0].clientX < cx - 20) keysPressed[usrSettings.leftKey] = true;
                else keysPressed[usrSettings.leftKey] = false;
                if (e.targetTouches[0].clientX > cx + 20) keysPressed[usrSettings.rightKey] = true;
                else keysPressed[usrSettings.rightKey] = false;
                if (e.targetTouches[0].clientY < cy - 20) keysPressed[usrSettings.forwardKey] = true;
                else keysPressed[usrSettings.forwardKey] = false;
                if (e.targetTouches[0].clientY > cy + 20) keysPressed[usrSettings.backwardKey] = true;
                else keysPressed[usrSettings.backwardKey] = false;
            }} on:touchend={() => {
                keysPressed[usrSettings.leftKey] = false;
                keysPressed[usrSettings.rightKey] = false;
                keysPressed[usrSettings.forwardKey] = false;
                keysPressed[usrSettings.backwardKey] = false;
            }} />
        <polygon points="-100,0 -70,-30 -70,30" fill="black" opacity={keysPressed[usrSettings.leftKey] ? "0.7" : "0.3"}
            style:pointer-events="none" />
        <polygon points="100,0 70,-30 70,30" fill="black" opacity={keysPressed[usrSettings.rightKey] ? "0.7" : "0.3"}
            style:pointer-events="none" />
        <polygon points="-30,-70 0,-100 30,-70" fill="black" opacity={keysPressed[usrSettings.forwardKey] ? "0.7" : "0.3"}
            style:pointer-events="none" />
        <polygon points="-30,70 0,100 30,70" fill="black" opacity={keysPressed[usrSettings.backwardKey] ? "0.7" : "0.3"}
            style:pointer-events="none" />
    </g>
    <rect x={screenWidth - 70} y={20} width={50} height={50} fill="#252525" opacity="0.5" stroke="black" stroke-width="5" stroke-opacity="0.75"
        on:touchstart={() => {
            pauseMenuVisible = true;
            if (animationFrameId !== -1) cancelAnimationFrame(animationFrameId);
            animationFrameId = -1;
        }} />
    <line x1={screenWidth - 52} y1={32} x2={screenWidth - 52} y2={58} stroke="black" stroke-width="8" stroke-opacity="0.25" style:pointer-events="none" />
    <line x1={screenWidth - 38} y1={32} x2={screenWidth - 38} y2={58} stroke="black" stroke-width="8" stroke-opacity="0.25" style:pointer-events="none" />
{/if}

{#if pauseMenuVisible}
    <rect x={0} y={0} width={camera.viewport[0] / 2} height={camera.viewport[1]} fill="#222222" opacity="0.5"
        in:fly={{ x: -camera.viewport[0] / 2, duration: 700, opacity: 1 }} out:fly={{ x: -camera.viewport[0] / 2, duration: 700, opacity: 1 }} />
    <rect x={camera.viewport[0] / 2} y={0} width={camera.viewport[0] / 2} height={camera.viewport[1]} fill="#222222" opacity="0.5"
        in:fly={{ x: camera.viewport[0] / 2, duration: 700, opacity: 1 }} out:fly={{ x: camera.viewport[0] / 2, duration: 700, opacity: 1 }} />
    <foreignObject x="0" y="0" width={screenWidth} height={screenHeight}
        in:fade={{ delay: 700, duration: 500 }} out:fade={{ duration: 500 }}>
        <div style:width="100%" style:height="100%" style:display="flex"
            style:flex-direction="column" style:align-items="center" style:justify-content="center">
            <h1 style:color="white">Game Paused</h1>
            <button on:click={() => {
                pauseMenuVisible = false;
                if (animationFrameId === -1) {
                    lastTime = Date.now();
                    animationFrameId = requestAnimationFrame(gameLoop);
                }

                if (usrSettings.controlScheme == "mouse") document.body.requestPointerLock();
            }}>Resume</button>
            <br />
            <button on:click={() => {
                goto("../menu");
            }}>Exit to Menu</button>
        </div>
    </foreignObject>
{/if}

<!-- developer panel -->
<!--
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
-->