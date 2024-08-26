import RPi.GPIO as GPIO
import time
import argparse

# handle command line arguments
parser = argparse.ArgumentParser("relayctl")
parser.add_argument("gpio_num", help="the GPIO number", type=int)
parser.add_argument("-s", "--seconds", help="the amount of time in seconds to remain on (0=off)", type=int)
args = parser.parse_args()

# Set the GPIO mode
GPIO.setmode(GPIO.BCM)  # or GPIO.BOARD

# Set up the GPIO pin
GPIO_PIN = args.gpio_num  # Replace with your GPIO pin number
GPIO.setup(GPIO_PIN, GPIO.OUT)

# Turn the GPIO pin on
if args.seconds is None or args.seconds != 0:
    GPIO.output(GPIO_PIN, GPIO.HIGH)
    print(f"GPIO pin {GPIO_PIN} {GPIO.HIGH} turned ON")

# Turn the GPIO pin off
if args.seconds is not None:
    # Sleep
    if args.seconds > 0:
        time.sleep(args.seconds)  # Keep the pin on for 2 seconds

    GPIO.output(GPIO_PIN, GPIO.LOW)
    print(f"GPIO pin {GPIO_PIN} turned OFF")

    # Clean up
    GPIO.cleanup()
