import * as zmq from 'zeromq';
import { flatbuffers } from 'flatbuffers';

import { Message } from '../fbspec/message_generated';

class MessageWrapper {
  constructor(id, type, target = null, payload = null/* , binaryAttachment1=null */) {
    // We do not support sending binary attachments because there
    // is no support for createByteVector() in the js API.
    this.id = id;
    this.type = type;
    this.target = target;
    this.payload = payload;
  }

  tobytes() {
    const builder = new flatbuffers.Builder(512);

    const id = builder.createLong(this.id, 0);
    const target = this.target ? builder.createString(this.target) : null;
    const payload = this.payload ? builder.createString(JSON.stringify(this.payload)) : null;

    Message.Message.startMessage(builder);
    Message.Message.addId(builder, id);
    Message.Message.addType(builder, this.type);
    if (target) {
      Message.Message.addTarget(builder, target);
    }
    if (payload) {
      Message.Message.addPayload(builder, payload);
    }
    const msg = Message.Message.endMessage(builder);

    builder.finish(msg);
    return builder.asUint8Array();
  }
}

class Client {
  constructor(zmqSocket) {
    this.sock = zmqSocket;
    this.callbacks = {};
    this.subscriptions = {};
    this.msgId = 0;

    // This promise resolves when client has connected with the server
    // Use this in front of every API call. Note this does not guarantee
    // the connection exists. This only resolves when the FIRST connection
    // is made, but ignores disconnects.
    this.waitForConnect = new Promise((resolve, reject) => {
      const onConnect = () => {
        this.sock.removeListener('connect', onConnect);
        resolve();
      };
      this.sock.on('connect', onConnect);
    });

    this.sock.on('message', (data) => {
      const message = Message.Message.getRootAsMessage(new flatbuffers.ByteBuffer(data));
      if (message.type() === Message.Type.Response) {
        const id = message.id().low;
        if (id in this.callbacks) {
          const callback = this.callbacks[id];
          delete this.callbacks[id];

          const args = {
            result: JSON.parse(message.payload()),
            attachment: message.binaryAttachment1Array(),
          };
          callback(args);
        }
      } else if (message.type() === Message.Type.Publish) {
        const name = message.target();
        if (name in this.subscriptions) {
          const callbacks = this.subscriptions[name];
          const args = {
            result: JSON.parse(message.payload()),
            attachment: message.binaryAttachment1Array(),
          };
          callbacks.forEach(func => func(args));
        }
      } else {
        console.warn('Received invalid message. Ignoring.');
      }
    });
  }

  // Internal use only
  getNextId() {
    // assumes that in-use ids don't get backed up the max number of integers
    // TODO finite-search for next available ID. This is extremely low-prio.
    this.msgId = (this.msgId + 1) % Number.MAX_SAFE_INTEGER;
    return this.msgId;
  }

  request(msg, respCallback) {
    if (msg.id in this.callbacks) {
      throw new Error(`Message ID ${msg.id} already in use!`);
    }
    this.callbacks[msg.id] = respCallback;

    const data = new Buffer(msg.tobytes());
    this.sock.send(data);
  }

  subscribe(name, callback) {
    if (!(name in this.subscriptions)) {
      this.subscriptions[name] = [];
    }
    this.subscriptions[name].push(callback);
  }
}

class ITKTubeClient extends Client {
  onTubeGeneratorChange(callback) {
    this.subscribe('itk.tube.segmentresult', callback);
  }

  openFile(filename) {
    return this.waitForConnect
      .then(() => new Promise((resolve, reject) => {
        const msg = new MessageWrapper(this.getNextId(), Message.Type.Request, 'itk.volume.open', [filename]);
        this.request(msg, ({ result: imageInfo, attachment: scalars }) => {
          resolve(Object.assign(imageInfo, { scalars }));
        });
      }));
  }

  generateTube(coords, scale) {
    return this.waitForConnect
      .then(() => new Promise((resolve, reject) => {
        const args = [coords, scale];
        const msg = new MessageWrapper(this.getNextId(), Message.Type.Request, 'itk.tube.segment', args);
        this.request(msg, ({ result: tube }) => {
          resolve(tube);
        });
      }));
  }

  setTubeColor(id, color) {
    return this.waitForConnect
      .then(() => new Promise((resolve, reject) => {
        const args = [id, color];
        const msg = new MessageWrapper(this.getNextId(), Message.Type.Request, 'itk.tube.setcolor', args);
        this.request(msg, () => resolve());
      }));
  }

  deleteTube(id) {
    return this.waitForConnect
      .then(() => new Promise((resolve, reject) => {
        const args = [id];
        const msg = new MessageWrapper(this.getNextId(), Message.Type.Request, 'itk.tube.delete', args);
        this.request(msg, () => resolve());
      }));
  }
}

function run(uri, startFn, stopFn) {
  const sock = zmq.socket('pair');

  if (startFn) {
    startFn(new ITKTubeClient(sock));
  }

  sock.on('disconnect', () => {
    if (stopFn) {
      stopFn();
    }
    sock.unmonitor();
  });

  sock.monitor(500, 0);
  sock.connect(uri);
}

export default {
  run,
};
