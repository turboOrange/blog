---
title: embedded development how does it work?
date: 2026-05-06
authors: cgauthier
tags: [embedded, cpp, rust, arduino, pic, microcontroller, raspberry pi, esp32]
description: Reporting issues can be tricky
---
# Embedded development how does it work?
## Why I'm doing this
I did both college in electronics computers and networks and a bachelor of computer science.
I do not have the experience of all universities but at UQAM at least, embedded development wasn't really touched at all.
There wasn't even a specialisation course.
I find it strange cause for the rest of the fields, they give at least a good overview.
I just happen to know about that part of software development because of my DEC so I'm here to open those doors for you.
My goal here is to give enough information so you know the principal mechanisms and be able to figure out the rest by yourself.
If you happen to work for UQAM, it would be, maybe, a good idea to make a course about it. Maybe an optional one. I know it's a bit more expensive cause you need extra hardware.

## What is embedded development?
Embedded development is about programming things I would say.
It's about software developed for a specific hardware and the hardware developed for a specific software.
It's not a system that will compete with other software on a computer or server but a software that lives along or alongside other part of the same system, in a specialised hardware.

## The Tree Types Of Embedded Development
There are what I would call three levels of embedded development, bare metal, RTOS and in an OS.

### Bare Metal
The bare metal is the simpler one. Everything generally lives in a super loop after the first setup except for interrupts, we will see them later.
```cpp
int main() {
    setup();
    while (true) {
        loop();
    }
}
```
If you ever use an arduino, they simplify this for some reason. You start your code by defining the two functions.
```cpp
void setup() {
    // setup code here
}

void loop() {
    // loop code here
}
```

It's simple but really limiting. If something blocks, everything blocks.
In an other hand, it's perfect if you need a really cheap controller cause that takes no extra processing power.

### RTOS
RTOS stands for real time operating system. It's technically an OS but it's compiled with the firmware.
I had a course about operating systems and a RTOS doesn't even qualify as an OS according to it's definition.
It doesn't have a file system, it doesn't have a user interface. It's just a scheduler.
It allow to run multiple tasks concurrently, simulating parallelism in some sort.
If you're not aware, operation systems like the one you're using right now has a scheduler. 
Schedulers are generally complex, relatively, to make sure everything has the right amount of time.
Real time schedulers are simple. they let a process run for an amount of ticks then it switch to an other one and it loops this way.
That kind of scheduler is used for two reasons, they are predictable and easy on the CPU.
Just to mention it, I saw that under Linux, it's possible to change your scheduler and there is a real time option.
Don't do this on your main machine BTW, the one you most likely have is the best for you.
It's just, you know, something to play around on a old computer or raspberry pi to see what it does.
I'm saying that cause there is a real time option.
I don't know how good it is.

setup example:
```cpp
#include <FreeRTOS.h>

void task1(void* pvParameters) {
    while (true) {
        // task 1 code here
    }
}

void task2(void* pvParameters) {
    while (true) {
        // task 2 code here
    }
}

void setup() {
    xTaskCreate(task1, "Task 1", 1000, NULL, 1, NULL);
    xTaskCreate(task2, "Task 2", 1000, NULL, 1, NULL);
    vTaskStartScheduler();
}

```

### In an OS
So the last one is when we put literally an OS, often Linux, not always, in the controller. Not all of them are OS enabled.
It needs to be powerful enough. This option enables, better logs, better debugging, a file manager, easier communication over network.
You can even run other software with it like a database, why not.
It also enables more languages. In the other ones, you are limited to ASM, C, C++ and maybe Rust and Zig if you have the nerves to be a pioneer.
Now you can run anything. Generally Python is a really popular one but Go, Java, NodeJS, Ruby, Elixir, whatever you want is now possible.
For this kind of development, a good way to build, if using linux is to use Yocto.
Things are a bit less predictable here. It's a price to pay.

## microcontrollers

Microcontrollers are a special kind of hardware. It's a CPU with some things around it useful for embedded tasks.
It can go with multiple internal modules and protections.
Here are common modules you can see:
- GPIO: general purpose input output
- ADC: analog to digital converter
- DAC: digital to analog converter
- PWM: pulse width modulation

