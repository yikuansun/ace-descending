<script>
    import { onMount } from "svelte";
    import PixelManipulator from "$lib/helpers/PixelManipulator";
    import loadImage from "$lib/helpers/loadImage";

    import levelMap from "$lib/levels/test.png";

    let player = {
        x: 100,
        y: 256,
        angle: 0,
        angularVelocity: 2,
        linearVelocity: 60,
    };

    /** @type {{
     * width: number,
     * height: number,
     * data: PixelManipulator,
     * image: HTMLImageElement,
    }} */
    let stage;

    /**
     * @property {number} aov AOV (angle of view)
     * @property {number} resolution number of lines to render
     * @property {number} maxDepth maximum distance player can see
     */
    let camera = {
        aov: Math.PI / 4,
        resolution: 100,
        maxDepth: 512,
    };
    /** @type {Array.<{x: number, y: number, distance: number, color: [red: number, green: number, blue: number, alpha: number]}>} */
    let visiblePoints = [];

    /** @type {Object.<string, boolean>} */
    let keysPressed = {};

    let lastTime = (new Date()).getTime();
    function gameLoop() {
        // adjust speeds to be in pixels per second
        let startTime = (new Date()).getTime();
        let deltaTime = (startTime - lastTime) / 1000;
        lastTime = startTime;

        if (keysPressed["ArrowLeft"]) {
            player.angle -= deltaTime * player.angularVelocity;
        }
        if (keysPressed["ArrowRight"]) {
            player.angle += deltaTime * player.angularVelocity;
        }

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
                        distance: rayLength,
                        color: rayColor,
                    }];
                    break;
                }
            }
        }

        requestAnimationFrame(gameLoop);
    }

    onMount(async () => {
        const img = await loadImage(levelMap);
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        stage = {
            width: img.width,
            height: img.height,
            data: new PixelManipulator(canvas),
            image: img,
        };

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

<!-- minimap -->
<div style:position="fixed" style:top="10px" style:left="10px" style:transform="scale(0.75)">
    <img src={levelMap} alt="level map" style:position="absolute"
        style:top="0" style:left="0" />
    <div style:position="absolute" style:left="{player.x}px" style:top="{player.y}px"
        style:transform="translate(-50%, -50%) rotate({player.angle}rad)" style:width="25px" style:height="25px"
        style:background-color="red">
        <div style:position="absolute" style:left="12.5px" style:top="10px" style:width="12.5px" style:height="5px"
            style:background-color="black">
        </div>
    </div>
    {#each visiblePoints as point}
        <div style:position="absolute" style:left="{point.x}px" style:top="{point.y}px"
            style:transform="translate(-50%, -50%)" style:border-radius="2.5px"
            style:width="5px" style:height="5px" style:background-color="orange">
        </div>
    {/each}
</div>

