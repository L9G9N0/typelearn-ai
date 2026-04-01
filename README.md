This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
Dev Log: How I Built TypeLearn AI (and survived Next.js 16)

Here is a full breakdown of the whole project, from the initial idea to the final debugging sessions.

### The Original Idea vs. The Pivot
At first, the plan was just to build a standard coding platform, basically a LeetCode clone where users type code and a backend compiles it. But honestly, just testing code doesn't actually teach anyone how to code. 

So, we made a massive pivot. Instead of just a code executor, we turned it into an Active Learning AI Mentor. I used my structured college notes as a blueprint to create a 5-step learning process: 
1. Input/Output 
2. Intuition 
3. Data Structures
4. Pseudocode/Real Code 
5. Implementation and Q&A. 

If a user gets stuck, they can ask for the optimal approach, but the app literally forces them to type out the core logic to build muscle memory. No more passive reading.

### The Tech Stack
* Frontend: Next.js (App Router) with Tailwind CSS.
* AI Engine: Groq API using the Llama-3.3-70b-versatile model. It is insanely fast, which is exactly what you need for a real-time tutor.
* PDF Extraction: Set up an API route using pdf-extraction so users can just upload their assignment PDFs or slide decks, and the app reads it instantly.
* Architecture: Kept the backend entirely stateless. The React frontend holds the conversation history array and passes it back and forth to the API. Saves a ton of database headaches.

### The Unique Features We Added
To make the app actually stand out from every other generic AI wrapper out there, we built some custom features:

* Rubber Duck Mode (Voice-to-Text): Developers talk to themselves to solve problems. Instead of paying for a fancy audio API, we used the browser's free, native Web Speech API. Now you can just click a mic button and speak your intuition, and it types it out for you.
* VS Code-Style Highlighting: When the AI was outputting C++ and Python code, plain text looked awful. We hooked up react-markdown and react-syntax-highlighter (using the vscDarkPlus theme) so the code blocks actually look like a real IDE.
* Hardcore Mode: Added a toggle for the classic typing mode. When you turn it on, the text you type turns invisible. You have to completely trust your touch-typing muscle memory until the very end when it grades you.
* Gamification Dashboard: Added a GitHub-style green heatmap to track daily activity, average WPM, and accuracy. 

---

### The Great Bug Hunt (What broke and how we fixed it)
Building this was a grind, mostly because we are using the bleeding-edge Next.js 16 with Turbopack, which is super strict. Here is the log of every major error we hit and solved:

1. The Laptop Freezing Issue
* What happened: I ran npm run dev and my whole laptop practically froze. Turbopack was throwing a weird warning about the workspace root.
* The Fix: Turns out, there was a stray package-lock.json sitting way up in my Mac's root folder. Next.js got confused and literally tried to compile my entire hard drive as a React project. I ran a command in the terminal to delete the stray file, and my CPU finally relaxed.

2. The 404 Routing Mess
* What happened: We kept getting 404 errors for the tutor and dashboard pages.
* The Fix: Classic Next.js file-routing mistakes. First, I accidentally put the tutor page inside the api folder, which caused a route conflict. Then, we nested the dashboard inside a user folder but forgot to update the router links. We moved the folders back to the root app directory and fixed the button links to cleanly point to the dashboard.

3. The React Rules of Hooks Crash
* What happened: The app threw an error saying it rendered more hooks than during the previous render.
* The Fix: I put a useEffect (for saving user stats) inside an if statement. React absolutely hates conditional hooks because it messes up the render cycle order. We moved the useEffect to the very top of the file and just put the if statement inside the hook instead.

4. The Clerk Authentication Final Boss
* What happened: Since localStorage only saves to one browser, we needed real user accounts so everyone gets their own dashboard. We installed Clerk. But Next.js 16 changed middleware.ts to proxy.ts, which completely broke Clerk's security checks. Plus, Turbopack couldn't compile Clerk's wrapper components.
* The Fix: We completely deleted proxy.ts, went back to a properly formatted v5 middleware.ts, and swapped the UI wrappers for the useAuth React hook. The app finally compiled, the routes locked down securely, and the login modal popped up perfectly.

### What's Next?
The code is clean, the bugs are squashed, and the auth is wired up. The next and final step is just running npm run build to make sure there are no lingering TypeScript errors, pushing it to GitHub, and deploying it live on Vercel.
