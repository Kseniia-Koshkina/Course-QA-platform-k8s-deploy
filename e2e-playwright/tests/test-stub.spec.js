const { test, expect, chromium } = require("@playwright/test");
const crypto = require('crypto');

test("Display new question without page refresh", async () => {
  const browser = await chromium.launch();
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const user1 = await context1.newPage();
  const user2 = await context2.newPage();

  user1.on('console', (msg) => {
    console.log('User1 browser log:', msg.text());
  });

  await user1.goto("/courses/1");
  await user2.goto("/courses/1");

  const newQuestion = {
    title: "New Question Title",
    text: "New question added during the test"
  };

  await user1.locator('[data-testid="CourseInfo"]').waitFor();

  const questionList1 = user1.locator('.mt-10.mb-10.w-full.border-t-2');
  const initialQuestionsCount = await questionList1.locator('a').count();

  const askQuestionButton = await user1.getByRole('button', { name: 'Ask Question' });
  await askQuestionButton.click();

  const titleField = user1.locator('input[placeholder="e.g. How can I measure the performance of my algorithm?"]');
  const descriptionField = user1.locator('textarea[placeholder="Describe your problem"]');
  await titleField.fill(newQuestion.title);
  await descriptionField.fill(newQuestion.text);

  const submitButton = await user1.getByRole('button', { name: 'Submit' });
  await submitButton.click();

  const backButton = await user1.getByRole('button', { name: 'Back' });
  await backButton.click();

  const firstQuestionCard1 = questionList1.nth(0);

  const questionTitleText1 = await firstQuestionCard1.locator('a').nth(0).textContent();
  const questionText1 = await firstQuestionCard1.locator('p.text-ellipsis').nth(0).textContent();

  await expect(questionTitleText1).toBe(newQuestion.title);
  await expect(questionText1).toBe(newQuestion.text);

  const questionList2 = user2.locator('.mt-10.mb-10.w-full.border-t-2');

  const firstQuestionCard2 = questionList2.first();
  const questionTitleText2 = await firstQuestionCard2.locator('a').nth(0).textContent();
  const questionText2 = await firstQuestionCard2.locator('p.text-ellipsis').nth(0).textContent();

  console.log(`User2 Expected title: ${newQuestion.title}, Got title: ${questionTitleText2}`);
  console.log(`User2 Expected text: ${newQuestion.text}, Got text: ${questionText2}`);

  await expect(questionTitleText2).toBe(newQuestion.title);
  await expect(questionText2).toBe(newQuestion.text);

  const finalQuestionsCount = await questionList2.locator('a').count();
  await expect(finalQuestionsCount).toBeGreaterThan(initialQuestionsCount);

  await context1.close();
  await context2.close();
  await browser.close();
});

test("Check that answer appeared on the page after have been added", async () => {
  const browser = await chromium.launch();
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const user1 = await context1.newPage();
  const user2 = await context2.newPage();

  user1.on('console', (msg) => {
    console.log('Browser log:', msg.text());
  });

  await user1.goto("/courses/1/questions/1");
  await user2.goto("/courses/1/questions/1");

  const newAnswerText = `New answer: ${crypto.randomUUID()}`;
  let previousAnswerText = "";

  const answerList1Content = await user1.locator('[data-testid="answer-list"]').textContent();
  const answerList2Content = await user2.locator('[data-testid="answer-list"]').textContent();
  await expect(answerList1Content).toBe(answerList2Content);

  if (answerList1Content.length !== 0)
    previousAnswerText = await user1.locator('.w-full.pt-4.pb-4.flex.border-b-2').nth(0).textContent();

  const textField = user1.locator('textarea[placeholder="min 10 ch."]');
  await textField.fill(newAnswerText);

  const submitButton = await user1.getByRole('button', { name: 'Submit'});
  await submitButton.click();

  await user1.waitForFunction((newAnswerText) => {
    const answer = document.querySelector('[data-testid="answer-list"]');
    return answer.textContent.includes(newAnswerText);
  }, newAnswerText);

  const firstAnswerLocator1 = user1.locator('.w-full.pt-4.pb-4.flex.border-b-2').nth(0);
  const firstAnswerLocator2 = user2.locator('.w-full.pt-4.pb-4.flex.border-b-2').nth(0);

  const firstAnswerText1 = await firstAnswerLocator1.textContent();
  const firstAnswerText2 = await firstAnswerLocator2.textContent();
  console.log("user1: ", firstAnswerText1);
  console.log("user2: ", firstAnswerText2);
  console.log("previous text: ", previousAnswerText);

  await expect(firstAnswerText1).toBe(firstAnswerText2)
  await expect(previousAnswerText).not.toContain(firstAnswerText1);

  await context1.close();
  await context2.close();
  await browser.close();
});

