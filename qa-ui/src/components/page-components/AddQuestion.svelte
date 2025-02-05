<script>
	import InfoCard from './../general/InfoCard.svelte';
	import TextArea from './../general/TextArea.svelte';
	import BaseHeading from './../general/BaseHeading.svelte';
	import Button from './../general/Button.svelte';
  import { userUuid } from '../../stores/stores';
  export let addingQuestion;
  export let courseId;

  let questionTitle;
  let questionDescription;
  const goBack = () => {addingQuestion = false;}

  const submitNewQuestion = async() => {
    if (questionDescription.length == 0 || questionTitle.length == 0) return;

    const data = {
      courseId: courseId,
      title: questionTitle,
      text: questionDescription,
      userUuid: $userUuid
    }

    const response = await fetch(`/api/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });

    if (response.status == 429) {
      alert("One answer or question is allowed per minute");
    }
  }
</script>

<div class="p-4 mt-6">
  <div class="flex justify-between mb-10">
    <BaseHeading text="Ask a public question"/>
    <Button action={goBack} text='Back'/>
  </div>
  <InfoCard 
    title="Introduce the problem" 
    text="Explain how you encountered the problem you’re trying to solve, and any difficulties that have prevented you from solving it yourself."
  />
  <div class="mb-6">
    <BaseHeading text="Title" style="text-xl"/>
    <p class="mb-4">Be specific and imagine you’re asking a question to another person.</p>
    <input class="w-full p-2 border-2 rounded hover:border-sky-700 focus:outline-none focus:ring focus:ring-sky-600" bind:value={questionTitle} placeholder="e.g. How can I measure the performance of my algorithm?"/>
  </div>
  <div class="mb-6">
    <BaseHeading text="What are the details of your problem?" style="text-xl"/>
    <p class="mb-4">Introduce the problem and expand on what you put in the title.</p>
    <TextArea bind:text={questionDescription} placeholder="Describe your problem"/>
  </div>
  <Button action={submitNewQuestion} text='Submit'/>
</div>