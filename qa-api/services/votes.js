import { sql } from "../database/database.js";

const getUserAnswerVote = async(userUuid, answerId) => {
  return sql`SELECT * FROM answer_votes 
    WHERE answer_id = ${answerId} AND user_uuid=${userUuid}`;
}

const getUserQuestionVote = async(userUuid, questionId) => {
  return sql`SELECT * FROM question_votes 
    WHERE question_id = ${questionId} AND user_uuid=${userUuid}`;
}

const addAnswerVote = async(userUuid, answerId, value) => {
  return sql`INSERT INTO answer_votes (user_uuid, answer_id, value) 
    VALUES (${userUuid}, ${answerId}, ${value});`;
}

const addQuestionVote = async(userUuid, questionId, value) => {
  return sql`INSERT INTO question_votes (user_uuid, question_id, value) 
    VALUES (${userUuid}, ${questionId}, ${value})`;
}

const deleteQuestionVote = async (voteId) => {
  return sql`DELETE FROM question_votes 
    WHERE id = ${voteId}`;
};

const countQuestionVotes = async(questionId) => {
  return sql`SELECT COALESCE(SUM(value), 0) AS total FROM question_votes 
    WHERE question_id = ${questionId};`;
}

const countAnswerVotes = async(answerId) => {
  return sql`SELECT COALESCE(SUM(value), 0) AS total FROM answer_votes 
    WHERE answer_id = ${answerId};`;
}

export {
  getUserAnswerVote,
  getUserQuestionVote,
  addAnswerVote,
  addQuestionVote,
  deleteQuestionVote,
  countAnswerVotes,
  countQuestionVotes
}