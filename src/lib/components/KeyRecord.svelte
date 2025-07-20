<script>
    export let value;

    let recording = false;

    /**
     * Translate value to a human-readable format
     * @param val
     */
    function displayValue(val) {
        if (val == " ") return "Space";
        if (val.length == 1) return val.toUpperCase();
        if (val == "ArrowUp") return "↑";
        if (val == "ArrowDown") return "↓";
        if (val == "ArrowLeft") return "←";
        if (val == "ArrowRight") return "→";
        if (val == "Control") return "Ctrl";
        if (val == "PageUp") return "PgUp";
        if (val == "PageDown") return "PgDn";
        return val;
    }
</script>

<svelte:window on:keydown={(e) => {
    if (recording) {
        if (e.key == "Escape") recording = false;
        else {
            e.preventDefault();
            value = e.key;
            recording = false;
        }
    }
}} />

<button on:click={() => {
    recording = !recording;
}}>
    {#if !recording}
        <span>{displayValue(value)}</span>
    {:else}
        <span style:color="darkred">REC</span>
    {/if}
</button>

<style>
    button {
        border: 3px outset grey;
        background-color: darkgrey; /* lighter than grey haha */
        padding: 7px 11px;
        outline: none!important;
        border-radius: 2px;
    }

    button:active {
        border-style: inset;
    }
</style>