declare module "unix-dgram" {
    import { EventEmitter } from "events";
    interface ReceiveInfo {size: number, address: {}, path: string}
    class ErrnoException extends Error {
        errno: number
        code: number
        syscall: string
    }
    class InternalError extends Error {
        code: number
    }
    type OnMessageCallback = (buf: Buffer, rinfo: ReceiveInfo) => void
    type SendCallback = (e?: ErrnoException | InternalError) => void
    type SocketType = "udp4" | "udp6" | "unix_dgram"
    
    export class Socket extends EventEmitter {
        readonly type: SocketType
        bind(path: string): void
        connect(path: string): void
        send(buf: Buffer, callback?: SendCallback): void
        close(): void
    }
    export function createSocket(type: SocketType, listener?: OnMessageCallback): Socket
}
