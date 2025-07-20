<script>
    import { goto } from "$app/navigation";
</script>

<foreignObject x="0" y="0" width="100%" height="100%">
    <button on:click={() => goto("../dungeon")}>play</button>
    <br />
    <button on:click={() => goto("../settings")}>settings</button>
</foreignObject>