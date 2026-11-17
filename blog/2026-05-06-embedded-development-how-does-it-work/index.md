---
title: embedded development how does it work?
date: 2026-05-06
authors: cgauthier
tags: [embedded, cpp, rust, arduino, pic, microcontroller, raspberry-pi, esp32]
description: A tour of the principal mechanisms of embedded development
---
## Why I'm doing this
I did both a college degree in electronics, computers and networks and a bachelor in computer science.
I do not have the experience of all universities but at UQAM at least, embedded development wasn't really touched at all.
There wasn't even a specialisation course. {/* truncate */}
I find it strange cause for the rest of the fields, they give at least a good overview.
I just happen to know about that part of software development because of my DEC so I'm here to open those doors for you.
My goal here is to give enough information so you know the principal mechanisms and be able to figure out the rest by yourself.
If you happen to work for UQAM, it would be, maybe, a good idea to make a course about it. Maybe an optional one. I know it's a bit more expensive cause you need extra hardware.

## What is embedded development?
Embedded development is about programming things I would say.
It's about software developed for a specific hardware and the hardware developed for a specific software.
It's not a system that will compete with other software on a computer or server but a software that lives along or alongside other parts of the same system, in a specialised hardware.

## the three types of embedded development
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
If you ever used an arduino, this shape should look familiar. They simplify all this for you, you just define two functions.
```cpp
void setup() {
    // setup code here
}

void loop() {
    // loop code here
}
```
But under the hood, the arduino toolchain generates exactly the super loop above. Your setup() runs once, your loop() runs forever. The training wheels are nice, but now you know what they hide.

It's simple but really limiting. If something blocks, everything blocks.
On the other hand, it's perfect if you need a really cheap controller cause that takes no extra processing power.

### RTOS
RTOS stands for real time operating system. It's technically an OS but it's compiled with the firmware.
I had a course about operating systems and something like FreeRTOS doesn't really qualify as a full OS.
It doesn't have a file system, it doesn't have a user interface. It's basically a very good scheduler.
It allows running multiple tasks concurrently, simulating parallelism in a way.
If you're not aware, operating systems like the one you're using right now have a scheduler.
Schedulers are generally complex, relatively, to make sure everything has the right amount of time.
Real time schedulers are much simpler, and that's on purpose. Tasks have priorities and the scheduler always runs the highest priority task that is ready.
If a few tasks have the same priority, they share the CPU in a round robin way, each one getting a fixed time slice.
That kind of scheduler is used for two reasons, they are predictable and easy on the CPU.
Just to mention it, under Linux it's possible to run with real time scheduling too, and since kernel 6.12, the PREEMPT_RT option is even part of the mainline kernel.
Don't do this on your main machine BTW, the one you most likely have is the best for you.
It's just, you know, something to play around on an old computer or raspberry pi to see what it does.

setup example:
```cpp
#include <FreeRTOS.h>
#include <task.h>

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
    xTaskCreate(task2, "Task 2", 1000, NULL, 2, NULL);
    vTaskStartScheduler();
}

```

### In an OS
So the last one is when we put literally an OS, often Linux, not always, in the controller. Not all of them are OS enabled.
It needs to be powerful enough. This option enables better logs, better debugging, a file manager, easier communication over network.
You can even run other software with it like a database, why not.
It also enables more languages. In the other ones, you are limited to ASM, C, C++ and maybe Rust and Zig if you have the nerves to be a pioneer.
Now you can run anything. Generally Python is a really popular one but Go, Java, NodeJS, Ruby, Elixir, whatever you want is now possible.
For this kind of development, if using Linux, a good way to build is to use Yocto.
Things are a bit less predictable here. It's a price to pay.

## microcontrollers

Microcontrollers are a special kind of hardware. It's a CPU with some things around it useful for embedded tasks.
It can go with multiple internal modules and protections.
Here are common modules you can see:
- GPIO: general purpose input output
- ADC: analog to digital converter
- DAC: digital to analog converter
- PWM: pulse width modulation

Understanding a bit of electronics can really help understand how the software interacts with it.

They come in all sizes and have different feature sets so it can be really hard to choose one for a project.
And when I say all sizes, I also mean memory. Think kilobytes of RAM here, not gigabytes. A single variable suddenly matters when you have 20KB to play with.
Some family names you will see a lot: AVR, PIC, STM32, ESP32.
It's better to start with one a bit overkill for the project and eventually move to a cheaper one after testing that it works.
To try things it's often easier with a development board. There is a ton of them.

