# Understanding Docker: A Guide for Control Users

Docker is a platform that allows you to package an application and all its dependencies into a standardized unit called a **container**. Think of it as a "shipping container" for software.

## Why are we using Docker for Control?

In the context of **Control Web**, Docker is used to create "Virtual Machines" (VMs). Instead of needing a full heavy virtual machine like VMware or VirtualBox, Docker allows us to spin up a lightweight Linux desktop in seconds that you can control from your browser.

## Key Concepts

### 1. Images
An image is a read-only template with instructions for creating a Docker container. For Control, we have a "Desktop Image" that contains Ubuntu, a desktop environment (XFCE), and the necessary drivers to allow the AI to move the mouse and type.

### 2. Containers
A container is a runnable instance of an image. When you click "Create VM" in Control Web, we start a new container from our image. It is isolated from other users, meaning your files and activities are private.

### 3. Dockerfile
A Dockerfile is a text document that contains all the commands a user could call on the command line to assemble an image. You can see ours in `control_web/vm/Dockerfile`.

### 4. Volumes
Since containers are "ephemeral" (they disappear when deleted), we use **Volumes** to save your files. This is how your virtual computer "remembers" your data even after you turn it off.

## How it works in Control Web

1. **Isolation**: Every user gets their own container.
2. **Access**: We use a technology called **noVNC** which turns the container's desktop into a website. Control Web embeds this website so you can see the screen.
3. **AI Control**: The Control AI Agent talks to the container via a secure bridge to perform tasks like searching the web or organizing files.

## Summary of Commands (For Reference)

If you have Docker installed and want to run a Control VM locally:
- `docker build -t control-vm .` (Builds the image)
- `docker run -p 6080:6080 control-vm` (Starts the VM, accessible at http://localhost:6080)

Docker makes the "Web" part of Control possible by providing consistent, isolated, and scalable virtual computers on demand.
