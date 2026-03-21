---
title: about reporting issues
date: 2026-03-21
authors: cgauthier
tags: [qa, ux, cyber security]
description: Reporting issues can be tricky
---
# About reporting issues
## A word before I start

Just to be clear. My own code is not perfect. It's far from it. There is a lot of architecture decisions I had I wouldn't do it again.
I also never found any code base that didn't have problems. Everyone, even seniors, are always learning during conception and development in this forever changing field.
Every UI has UX problems. Every projects has security issues. Every software has bugs.

The only thing we do is our best.

I happen to have experience in QA, learned UX evaluation from one of the best professors and have a good understanding of cyber security due to some courses and CTFs.
I happen to be hyper curious, so when I'm not sure, I explore. I'm the first one to find a way to under the map in a video game.

With all of this, even if ultimately I just want to build things, I just happen to find a lot of issues with every software I use.

## My issue with reporting

ultimately, i believe that even the smallest issues should be reported just so we can track all the imperfections of a software.

That utopy is not that easy to reach in real life.

We all know we should detach ourselves from the code we are writing and not get emotions about it.
People can still feel personally attacked when we directly criticise a decision they did.

### UX issues are the worst

That's especially true with UX issues. Even if you come with arguments backed by data, people see UX issues reporting as opinions often.
I got people visibly upset saying that that UI is only used by people that had a course on how to use it so they will know how to use it basically.
That shows it's optional but not necessarily optimal. The need of a course to use a software is a red flag. It doesn't mean the UI is ultimately bad.
It's just an opportunity to ask why it's that way. Is it because what we are doing is complicated or is it the UI that's not optimal? It might be both.

## An example with a horrible functional bug

I even got problems reporting functional issues. That can happen when the issue is so big it can break the release plans of a project. Sometimes managers just wish hard what you're saying is not true because of pressure from above.
I had to create an automated test that can run for days. That was an actual task I had to do. BTW, that kind of task sucks to do. You start the test, you wait hours for it to break, you fix it and rerun the thing. They didn't even want to give me parallel tasks to do for some reasons but I digress.
I ended up actually finding a bug with that test. There was a situation that happened after 5 to 7h after the test start where some unexpected things was happening. Really critical unexpected things.
Considering that the system was made to run for long chunks of times, that was a big deal.
My problem was that I had no way to replicate it other than with time. So I made a bug report, made it high priority and was ready to move on with another task.
When the team saw what I did, they asked me to fix the bug in my test. So for almost a month, I didn't have any new tasks. Every day they were asking me to fix the test and I was replying that the test was fine but there is a problem with the tested system.
Every scrums I was trying to rephrase that my test was done, that I need new tasks and that the system has a big problem.
They never really acknowledged the problem. I was changed to another team and they kept acting like nothing wrong happened.
Months ago, I learned that the project was blocked because of an "unexpected bug" that happen in the field. I wish I could say I saved that project but I couldn't this time.

Sorry for the long story. I just think it's a good case for how issue reporting can be tricky.
I do not know how I would've been able to change the situation. I wasn't the only actor but there is probably a world where I could've said the right words at the right time and change the outcome.
What we could keep from that story is that reporting is not just about writing a good bug report. It's also a social activity with imperfect humans. Never assume that they will have the best response by pure logic.

## Egg walks

It happened more than once that an issue is shoved away or create tension for me.
When your job is QA related and it's part of your job to find problems and report them, the tensions can grow if those are not handled properly.
In a perfect world, we would just need to explain the issue and move one. In real life, some issues need to be introduced carefully to the team.
Most of issues are actually fine, so you don't always have to walk on eggs. But how can you identify when it's an egg walk?

Ask yourself:

- Is this issue a threat to the plans of the company?
- Is this issue the result of someone's decision that give them pride? (that include most of UX issues unfortunately)

Then ask yourself:

- Is this issue important enough to risk an egg walk?

If yes, then examine the situation:

- What reputation do I have?
- What's my title at the moment?
- How much authority do I have?
- How did the team take similar issues in the past?
- Who might have a bad reaction to the news?
- Who could I use to back me up?

Unfortunately, since there is an infinite possible situation, there is no perfect solution.
Just be aware and don't ask for people to be perfect. Yes, in those situation, the reporter is not the one causing the problem.
But life is not a blaming game. We have to do the best with what we have.
Staying aware is the best thing we can do.