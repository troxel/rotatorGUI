import RPi.GPIO as GPIO
import time

# Set the GPIO mode
GPIO.setmode(GPIO.BCM)  # or GPIO.BOARD

# Set up the GPIO pin
GPIO_PIN = 18  # Replace with your GPIO pin number
GPIO.setup(GPIO_PIN, GPIO.OUT)

# Turn the GPIO pin on
GPIO.output(GPIO_PIN, GPIO.HIGH)
print("GPIO pin turned ON")
time.sleep(2)  # Keep the pin on for 2 seconds

# Turn the GPIO pin off
GPIO.output(GPIO_PIN, GPIO.LOW)
print("GPIO pin turned OFF")

# Clean up
GPIO.cleanup()

