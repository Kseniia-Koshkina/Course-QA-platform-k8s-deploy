import { sql } from "../database/database.js";

const getAllQuestions = async(courseId, limit, offset) => {
  return await sql`SELECT * FROM questions 
    WHERE course_id = ${courseId} 
    ORDER BY voted_at DESC 
    LIMIT ${limit} OFFSET ${offset};`;
}

const getQuestionById = async(questionId) => {
  return await sql`SELECT * FROM questions
    WHERE id = ${questionId}`;
}

const addQuestion = async(courseId, title, text) => {
  return await sql`INSERT INTO questions (course_id, title, text) 
    VALUES (${courseId}, ${title}, ${text}) RETURNING *;`;
}

const updateQuestionVoteDate = async(questionId) => {
  return await sql`UPDATE questions SET voted_at = NOW() 
    WHERE id = ${questionId};`
}

const updateQuestionViews = async (questionId) => {
  return await sql`UPDATE questions
    SET views = views + 1
    WHERE id = ${questionId}
  `;
};

export {
  getAllQuestions,
  getQuestionById,
  addQuestion,
  updateQuestionVoteDate,
  updateQuestionViews
}