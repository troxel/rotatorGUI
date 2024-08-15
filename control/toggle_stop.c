#include <pigpio.h>
#include <stdio.h>

#define GPIO_PIN 18  // Use the BCM pin number

int main(void) {
    // Initialize pigpio
    if (gpioInitialise() < 0) {
        printf("pigpio initialization failed\n");
        return 1;
    }

    // Set the GPIO pin as an output
    gpioSetMode(GPIO_PIN, PI_OUTPUT);

    // Turn the GPIO pin on
    gpioWrite(GPIO_PIN, 1);
    printf("GPIO pin turned ON\n");
    time_sleep(2);  // Keep the pin on for 2 seconds

    // Turn the GPIO pin off
    gpioWrite(GPIO_PIN, 0);
    printf("GPIO pin turned OFF\n");

    // Terminate pigpio
    gpioTerminate();

    return 0;
}