Now you wonder probably how we get to know a microcontroller and its functions if it's all different every time.
RTFM. That's literally it. There are PDFs out there for your microcontroller. Two actually, the datasheet gives you the specs and the pinout, the reference manual explains how the peripherals and the registers work.
Download them, put them in the project folder and ctrl+f in it.
I tried to find MCP servers for them so AI tools could help and there is some movement now, mostly around STM32. Some can search the documentation, some can even flash a board through OpenOCD.
It's still early days tho. Keep the manual with you.

## interrupts

Interrupts are functions that can start whenever an event happens. It can be a timer, a GPIO change, a communication event, etc.
It pauses everything that the CPU is doing, does something, then resumes.
For this reason, it needs to be a really really quick action. Often setting a flag or incrementing a counter.
If you need to do something more complex, set a flag then check it in the loop or in a RTOS task.
Here is an example of an interrupt that increments a counter every time a button is pressed:
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

You can see the `volatile` keyword on the counter. It's not decoration. Without it, the compiler could optimize the variable into a register and never notice that the interrupt changed it. `volatile` tells it to always read the real value.

Small warning on this exact example: physical buttons bounce. One press can trigger the interrupt a few times so on real hardware, the count goes up faster than reality. That's why people debounce, usually with a small delay or a timer. Just don't be surprised when the counter looks inflated.

As you can see, it can be set on a FALLING or RISING edge, or even on a CHANGE. It depends on the use case.

## sleep
There are generally 3 types of sleep in embedded development.
- Idle sleep: the CPU is sleeping but the peripherals are still working.
- Deep sleep: the CPU and most of the peripherals are sleeping, only a few things can wake it up.
- Standby sleep: everything is off, even the RAM content, only a few wake up sources are left.

The names change from one manufacturer to another. STM32 calls them Sleep, Stop and Standby, ESP32 just has Light and Deep sleep. The levels are the same idea tho.
The details can change from a chip to another so make sure the one you pick does what you need.
Those are used to save power for applications that need to run on battery for a long time.
A command puts it to sleep and a wake up source brings it back. Which sources can wake which mode is exactly the kind of thing you check in the manual.

## registers
If you ever did some ASM, you know that registers are always there implicitly. When working with a microcontroller, you can use them directly.
Why? Because it's how you set and interact with your GPIO, ADC, DAC, etc.
Even if you're using internal tools, they are all reduced to GPIO.
In a register, you can put a value right? That value could be seen as a number but a more useful representation is to look at its bits here.
You typically have a register to set the mode of a GPIO pin (read, write) and another one to set the value (high, low).
You can have another one to set the pull up or pull down resistors. You really need to read the manual to really know how a controller works.
All microcontrollers are different. I just try to give a general idea here. There might be many other options.

Let's say you want to set a GPIO to high. This means having a 5V or 3.3V on the pin.
You check the manual, it says this pin is on GPIOA, pin 5. What you want to do is to set this bit to 1:
0b00100000. But if you do that, you unset all the other pins. So that's why knowing a bit of bitwise operations is really useful in embedded.
You can do something like this:
```cpp
GPIOA->OUTPUT |= 0b00100000;
```
There is a section on bitwise operations below.
The way to interact with registers syntactically differs from a controller to another cause they come with different libraries.
What happens under the hood is similar. The register has an address and you have to write at that address.
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
- Left shift: `<<` example: `0b0001 << 2 = 0b0100`
- Right shift: `>>` example: 0b0100 >> 2 = 0b0001

And here are the most useful uses of them for registers:
- Set a bit: `reg |= (1 << bit_position);`
- Clear a bit: `reg &= ~(1 << bit_position);`
- Toggle a bit: `reg ^= (1 << bit_position);`
- Check if a bit is set: `if (reg & (1 << bit_position)) {}`
- Check if a bit is clear: `if (!(reg & (1 << bit_position))) {}`
- Set multiple bits: `reg |= (mask);`
- Clear multiple bits: `reg &= ~mask;`
- Toggle multiple bits: `reg ^= (mask);`
- Check if multiple bits are set: `if ((reg & mask) == mask) {}`

