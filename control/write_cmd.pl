#!/usr/bin/perl

use strict;
use warnings;
use Device::SerialPort;

sub validate_command {
    my ($command) = @_;

    # The command should match the pattern $position@$speed\n
    if ($command =~ /^(-?\d+)\@(\d+)$/) {
        my ($position, $speed) = ($1, $2);
        # Validate position
        if ($position >= -190 && $position <= 190) {
            # Validate speed
            if ($speed >= 1 && $speed <= 22) {
                return 1;  # Valid command
            }
        }
    }
    return 0;  # Invalid command
}

sub print_invalid_cmd {
    print "Invalid input. Required format: position\@speed\n\n";
    print "Where \$position is an integer between -190 and 190, and \$speed is a positive integer between 1 and 20.\n";
    exit 1;
}


my $port = '/dev/ttyRotate';

# Check if a command line argument is provided
if (@ARGV == 0) { print_invalid_cmd() };

my $command = $ARGV[0];

# Validate the command line argument
#unless (validate_command($command)) { print_invalid_cmd() }

my $serial_port = Device::SerialPort->new($port) or die "Cannot open port $port: $!";

$serial_port->baudrate(9600);
$serial_port->parity("none");
$serial_port->databits(8);
$serial_port->stopbits(1);
$serial_port->handshake("none");

$serial_port->write_settings or die "Could not write settings to $port: $!";

$serial_port->write($command) or die "Failed to write to $port: $!";

print "Message sent: $command\n";

$serial_port->close or die "Could not close port $port: $!";
