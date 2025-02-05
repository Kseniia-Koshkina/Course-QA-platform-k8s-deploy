<script>
	import Link from './../general/Link.svelte';
  export let title;
  export let description;
  export let link;
</script>

<div class="h-[150px] pt-4 pl-6 pr-6 border-b-2">
  <div class="w-full h-full">
    <Link text={title} link={link}/>
    <p class="text-ellipsis overflow-hidden whitespace-normal break-word line-clamp-2 md:line-clamp-3">{description}</p>
  </div>
</div>