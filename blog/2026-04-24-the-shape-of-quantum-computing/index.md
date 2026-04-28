---
title: the shape of quantum computing
date: 2026-04-24
authors: cgauthier
tags: [spinachlang, quantum computing]
description: Reporting issues can be tricky
---
# The shape of quantum computing
## Why I'm doing this
Last year, I took a quantum computing course in the middle of certifications just for fun.
I don't claim to be an expert, far from that. I know some quantum gates, the mental models people use to make sense of quantum physics and how things interact with each other.
I don't really understand all the algorithms but I can understand a circuit when I see one. That's where I am.

Anyway. I like to understand things. That's what made me learn C at 11. I just wanted to know how to do something basic and send it to a real quantum computer and get results.

## the shape
I think every software developer should check quantum computing out. The basics are simple as long as you don't think too much about what all of this implies.
It forces a paradigm that's really different from standard programming. I would say in some ways, it's closer to what you do when you program an FPGA. You're not defining steps but a circuit.
You have gates like X or CCX or Y, or you can even create your own if you're a pro — not like me. My way to visualise it is that you create that circuit and then shoot spinning balls into it. The circuit is a bunch of tubes that have properties that will change the orientation of the spin of the ball.
It's the closest image my brain can take without losing time rethinking everything I know about the universe.

I said that quantum computers are somewhat closer to what we do in VHDL on an FPGA or CPLD in the sense that you design a circuit to pass elements through it as text and it creates that circuit.
The big difference is what goes into those circuits. For traditional logical circuits, it's a flow of electrons that are interestingly elementary particles. For quantum logical circuits, it's elementary particles — can be theoretically any — but it's the state of the element that is checked, not the flow.
That means that after using the state of an element with a gate in quantum computing, you've consumed the original state and can't get it back after. That's different from traditional circuits where both the input and the output are usable at the same time.
That's a huge limitation that makes most of what we do on traditional computers impossible to do on a quantum computer.
But now you're probably wondering, "but we could copy the state of a qubit onto another qubit and then use the gate right?", no.
Qubits can't be fully copied. I mean, you can copy a qubit into a bit but it counts as an observation, so a qubit in a superposition state (not true or false) will "choose" a traditional state and this is both what your qubit will have and your bit.
So you both destroy the state of the qubit and get a randomish state in your bit.
For those completely new to quantum computing, superposition is like an undefined state. You can describe it as a 3D orientation, somewhat, but it only exists in that state until it gets measured.
My mental image of it is it's some sort of state that can only exist when it's just floating and interacting with nothing. The state can drift and dream about those absurd states until something slaps its face out of nowhere and wakes it up. Then it's like "Oh crap! I have to get to a state that actually exists."

There are gates that take one input and others that take more. Every gate that takes more than one input is just a one-input gate plus what they call controls (C). For example, you have CX that is an X gate with a control.
A control decides if we actually execute the gate. You can see it as "apply X to q0 if q1 is true"... sort of.
There is an exception. When the control qubit is in superposition, the two qubits entangle themselves. It just means that now they are both in superposition but both will end up showing the same state when measured. That's what they call quantum teleportation.

It's maybe a good idea to mention that since we are building circuits, any loops are not possible.
## abstractions
I know, quantum computing is exciting by itself but what I found the most interesting is the fact that no abstractions exist yet for that kind of software development.
The paradigm is still basically machine code. The first language I used was qasm. It can be directly sent to IBM's quantum computers and it takes around 15 minutes to get your results. It's free BTW.
That's why I created spinachlang, to explore the possible abstractions we can use to make a more readable and reusable quantum computer language.
I think I found pretty good ones.

First I thought it would be nice to be able to name things. Like, this qubit is named tom, this bit is named tam.
In Spinachlang it looks like this: 
```spinachlang
tom : q 0
tim : q 1
tam : b 0
```
Then I thought it would be great to pass a qubit through many gates in one line, so I created pipelines.
```spinachlang
mypipeline : H | X | Z
tom -> mypipeline
```
For the controlled gates I thought that by default the qubit passing through the pipeline must pass by the input, not be the control, but to make it more useful I created flipped gates where it becomes the control.
```spinachlang
tom -> CX(tim)
tom -> FCX(tim)
```
Then later I realised that often, we undo some parts of an algorithm by doing its reverse. It's useful in some algos.
I decided to make it possible to reverse it without rewriting everything.

```spinachlang
tom -> mypipeline # goes like this: H | X | Z
tom -> mypipeline <- # goes like this: Z | X | Z
```
## be creative
I have many other ideas that I want to implement.
I just think it's an opportunity we have to imagine what would be a better language for that kind of computing.
At the moment, it doesn't matter cause people work with tiny algorithms. For me that's just a sandbox for creativity.
If you have an idea for an abstraction to add to Spinachlang you can always send me a message or implement it yourself. It's an open source project.

Just a mention, tket are doing a great job in making a good quantum backend to let us compile into many languages. Spinachlang is based on pytket.

## out of subject
The hot long days are slowly coming back. I feel like this summer will be great. I can't wait to go swim, hike or walk around.
We have so many exciting things coming up too. I'll be watching my favorite metal band, Electric Callboy, on the 14th. I'm so excited.

Just a heads up. I'm still looking for a job. I'm interested in embedded and web development. If both combine, it's the best. I love IoT projects.

Have a nice rest of your day!
