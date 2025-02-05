import http from "k6/http";

export const options = {
  duration: "10s",
  vus: 10,
  summaryTrendStats: ["med", "p(99)"],
};

export default function () {
  const data = {
    text: "text",
    userUuid: "testing-user",
    questionId: "1"
  }
  http.post(
    "http://localhost:7800/api/answers",
    JSON.stringify(data)
  );
}