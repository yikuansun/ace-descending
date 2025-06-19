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
</div>

