#!/usr/bin/perl

use strict;
use warnings;
use Device::SerialPort;
use Time::HiRes qw(gettimeofday);
use DBI;
use POSIX qw(:signal_h);

use IO::Handle;

my $port = '/dev/ttyACM0';
my $log_file = 'serial_log.txt';

# Database configuration
my $db_name = 'lsvsail';
my $db_host = 'localhost';
my $db_user = 'webdev';
my $db_pass = 'webdev1';
my $db_table = 'encoder';


# Open log file for writing
open my $log_fh, '>>', $log_file or die "Cannot open log file $log_file: $!";

STDOUT->autoflush();
$log_fh->autoflush();

# Connect to the database
my $dbh = DBI->connect("DBI:mysql:database=$db_name;host=$db_host", $db_user, $db_pass, {'RaiseError' => 1});

my $serial_port = Device::SerialPort->new($port) or die "Cannot open port $port: $!";

$serial_port->baudrate(9600);
$serial_port->parity("none");
$serial_port->databits(8);
$serial_port->stopbits(1);
$serial_port->handshake("none");

$serial_port->write_settings or die "Could not write settings to $port: $!";

my $previous_char = '';
my $previous_position = '';

# Signal handler for Ctrl-C
$SIG{INT} = sub {
    print "Caught Ctrl-C, exiting...\n";
    cleanup();
    exit 0;
};

sub cleanup {
    $serial_port->close or warn "Could not close port $port: $!";
    close $log_fh or warn "Cannot close log file $log_file: $!";
    $dbh->disconnect or warn "Cannot disconnect from database: $!";
    print "Cleanup complete.\n";
}

while (1) {
    #$char = $serial_port->lookfor;
    our $char = $serial_port->READLINE;
    if ( length($char) == 0 ) { print("."); sleep(1); next; }
    print(">$char\n");
    if (defined $char && length($char) > 0 && $char ne $previous_char) {
        my ($seconds, $microseconds) = gettimeofday;
        my $timestamp = localtime($seconds) . sprintf(".%06d", $microseconds);
        
        print $log_fh "[$timestamp] Received: $char\n";
        print "Received: $char\n";  # Optional: print to console

        # Check if the char contains encoder position
        if ($char =~ /External encoder position (-?[\d.]+)°/) {
            my $position = $1;

            # Insert into the database only if the position is unique
            if ($position ne $previous_position) {

                my $ts = "$seconds$microseconds";
                my $sth = $dbh->prepare("INSERT INTO $db_table (ts, position) VALUES (?, ?)");
                $sth->execute($ts, $position);
                print $log_fh "[$ts] Inserted position: $position\n";
                print "Inserted position: $position\n";  # Optional: print to console
                $previous_position = $position;
            }
        }

        $previous_char = $char;
    }
    else { print("."); }
    sleep(1);
}

cleanup();