## cross compilation and toolchains
You might be used to compile your C or C++ code using gcc or clang. It's similar in embedded development but you need compilers made for your chip architecture and, if it's a microcontroller, a tool to put it in there called a programmer.
It's different for every architecture and every microcontroller. You need to check the manual to know which one you need.
On the flashing side, you will cross paths with tools like avrdude for AVR or OpenOCD for a lot of the ARM chips. A flash with OpenOCD looks something like this:
```bash
openocd -f interface/stlink.cfg -f target/stm32f1x.cfg \
    -c "program firmware.elf verify reset exit"
```

## debugging
So how do you debug something with no screen? The classic is logs over serial UART. Basically printf debugging.
Most boards have a USB port that shows up as a serial port on your computer and you just look at the logs. It saves you most of the time.
For the serious stuff, there is the debug probe. You connect it to the chip with SWD or JTAG and with OpenOCD and GDB, you can put breakpoints, step through the code and inspect the memory of the chip live.
A lot of probes can also flash the chip, same tooling as the programmer earlier. If you want to try, a ST-Link or a raspberry pi as a probe are cheap ways to start.
And if you run an OS, like on a raspberry pi, you can just ssh in and debug like on any Linux machine so the usual tools work here.

## Yocto
Yocto is a build system for embedded Linux. It allows you to create a custom Linux distribution.
It's useful when working on an embedded system with an OS. Instead of installing a prebuilt Linux image and adding what you need,
you can just put everything together with some lines of code and have the same environment popping every time.
A small example, a recipe that keeps the stock nginx but adds our own nginx.conf:
```bitbake
# meta-mynginx/recipes-webserver/nginx/nginx_%.bbappend
FILESEXTRAPATHS:prepend := "${THISDIR}/${BPN}:"

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

Like you can see, it's just a descriptive way to set up your image. It reminds me a lot of dockerfiles or nixos.

## Communication
Here are the communication methods I'm aware of, first the ones used inside a device between chips:
- I2C: Inter-Integrated Circuit, a two wire protocol for short distance communication between chips.
- SPI: Serial Peripheral Interface, a four wire protocol for short distance communication, generally faster than I2C.
- UART: Universal Asynchronous Receiver Transmitter, a two wire protocol for serial communication. Also the classic way to get logs out.
- CAN: Controller Area Network, a multi-master protocol for automotive and industrial applications.

For talking with the rest of the world, wired:
- Ethernet: a wired protocol for local area networks.
- USB: Universal Serial Bus, a wired protocol for communication and power supply between devices.
- RS-232: an electrical standard for short distance, point-to-point serial communication.
- RS-485: an electrical standard for long distance and noisy environments.
- Modbus: a protocol for industrial automation, usually running on top of RS-485.

One nuance here, RS-232 and RS-485 are just the wire and voltage spec. Protocols like Modbus run on top of them. People mix the names all the time tho, now you know.

And for wireless:
- Wi-Fi: a wireless protocol for local area networks.
- Bluetooth: a wireless protocol for short range communication.
- LoRa: a wireless protocol for long range communication with low power consumption.
- Zigbee: a wireless protocol for low power, low data rate communication in mesh networks.
- Z-Wave: a wireless protocol for low power, low data rate communication in home automation.
- Cellular: a wireless protocol for wide area networks using cellular towers.
- NFC: Near Field Communication, a wireless protocol for very short range communication.
- RFID: Radio Frequency Identification, a wireless protocol for identification and tracking using radio waves.

Studying them can really help you.

## Electronics
Having a certain level of understanding of electronic circuits can help you. You're interacting directly with circuits after all.
So here are some things you can use your curiosity on:
- analog to digital converters
- digital to analog converters
- transistor basics
- op-amp circuits
- logic gates
- decoders
- multiplexers

## Conclusion
I hope this can help you get started on embedded development. A lot of people start with arduino and its libraries but I personally think that while it can be useful, it can also hide important things and give the impression you understand more than you do.
Read the manuals of the chips. I'm not saying you should read the whole thing. They are kind of heavy. But take a look and understand the features.
If you think I should add something, you can always send me a message, I might revisit this post and add things by gaining experience myself.
I didn't even talk about FPGAs and CPLDs, which are also really interesting for embedded development. I might do a post about it in the future. I'm just myself really rusty on that part at the moment.
Have a nice day!
