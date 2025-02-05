<script>
	import BaseHeading from './BaseHeading.svelte';
  export let title;
  export let text;
</script>

<div class="mb-10 border-2 rounded p-6 border-sky-700 bg-sky-600 bg-opacity-30">
  <BaseHeading text={title} style="mb-4"/>
  <p>{text}</p>
</div>