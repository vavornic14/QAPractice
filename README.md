# Autumn 2026 QA Hiring Homework

This is a **GitHub template repository** containing a sample React application used to assess the candidate's skills in the QA task. The repo is front-end only.

Create your own copy with the **"Use this template" → Create a new repository** button (do **not** fork). This gives you an independent repository, with a clean history and no link back to this one, that you can set to **private** so other candidates can't see your work. Each candidate works only in their own copy, fully isolated from the original and from everyone else.

## The Sample App

The app is a simple Task Manager application that displays a list of Tasks.
A task has 5 ( user-facing ) properties:

```
- Title - string
- Description - string
- Importance - High, Medium, Low
- Label - Work, Social, Home, Hobby
- Completeness - boolean
```

The app has the following features:

1. User should be able to **add** a task
2. User should be able to **delete** a task
3. User should be able to **edit** a task
4. User should be able to **mark** a task as **complete / incomplete**
5. User should be able to **filter** tasks **by label**
6. User should be able to **sort** tasks **by importance**

Product requirements for adding tasks are:

1. Title and Importance are required
2. Description and Label are optional
3. Completeness is set to false by default
4. Importance is set to Medium by default
5. Label is set to Work by default
6. Title should start with capital letter

Other requirements are up to the candidate's interpretation - since a lot of the times on the job, requirements are not clear and the QA has to make a decision based on the context. A thing to keep in mind is that the app should be user-friendly and intuitive.

## AI-First Ways of Working

**This role is AI-first.** In your day-to-day you will spend most of your time working *with* AI tools rather than hand-writing every line, so this homework is designed to see how effectively you drive them. We expect you to use AI coding agents throughout — for exploring the app, drafting the bug report, and especially for generating and maintaining the automated tests.

For the automated tests we recommend using **[Playwright Test Agents](https://playwright.dev/docs/test-agents)** — AI agents that plan, generate, and self-heal Playwright tests — but you are free to use any other AI assistant you prefer.

We care far more about **how you steer, review, and validate the AI's output** than about whether you can type Playwright syntax from memory. Blindly committing AI output that doesn't run — or that tests the wrong thing — is a red flag. Be ready to explain, in your PR description or the interview, *why* your tests look the way they do and how you verified them.

## Homework

The position is highly focused on AI and automation, but sometimes manual testing is inevitable - especially when trying to move things along and validate small fixes for deploys - that's why we expect candidates to be proficient in both. The homework is divided into two parts:

1. Exploratory Testing and Bug Reporting
2. Automated Testing ( AI-assisted )

### Exploratory Testing and Bug Reporting

- The candidate is expected to test the application and report any bugs found.
- We encourage to look for both functional and visual (UX) bugs.
- The candidate should provide a report of the bugs found.
- You may use AI tools to help explore the app and structure the report, but the findings and judgment must be your own.

You will be evaluated on the quality of the report and the bugs found.

### Automated Testing ( AI-assisted )

Use **[Playwright](https://playwright.dev)** as the testing framework — it is required so you can drive the AI test agents described below.

How you design and organize your tests and scenarios is up to you, but at a minimum it must include at least:

- 5 user stories
- 3 regression tests for functional bugs found during manual testing ( they should fail when run, because the bugs are not fixed yet )
- A test that generates a test of all possible combinations of the task properties ( importance, label, completeness ) and takes a screenshot of the app after each combination is added.

The suite must run in CI as well, split into two separate runs — one for e2e and one for visual tests.

Use the **[Playwright Test Agents](https://playwright.dev/docs/test-agents)** to write and maintain these tests, or another AI tool of your choice. Whatever you use, stay the reviewer — don't let an agent "heal" a test into passing when the app is actually buggy ( those are your 3 regression tests, which are *supposed* to fail ).

## Steps to follow

1. Click **"Use this template" → Create a new repository** and make it **private** ( do not fork ) - https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template . This new repository is your own isolated copy to work in.
2. Invite the reviewer to your repository valaheugen(valaheugen237@gmail.com)
3. Clone your repository
4. Install the dependencies `npm install`
5. Run the app using `npm run dev`, http://localhost:5173/
6. Start testing the app
7. Write the bug report based on findings and commit it in the root folder
8. Set up Playwright and write the automated tests using the Playwright Test Agents ( or another AI tool of your choice )
9. Add two CI workflows — one for the e2e tests and one for the visual tests ( Argos tool )
10. Commit the tests, plans, agent definitions and workflows to the project
11. Push the changes to your repository on a new branch
12. Open a PR to the main branch of your repository — in the description, briefly explain how you used the AI agents and how you validated their output
13. Add the reviewer as a reviewer to the PR

If you have any questions, feel free to open an issue in your own private repository ( so other candidates don't see the questions ) and I'll do my best to answer them ASAP.
