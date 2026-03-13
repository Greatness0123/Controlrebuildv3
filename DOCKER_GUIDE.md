# Comprehensive Guide to Docker

Docker is a platform for developing, shipping, and running applications in isolated environments called **containers**.

## 1. Core Concepts

### Images
An image is a read-only template with instructions for creating a Docker container. Often, an image is based on another image, with some additional customization. For example, you can build an image which is based on the `ubuntu` image, but installs the Apache web server and your application.

### Containers
A container is a runnable instance of an image. You can create, start, stop, move, or delete a container using the Docker API or CLI. By default, a container is relatively well isolated from other containers and its host machine.

### Dockerfiles
A `Dockerfile` is a text document that contains all the commands a user could call on the command line to assemble an image.

## 2. Why Use Docker for AI Agents?

- **Isolation**: Each agent runs in its own environment. One agent cannot interfere with the host system or other agents.
- **Reproducibility**: The agent will run exactly the same way on your computer, a server, or the web.
- **Security**: You can limit the resources (CPU, Memory) and permissions of a container.
- **Scalability**: You can easily spin up hundreds of identical containers to handle many users.

## 3. Basic Commands

- `docker build -t my-image .`: Build an image from a Dockerfile.
- `docker run -p 8080:80 my-image`: Run a container, mapping host port 8080 to container port 80.
- `docker ps`: List running containers.
- `docker stop <container_id>`: Stop a running container.

## 4. Using Docker with Control

In the context of Control, Docker is used to provide **Virtual Machines** (VMs) for the AI to interact with. Instead of the AI controlling your actual desktop (which might be risky or inconvenient), it can control a desktop running inside a Docker container.

### Running a Desktop in Docker
```bash
docker run -d -p 6080:80 dorowu/ubuntu-desktop-lxde-vnc
```
Once running, you can open your web browser to `http://localhost:6080` to see the virtual desktop.

## 5. Security Best Practices
- Use non-root users inside containers.
- Limit container resources using `--memory` and `--cpus` flags.
- Regularly update your base images to include the latest security patches.
