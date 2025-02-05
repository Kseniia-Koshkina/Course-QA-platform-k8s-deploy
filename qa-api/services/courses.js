import { sql } from "../database/database.js";

const getAllCourses = async() => {
  return await sql`SELECT * FROM courses`;
}

const getCourseById = async(courseId) => {
  return await sql`SELECT * FROM courses 
    WHERE id = ${courseId}`;
}

export {
  getAllCourses,
  getCourseById
}