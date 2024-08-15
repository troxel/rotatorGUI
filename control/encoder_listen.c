#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <termios.h>
#include <sys/time.h>
#include <signal.h>

#include <inttypes.h>
#include <math.h>

#include <mysql/mysql.h>

#define PORT "/dev/ttyRotate"
#define LOG_FILE "serial_log.txt"
#define BAUDRATE B9600
#define DB_NAME "lsvsail"
#define DB_HOST "localhost"
#define DB_USER "webdev"
#define DB_PASS "webdev1"
#define DB_TABLE "encoder"

#define MAX_LINE_LENGTH 1024

int Verbose = 1; 

int serial_fd;
FILE *log_file;
MYSQL *conn;

void cleanup() {
    if (serial_fd != -1) close(serial_fd);
    if (log_file) fclose(log_file);
    if (conn) mysql_close(conn);
    printf("Cleanup complete.\n");
}

void sigint_handler(int sig) {
    printf("Caught Ctrl-C, exiting...\n");
    cleanup();
    exit(0);
}

void open_serial_port() {
    serial_fd = open(PORT, O_RDWR | O_NOCTTY | O_SYNC);
    if (serial_fd < 0) {
        perror("Error opening serial port");
        exit(1);
    }

    struct termios tty;
    if (tcgetattr(serial_fd, &tty) != 0) {
        perror("Error from tcgetattr");
        exit(1);
    }

    cfsetospeed(&tty, BAUDRATE);
    cfsetispeed(&tty, BAUDRATE);

    tty.c_cflag = (tty.c_cflag & ~CSIZE) | CS8;
    tty.c_iflag &= ~IGNBRK;
    tty.c_lflag = 0;
    tty.c_oflag = 0;
    tty.c_cc[VMIN] = 1;
    tty.c_cc[VTIME] = 1;

    tty.c_iflag &= ~(IXON | IXOFF | IXANY);
    tty.c_cflag |= (CLOCAL | CREAD);
    tty.c_cflag &= ~(PARENB | PARODD);
    tty.c_cflag |= 0;
    tty.c_cflag &= ~CSTOPB;
    tty.c_cflag &= ~CRTSCTS;

    if (tcsetattr(serial_fd, TCSANOW, &tty) != 0) {
        perror("Error from tcsetattr");
        exit(1);
    }
}

void connect_to_database() {
    conn = mysql_init(NULL);
    if (conn == NULL) {
        fprintf(stderr, "mysql_init() failed\n");
        exit(1);
    }

    if (mysql_real_connect(conn, DB_HOST, DB_USER, DB_PASS, DB_NAME, 0, NULL, 0) == NULL) {
        fprintf(stderr, "mysql_real_connect() failed\n");
        mysql_close(conn);
        exit(1);
    }
}

void log_and_insert_data(char *data) {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    char timestamp[64];
    snprintf(timestamp, sizeof(timestamp), "%ld.%06ld", tv.tv_sec, tv.tv_usec);

    // Disable log inputs for now 
    //fprintf(log_file, "[%s] Received: %s", timestamp, data);
    //fflush(log_file);

    // Epoch in milliseconds 
    long long unsigned int ts = (long long)tv.tv_sec * 1000LL + tv.tv_usec / 1000;
 
    char *position_str = strstr(data, "External encoder data ");
    if (position_str) {
        position_str += strlen("External encoder data ");
        float position;

        if (sscanf(position_str, "%f", &position) == 1) {
            static float previous_position = -9999.0;
        
            // This filter on position is not rqd since we filter for dups in the while loop. 
            if (position != previous_position) {
                char query[256];
                snprintf(query, sizeof(query), "INSERT INTO %s (ts, position) VALUES ('%lld', '%f')", DB_TABLE, ts, position);

                // Moved connect here since the while loops only runs when moving and there could be a long time between rotates
                connect_to_database();
                if (mysql_query(conn, query)) {
                    fprintf(stderr, "INSERT failed. Error: %s\n", mysql_error(conn));
                } else {
                    //fprintf(log_file, "[%s] Inserted position: %f\n", timestamp, position);
                    //fflush(log_file);
                }
                mysql_close(conn);

                previous_position = position;
            }
        }
    }
}

ssize_t read_line(int fd, char *buf, size_t max_len) {
    size_t i = 0;
    char ch;
    ssize_t n;

    while (i < max_len - 1) {
        n = read(fd, &ch, 1);

        //printf(">(%i,%d,%c)\n",i,ch,ch);

        if (n > 0) {
            buf[i++] = ch;
            if (ch == '\n') break;
        } else if (n == 0) {
            printf("EOF\n");
            exit(1); // End of file
        } else {

            //if (errno == EINTR) continue; // Interrupted, try again
            perror("Error reading from serial port");
            return -1;
        }
    }
    buf[i] = '\0';
    return i;
}

int main() {
    signal(SIGINT, sigint_handler);

    log_file = fopen(LOG_FILE, "a");
    if (!log_file) {
        perror("Error opening log file");
        exit(1);
    }

    open_serial_port();

    char line[MAX_LINE_LENGTH];
    char line_prev[MAX_LINE_LENGTH];
    
    while (1) {
        ssize_t len = read_line(serial_fd, line, sizeof(line));

        if ( strcmp(line,line_prev) == 0 ) { continue; } // filter dups
        if ( len == 1 ) { continue; } // remove blank lines 
        strcpy(line_prev,line); 
        
        if ( Verbose ) { printf("%s",line);
 }
        if (len > 0) {
            log_and_insert_data(line);
        }
        //usleep(100000);
    }

    cleanup();
    return 0;
}
