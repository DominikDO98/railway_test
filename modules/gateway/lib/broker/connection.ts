import "dotenv/config.js";
import { Channel, connect, ChannelModel, ConsumeMessage } from "amqplib";
import { logger } from "../logger/logger.js";
import { ValidationError } from "../errors/validationError.js";

export class RpcConnection {
  private _connection: ChannelModel | null = null;
  private _channel: Channel | null = null;

  get connection(): ChannelModel | null {
    return this._connection;
  }
  get channel(): Channel | null {
    return this._channel;
  }

  async init() {
    const uri = (() => {
      if (process.env.NODE_ENV === "LOCAL") {
        return process.env.RABBITMQ_URI_LOCAL;
      } else {
        return process.env.RABBITMQ_URI;
      }
    })();
    console.log(uri);

    return await connect(uri)
      .then((conn) => {
        this._connection = conn;
        console.log("conn");

        return this._connection.createChannel();
      })
      .then((chan) => {
        this._channel = chan;
        console.log("chan");
        this.validateConnection();
        console.log("valid");

        logger.log("Broker initialization is over", "Rpc connection", false);
        return [this._connection, this._channel];
      })
      .catch((e) => {
        logger.error(e, "Rpc connection", true);
        throw new ValidationError(e as string);
      });
  }
  async listenQ(
    queue: string,
    callback: (replyQueue: string, msg: ConsumeMessage | null) => void
  ) {
    this.validateConnection();
    const replyQueue = `${queue}-reply`;
    await this._channel?.assertQueue(queue);
    await this._channel?.assertQueue(replyQueue);
    await this._channel?.prefetch(1);

    await this._channel?.consume(queue, (msg) => {
      try {
        if (!msg) throw Error("No message!");
        logger.log(msg?.content.toString(), "Rpc connection");
        this._channel?.ack(msg);
        callback(replyQueue, msg);
      } catch (err) {
        logger.error(err as string, "Rpc connection", true);
        if (msg) this._channel?.ack(msg);
      }
    });
  }
  async sendCall(
    queue: string,
    msg: string,
    callback: (reply: ConsumeMessage | null) => void
  ) {
    this.validateConnection();
    const replyQueue = `${queue}-reply`;
    return await this._channel
      ?.assertQueue(queue)
      .then(async () => {
        await this._channel?.assertQueue(replyQueue);
        return this._channel?.sendToQueue(queue, Buffer.from(msg));
      })
      .then(async (send) => {
        if (!send) throw Error("Sending a msg was unsuccesful!");
        await this._channel?.consume(replyQueue, (replyMsg) => {
          if (!replyMsg) throw Error("No msg!");
          this._channel?.ack(replyMsg!);
          logger.log(replyMsg.content.toString(), "Rpc connection");
          callback(replyMsg);
        });
      })
      .catch((e) => {
        logger.error(e, "Rpc connection", true);
      });
  }
  async replyCall(replyQueue: string, msg: string) {
    this.validateConnection();
    await this._channel?.assertQueue(replyQueue);
    this._channel?.sendToQueue(replyQueue, Buffer.from(msg));
  }
  disconnect() {
    this.validateConnection();
    try {
      this._channel!.close().then(() => {
        this._channel = null;
      });
      this._connection!.close().then(() => {
        this._connection = null;
      });
    } catch (e) {
      logger.error(
        `Unable to disconnect from Message Broker!\n${e}`,
        "Rpc connection",
        true
      );
    }
  }
  validateConnection() {
    if (!this._connection) throw new ValidationError("No connection!");
    if (!this._channel) throw new ValidationError("No channel!");
  }
}
