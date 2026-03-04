---
sidebar_position: 1
slug: /C++/C++网络编程/Sctp-客户端与服务端
---

---
title: Sctp 客户端与服务端
date: '2024-11-29 00:20:53'
updated: '2025-01-05 17:51:47'
slug: /C++/C++网络编程/Sctp-客户端与服务端---
[传输层学习之六（SCTP）](https://blog.csdn.net/goodluckwhh/article/details/10648633)



服务端

```c
/*  
 *  sctps.c
 *  Servidor SCTP
 *  Rafael Damian Fito Izquierdo
 *  
 *  Basado en parte en el codigo de Kari Vatjus-Anttila
 *  http://stackoverflow.com/questions/6342617/sctp-multihoming
 */

#include <sys/types.h>
#include <sys/socket.h>
#include <signal.h>
#include <netinet/in.h>
#include <netinet/sctp.h>
#include <arpa/inet.h>
#include <string.h>
#include <stdio.h>
#include <net/if.h>
#include <stdlib.h>
#include <unistd.h>

#define BUFFER_SIZE	65535

#define PORT	23001

#define CTRL_STREAM	0
#define DATA_STREAM	1

int sock, conSock;

void handle_signal(int signum);

int main(void) {
    int ret, i=0;
    int reuse = 1;
    int addr_count = 0;
    char buffer[BUFFER_SIZE+1];
    socklen_t addr_len;
    socklen_t hb_len;

    struct sockaddr_in addr;
    struct sockaddr_in *laddr[9];
    struct sctp_event_subscribe events;
    struct sctp_paddrparams heartbeat;
    struct sigaction sig_handler;
    struct sctp_rtoinfo rtoinfo;
    struct sockaddr_in client;

    if((sock = socket(AF_INET, SOCK_STREAM, IPPROTO_SCTP)) < 0)
        perror("socket");

    memset(&addr,      0, sizeof(struct sockaddr_in));
    memset(&events,    0, sizeof(struct sctp_event_subscribe));
    memset(&heartbeat, 0, sizeof(struct sctp_paddrparams));
    memset(&rtoinfo,   0, sizeof(struct sctp_rtoinfo));

    addr_len = (socklen_t)sizeof(struct sockaddr_in);

    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(PORT);

    sig_handler.sa_handler = handle_signal;
    sig_handler.sa_flags = 0;

    heartbeat.spp_flags = SPP_HB_ENABLE;
    heartbeat.spp_hbinterval = 5000;
    heartbeat.spp_pathmaxrxt = 1;

    rtoinfo.srto_max = 3000;

    /*Set Signal Handler*/
    if(sigaction(SIGINT, &sig_handler, NULL) == -1)
        perror("sigaction");

    /*Set Heartbeats*/
    if(setsockopt(sock, SOL_SCTP, SCTP_PEER_ADDR_PARAMS, &heartbeat, sizeof(heartbeat)) != 0)
        perror("setsockopt");

    /*Set rto_max*/
    if(setsockopt(sock, SOL_SCTP, SCTP_RTOINFO,&rtoinfo, sizeof(rtoinfo)) < 0)
        perror("setsockopt");

    /*Set Events */
    events.sctp_data_io_event = 1;
    events.sctp_association_event = 1;
    if(setsockopt(sock, IPPROTO_SCTP, SCTP_EVENTS, 
                  &events, sizeof(events)) < 0)
        perror("setsockopt");

    /*Set the Reuse of Address*/
    if(setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, 
                  &reuse, sizeof(int)) < 0)
        perror("setsockopt");

    /*Bind the Addresses*/
    if(bind(sock, (struct sockaddr*)&addr, sizeof(struct sockaddr)) < 0)
        perror("bind");

    if(listen(sock, 2) < 0)
        perror("listen");

    /*Get Heartbeat Value*/
    hb_len = (socklen_t)(sizeof heartbeat);
    getsockopt(sock, SOL_SCTP, SCTP_PEER_ADDR_PARAMS, &heartbeat, &hb_len);
    /*printf("Heartbeat interval %d\n", heartbeat.spp_hbinterval);*/

    /*Print Locally Binded Addresses*/
    addr_count = sctp_getladdrs(sock, 0, (struct sockaddr**)laddr);
    printf("# IP locales: %d\n", addr_count);
    for(i = 0; i < addr_count; i++)
        printf("  IP %d: %s\n", i+1, inet_ntoa((*laddr)[i].sin_addr));
    sctp_freeladdrs((struct sockaddr*)*laddr);

    while(1) {
        i=0;
        ret=1;
        printf("# Esperando conexion\n");
        if((conSock = accept(sock, 
                             (struct sockaddr *)&client, &addr_len)) == -1)
            perror("accept");
        printf("  Cliente: %s\n", inet_ntoa(client.sin_addr));
        while(ret > 0) {
            snprintf(buffer, BUFFER_SIZE, "%s%02d\n", "control_", i);
            ret = sctp_sendmsg(conSock, (void *)buffer, (size_t)strlen(buffer), 
                               (struct sockaddr *)&client, addr_len, 0, 0, 
                               CTRL_STREAM, 0, 0);


            size_t buffer_size = 100000;
            char *buffer = (char *)malloc(buffer_size);

            // 检查是否成功申请内存
            if (buffer == NULL) {
                perror("Failed to allocate memory");
                return EXIT_FAILURE;
            }

            // 使用 buffer，例如初始化为 0
            for (size_t i = 0; i < buffer_size; ++i) {
                buffer[i] = 1; // 初始化 buffer
            }


            // snprintf(buffer, BUFFER_SIZE, "%s%02d\n", "data_", i);
            ret = sctp_sendmsg(conSock, (void *)buffer, (size_t)strlen(buffer),
                               (struct sockaddr *)&client, addr_len, 0, 0, DATA_STREAM, 0, 0);

            free(buffer);


            /*printf("  Enviando a %s\n", inet_ntoa(client.sin_addr));*/
            i++;
            sleep(2);
        }
        /*close(conSock);*/
    }
    if(close(sock) < 0)
        perror("close");

    return 0;
}   

void handle_signal(int signum) {
    printf(" Cerrando...\n");
    if(close(conSock) < 0)
        perror("close");
    if(close(sock) < 0)
        perror("close");
    exit(0);
}
```

客户端

```c
/*  
 *  sctpc.c
 *  Servidor SCTP
 *  Rafael Damian Fito Izquierdo
 *  
 *  Basado en parte en el codigo de Kari Vatjus-Anttila
 *  http://stackoverflow.com/questions/6342617/sctp-multihoming
 */

#include <sys/types.h>
#include <sys/socket.h>
#include <signal.h>
#include <netinet/in.h>
#include <netinet/sctp.h>
#include <arpa/inet.h>
#include <string.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/ioctl.h>

#define PORT 11000
#define MSG_SIZE 1000
#define NUMBER_OF_MESSAGES 1000

int sock;
struct sockaddr_in *paddrs[5];
struct sockaddr_in *laddrs[5];

void handle_signal(int signum);

int main(int argc, char **argv)
{
    int i;
    int counter = 0;
    int asconf = 1;
    int ret;
    int addr_count;
    char address[16];
    char buffer[MSG_SIZE];
    sctp_assoc_t id;
    struct sockaddr_in addr;
    struct sctp_status status;
    struct sctp_initmsg initmsg;
    struct sctp_event_subscribe events;
    struct sigaction sig_handler;
    struct sctp_paddrparams heartbeat;
    struct sctp_rtoinfo rtoinfo;

    memset(&buffer,     'j', MSG_SIZE);
    memset(&initmsg,    0,   sizeof(struct sctp_initmsg));
    memset(&addr,       0,   sizeof(struct sockaddr_in));
    memset(&events,     1,   sizeof(struct sctp_event_subscribe));
    memset(&status,     0,   sizeof(struct sctp_status));
    memset(&heartbeat,  0,   sizeof(struct sctp_paddrparams));
    memset(&rtoinfo,    0, sizeof(struct sctp_rtoinfo))

    if(argc != 2 || (inet_addr(argv[1]) == -1))
    {
        puts("Usage: client [IP ADDRESS in form xxx.xxx.xxx.xxx] ");        
        return 0;
    }

    strncpy(address, argv[1], 15);
    address[15] = 0;

    addr.sin_family = AF_INET;
    inet_aton(address, &(addr.sin_addr));
    addr.sin_port = htons(PORT);

    initmsg.sinit_num_ostreams = 2;
    initmsg.sinit_max_instreams = 2;
    initmsg.sinit_max_attempts = 1;

    heartbeat.spp_flags = SPP_HB_ENABLE;
    heartbeat.spp_hbinterval = 5000;
    heartbeat.spp_pathmaxrxt = 1;

    rtoinfo.srto_max = 2000;

    sig_handler.sa_handler = handle_signal;
    sig_handler.sa_flags = 0;

    /*Handle SIGINT in handle_signal Function*/
    if(sigaction(SIGINT, &sig_handler, NULL) == -1)
        perror("sigaction");

    /*Create the Socket*/
    if((ret = (sock = socket(AF_INET, SOCK_STREAM, IPPROTO_SCTP))) < 0)
        perror("socket");

    /*Configure Heartbeats*/
    if((ret = setsockopt(sock, SOL_SCTP, SCTP_PEER_ADDR_PARAMS , &heartbeat, sizeof(heartbeat))) != 0)
        perror("setsockopt");

    /*Set rto_max*/
    if((ret = setsockopt(sock, SOL_SCTP, SCTP_RTOINFO , &rtoinfo, sizeof(rtoinfo))) != 0)
        perror("setsockopt");

    /*Set SCTP Init Message*/
    if((ret = setsockopt(sock, SOL_SCTP, SCTP_INITMSG, &initmsg, sizeof(initmsg))) != 0)
        perror("setsockopt");

    /*Enable SCTP Events*/
    if((ret = setsockopt(sock, SOL_SCTP, SCTP_EVENTS, (void *)&events, sizeof(events))) != 0)
        perror("setsockopt");

    /*Get And Print Heartbeat Interval*/
    i = (sizeof heartbeat);
    getsockopt(sock, SOL_SCTP, SCTP_PEER_ADDR_PARAMS, &heartbeat, (socklen_t*)&i);

    printf("Heartbeat interval %d\n", heartbeat.spp_hbinterval);

    /*Connect to Host*/
    if(((ret = connect(sock, (struct sockaddr*)&addr, sizeof(struct sockaddr)))) < 0)
    {
        perror("connect");
        close(sock);
        exit(0);
    }

    /*Get Peer Addresses*/
    addr_count = sctp_getpaddrs(sock, 0, (struct sockaddr**)paddrs);
    printf("\nPeer addresses: %d\n", addr_count);

    /*Print Out Addresses*/
    for(i = 0; i < addr_count; i++)
        printf("Address %d: %s:%d\n", i +1, inet_ntoa((*paddrs)[i].sin_addr), (*paddrs)[i].sin_port);

    sctp_freepaddrs((struct sockaddr*)*paddrs);

    /*Start to Send Data*/
    for(i = 0; i < NUMBER_OF_MESSAGES; i++)
    {
        counter++;
        printf("Sending data chunk #%d...", counter);

        if((ret = send(sock, buffer, MSG_SIZE, 0)) == -1)
            perror("write");

        printf("Sent %d bytes to peer\n",ret);

        sleep(1);
    }

    if(close(sock) != 0)
        perror("close");
}


void handle_signal(int signum)
{
    switch(signum)
    {
        case SIGINT:
            if(close(sock) != 0)
                perror("close");
            exit(0);
            break;  
        default: exit(0);
            break;
    }
}
```