test('Test: update votes count, timestamp, display order when a user votes', async ({ page }) => {
  await page.goto("/courses/1");
  await page.waitForTimeout(2000);

  const questionCards = page.locator('.p-4.flex.border-b-2');
  const firstQuestionText = await questionCards.nth(0).locator('.line-clamp-1').nth(0).textContent();
  const secondQuestionText = await questionCards.nth(1).locator('.line-clamp-1').nth(0).textContent();

  console.log("First: ", firstQuestionText);
  console.log("Second: ", secondQuestionText);

  const secondQuestionVotesLocator = questionCards.nth(1).locator('.flex.flex-col.text-center.mt-2');
  const secondQuestionInitialVotes = Number(await secondQuestionVotesLocator.locator('p').textContent());

  const voteUpButton = secondQuestionVotesLocator.locator('button:has(svg.iconArrowUp)');
  await voteUpButton.click();

  await page.reload();
  await page.waitForTimeout(2000);

  const updatedFirstQuestion = await questionCards.nth(0);
  const secondQuestionUpdatedVotes = await updatedFirstQuestion.locator('.flex.flex-col.text-center.mt-2 >> p').textContent();
  const updatedVoteUpButton = updatedFirstQuestion.locator('button:has(svg.iconArrowUp)');
  
  await expect(await updatedFirstQuestion.textContent()).toContain(secondQuestionText);
  await expect(secondQuestionUpdatedVotes).toBe((secondQuestionInitialVotes+1).toString());
  await expect(updatedVoteUpButton).toBeDisabled();
});

test("Update question count when scrolling to the bottom", async ({ page }) => {
  await page.goto("/courses/1");

  const questionList = page.locator('.mt-10.mb-10.w-full.border-t-2');
  const initialQuestionsNum = await questionList.locator('a').count();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await questionList.locator('a').nth(0).waitFor();

  const newQuestionsNum = await questionList.locator('a').count();
  expect(newQuestionsNum).toBeGreaterThan(initialQuestionsNum);
});

test('Test blocking mechanism: user can submit only one question or answer per minute', async ({ page }) => {
  let alertTriggered = false;

  page.on('console', (msg) => {
    console.log('Browser log:', msg.text());
  });

  page.on('dialog', async (dialog) => {
    if (dialog.type() === 'alert') {
      alertTriggered = true;
      await dialog.accept();
    }
  });

  await page.goto("/courses/1/questions/1")

  const firstAnswerText = `First answer: ${crypto.randomUUID()}`;
  const secondAnswerText = `Second answer: ${crypto.randomUUID()}`;

  const textField = page.locator('textarea[placeholder="min 10 ch."]');
  await textField.fill(firstAnswerText);

  const submitButton = await page.getByRole('button', { name: 'Submit'});
  await submitButton.click();

  await page.waitForFunction((firstAnswerText) => {
    const answer = document.querySelector('[data-testid="answer-list"]');
    return answer.textContent.includes(firstAnswerText);
  }, firstAnswerText);

  const firstAnswerLocator = page.locator('.w-full.pt-4.pb-4.flex.border-b-2').nth(0);
  const newAnswerText = await firstAnswerLocator.textContent();

  await textField.fill(secondAnswerText);
  await submitButton.click();

  await page.waitForTimeout(2000);

  const newAnswerTextAfterSecondSubmit = await page.locator('.w-full.pt-4.pb-4.flex.border-b-2').nth(0).textContent();
  await expect(newAnswerText).toContain(firstAnswerText);
  await expect(alertTriggered).toBe(true);
  await expect(newAnswerTextAfterSecondSubmit).not.toContain(secondAnswerText)
});