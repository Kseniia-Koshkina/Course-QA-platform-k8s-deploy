<script>
  export let action;
  export let disabled;

  $: color = disabled ? "fill-gray-500" : "";
</script>

<button class="mx-auto" on:click={action} disabled={disabled}>
  <svg aria-hidden="true" class={"svg-icon iconArrowUp "+ color} width="18" height="18" viewBox="0 0 18 18">
    <path d="M1 12h16L9 4z"/>
  </svg>
</button>