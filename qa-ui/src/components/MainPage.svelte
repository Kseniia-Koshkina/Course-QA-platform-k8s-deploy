<script>
	import BaseHeading from './general/BaseHeading.svelte';
	import CourseCard from './page-components/CourseCard.svelte';

	let courses = [];
	const getCourses = async() => {
		const response = await fetch(`/api/courses`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}
		});

		courses = await response.json();
	}

</script>

<!--MAIN PAGE WITH COURSE LIST-->
<div class="p-10 w-full">
	<BaseHeading text="Welcome to Q&A Course platform!"/>
	{#await getCourses()}
		<p class="mt-10 text-center">Loading...</p>
	{:then}
		{#if (courses.length != 0)}
			<div class="mt-10 mb-10 w-full border-2 rounded border-b-0">
				{#each courses as course}
					<CourseCard 
						title={course.title} 
						description={course.description}
						link={`/courses/${course.id}`}
					/> 
				{/each}
			</div>
		{/if}
	{/await}
</div>