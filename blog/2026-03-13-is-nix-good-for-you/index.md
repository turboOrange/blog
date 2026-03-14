---
title: Is Nix good for you?
date: 2026-03-13
authors: cgauthier
tags: [nix]
description: why I started using nix and how is it going so far
---

# Why I started using Nix
I broke my pop!_os setup recently.
I'm usually careful and got really good at fixing broken things with Linux so while it happen a lot when I started with Linux, I didn't have any problem for decades.
It was a major release that was going on and someone around me started to be aggressive.
I didn't want it to heat up in my back pack, didn't want to leave it there. So I had to close it mid update.
When I opened it, plasma wasn't starting, half of the application was gone and I didn't find any way to recover.
I believe that a determined Linux user always finds a way but this time I was done after 2 hours.
I didn't really have to setup everything again. I use a lot of things and it takes a while for me to feel at home on a new linux install.
Then I randomly thought about how annoying it is to start a new job and get a new computer to configure how you want.
The absurd thing about all of it is, what I want is just the same thing. I don't care what OS I'm on, I just want that setup I always use to be replicable.
It sounds dumb but I thought to myself that I'm not alone. Other people have the same frustrations I have.

Now that I was confronted to that problem again, I looked online and found out about Nix. I mean, I already sort of know about it in surface.
I wasn't convinced but I told myself it's the best time to try. I downloaded nixos and installed it.

# What is nix?
So nix is a package manager. It's like your apt or pacman if you're using Arch btw. But you don't installed something by doing ``nix install recall-for-linux``.
Instead you modify file somewhere under /etc/. You add something like this:

```nix
{
  environment.systemPackages = with pkgs; [
    recall-for-linux
  ];
}
```

then you do ``nixos-rebuild switch`` or something like that depending on your setup and you pray for the build to succeed. There is no need for reboot, you're already on the new build.
As a developer, I can see how that makes sense. When you really think about it, dependency declaration files really helped software development.
I don't think I can really go back to how I did C programing in 2003 (Yeah, I was a kid playing with code::block at the time.)
I was just installing the libraries and hope they are at a compatible version.
So why not just using the same principle for the whole system right?

Now that you know what nix is, let's talk about nixos.

# What is nixos?
NixOS is the Linux distribution that by default use nix as it's only package manager.
Yop. That's it.

# what do I think so far about it?
I've been playing with it for some time but didn't use all the features yet.

## pros
So, whatever you think about Nix, you have to admit it's powerful like crazy. 
- Your setup is fully portable from a computer to an other including VMs.
- You can put it in a git repo, update it when you modify something so if something goes bad you have a sort of backup as text.
- You can create a VM with your exact setup. This way working on a lesser trusted project like sometime when freelancing is way easier.
- If you're not like me, you can also separate your setup with modules. I should really start to do it.
- A Linux based config is mostly compatible with nix on windows and macOS so with a bit of will and maybe luke you could literally be prepared day one to work at a new job.
- Since it's completely text based it's possible to be helped by any LLM, sort of. In my experience, something like gepetefourpointo would give unusable result. Sonnet 4.6 would be fine tho. For better results maybe use the nix MCP so it doesn't have to duck duck it all the time.
- It can do more then just package management. It can handle preferences and plugins for all the applications I tested that with. (nvim, zsh, tmux, intelij, firefox, LibreWolf)
- That's a really important one for me: you can install applications at the directory level. Imagine this: Your're at /home/tarsan/ and do ``python``, an error happen. You go to /home/tarsan/project1/ and do the same thing then python2.6 starts. You do the same thing again in /home/tarsan/project2/ and now it's python3.10! For python, it's not that useful cause it already has venv and toml. But for an elixir or C++ project, OMG that's liberating.

## cons
While I decided to use Nixos for myself, I do see a lot of problems with it. It's just like if everything is a trade off.
Most people use a browser for most tasks and are scared of terminals and text files.
I think Nix is really just for developers and maybe IT people. I don't see much other people even wanting to use it.
I mean, we are really the only people that really need an exact version of a software then an other version of the same software for an other project.
So here we go.
- It's kinda hard to setup. I mean, you have the official documentation, a small community and LLMs seems not trained enough on it so it take some time to get a good it right.
- If you use only Nix because you want to have that perfect text based backup of your setup, some install scripts will simply not work.
- Official websites for applications will show you how to apt or pacman or brew but probably not how to nix.
- That might be a skill issue but every time I want to install something it take some time to just compile the new setup. There might be a way to partial build it but I haven't found it yet.

# Conclusion
If you're not a developer don't even look at it. It's complication for nothing. If you are tho and you're like me, always exploring new stacks, it might be worth it.
You don't even need to make it the only way to install. 

BTW, my nix setup on my system76 laptop is way easier on the battery then the pop!_os one somehow. That's a bonus I got.

So, should you, should you not? My situation was a bit special. I had to install an OS anyway. I think if you're a developer and especially if you're working with a stack that's notoriously bad with dependencies management like C, C++, it's definitively something to look at.
