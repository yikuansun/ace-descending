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
    {/if}
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