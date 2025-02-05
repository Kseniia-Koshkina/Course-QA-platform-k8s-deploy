<script>
  export let action;
  export let text;
</script>

<button on:click={action} class="w-[120px] p-1 rounded bg-sky-600 text-white">
  {text}
</button>