Understanding a bit of electronics can really help understand how the software interact with it.

They come in all sizes and have different feature set so it can be really hard to choose one for a project.
It's better to start with one a bit overkill for the project and eventually move to a cheaper one after testing that it works.
To try things it's often easier with a development board. There is a ton of them.

Now you wonder probably how we get to know a microcontroller and it's functions if it's all different every time.
RTFM. That's literally it. There is a PDF out there for your microcontroller. Download it, put it in the project folder and ctrl+f in it.
I tried to find MCP servers for them so AI tools could help but found nothing yet.
It might be a thing in the future tho. Still, keep the manual with you.

## sleep
There is generally 3 types of sleep in embedded development.
- Idle sleep: the CPU is sleeping but the peripherals are still working.
- Deep sleep: the CPU and most of the peripherals are sleeping, only a few things can wake it up.
- Standby sleep: the CPU and all peripherals are sleeping, only an external event can wake it up.

The microcontroller can have different versions of it so make sure.
Those are used to save power for applications that need to run on battery for a long time.
A command put to sleep and an interrupt or a timer can wake it up.

## interrupts

Interrupts are functions that can start whenever an event happens. It can be a timer, a GPIO change, a communication event, etc.
It pauses everything that the CPU is doing, do something, then resume.
For this reason, it needs to be a really really quick action. Often setting a flag or incrementing a counter.
If you need to do something more complex, set a flag then check it in the loop or in a RTOS task.
Here an example of an interrupt that increments a counter every time a button is pressed:
```cpp
volatile int buttonPressCount = 0;
void handleButtonPress() {
    buttonPressCount++;
}
void setup() {
    pinMode(buttonPin, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(buttonPin), handleButtonPress, FALLING);
}
```

As you can see, it can be set on a FALLING or RISING edge, or even on a CHANGE. It depends on the use case.

## registers
If you ever did some ASM, you know that registers are always there implicitly. When working with a microcontroller, you can use them directly.
Why? Because it's how you set and interact with your GPIO, ADC, DAC, etc.
Even if you're using internal tools, they are all reduced to GPIO.
In a register, you can put a value right? That value could be seen as a number but a more useful representation is to look at it's bits here.
You typically have a register to set the mode of a GPIO pin (read, write) and another one to set the value (high, low).
You can have an other one to set the pull up or pull down resistors. You really need to read the manual to really know how a controller works.
All microcontrollers are different. I just try to give a general idea here. There might have many other options.

Let's say you want to set a GPIO to high. This mean, having a 5V or 3.3V on the pin. 
You check the manual, it says this pin is on GPIOA, pin 5. What you want to do is to set this bit to 1:
0b00100000. But if you do that, you unset all the other pins. So that's why knowing a bit of bitwise operations is really useful in embedded.
You can do something like this:
```cpp
GPIOA->OUTPUT |= 0b00100000;
```
We will have a section on bitwise operations.
The way to interact with registers syntactically differ from a controller to an other cause they come with different libraries.
What happens under the hood is similar, The register has an address and you have to write at that address.
So the example above could also be written like this:
```cpp
*(volatile uint32_t*)(GPIOA_BASE + OUTPUT_OFFSET) |= 0b00100000;
``` 
## bitwise operations
Here are the bitwise operations you want to know:
- AND: & example: 0b1101 & 0b1011 = 0b1001
- OR: | example: 0b1101 | 0b1011 = 0b1111
- XOR: ^ example: 0b1101 ^ 0b1011 = 0b0110
- NOT: ~ example: ~0b1101 = 0b0010
- Left shift: << example: 0b0001 << 2 = 0b0100
- Right shift: >> example: 0b0100 >> 2 = 0b0001

