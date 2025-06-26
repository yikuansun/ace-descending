<script>
    let screenWidth = 960;
    let screenHeight = 540;
</script>


<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {screenWidth} {screenHeight}"
    style:position="fixed" style:top="50vh" style:left="50vw" style:transform="translate(-50%, -50%)"
    style:width="100vw" style:height="100vh">
    <defs>
        <clipPath id="screenClip">
            <rect width={screenWidth} height={screenHeight} x="0" y="0" />
        </clipPath>
    </defs>
    <g clip-path="url(#screenClip)">
        <slot {screenWidth} {screenHeight} />
    </g>
</svg>

<svelte:head>
    <title>Ace Descending</title>
</svelte:head>