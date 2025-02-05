<script>
  export let text;
  export let placeholder;
</script>

<textarea class="w-full p-2 h-[200px] border-2 rounded hover:border-sky-700 focus:outline-none focus:ring focus:ring-sky-600" bind:value={text} placeholder={placeholder}/>