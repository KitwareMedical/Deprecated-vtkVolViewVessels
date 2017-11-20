import json
import threading
import zmq
import flatbuffers

from Message import Message
from Message.Type import Type as MessageType

from message_wrapper import MessageWrapper

ENDPOINT_PROPERTY = '__endpoint'

def register(endpoint):
    '''Registers an endpoint to a decorated function in the Protocol class.'''
    def decorator(func):
        if not hasattr(func, ENDPOINT_PROPERTY):
            setattr(func, ENDPOINT_PROPERTY, endpoint)
        else:
            raise Exception('Endpoint %s exists on %s' % (endpoint, repr(func)))
        return func
    return decorator

class Protocol(object):
    def __init__(self, zmq_socket):
        self._sock = zmq_socket
        self._endpoints = dict()

        # get all endpoints
        for prop in dir(self):
            attr = getattr(self, prop)
            if hasattr(attr, ENDPOINT_PROPERTY) and callable(attr):
                endpoint = getattr(attr, ENDPOINT_PROPERTY)
                self._endpoints[endpoint] = attr

    def cleanup(self):
        '''Optional cleanup hook when server is stopped.'''
        pass

    def send(self, msg):
        '''Sends a MessageWrapper to the client.

        For internal use only.
        '''
        self._sock.send(msg.tobytes())

    def publish(self, retval=None, binaryAttachment=None):
        pass

    def delegate(self, message):
        target = message.Target()
        if target in self._endpoints:
            func = self._endpoints[target]
            args = json.loads(message.Payload() or '[]')

            try:
                resp = func(*args)
            except Exception as e:
                # TODO
                resp = e

            if resp is None:
                resp = self.makeResponse()

            if not isinstance(resp, MessageWrapper):
                raise Exception('Return value of %s endpoint should '
                                'come from self.makeResponse()!' % target)

            # set correct response ID
            resp.id = message.Id()
            self.send(resp)

    def makeResponse(self, retval=None, binaryAttachment=None):
        '''Makes a response message.'''
        payload = None
        if retval:
            # json can only serialize dict/list
            if type(retval) is not dict and type(retval) is not list:
                retval = [retval]
            payload = json.dumps(retval)

        # assert type(binaryAttachment) is bytes or bytearray

        # message ID should be modified before sending
        return MessageWrapper(-1, MessageType.Response,
                payload=payload,
                binaryAttachment1=binaryAttachment)

class Server(object):
    def __init__(self):
        self.context = zmq.Context()

    def start(self, host, port, protocol, proto='tcp'):
        sock = self.context.socket(zmq.PAIR)
        print ('%s://%s:%d' % (proto, host, port))
        sock.bind('%s://%s:%d' % (proto, host, port))

        # create protocol
        delegator = protocol(sock)

        # start single-worker server
        try:
            while True:
                data = sock.recv()
                msg = Message.Message.GetRootAsMessage(data, 0)
                if msg.Type() == MessageType.Request:
                    delegator.delegate(msg)
        except KeyboardInterrupt:
            delegator.cleanup()
