<script>
  import { userUuid } from "../stores/stores.js";
  let showUuid = false;
</script>

<div class="sticky top-0 z-10 p-4 border-2 border-t-0 border-r-0 border-t-4 border-t-sky-700 bg-white">
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div 
    class="container mx-auto text-2xl text-gray-700 font-serif max-w-[1300px]" data-testid="header"
    on:mouseover={() => (showUuid = true)}
    on:mouseout={() => (showUuid = false)}
  >
    Hello {#if showUuid}{$userUuid}{:else}user! Welcome to our learning platform{/if}! 
  </div>
</div>