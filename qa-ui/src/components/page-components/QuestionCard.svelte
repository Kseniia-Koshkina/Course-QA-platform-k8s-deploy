<script>
	import VoteUp from './../general/VoteUp.svelte';
	import VoteDown from './../general/VoteDown.svelte';
	import Link from './../general/Link.svelte';
  import { userUuid } from '../../stores/stores';

  export let questionId;
  export let title;
  export let text;
  export let views;
  export let createdAt;
  export let link;

  let votes = 0;
  let disabled = true;
  let userVoteId = null;
  let userVoteValue = 0;

  const getVotes = async() => {
    const response = await fetch(`/api/votes/questions?questionId=${questionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    votes = (await response.json()).total;
  }

  const getUserVote = async() => {
    const response = await fetch(`/api/votes/users?questionId=${questionId}&userUuid=${$userUuid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    const vote = await response.json();
    if (vote && vote.length > 0) {
      userVoteId = vote[0].id;
      userVoteValue = vote[0].value;
      disabled = false;
    } else {
      userVoteId = null;
      userVoteValue = 0;
      disabled = false;
    }
  }

  const loadVotes = async() => {
    await getUserVote();
    await getVotes();
  }

  const voteUp = async () => {
    if (userVoteValue == 0) {
      await addVote(1);
      await getUserVote()
    } else if (userVoteValue == -1) {
      await deleteVote();
    }
  };

  const voteDown = async () => {
    if (userVoteValue == 0) {
      await addVote(-1);
      await getUserVote()
    } else if (userVoteValue == 1) {
      await deleteVote();
    }
  };

  const deleteVote = async () => {
    if (userVoteId !== null) {
      const response = await fetch(`/api/votes/delete?voteId=${userVoteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status == 200) {
        votes = -1*Number(userVoteValue) + Number(votes);
        userVoteValue = 0;
      }

      if (!response.ok) {
        console.error("Failed to delete vote:", response);
      }
    }
  };

  const addVote = async (value) => {
    const data = {
      userUuid: $userUuid,
      questionId: questionId,
      value: value
    };
    const response = await fetch(`/api/votes/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });
    if (response.status === 200) {
      votes = Number(votes) + Number(value);
      userVoteValue = value;
      await fetch(`/api/votes/update?questionId=${questionId}`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      })
    } else if (response.status === 409) {
      console.error("Vote already exists, handle accordingly.");
    } else {
      console.error("Failed to add vote:", response);
    }
  };
</script>

<div class="h-[150px] p-4 flex border-b-2">
  <div class="min-w-[100px] flex flex-col text-center mt-2">
    <VoteUp action={voteUp} disabled={userVoteValue === 1} />
    {#await loadVotes()}
      <p>0</p>
    {:then} 
      <p>{votes}</p>
    {/await}
    <VoteDown action={voteDown} disabled={userVoteValue === -1} />
  </div>
  <div class="lg:pl-5 w-full h-full">
    <Link text={title} link={link}/>
    <p class="text-ellipsis overflow-hidden whitespace-normal break-words line-clamp-2">
      {text}
    </p>
    <p class="text-right">
      {createdAt}
    </p>
    <p class="text-right text-sm">Views: {views}</p>
  </div>
</div>