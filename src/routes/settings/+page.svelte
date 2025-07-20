<script>
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let usrSettings = {
        controlScheme: "mouse",
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

<foreignObject x="0" y="0" width="100%" height="100%">
    <label>
        Control Scheme:
        <select bind:value={usrSettings.controlScheme}>
            <option value="mouse">Keyboard and Mouse</option>
            <option value="keyboard">Keyboard Only</option>
        </select>
    </label>
    <br /> <br />
    <button on:click={() => {
        saveSettings();
        goto("../menu")
    }}>Save and Return to Menu</button>
</foreignObject>