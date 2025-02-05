import { sql } from "../database/database.js";

const getAllAnswers = async(questionId, limit, offset) => {
  return await sql`SELECT * FROM answers 
    WHERE question_id = ${questionId} 
    ORDER BY voted_at DESC 
    LIMIT ${limit} OFFSET ${offset};`
}

const addAnswer = async(questionId, text) => {
  return await sql`INSERT INTO answers (text, question_id) 
    VALUES (${text}, ${questionId}) RETURNING *;`;
}

const updateAnswerVoteDate = async(answerId) => {
  return sql`UPDATE answers SET voted_at = NOW() 
    WHERE id = ${answerId};`
}

export {
  getAllAnswers,
  addAnswer,
  updateAnswerVoteDate
}