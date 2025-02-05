# Database Schema Description

This database schema is designed for a basic Q&A functionality where users can create, view, and upvote questions and answers. The schema includes several related tables to store the necessary data.  

### Tables

`courses` table is used to store basic information such as title and description related to courses.  

`questions` table stores records of questions related to courses like title, text, creation and vote time. `course_id` foreign key - links the question to a specific course. 

`answers` stores answers (text, creation and vote time) to questions. `question_id` foreign key - links the answer to a specific question.

`answer_votes` and `question_votes` track user votes on answes/questions to facilitate ranking and engagement tracking. `answer_id`/`question_id` foreign key - links the user vote to specific answer/question. Additionally, a UNIQUE constraint ensures that each combination of `user_uuid` and `question_id` (or `answer_id`) is unique, enforcing the rule that a user can vote only once for a specific question or answer

### Denormalization Decisions

This database schema is primarily normalized, separating distinct concerns into different tables for maintainability and integrity. However, some denormalization decisions were made to improve performance:  

`voted_at` fields in questions and answers:  

These fields are updated whenever a vote is added. By duplicating this information, the schema simplifies sorting logic for displaying the most recently upvoted questions or answers. This avoids complex joins between `questions`/`answers` and `question_votes`/`answer_votes` tables, therefore, the decision improves query performance.

### Indexes

Indexes are created to optimize query performance:

#### - For questions table:

`idx_questions_on_course`: Speeds up queries filtering by `course_id`.  
`idx_questions_recency`: Optimizes ordering by the `voted_at` field.  

#### - For answers table:

`idx_answers_on_question`: Speeds up queries filtering by `question_id`.  
`idx_answers_recency`: Optimizes ordering by the `voted_at` field.  

#### - For question_votes table:

`idx_user_vote_to_question`: Ensures efficient lookups of a user's votes on questions.  
`idx_vote_to_question`: Speeds up queries filtering by `question_id`.   

#### - For answer_votes table:

`idx_user_vote_to_answer`: Ensures efficient lookups of a user's votes on answers.  
`idx_vote_to_answer`: Speeds up queries filtering by `answer_id`.  

### Caching

Caching is added to the project to improve performance and efficiency. For this purpose, Redis is used as the caching layer, following the proxy-based solution provided in the course materials. I organized data into separate namespaces and hash tables for `answers`, `questions`, `votes`, and `courses`. This separation ensures that flushing the cache for one type of data (e.g. questions) does not flush unrelated data (e.g. answers).  

To meet the project requirement of limiting users to submitting only one question or answer per minute, I implemented a blocking mechanism using Redis. When a user submits a new question or answer, a record is created in Redis with the user UUID as the key and a TTL of 60 seconds. This prevents the user from submitting another question or answer until the TTL expires (while record exists).