And here are the most useful use of it for registers:
- Set a bit: reg |= (1 << bit_position);
- Clear a bit: reg &= ~(1 << bit_position);
- Toggle a bit: reg ^= (1 << bit_position);
- Check if a bit is set: if (reg & (1 << bit_position)) {}
- Check if a bit is clear: if (!(reg & (1 << bit_position))) {}
- Set multiple bits: reg |= (mask);
- Clear multiple bits: reg &= ~mask;
- Toggle multiple bits: reg ^= (mask);
- Check if multiple bits are set: if ((reg & mask) == mask) {}

## cross compilation and toolchains
You might be used to compile your C or C++ code using gcc or clang. It's similar in embedded development but you need compilers made for your chip architecture and, if it's a microcontroller, a tool to put it in there called a programmer.
It's different for every architecture and every microcontroller. You need to check the manual to know which one you need.

## Yocto
Yocto is a build system for embedded Linux. It allows you to create a custom Linux distribution.
It's useful when working on an embedded system with an OS. Instead of installing a prebuild linux and add what you need,
you can just put everything together with some lines of code and have the same environment popping every time.
A small example of a yocto recipe to install nginx:
```bitbake
# meta-mynginx/recipes-webserver/nginx/nginx_%.bbappend
DESCRIPTION = "My nginx web server"
LICENSE = "MIT"

RDEPENDS:${PN} = "nginx"

SRC_URI += "file://nginx.conf"

do_install:append() {
    install -d ${D}${sysconfdir}/nginx
    install -m 0644 ${WORKDIR}/nginx.conf ${D}${sysconfdir}/nginx/nginx.conf
}
```

Then in your `local.conf` or image recipe, you add it to the image:
```bitbake
IMAGE_INSTALL:append = " nginx"
```

And you build with:
```bash
source oe-init-build-env
bitbake core-image-minimal
```

That's it. Yocto pulls, compiles and packages everything and spits out an image you can flash directly on your board.

Like you can see, it's just a descriptive way to setup your image. It reminds me a lot of dockerfiles or nixos.

## Communication
There are some communication methods that are used inside a controller between chips.
Here are the ones I'm aware of:
- I2C: Inter-Integrated Circuit, a two wire protocol for short distance communication.
- SPI: Serial Peripheral Interface, a four wire protocol for short distance communication.
- UART: Universal Asynchronous Receiver Transmitter, a two wire protocol for serial communication.
- CAN: Controller Area Network, a multi-master protocol for automotive and industrial applications.

There is also things for longer distances like:
- Ethernet: a wired protocol for local area networks.
- Wi-Fi: a wireless protocol for local area networks.
- Bluetooth: a wireless protocol for short range communication.
- LoRa: a wireless protocol for long range communication with low power consumption.
- Zigbee: a wireless protocol for low power, low data rate communication in mesh networks.
- Z-Wave: a wireless protocol for low power, low data rate communication in home automation.
- Cellular: a wireless protocol for wide area networks using cellular towers.
- NFC: Near Field Communication, a wireless protocol for very short range communication.
- RFID: Radio Frequency Identification, a wireless protocol for identification and tracking using radio waves.
- Modbus: a serial communication protocol for industrial automation.
- RS-485: a serial communication protocol for long distance and noisy environments.
- RS-232: a serial communication protocol for short distance and point-to-point communication.
- USB: Universal Serial Bus, a wired protocol for communication and power supply between devices.

Studying them can really help you.

## Electronics
Having a certain level of understanding of electronic circuit can help you. You're interacting directly with circuits after all.
So here are some things you can use your curiosity on:
- Analog Digital Converters
- Digital Analog converters
- Transistors basics
- AmpOp circuits
- logic gates
- decoders
- multiplexers

## Conclusion
I hope this can help you get started on embedded development. A lot of people starts with arduino and it's libraries but I personally think that while it can be useful, it can also hide important things and give the impression you understand more than you do.
Read the manuals of the chips. I don't say read the whole thing. They are kind of heavy. But take a look and understand the features.
If you think I should add something, you can always send me a message, I might revisit this post and add things by gaining experience myself.
I didn't even talk about FPGAs and CPLDs, which are also really interesting for embedded development. I might do a post about it in the future. I'm just myself really rusty on that part at the moment.
Have a nice day!
