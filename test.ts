import {sd_notify} from "./index"
import {createSocket, ReceiveInfo} from "unix-dgram"
// import {} from "mocha"
import * as chai from "chai"
import * as os from "os"
import {unlinkSync} from "fs"

describe("sd_notify", () => {
    it("should send message on socket", async () => {
        const socket = createSocket('unix_dgram')
        const path = `${__dirname}/dist/test-socket`
        process.env.NOTIFY_SOCKET = path
        socket.bind(path)
        try {
            const receivedMessagePromise = new Promise((resolve, reject) => {
                socket.on("message", (buf: Buffer, rinfo: ReceiveInfo) => {
                    resolve(buf)
                })
                socket.on("error", reject)
            })
            chai.expect(await sd_notify(false, "hello")).to.be.true
            const msg = await receivedMessagePromise as Buffer
            chai.expect(msg.toString("hex"))
                .to.equal(Buffer.from("hello").toString("hex"))
        } finally {
            try {
                socket.close()
            } finally {
                unlinkSync(path)
            }
        }
    })
    it("should delete NOTIFY_SOCKET if unsetEnvironment", async () => {
        const socket = createSocket('unix_dgram')
        const path = `${__dirname}/dist/test-socket`
        process.env.NOTIFY_SOCKET = path
        socket.bind(path)
        try {
            chai.expect(await sd_notify(false, "hello")).to.be.true
            chai.expect(process.env.NOTIFY_SOCKET).to.equal(path)
            chai.expect(await sd_notify(true, "hello")).to.be.true
            chai.expect(process.env.NOTIFY_SOCKET).to.be.undefined
        } finally {
            try {
                socket.close()
            } finally {
                unlinkSync(path)
            }
        }
    })
    it("should resolve to false when NOTIFY_SOCKET is unset", async () => {
        delete process.env.NOTIFY_SOCKET
        chai.expect(await sd_notify(false, "hello")).to.be.false
        chai.expect(await sd_notify(true, "hello")).to.be.false
    })
    it("should be able to connect to abstract namespace sockets on linux", async () => {
        if (os.platform() !== "linux") return
        const socket = createSocket('unix_dgram')
        const name = "sd-notify-test"
        process.env.NOTIFY_SOCKET = `@${name}`
        socket.bind(`\0${name}`)
        try {
            const receivedMessagePromise = new Promise((resolve, reject) => {
                socket.on("message", (buf: Buffer, rinfo: ReceiveInfo) => {
                    resolve(buf)
                })
                socket.on("error", reject)
            })
            chai.expect(await sd_notify(false, "hello")).to.be.true
            const msg = await receivedMessagePromise as Buffer
            chai.expect(msg.toString("hex"))
                .to.equal(Buffer.from("hello").toString("hex"))
        } finally {
            socket.close()
        }
    })
})
