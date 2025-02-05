import { serve } from "./deps.js";
import {cacheMethodCalls} from "./caching/cachingDataBase.js";
import * as coursesDataBase from "./services/courses.js";
import * as questionsDataBase from "./services/questions.js";
import * as answersDataBase from "./services/answers.js";
import * as votesDataBase from "./services/votes.js";
import { userBlockActions, setUserBlockActions } from "./caching/userLastActivity.js";

const cachedCourses = cacheMethodCalls(coursesDataBase, [], 'courses');
const cachedQuestions = cacheMethodCalls(questionsDataBase, ["addQuestion", "updateQuestionVoteDate", "updateQuestionViews"], 'questions');
const cachedAnswers = cacheMethodCalls(answersDataBase, ["addAnswer", "updateAnswerVoteDate"], 'answers');
const cachedVotes = cacheMethodCalls(votesDataBase, ["addAnswerVote", "addQuestionVote", "deleteQuestionVote"], 'votes');

const MAX_REQUESTS = Number.MAX_SAFE_INTEGER;
let requests = 0;

const addMetricsCount = () => {
  if (requests >= MAX_REQUESTS) {
    requests = 0;
  }

  requests += 1;
}

/*
* Maps to store sockets with answerId and questionId as keys;
* Allows to limit broadcasting to pages where new answer or question was created;
*/
const answerPageSockets = new Map();
const questionPageSockets = new Map();

/* 
* Functions for websocket send event
*/
const newAnswerSend = (answer, questionId) => {
  const data = JSON.stringify(answer);
  if (answerPageSockets.has(questionId))
    answerPageSockets.get(questionId).forEach((socket) => socket.send(data));
}

const newQuestionSend = (question, courseId) => {
  const data = JSON.stringify(question);
  if (questionPageSockets.has(courseId))
    questionPageSockets.get(courseId).forEach((socket) => socket.send(data));
}

/*
* Functions to handle websocket connections;
*/

const handleConnectAnswerPage = async(request) => {
  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');
    if (!questionId) {
      return new Response("Missing questionId", { status: 400 });
    }
    const { socket, response } = Deno.upgradeWebSocket(request);

    if (!answerPageSockets.has(questionId)) {
      answerPageSockets.set(questionId, new Set());
    }
    answerPageSockets.get(questionId).add(socket);

    socket.onclose = () => {
      const sockets = answerPageSockets.get(questionId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          answerPageSockets.delete(questionId);
        }
      }
    };

    return response;
  } catch(error) {
    console.error(error);
  }
}

const handleConnectQuestionPage = async(request) => {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    if (!courseId) {
      return new Response("Missing courseId", { status: 400 });
    }
    const { socket, response } = Deno.upgradeWebSocket(request);
    
    if (!questionPageSockets.has(courseId)) {
      questionPageSockets.set(courseId, new Set());
    }
    questionPageSockets.get(courseId).add(socket);

    socket.onclose = () => {
      const sockets = questionPageSockets.get(courseId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          questionPageSockets.delete(courseId);
        }
      }
    };

    return response;
  } catch(error) {
    console.error(error);
  }
}

/*
* Function to generate answers with llm; 
*/

