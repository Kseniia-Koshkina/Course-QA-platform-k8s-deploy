<script>
	import QuestionInfo from './page-components/QuestionInfo.svelte';
	import AnswerCard from './page-components/AnswerCard.svelte';
	import TextArea from './general/TextArea.svelte';
	import BaseHeading from './general/BaseHeading.svelte';
	import Button from './general/Button.svelte';
  import { onMount } from "svelte";
  import { userUuid } from '../stores/stores';
  export let questionId;

  const PUBLIC_DEPLOYMENT_TYPE = import.meta.env.PUBLIC_DEPLOYMENT_TYPE;
  const limit = 20;
  let loading = false;
  let allAnswers = false;
  let page = 0;
  let answerText;
  let question;
  let answers = [];
  let ws;

  onMount(() => {
    const url = PUBLIC_DEPLOYMENT_TYPE === 'kubernetes' ? "" :`ws://` + window.location.hostname + `:7800`;
    ws = new WebSocket(url+`/api/connect/answers?questionId=${questionId}`);

    ws.onmessage = (event) => {
      const answer = JSON.parse(event.data);
      answers = [answer, ...answers];
    };

    ws.onopen = (event) => {
      console.log("WebSocket connection established");
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (ws.readyState === 1) {
        ws.close();
      }
    };
  });

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.scrollY + window.innerHeight;
    if ((scrollHeight - scrollPosition <= 100)
        && !loading 
        && !allAnswers)
      getAnswers();
  }

  const getQuestion = async() => {
    const response = await fetch(`/api/questions/${questionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    if (response.status == 200) question = await response.json();
  }

  const getAnswers = async() => {
    loading = true;
    const response = await fetch(`/api/answers?questionId=${questionId}&page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (response.status == 200) {
      const newAnswers = await response.json();
      answers = [...answers, ...newAnswers];
      if (newAnswers.length < limit) allAnswers = true;
      page++;
    }

    loading = false;
  }

  const loadContent = async() => {
    await getQuestion();
    await getAnswers();
  }

  const submitNewAnswer = async() => {
    if (answerText.length < 10) return;
    const data = {
      text: answerText,
      questionId: questionId,
      userUuid: $userUuid
    }
    const response = await fetch(`/api/answers`, {
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

<!-- COURSE PAGE WITH QUESTION LIST -->
{#await loadContent()}
  <p class="mt-10 text-center">Loading...</p>
  {:then}
    <div class=" w-full">
      <div class="m-10 mt-4">
        <QuestionInfo
          questionId={questionId}
          title={question.title}
          text={question.text}
          createdAt={question.created_at}
        />

        <div class="mb-10">
          <BaseHeading text={answers.length + " answers on the page"}/>
        </div>
        <div data-testid="answer-list">
          {#if (answers.length != 0)}
            <div class="mb-10 border-t-2 flex flex-col">
              {#each answers as answer (answer.id)}
                <AnswerCard text={answer.text} answerId={answer.id}/>
              {/each}
            </div>
          {/if}
        </div>

        <div class="mb-4">
          <BaseHeading text="Your Answer" style="mb-4"/>
          <TextArea bind:text={answerText} placeholder="min 10 ch."/>
        </div>
        <Button action={submitNewAnswer} text="Submit"/>
      </div>
    </div>
{/await}