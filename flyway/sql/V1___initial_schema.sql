CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  title TEXT NOT NULL,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id),
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE answer_votes (
  id SERIAL PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  answer_id INTEGER REFERENCES answers(id),
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_uuid, answer_id)
);

CREATE TABLE question_votes (
  id SERIAL PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  question_id INTEGER REFERENCES questions(id),
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_uuid, question_id)
);

CREATE INDEX idx_questions_on_course ON questions (course_id);

CREATE INDEX idx_answers_on_question ON answers (question_id);

CREATE INDEX idx_questions_recency ON questions (voted_at DESC);

CREATE INDEX idx_answers_recency ON answers (voted_at DESC);

CREATE INDEX idx_user_vote_to_question ON question_votes (user_uuid, question_id);

CREATE INDEX idx_vote_to_question ON question_votes (question_id);

CREATE INDEX idx_user_vote_to_answer ON answer_votes (user_uuid, answer_id);

CREATE INDEX idx_vote_to_answer ON answer_votes (answer_id);