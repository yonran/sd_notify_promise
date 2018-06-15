import { createSocket } from "unix-dgram";
/**
 * Send notification to systemd.
 *
 * Returns a promise that is true if the notification succeeded,
 * false if NOTIFY_SOCKET is undefined,
 * or is rejected if there was an error
 */
export default function sd_notify(unsetEnvironment: boolean, state: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        let notifySocket = process.env.NOTIFY_SOCKET
        if (notifySocket == null)
            return resolve(false)
        if (! (notifySocket.startsWith("@") || notifySocket.startsWith("/")))
            throw new Error("NOTIFY_SOCKET does not start with @ or /")
        if (notifySocket.length < 2)
            throw new Error("NOTIFY_SOCKET should have a name; got only 1 character " + notifySocket)
        if (notifySocket.startsWith("@")) {
            // Linux abstract sockets start with the null byte
            notifySocket = "\0" + notifySocket.substr(1)
        }
        const client = createSocket("unix_dgram")
        let closed = false
        const closeAndComplete = (e?: Error) => {
            let closeError;
            try {
                if (!closed) {
                    closed = true
                    client.close()
                }
                if (unsetEnvironment)
                    delete process.env.NOTIFY_SOCKET
            } catch (e2) {
                closeError = e2
            } finally {
                e = e || closeError
                if (e) {
                    reject(e)
                } else {
                    resolve(true)
                }
            }
        }
        // unix-dgram emits an Error with syscall and errno if connect, or close fail
        client.on("error", closeAndComplete)
        // onConnected is always synchronous. Oh well.
        client.on("connect", onConnected)
        client.connect(notifySocket)
        function onConnected() {
            // STATUS=… is UTF-8, and all other messages are ASCII
            const message = Buffer.from(state, 'utf8')
            client.send(message)
            closeAndComplete()
        }
    })

}
