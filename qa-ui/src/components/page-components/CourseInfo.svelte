<script>
	import InfoCard from './../general/InfoCard.svelte';
	import BaseHeading from './../general/BaseHeading.svelte';
	import Button from './../general/Button.svelte';
  export let addingQuestion;
  export let questionNumber;
  export let title;
  export let description;
  
  const addQuestion = () => {addingQuestion = true;}
</script>

<div class="p-4 mt-6" data-testid="CourseInfo">
  <InfoCard title={title} text={description}/>
</div>
<div class="p-4 pl-6 pt-0">
  <div class="flex justify-between">
    <BaseHeading text={"Newest Questions"}/>
    <Button action={addQuestion} text={"Ask Question"}/>
  </div>
  <p>{questionNumber} questions on the page</p>
</div>