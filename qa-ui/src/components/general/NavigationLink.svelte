<script>
  export let link;
</script>

<a class="flex hover:bg-sky-600 hover:bg-opacity-30 mb-2 pl-2 text-ellipsis overflow-hidden whitespace-normal break-words line-clamp-1" href={link}>
  <slot/>
</a>