const generateAnswer = async(questionText) => {
  const data = {
    question: questionText
  }
  const response = await fetch("http://llm-api:7000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  });

  const answerText = await response.json();
  return answerText[0].generated_text;
}

/*
* Courses functions; 
*/

const handleGetCourses = async() => {
  try {
    addMetricsCount();
    const courses = await cachedCourses.getAllCourses();
    return Response.json(courses, { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
};

const handleGetCourse = async(request, params) => {
  try {
    addMetricsCount();
    const { id } = params;
    if (!id || isNaN(id)) return Response.json("No id provided", { status: 400 });
    const courses = await cachedCourses.getCourseById(id);
    if (courses.length == 0) return Response.json("No course found", { status: 400 });
    return Response.json(courses[0], { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
};

/*
* Questions functions;
*/

const handleGetQuestions = async(request) => {
  try {
    addMetricsCount();
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');
    if (!courseId || !page || !limit) 
      return Response.json("Missing parameter", { status: 400 });
    const questions = await cachedQuestions.getAllQuestions(
      courseId, 
      limit, 
      page*limit
    );

    return Response.json(questions, { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
};

const handleGetQuestion = async(request, params) => {
  try {
    addMetricsCount();
    const { id } = params;
    if (!id || isNaN(id)) return Response.json("No id provided", { status: 400 });
    await cachedQuestions.updateQuestionViews(id);
    const questions = await cachedQuestions.getQuestionById(id);
    if (questions.length == 0) return Response.json("No question found", { status: 400 });
    return Response.json(questions[0], { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
};

const handleAddQuestion = async(request) => {
  try {
    addMetricsCount();
    const { courseId, title, text, userUuid } = await request.json();
    if (!userUuid) return Response.json("Missing userUuid", { status: 400 });
    if (!text || !title || !courseId) return Response.json("Missing body", { status: 400 });
    if (await userBlockActions(userUuid)) return Response.json("Timing", { status: 429 });

    const question = await cachedQuestions.addQuestion(courseId, title, text);
    if (question[0]) {
      await setUserBlockActions(userUuid);
      newQuestionSend(question[0], courseId);
      for (let i = 0; i < 3; i++) {
        const text = await generateAnswer(title);
        const answer = await cachedAnswers.addAnswer(question[0].id, text);
        newAnswerSend(answer[0], String(question[0].id));
      }
      return Response.json({ status: 200 });
    }
    return Response.json("Error while adding to database", { status: 400 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

/*
* Answers functions;
*/

const handleGetAnswers = async(request) => {
  try {
    addMetricsCount();
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');
    const questionId = url.searchParams.get('questionId');
    if (!questionId || !page || !limit) 
      return Response.json("Missing parameter", { status: 400 });
    const answers = await cachedAnswers.getAllAnswers(
      questionId, 
      limit, 
      page*limit
    );

    return Response.json(answers, { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
};

const handleAddAnswer = async(request) => {
  try {
    addMetricsCount();
    const { text, questionId, userUuid } = await request.json();
    if (!userUuid) return Response.json("Missing userUuid", { status: 400 });
    if (!text || !questionId) return Response.json("Missing body", { status: 400 });
    if (await userBlockActions(userUuid)) return Response.json("Timing", { status: 429 });
    const answer = await cachedAnswers.addAnswer(questionId, text);
    if (answer[0]) {
      await setUserBlockActions(userUuid);
      newAnswerSend(answer[0], questionId);
      return Response.json({ status: 200 });
    }
    return Response.json("Error while adding to database", { status: 400 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

/*
* Votes functions;
*/

const handleGetVotesQuestions = async(request) => {
  try {
    addMetricsCount();
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');
    if (!questionId) {
      return new Response("Missing questionId", { status: 400 });
    }

    const votes = await cachedVotes.countQuestionVotes(questionId);
    return Response.json(votes[0], { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleGetVotesAnswers = async(request) => {
  try {
    addMetricsCount();
    const url = new URL(request.url);
    const answerId = url.searchParams.get('answerId');
    if (!answerId) {
      return new Response("Missing answerId", { status: 400 });
    }

    const votes = await cachedVotes.countAnswerVotes(answerId);
    return Response.json(votes[0], { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleAddVotesAnswers = async(request) => {
  try {
    addMetricsCount();
    const { userUuid, answerId, value } = await request.json();
    if (!userUuid || !answerId || !value) return Response.json("Missing parameters", { status: 400 });

    await cachedVotes.addAnswerVote(userUuid, answerId, value);
    return Response.json({ status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleAddVotesQiestions = async(request) => {
  try {
    addMetricsCount();
    const { userUuid, questionId, value } = await request.json();
    if (!userUuid || !questionId || !value) return Response.json("Missing parameters", { status: 400 });

    await cachedVotes.addQuestionVote(userUuid, questionId, value);
    return Response.json({ status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleGetVotesUsers = async(request) => {
  try {
    addMetricsCount();
    const url = new URL(request.url);
    const userUuid = url.searchParams.get('userUuid');
    const answerId = url.searchParams.get('answerId');
    const questionId = url.searchParams.get("questionId");
    if (!userUuid || (!answerId && !questionId)) {
      return new Response("Missing params", { status: 400 });
    }

    if (answerId) {
      const vote = await cachedVotes.getUserAnswerVote(userUuid, answerId);
      return Response.json(vote, { status: 200 });
    }
    const vote = await cachedVotes.getUserQuestionVote(userUuid, questionId);
    return Response.json(vote, { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}
const handleUpdateVotesTimeStamp = async(request) => {
  try {
    addMetricsCount();
    const url = new URL(request.url);
    const answerId = url.searchParams.get('answerId');
    const questionId = url.searchParams.get("questionId")
    if (!answerId && !questionId) {
      return new Response("Missing params", { status: 400 });
    }

    if (answerId) {
      await cachedAnswers.updateAnswerVoteDate(answerId);
      return Response.json({ status: 200 });
    }
    await cachedQuestions.updateQuestionVoteDate(questionId);
    return Response.json({ status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleDeleteVotesQuestions = async (request) => {
  try {
    console.log("Received request to delete vote for question.");

    const url = new URL(request.url);
    const voteId = url.searchParams.get('voteId');
    console.log("Extracted voteId:", voteId);

    if (!voteId || isNaN(voteId)) {
      console.error("Invalid voteId:", voteId);
      return new Response(JSON.stringify({ error: "No valid voteId provided" }), { status: 400 });
    }
    addMetricsCount();
    console.log("Metrics count updated.");

    console.log("Attempting to delete vote with voteId:", voteId);
    await cachedVotes.deleteQuestionVote(voteId);

    console.log("Vote successfully deleted.");
    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (error) {
    console.error("Error deleting vote:", error);

    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500 }
    );
  }
};

const handleGetMetrics = async(request) => {
  return new Response(
    `# HELP app_requests_total The total number of requests.\n# TYPE app_requests_total counter\napp_requests_total ${requests}\n`,
    { status: 200 }
  );
}

const urlMapping = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/courses" }),
    fn: handleGetCourses
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/courses/:id" }),
    fn: handleGetCourse
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/questions" }),
    fn: handleGetQuestions
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/questions/:id" }),
    fn: handleGetQuestion
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/answers" }),
    fn: handleGetAnswers
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/answers" }),
    fn: handleAddAnswer
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/questions" }),
    fn: handleAddQuestion
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/connect/answers" }),
    fn: handleConnectAnswerPage
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/connect/questions" }),
    fn: handleConnectQuestionPage
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/votes/questions" }),
    fn: handleGetVotesQuestions
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/votes/answers" }),
    fn: handleGetVotesAnswers
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/votes/users" }),
    fn: handleGetVotesUsers
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/votes/questions" }),
    fn: handleAddVotesQiestions
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/votes/answers" }),
    fn: handleAddVotesAnswers
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/votes/update" }),
    fn: handleUpdateVotesTimeStamp
  },
  {
    method: "DELETE",
    pattern: new URLPattern({ pathname: "/votes/delete" }),
    fn: handleDeleteVotesQuestions
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/metrics" }),
    fn: handleGetMetrics
  }
];

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  return await mapping.fn(request, mappingResult?.pathname.groups || {});
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);