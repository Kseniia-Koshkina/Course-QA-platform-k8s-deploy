import http from "k6/http";
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  duration: "10s",
  vus: 10,
  summaryTrendStats: ["med", "p(99)"],
};

export default function () {
  const userUuid = uuidv4();
  const data = {
    text: "text",
    userUuid: userUuid,
    questionId: "1"
  };
  http.post("http://localhost:7800/api/answers", JSON.stringify(data));
}
