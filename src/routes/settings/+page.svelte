<script>
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import KeyRecord from "$lib/components/KeyRecord.svelte";

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

    onMount(async () => {
        if (localStorage.getItem("usrSettings")) {
            let _usrSettings = JSON.parse(localStorage.getItem("usrSettings") || "{}");
            if (typeof _usrSettings == "object") {
                for (let key in _usrSettings) usrSettings[key] = _usrSettings[key];
            }
        }
    });

    function saveSettings() {
        localStorage.setItem("usrSettings", JSON.stringify(usrSettings));
    }
</script>

<foreignObject x="0" y="0" width={screenWidth / 2} height={screenHeight - 50}>
    <label>
        Control Scheme:
        <select bind:value={usrSettings.controlScheme}>
            <option value="mouse">Keyboard and Mouse</option>
            <option value="keyboard">Keyboard Only</option>
            <option value="mobile">Mobile/Touchscreen</option>
        </select>
    </label> <br />
    <br />
    <b>Movement</b> <br />
    <span>
        Forward:
        <KeyRecord bind:value={usrSettings.forwardKey} />
    </span> <br />
    <span>
        Backward:
        <KeyRecord bind:value={usrSettings.backwardKey} />
    </span> <br />
    <span>
        Left:
        <KeyRecord bind:value={usrSettings.leftKey} />
    </span> <br />
    <span>
        Right:
        <KeyRecord bind:value={usrSettings.rightKey} />
    </span> <br />
    <br />
    {#if usrSettings.controlScheme == "keyboard"}
        <b>Camera</b> <br />
        <span>
            Rotate Left:
            <KeyRecord bind:value={usrSettings.cameraLeftKey} />
        </span> <br />
        <span>
            Rotate Right:
            <KeyRecord bind:value={usrSettings.cameraRightKey} />
        </span> <br />
    {:else if usrSettings.controlScheme == "mouse"}
        <span>
            Mouse Sensitivity:
            <input type="range" min="0.5" max="3" step="0.1" bind:value={usrSettings.mouseSensitivity} />
            <input type="number" step="0.1" bind:value={usrSettings.mouseSensitivity} style:width="50px" />
        </span>
    {/if}
</foreignObject>

<foreignObject x={screenWidth / 2} y="0" width={screenWidth / 2} height={screenHeight - 50}>
    <label>
        Resolution:
        <input type="range" min="50" max="400" bind:value={usrSettings.resolution} />
        <input type="number" bind:value={usrSettings.resolution} style:width="50px" />
    </label> <br />
    <label>
        Rotational Speed:
        <input type="range" min="0.5" max="3" step="0.1" bind:value={usrSettings.angularVelocity} />
        <input type="number" step="0.1" bind:value={usrSettings.angularVelocity} style:width="50px" />
    </label> <br />
</foreignObject>

<foreignObject x="0" y={screenHeight - 50} width={screenWidth} height="50">
    <div style:display="flex" style:flex-direction="column" style:align-items="center" style:justify-content="center"
        style:width="100%" style:height="100%">
        <button on:click={() => {
            saveSettings();
            goto("../menu")
        }}>Save and Return to Menu</button>
    </div>
</foreignObject>