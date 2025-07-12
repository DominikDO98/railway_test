import express from "express";
import { RpcConnection } from "../lib/broker/connection.js";
class App {
  private _app = express();
  private _broker = new RpcConnection();

  async init() {
    try {
      await this._broker.init();
      this._app.get("/", async (_req, res) => {
        console.log("Got a request");
        await this._broker.sendCall("railway", "message", async (reply) => {
          console.log(reply?.content.toString());
          res.json(reply?.content.toString());
        });
      });
      this._app.listen(3000, "0.0.0.0", () => {
        console.log("server is listening...");
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
