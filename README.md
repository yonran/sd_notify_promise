This is an implementation of systemd’s simple sd_notify protocol as described in [`sd_notify` Notes](https://www.freedesktop.org/software/systemd/man/sd_notify.html#Notes) and as implemented in [libsystemd](https://github.com/systemd/systemd/blob/master/src/libsystemd/sd-daemon/sd-daemon.c).

## API

```js
sd_notify(unsetEnvironment, state)
```

Sends the string in `state` to systemd (which is identified by the `NOTIFY_SOCKET` environment variable), and returns a `Promise` that completes once the message has been sent.

If `unsetEnvironment` is set, deletes the `process.env.NOTIFY_SOCKET` field so that subprocesses do not use the socket. If you are calling `sd_notify` more than once, `unsetEnvironment` should be false.

## Not supported

I have not implemented `sd_pid_notify`, which sends the credentials of the PID in question to systemd using ancillary data of type `cmsg_type=SCM_CREDENTIALS` in the `sendmsg` call.

I have not implemented `sd_pid_notify_with_fds`, which sends open file descriptors to systemd using ancillary data of type `cmsg_type=SCM_RIGHTS` in the `sendmsg` call. This is used in `sd_notify(…, "FDSTORE=1")` to keep a socket open even when a process is restarted.

## Other implementations

* [sdnotify-wrapper](https://github.com/dog-ai/sdnotify-wrapper) calls the libsystemd shared library. It requires libsystemd to be installed.
* [systemd-daemon](https://github.com/bnf/node-systemd-daemon) exposes a fire-and-forget notify function.

## Dependencies

The only dependency is `unix-dgram`, which is needed to create datagram sockets (`socket(AF_UNIX, SOCK_DGRAM)`). (Node/libuv’s builtin [IPC support](https://nodejs.org/api/net.html#net_ipc_support) creates only streaming sockets `socket(AF_UNIX, SOCK_STREAM)`).