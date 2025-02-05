<script>
	import BaseHeading from './../general/BaseHeading.svelte';
  export let questionId;
  export let title;
  export let text;
  export let createdAt;

  let votes = 0;
  const getVotes = async() => {
    const response = await fetch(`/api/votes/questions?questionId=${questionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    votes = (await response.json()).total;
  }
</script>

<div class="flex flex-col mb-5">
  <div class="flex mb-5">
    {#await getVotes()}
      <p class="mr-5">0 votes</p>
    {:then} 
      <p class="mr-5">{votes} votes</p>
    {/await}
    <p>{createdAt}</p>
  </div>
  <div class="w-full h-full">
    <BaseHeading text={title}/>
    <p class="mt-5 whitespace-pre-line">{text}</p>
  </div>
</div>