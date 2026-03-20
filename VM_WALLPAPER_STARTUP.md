# Setting a Custom VM Wallpaper on Startup

The Control Virtual Machine uses an Ubuntu desktop environment over VNC. By default, it loads a standard Ubuntu background. If you want to customize the wallpaper during startup, you have a few options based on updating the underlying Docker container or injecting a setup script.

## Method 1: Modify the VM Dockerfile (Recommended)
You can include your specific wallpaper image directly into the Docker image when building it, and set it as the default background using the `pcmanfm` configuration (since the image likely uses a lightweight window manager like LXDE).

1. Place your desired wallpaper image (e.g., `custom_wallpaper.jpg`) into your `./vm` Docker build folder.
2. Edit your `./vm/Dockerfile`.
3. Add the following lines towards the end of your Dockerfile to copy the wallpaper and set it as the background for `controluser`:

```dockerfile
# Copy the custom wallpaper into the image
COPY custom_wallpaper.jpg /usr/share/backgrounds/custom_wallpaper.jpg

# Set the wallpaper for the default user (controluser) by updating pcmanfm configuration
RUN mkdir -p /home/controluser/.config/pcmanfm/LXDE/ \
    && echo "[desktop]\nwallpaper=/usr/share/backgrounds/custom_wallpaper.jpg\nwallpaper_mode=crop" > /home/controluser/.config/pcmanfm/LXDE/desktop-items-0.conf \
    && chown -R controluser:controluser /home/controluser/.config
```

4. Rebuild the VM image:
```bash
docker build -t control-vm ./vm
```

## Method 2: Injecting a Startup Script
If you prefer not to rebuild the image, you can modify `vm_service.py` to set the wallpaper background after the container is created, much like how power management is disabled. Note that this requires downloading or copying the image.

In `control_web/backend/app/services/vm_service.py`, inside the `_disable_power_mgmt` function:

```python
async def _disable_power_mgmt(cont):
    await asyncio.sleep(10) # wait for X server
    try:
        cont.exec_run("xset s off", user="controluser", environment={"DISPLAY": ":1"})
        cont.exec_run("xset -dpms", user="controluser", environment={"DISPLAY": ":1"})
        cont.exec_run("pkill xscreensaver", user="controluser")
        
        # Download and set wallpaper dynamically
        image_url = "https://example.com/your-wallpaper.jpg"
        cont.exec_run(f"wget -O /tmp/bg.jpg {image_url}", user="controluser")
        cont.exec_run("pcmanfm --set-wallpaper /tmp/bg.jpg", user="controluser", environment={"DISPLAY": ":1"})
    except Exception as e:
        logger.warning(f"Failed to configure VM: {e}")
```

These changes will apply the specific image as the wallpaper as soon as the VM's desktop environment boots up!
