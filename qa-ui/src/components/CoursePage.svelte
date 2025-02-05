<script>
	import AddQuestion from './page-components/AddQuestion.svelte';
	import QuestionCard from './page-components/QuestionCard.svelte';
	import CourseInfo from './page-components/CourseInfo.svelte';
  import { onMount } from "svelte";
  export let courseId;

  const PUBLIC_DEPLOYMENT_TYPE = import.meta.env.PUBLIC_DEPLOYMENT_TYPE;
  let addingQuestion = false;
  let loading;
  let allQuestions = false;
  let course;
  let page = 0;
  const limit = 20;
  let questions = [];
  let ws;

  onMount(() => {
    const url = PUBLIC_DEPLOYMENT_TYPE === 'kubernetes' ? "" : `ws://` + window.location.hostname + `:7800`;
    ws = new WebSocket(url+`/api/connect/questions?courseId=${courseId}`);

    ws.onmessage = (event) => {
      const question = JSON.parse(event.data);
      questions = [question, ...questions];
    };

    ws.onopen = (event) => {
      console.log("WebSocket connection established");
    }

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
    };
  });

  onMount(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  const handleScroll = () => {
    if (!addingQuestion) {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.scrollY + window.innerHeight;
      if ((scrollHeight - scrollPosition <= 100)
          && !loading 
          && !allQuestions)
        getQuestions();
    }
  }

  const getQuestions = async() => {
    loading = true;
    const response = await fetch(`/api/questions?courseId=${courseId}&page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (response.status == 200) {
      const newQuestions = await response.json();
      if (newQuestions < limit) allQuestions = true;
      questions = [...questions, ...newQuestions];
      page++;
    }

    loading = false;
  }

  const getCourseById = async() => {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    course = await response.json();
  }

  const loadContent = async() => {
    await getCourseById();
    await getQuestions();
  }

  const timeAgoToHuman = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    const timespans = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];

    for (const timespan of timespans) {
      const count = Math.floor(seconds / timespan.seconds);
      if (count > 0) {
        return `${count} ${timespan.label}${count !== 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }
</script>

<!-- COURSE PAGE WITH QUESTION LIST -->
{#await loadContent()}
  <p class="mt-10 text-center">Loading...</p>
  {:then}
    <div class=" w-full">
      {#if addingQuestion}
        <AddQuestion bind:addingQuestion={addingQuestion} courseId={courseId}/>
      {:else}
        <CourseInfo 
          bind:addingQuestion={addingQuestion} 
          questionNumber={questions.length}
          title={course.title}
          description={course.description}
        />
        {#if (questions.length != 0 && course)}
          <div class="mt-10 mb-10 w-full border-t-2">
            {#each questions as question (question.id)}
              <div data-testid="question-list">
                <QuestionCard
                  questionId={question.id}
                  title={question.title}
                  text={question.text}
                  views={question.views}
                  createdAt={timeAgoToHuman(question.created_at)}
                  link={`/courses/${courseId}/questions/${question.id}`}
                />
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
{/await}
