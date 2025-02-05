<script>
  export let text;
  export let link;
</script>

<a href={link} class="text-lg text-ellipsis overflow-hidden whitespace-normal break-words line-clamp-1 text-sky-600">
  {text}
</a>