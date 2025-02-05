<script>
  import { userUuid } from '../../stores/stores';
	import VoteDown from './../general/VoteDown.svelte';
  import VoteUp from './../general/VoteUp.svelte';
  export let text;
  export let answerId;

  let votes = 0;
  let disabled = true;
  const getVotes = async() => {
    const response = await fetch(`/api/votes/answers?answerId=${answerId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    votes = (await response.json()).total;
  }

  const getUserVote = async() => {
    const response = await fetch(`/api/votes/users?answerId=${answerId}&userUuid=${$userUuid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    const vote = await response.json();
    if (vote.length == 0) disabled = false;
  }

  const loadVotes = async() => {
    await getUserVote();
    await getVotes();
  }

  const voteUp = async() => {
    await addVote(1);
    disabled = true;
  }

  const voteDown = async() => {
    await addVote(-1);
    disabled = true;
  }

  const addVote = async(value) => {
    const data = {
      userUuid: $userUuid,
      answerId: answerId,
      value: value
    }
    const response = await fetch(`/api/votes/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });

    if (response.status == 200) {
      votes = Number(votes) + Number(value);
      const response = await fetch(`/api/votes/update?answerId=${answerId}`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      })
    }
  }
</script>

<div class="w-full pt-4 pb-4 flex border-b-2">
  <div class="min-w-[100px] flex flex-col text-center">
    <VoteUp action={voteUp} disabled={disabled}/>
    {#await loadVotes()}
      <p>0</p>
    {:then} 
      <p>{votes}</p>
    {/await}
    <VoteDown action={voteDown} disabled={disabled}/>
  </div>
  <div>
    <p class="whitespace-pre-line">
      {text}
    </p>
  </div>
</div>