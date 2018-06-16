This is an implementation of systemd’s simple sd_notify protocol as described in [`sd_notify` Notes](https://www.freedesktop.org/software/systemd/man/sd_notify.html#Notes) and as implemented in [libsystemd](https://github.com/systemd/systemd/blob/master/src/libsystemd/sd-daemon/sd-daemon.c). In the service’s systemd configuration, you can configure systemd to restart the process when it is not working using e.g. [`Type=notify`](https://www.freedesktop.org/software/systemd/man/systemd.service.html#Type=) or [`WatchdogSec=60`](https://www.freedesktop.org/software/systemd/man/systemd.service.html#WatchdogSec=).

## API

```js
function sd_notify(unsetEnvironment: boolean, state: string): Promise<boolean>
```

Sends the string in `state` to systemd (which is identified by the `NOTIFY_SOCKET` environment variable), and returns a `Promise` that completes once the message has been sent. The promise resolves to true if the message was sent, or false if `NOTIFY_SOCKET` was unset.

If `unsetEnvironment` is set, deletes the `process.env.NOTIFY_SOCKET` field so that subprocesses do not use the socket. If you are calling `sd_notify` more than once, `unsetEnvironment` should be false.

Typically you would use it like this. For a full list of messages that systemd understands, see the [sd_notify](https://www.freedesktop.org/software/systemd/man/sd_notify.html#Description) documentation.

```js
sd_notify(false, "STATUS=loading").catch(console.error)
sd_notify(false, "READY=1").catch(console.error)
sd_notify(false, "STATUS=serving").catch(console.error)
if (parseInt(process.env.WATCHDOG_USEC)) setInterval(() => {
    // check server health…

    sd_notify(false, "WATCHDOG=1").catch(console.error)
}, parseInt(process.env.WATCHDOG_USEC)/1000/2)
```

## Not supported

I have not implemented `sd_pid_notify`, which sends the credentials of the PID in question to systemd using ancillary data of type `cmsg_type=SCM_CREDENTIALS` in the `sendmsg` call.

I have not implemented `sd_pid_notify_with_fds`, which sends open file descriptors to systemd using ancillary data of type `cmsg_type=SCM_RIGHTS` in the `sendmsg` call. This is used in `sd_notify(…, "FDSTORE=1")` to keep a socket open even when a process is restarted.

## Other implementations

* [sdnotify-wrapper](https://github.com/dog-ai/sdnotify-wrapper) calls the libsystemd shared library. It requires libsystemd to be installed.
* [systemd-daemon](https://github.com/bnf/node-systemd-daemon) exposes a fire-and-forget notify function.

## Dependencies

The only dependency is `unix-dgram`, which is needed to create datagram sockets (`socket(AF_UNIX, SOCK_DGRAM)`). (Node/libuv’s builtin [IPC support](https://nodejs.org/api/net.html#net_ipc_support) creates only streaming sockets `socket(AF_UNIX, SOCK_STREAM)`).