import "dotenv/config";
import { RpcConnection } from "../lib/broker/connection.js";

class App {
  private _broker: RpcConnection;
  constructor() {
    this._broker = new RpcConnection();
  }
  async init() {
    try {
      console.log("env:  ", process.env.RABBITMQ_URI);

      await this._broker.init();
      await this._broker.listenQ("railway", async (replyQ, msg) => {
        console.log("message got:  ", msg?.content.toString());
        this._broker.replyCall(replyQ, "Got the message! Sending reply");
      });
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        this.init();
      }, 2000);
    }
  }
}
new App().init();
