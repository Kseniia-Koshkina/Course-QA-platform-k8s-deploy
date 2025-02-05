<script>
  export let action;
  export let disabled;

  $: color = disabled ? "fill-gray-500" : "";
</script>

<button class="mx-auto" on:click={action} disabled={disabled} aria-label="Downvote">
  <svg aria-hidden="true" class={"svg-icon" + color} width="18" height="18" viewBox="0 0 18 18">
    <path d="M1 6h16l-8 8z"/>
  </svg>
</button>